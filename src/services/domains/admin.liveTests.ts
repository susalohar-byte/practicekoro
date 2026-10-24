import { uploadValidatedImage, validateRasterFile } from '@/lib/rasterUploads';
import { requireSavedRow, deleteAdminRecord } from './admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { notifyExamsUpdated } from '@/lib/dataSync';
import { loadAllPages } from '@/utils/loadAllPages';
import {
  localExams,
  localLiveTests,
  localLiveTestParticipations,
  localTestQuestions,
  localTests,
} from '@/services/domains/localStore';
import {
  archiveTest,
  createTest,
  deleteTest,
  duplicateTest,
  getTestById,
  updateTest,
  validateTestForPublish,
} from './admin.tests';
import type { LiveTest, LiveTestParticipant, MockTest } from '@/types';

/**
 * Service domain for Live Tests Management & Student Participation
 *
 * Core Principle:
 * LIVE TEST = EXISTING TEST + SCHEDULED EVENT + OPTIONAL RANKING
 * A Live Test does NOT have its own questions or runner; it is a thin event layer.
 *
 * Persistence Architecture (3-Tier Resilient Storage):
 * 1. Primary: `public.live_tests` & `public.live_test_participants` tables (when migrated)
 * 2. Universal Fallback: `public.app_settings` (`id = 'live_tests_schedule_list'`) — readable
 *    by all authenticated & anonymous clients (Web & Mobile) and writable by Admin via RPC/upsert.
 * 3. Local Cache: `localStorage` (`pk_live_tests_list` & `pk_live_test_participations`) + in-memory store.
 */

const STORAGE_KEY = 'pk_live_tests_list';
const PARTICIPANTS_STORAGE_KEY = 'pk_live_test_participations';
const APP_SETTINGS_LIVE_TESTS_ID = 'live_tests_schedule_list';
const APP_SETTINGS_PARTICIPANTS_ID = 'live_tests_participants_list';

function getStoredLiveTests(): LiveTest[] {
  if (typeof window === 'undefined') return [...localLiveTests];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [...localLiveTests];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...localLiveTests];
  } catch {
    return [...localLiveTests];
  }
}

function saveStoredLiveTests(list: LiveTest[]): void {
  // Sync in-memory localLiveTests array
  localLiveTests.length = 0;
  localLiveTests.push(...list);

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('pk_live_tests_updated', { detail: list }));
  } catch (err) {
    console.warn('Failed to save live tests to localStorage:', err);
  }
}

function getStoredParticipations(): LiveTestParticipant[] {
  if (typeof window === 'undefined') return [...localLiveTestParticipations];
  try {
    const raw = localStorage.getItem(PARTICIPANTS_STORAGE_KEY);
    if (!raw) return [...localLiveTestParticipations];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [...localLiveTestParticipations];
  } catch {
    return [...localLiveTestParticipations];
  }
}

function saveStoredParticipations(list: LiveTestParticipant[]): void {
  localLiveTestParticipations.length = 0;
  localLiveTestParticipations.push(...list);

  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PARTICIPANTS_STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.warn('Failed to save live test participations to localStorage:', err);
  }
}

/** Helper to derive status based on schedule */
export function deriveLiveTestStatus(
  status: string,
  startAtStr: string,
  durationMinutes: number
): LiveTest['status'] {
  if (status === 'cancelled') return 'cancelled';
  if (status === 'draft') return 'draft';
  if (status === 'ended' || status === 'completed') return 'ended';
  const now = Date.now();
  const start = new Date(startAtStr).getTime();
  if (isNaN(start)) return status === 'live' ? 'live' : 'upcoming';
  const end = start + Math.max(1, durationMinutes) * 60 * 1000;

  // An explicitly started ("Start Live Now") event stays live until its window closes.
  if (status === 'live') return now <= end ? 'live' : 'ended';
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'ended';
}

/**
 * Convert a `<input type="date">` + `<input type="time">` pair, interpreted in the admin's
 * local timezone (IST for our admins), into a UTC ISO string.
 */
export function localDateTimeToIso(date: string, time: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('Invalid date or time.');
  }
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const local = new Date(y, m - 1, d, hh, mm, 0, 0);
  if (isNaN(local.getTime())) throw new Error('Invalid date or time.');
  return local.toISOString();
}

/** Split an ISO timestamp into local `YYYY-MM-DD` / `HH:mm` parts for date & time inputs. */
export function isoToLocalDateTimeParts(iso: string): { date: string; time: string } | null {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

/**
 * Map an admin-facing status onto the `live_tests` columns. The DB CHECK only allows
 * ('upcoming','live','ended','cancelled'); "Draft" is represented as an unpublished event.
 */
function toDbStatusFields(status: string): { status: string; isPublished?: boolean } {
  switch (status) {
    case 'draft':
      return { status: 'upcoming', isPublished: false };
    case 'live':
      return { status: 'live', isPublished: true };
    case 'ended':
    case 'completed':
      return { status: 'ended' };
    case 'cancelled':
      return { status: 'cancelled' };
    default:
      return { status: 'upcoming', isPublished: true };
  }
}

/** Map a Supabase `tests` row into a `MockTest` object */
function mapRowToMockTest(row: any): MockTest {
  return {
    id: String(row.id),
    title: String(row.title || 'Mock Test'),
    slug: String(row.slug || row.id),
    description: row.description ?? undefined,
    testType: row.test_type || 'full_mock',
    // Stored values only: a fresh paper really has 0 questions (no placeholder numbers).
    durationMinutes: Number(row.duration_minutes ?? 0),
    totalQuestions: Number(row.total_questions ?? 0),
    totalMarks: Number(row.total_marks ?? 0),
    passingMarks: Number(row.passing_marks ?? 0),
    negativeMarking: Number(row.negative_marking ?? 0),
    isPremium: Boolean(row.is_premium),
    isActive: Boolean(row.is_active ?? true),
    isLiveOnly: Boolean(row.is_live_only),
    orderIndex: Number(row.order_index || 0),
    status: (row.status || (row.is_active ? 'published' : 'draft')) as
      'draft' | 'published' | 'archived',
    examId: row.exam_id ?? undefined,
    testSeriesId: row.test_series_id ?? undefined,
    examTitle: row.exams?.title ?? undefined,
  };
}

/** Batch-fetch source MockTests from Supabase `public.tests` (with localTests fallback) */
async function fetchSourceTestsMap(testIds: string[]): Promise<Map<string, MockTest>> {
  const map = new Map<string, MockTest>();
  const uniqueIds = Array.from(new Set(testIds.filter(Boolean)));
  if (uniqueIds.length === 0) return map;

  // 1. Demo mode only: seed from localTests (never mix demo data into production)
  if (!isSupabaseConfigured) {
    for (const id of uniqueIds) {
      const local = localTests.find((t) => t.id === id);
      if (local) map.set(id, local);
    }
  }

  // 2. Query Supabase `public.tests` when configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select('*, exams:exam_id(id,title)')
        .in('id', uniqueIds);

      if (!error && Array.isArray(data)) {
        for (const row of data) {
          map.set(String(row.id), mapRowToMockTest(row));
        }
      }
    } catch (err) {
      console.warn('Could not batch-fetch source tests for live tests:', err);
    }
  }

  return map;
}

/** Format / enrich live test with source test data */
function enrichLiveTest(lt: any, sourceTest?: MockTest | null): LiveTest {
  const test =
    sourceTest ||
    lt.test ||
    (!isSupabaseConfigured
      ? localTests.find((t) => t.id === lt.testId || t.id === lt.test_id)
      : undefined) ||
    null;
  const exam = !isSupabaseConfigured
    ? localExams.find((e) => e.id === (lt.examId || lt.exam_id || test?.examId))
    : undefined;

  const startAt =
    lt.startAt || lt.start_at || lt.scheduledStartTime || lt.scheduled_start_time || '';
  const duration = Number(test?.durationMinutes || lt.durationMinutes || lt.duration_minutes || 0);
  const isPublished =
    lt.isPublished !== undefined
      ? Boolean(lt.isPublished)
      : lt.is_published !== undefined
        ? Boolean(lt.is_published)
        : true;
  const scheduleStatus = deriveLiveTestStatus(lt.status, startAt, duration);
  // An unpublished event stays a draft (even after its planned start time passes) until it is
  // published, cancelled or explicitly ended; it never ran, so it is never "completed".
  const storedStatus = String(lt.status || 'upcoming');
  const derivedStatus: LiveTest['status'] =
    !isPublished && ['upcoming', 'scheduled', 'live', 'draft'].includes(storedStatus)
      ? 'draft'
      : scheduleStatus;
  const endAt =
    lt.scheduledEndTime ||
    lt.scheduled_end_time ||
    (startAt && !isNaN(new Date(startAt).getTime())
      ? new Date(new Date(startAt).getTime() + duration * 60000).toISOString()
      : '');

  const resolvedTitle =
    (lt.customTitle && String(lt.customTitle).trim()) ||
    test?.title ||
    (lt.title && lt.title !== 'Live Mock Test' ? lt.title : undefined) ||
    lt.testTitle ||
    lt.title ||
    'Live Mock Test';

  const enrolled = Number(lt.enrolledCount ?? lt.enrolled_count ?? 0);
  const participants = Number(lt.participantsCount ?? lt.participants_count ?? enrolled);

  let rawInstructions =
    test?.description ||
    lt.instructions ||
    'Official examination pattern with statewide rank & percentile analysis.';
  let parsedBgImage: string | undefined =
    lt.bgImageUrl ||
    lt.bg_image_url ||
    lt.cardBgImage ||
    lt.card_bg_image ||
    lt.backgroundImage ||
    lt.background_image ||
    undefined;

  if (typeof lt.instructions === 'string' && lt.instructions.trim().startsWith('{')) {
    try {
      const meta = JSON.parse(lt.instructions);
      if (meta.bgImageUrl && !parsedBgImage) parsedBgImage = meta.bgImageUrl;
      if (meta.instructions !== undefined) rawInstructions = meta.instructions;
    } catch {
      // preserve raw instructions if not JSON
    }
  }

  return {
    id: String(lt.id),
    testId: String(lt.testId || lt.test_id),
    startAt,
    registrationDeadline: lt.registrationDeadline ?? lt.registration_deadline ?? null,
    status: derivedStatus,
    rankingEnabled:
      lt.rankingEnabled !== undefined
        ? Boolean(lt.rankingEnabled)
        : lt.ranking_enabled !== undefined
          ? Boolean(lt.ranking_enabled)
          : true,
    subscriptionRequired:
      lt.subscriptionRequired !== undefined
        ? Boolean(lt.subscriptionRequired)
        : lt.subscription_required !== undefined
          ? Boolean(lt.subscription_required)
          : false,
    createdAt: lt.createdAt || lt.created_at || new Date().toISOString(),
    updatedAt: lt.updatedAt || lt.updated_at || new Date().toISOString(),

    // Inherited from source test
    test: test || null,
    title: resolvedTitle,
    examId: exam?.id || test?.examId || lt.examId || lt.exam_id,
    examTitle: test?.examTitle || exam?.title || lt.examTitle,
    testTitle: test?.title || lt.testTitle || resolvedTitle,
    durationMinutes: duration,
    totalQuestions: Number(test?.totalQuestions || lt.totalQuestions || lt.total_questions || 0),
    totalMarks: Number(test?.totalMarks || lt.totalMarks || lt.total_marks || 0),
    negativeMarking: Number(
      test?.negativeMarking ?? lt.negativeMarking ?? lt.negative_marking ?? 0
    ),
    instructions: rawInstructions,
    enrolledCount: enrolled,
    participantsCount: participants,
    isPublished,
    scheduledStartTime: startAt,
    scheduledEndTime: endAt,
    scheduledStartAt: startAt,
    scheduledEndAt: endAt,
    logo:
      lt.logo ||
      lt.examLogo ||
      lt.exam_logo ||
      exam?.iconName ||
      (exam as any)?.icon_name ||
      test?.iconUrl ||
      undefined,
    examLogo:
      lt.logo ||
      lt.examLogo ||
      lt.exam_logo ||
      exam?.iconName ||
      (exam as any)?.icon_name ||
      test?.iconUrl ||
      undefined,
    bgImageUrl: parsedBgImage,
    cardBgImage: parsedBgImage,
  };
}

/** Sort LiveTests: LIVE first, then UPCOMING (soonest first), then ENDED (newest first), then CANCELLED */
function sortLiveTests(list: LiveTest[]): LiveTest[] {
  const statusWeight: Record<string, number> = {
    live: 1,
    upcoming: 2,
    scheduled: 2,
    ended: 3,
    completed: 3,
    cancelled: 4,
  };

  return [...list].sort((a, b) => {
    const wA = statusWeight[a.status] ?? 5;
    const wB = statusWeight[b.status] ?? 5;
    if (wA !== wB) return wA - wB;

    const tA = new Date(a.startAt).getTime();
    const tB = new Date(b.startAt).getTime();
    // For upcoming/live, soonest start time first; for ended/cancelled, most recent first
    return wA <= 2 ? tA - tB : tB - tA;
  });
}

/**
 * Persist Live Tests list across all 3 tiers:
 * 1. localStorage + in-memory + window custom event
 * 2. Supabase `public.app_settings` (`id = 'live_tests_schedule_list'`)
 * 3. Broadcast on Supabase Realtime channel
 */
async function syncLiveTestsToRemote(list: LiveTest[]): Promise<void> {
  // Strip heavy nested `test` object before serializing to app_settings to keep payload compact,
  // while keeping all metadata fields (`title`, `examId`, `examTitle`, `durationMinutes`, etc.) intact.
  const compactList = list.map((lt) => ({
    ...lt,
    test: undefined,
  }));

  saveStoredLiveTests(list);

  if (!isSupabaseConfigured) return;

  try {
    const settingRow = {
      id: APP_SETTINGS_LIVE_TESTS_ID,
      category: 'live_tests',
      key: APP_SETTINGS_LIVE_TESTS_ID,
      value: compactList,
      description: 'Scheduled Live Mock Tests for Student Portal and Mobile App',
      updated_at: new Date().toISOString(),
    };

    let rpcSuccess = false;
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('admin_update_app_settings', {
        p_settings: [settingRow],
      });
      if (!rpcError && (rpcData?.success || rpcData?.updated_count !== undefined)) {
        rpcSuccess = true;
      }
    } catch {
      // Fallback to direct upsert
    }

    if (!rpcSuccess) {
      await supabase.from('app_settings').upsert(settingRow, { onConflict: 'id' });
    }
  } catch (err) {
    console.warn('Could not sync live tests to app_settings:', err);
  }

  // Broadcast realtime event
  try {
    const channel = supabase.channel('live_tests_sync_channel');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'live_tests_updated',
          payload: { timestamp: Date.now() },
        });
      }
    });
  } catch {
    // Ignore broadcast errors
  }
}

async function fetchRemoteAppSettingsLiveTests(): Promise<any[] | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', APP_SETTINGS_LIVE_TESTS_ID)
      .maybeSingle();

    if (error || !data || data.value === undefined || data.value === null) {
      return null;
    }

    let rawVal = data.value;
    if (typeof rawVal === 'string') {
      try {
        rawVal = JSON.parse(rawVal);
      } catch {
        return null;
      }
    }

    if (Array.isArray(rawVal)) {
      return rawVal;
    }
  } catch {
    // Ignore
  }
  return null;
}

export async function getLiveTests(examId?: string): Promise<LiveTest[]> {
  if (isSupabaseConfigured) {
    let q = supabase
      .from('live_tests')
      .select('*, tests(*, exams:exam_id(id,title))')
      .order('start_at');
    if (examId) q = q.eq('exam_id', examId);
    const { data, error } = await q;
    if (error) throw new Error(error.message);
    return (data || []).map((r) => enrichLiveTest(r, r.tests ? mapRowToMockTest(r.tests) : null));
  }

  if (!isSupabaseConfigured) {
    const stored = getStoredLiveTests();
    const sourceList = stored.length > 0 ? stored : localLiveTests;
    const enriched = sourceList
      .map((lt) => enrichLiveTest(lt))
      .filter((lt) => !examId || lt.examId === examId);
    return sortLiveTests(enriched);
  }

  let rawItems: any[] | null = null;

  // Tier 1: Try `public.live_tests` table in Supabase
  try {
    const { data, error } = await supabase
      .from('live_tests')
      .select('*, tests(*, exams:exam_id(id,title))')
      .order('start_at', { ascending: true });

    if (!error && Array.isArray(data) && data.length > 0) {
      rawItems = data;
    }
  } catch {
    // Fallback to Tier 2 seamlessly
  }

  // Tier 2: Try `public.app_settings` (`id = 'live_tests_schedule_list'`)
  if (!rawItems) {
    const appSettingsList = await fetchRemoteAppSettingsLiveTests();
    if (appSettingsList !== null) {
      rawItems = appSettingsList;
    }
  }

  // Tier 3: Fallback to localStorage cache
  if (!rawItems) {
    rawItems = getStoredLiveTests();
  }

  if (!rawItems || rawItems.length === 0) {
    return [];
  }

  // Batch-enrich with real MockTest rows from `public.tests`
  const testIds = rawItems
    .map((item: any) => String(item.testId || item.test_id || ''))
    .filter(Boolean);
  const sourceTestsMap = await fetchSourceTestsMap(testIds);

  const enriched = rawItems.map((item: any) => {
    const tId = String(item.testId || item.test_id || '');
    const joinedTest = item.tests ? mapRowToMockTest(item.tests) : null;
    const sourceTest = joinedTest || sourceTestsMap.get(tId) || null;
    return enrichLiveTest(item, sourceTest);
  });

  const sorted = sortLiveTests(enriched);
  saveStoredLiveTests(sorted);

  if (examId) {
    return sorted.filter((lt) => lt.examId === examId);
  }
  return sorted;
}

export async function getActiveLiveTest(): Promise<LiveTest | null> {
  const all = await getLiveTests();
  const valid = all.filter(
    (lt) =>
      lt.isPublished !== false &&
      lt.status !== 'cancelled' &&
      lt.test?.isActive === true &&
      lt.test.status === 'published'
  );
  if (valid.length === 0) return null;

  // 1. Check for tests that are LIVE NOW
  const liveNow = valid.filter((lt) => lt.status === 'live');
  if (liveNow.length > 0) return liveNow[0];

  // 2. Check for soonest UPCOMING test
  const upcoming = valid
    .filter((lt) => lt.status === 'upcoming' || lt.status === 'scheduled')
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  if (upcoming.length > 0) return upcoming[0];

  // 3. Fallback to most recently ended test
  const ended = valid
    .filter((lt) => lt.status === 'ended' || lt.status === 'completed')
    .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  return ended[0] || valid[0] || null;
}

export async function getLiveTestById(id: string): Promise<LiveTest | null> {
  const all = await getLiveTests();
  return all.find((lt) => lt.id === id) || null;
}

/** Check if a test is locked because it is part of an active (upcoming or live) Live Test */
export async function isTestLockedForEditing(testId: string): Promise<boolean> {
  const all = await getLiveTests();
  return all.some(
    (lt) => lt.testId === testId && (lt.status === 'upcoming' || lt.status === 'live')
  );
}

export interface ScheduleLiveTestInput {
  testId: string;
  startAt: string;
  registrationDeadline?: string;
  rankingEnabled?: boolean;
  subscriptionRequired?: boolean;
  title?: string;
  logo?: string;
  examLogo?: string;
  bgImageUrl?: string;
  cardBgImage?: string;
  totalQuestions?: number;
  durationMinutes?: number;
  totalMarks?: number;
  negativeMarking?: number;
  /** Admin-facing status; 'draft' is stored as an unpublished upcoming event. */
  status?: LiveTest['status'];
}

/** Schedule an existing test as a Live Test event */
/** Live Tests reference an existing Full Mock test (also enforced by a DB trigger). */
function assertFullMockSource(testId: string, sourceTest: MockTest | null) {
  if (!testId) throw new Error('Select a Full Mock test to schedule as a Live Test.');
  if (!isSupabaseConfigured) return;
  if (!sourceTest) throw new Error('The selected source test no longer exists.');
  if (sourceTest.testType !== 'full_mock')
    throw new Error('Live Tests can only be scheduled from a Full Mock test.');
}

export async function scheduleLiveTest(input: ScheduleLiveTestInput): Promise<LiveTest> {
  if (!input.testId) throw new Error('Select a Full Mock test to schedule as a Live Test.');
  const currentList = await getLiveTests();

  // 1. Prevent duplicate active Live Test events for the same Test
  const isLocked = currentList.some(
    (lt) => lt.testId === input.testId && (lt.status === 'upcoming' || lt.status === 'live')
  );
  if (isLocked) {
    throw new Error(
      'This test is already scheduled for an active or upcoming Live Test event. Please cancel it or wait until it completes.'
    );
  }

  const id = `live-${input.testId}-${Date.now().toString().slice(-5)}`;
  const startAt = new Date(input.startAt).toISOString();
  const registrationDeadline = input.registrationDeadline
    ? new Date(input.registrationDeadline).toISOString()
    : startAt;

  // Fetch the real source test from Supabase (or localTests fallback)
  const sourceTestsMap = await fetchSourceTestsMap([input.testId]);
  const sourceTest = sourceTestsMap.get(input.testId) || null;
  assertFullMockSource(input.testId, sourceTest);

  const resolvedLogo = input.logo?.trim() || input.examLogo?.trim() || undefined;
  const resolvedBgImage = input.bgImageUrl?.trim() || input.cardBgImage?.trim() || undefined;
  const dbFields = toDbStatusFields(input.status || 'upcoming');
  const isPublished = dbFields.isPublished ?? true;

  const newLiveTest: LiveTest = enrichLiveTest(
    {
      id,
      test_id: input.testId,
      testId: input.testId,
      customTitle: input.title?.trim() || undefined,
      title: input.title?.trim() || sourceTest?.title || undefined,
      start_at: startAt,
      startAt,
      registration_deadline: registrationDeadline,
      registrationDeadline,
      status: dbFields.status,
      isPublished,
      ranking_enabled: input.rankingEnabled ?? true,
      rankingEnabled: input.rankingEnabled ?? true,
      subscription_required: input.subscriptionRequired ?? false,
      subscriptionRequired: input.subscriptionRequired ?? false,
      enrolledCount: 0,
      participantsCount: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      logo: resolvedLogo,
      examLogo: resolvedLogo,
      bgImageUrl: resolvedBgImage,
      cardBgImage: resolvedBgImage,
      totalQuestions: input.totalQuestions,
      totalMarks: input.totalMarks,
      durationMinutes: input.durationMinutes,
      negativeMarking: input.negativeMarking,
    },
    sourceTest
  );

  // Persist to Tier 2 (app_settings) & Tier 3 (localStorage + in-memory)
  const updatedList = sortLiveTests([newLiveTest, ...currentList.filter((lt) => lt.id !== id)]);
  if (!isSupabaseConfigured) await syncLiveTestsToRemote(updatedList);

  // Also attempt Tier 1 (`public.live_tests` table) if migrated
  if (isSupabaseConfigured) {
    try {
      const instructionsWithMeta = resolvedBgImage
        ? JSON.stringify({
            instructions: newLiveTest.instructions || '',
            bgImageUrl: resolvedBgImage,
          })
        : newLiveTest.instructions;

      const payload = {
        id,
        test_id: input.testId,
        exam_id: sourceTest?.examId ?? null,
        start_at: startAt,
        registration_deadline: registrationDeadline,
        status: dbFields.status,
        ranking_enabled: input.rankingEnabled ?? true,
        subscription_required: input.subscriptionRequired ?? false,
        title: newLiveTest.title,
        scheduled_start_time: startAt,
        scheduled_end_time: newLiveTest.scheduledEndTime,
        duration_minutes: newLiveTest.durationMinutes,
        total_questions: newLiveTest.totalQuestions,
        total_marks: newLiveTest.totalMarks,
        negative_marking: newLiveTest.negativeMarking,
        instructions: instructionsWithMeta,
        is_published: isPublished,
        logo: newLiveTest.logo,
        exam_logo: newLiveTest.examLogo,
      };

      requireSavedRow(await supabase.from('live_tests').insert(payload).select('id').single(), id);
    } catch {
      throw new Error('Live-test persistence failed. Check the backend schema and permissions.');
    }
  }

  // Also sync to app_settings so that all clients receive the updated list
  if (isSupabaseConfigured) {
    try {
      await syncLiveTestsToRemote(updatedList);
    } catch {
      // ignore
    }
  }

  notifyExamsUpdated();
  return newLiveTest;
}

export interface CreateLiveTestWithPaperInput {
  examId: string;
  title: string;
  startAt: string;
  durationMinutes: number;
  /** Target number of questions; the paper's real count follows its uploaded questions. */
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: number;
  rankingEnabled?: boolean;
  subscriptionRequired?: boolean;
  logo?: string;
}

/**
 * Create a Live Test together with its own paper: a Full Mock test flagged live-only, so it
 * and its questions stay out of every catalog and the Question Bank. The event starts as a
 * Draft; the admin uploads the questions and then publishes it.
 */
export async function createLiveTestWithPaper(
  input: CreateLiveTestWithPaperInput
): Promise<LiveTest> {
  const title = input.title.trim();
  if (!input.examId) throw new Error('Select the exam for this Live Test.');
  if (!title) throw new Error('Title is required.');

  const slugBase = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const paper = await createTest({
    title,
    slug: `live-${slugBase || 'paper'}-${Date.now().toString(36)}`,
    examId: input.examId,
    testType: 'full_mock',
    durationMinutes: Number(input.durationMinutes),
    totalQuestions: Number(input.totalQuestions),
    totalMarks: Number(input.totalMarks),
    passingMarks: 0,
    negativeMarking: Number(input.negativeMarking),
    isPremium: Boolean(input.subscriptionRequired),
    orderIndex: 0,
    isActive: true,
    isLiveOnly: true,
    status: 'draft',
  });

  try {
    return await scheduleLiveTest({
      testId: paper.id,
      title,
      startAt: input.startAt,
      registrationDeadline: input.startAt,
      durationMinutes: Number(input.durationMinutes),
      totalQuestions: Number(input.totalQuestions),
      totalMarks: Number(input.totalMarks),
      negativeMarking: Number(input.negativeMarking),
      rankingEnabled: input.rankingEnabled ?? true,
      subscriptionRequired: Boolean(input.subscriptionRequired),
      logo: input.logo,
      examLogo: input.logo,
      status: 'draft',
    });
  } catch (err) {
    // Never leave a paper behind without its Live Test.
    await deleteTest(paper.id).catch(() => undefined);
    throw err;
  }
}

const PUBLISHED_EVENT_STATUSES: ReadonlyArray<LiveTest['status']> = [
  'upcoming',
  'scheduled',
  'live',
];

/**
 * Keep a live-only paper in step with its event. Edits to title, duration, negative marking and
 * access are copied onto the paper (the database refuses scoring edits once the event is
 * published). Publishing the event first validates and publishes the paper, and takes the
 * question count and marks from what was actually uploaded.
 */
async function syncLivePaper(
  existing: LiveTest,
  paper: MockTest,
  updates: Partial<LiveTest>
): Promise<Partial<LiveTest>> {
  const paperUpdates: Partial<MockTest> = {};
  const nextTitle = updates.title?.trim();
  if (nextTitle && nextTitle !== paper.title) paperUpdates.title = nextTitle;
  if (
    updates.durationMinutes !== undefined &&
    Number(updates.durationMinutes) !== Number(paper.durationMinutes)
  )
    paperUpdates.durationMinutes = Number(updates.durationMinutes);
  if (
    updates.negativeMarking !== undefined &&
    Number(updates.negativeMarking) !== Number(paper.negativeMarking)
  )
    paperUpdates.negativeMarking = Number(updates.negativeMarking);
  if (
    updates.subscriptionRequired !== undefined &&
    Boolean(updates.subscriptionRequired) !== Boolean(paper.isPremium)
  )
    paperUpdates.isPremium = Boolean(updates.subscriptionRequired);
  if (Object.keys(paperUpdates).length > 0) await updateTest(paper.id, paperUpdates);

  const publishing =
    updates.status !== undefined &&
    PUBLISHED_EVENT_STATUSES.includes(updates.status) &&
    (existing.status === 'draft' || paper.status !== 'published');
  if (!publishing) return updates;

  const validation = await validateTestForPublish(paper.id);
  if (!validation.isValid)
    throw new Error(
      `Upload this Live Test's questions before publishing it: ${validation.errors.join('; ')}`
    );
  if (paper.status !== 'published') await updateTest(paper.id, { status: 'published' });
  const fresh = await getTestById(paper.id);
  return fresh
    ? { ...updates, totalQuestions: fresh.totalQuestions, totalMarks: fresh.totalMarks }
    : updates;
}

/** Make an ended Live Test's paper an ordinary Full Mock that students can practise. */
export async function releaseLivePaperToPractice(id: string): Promise<MockTest> {
  const liveTest = await getLiveTestById(id);
  if (!liveTest) throw new Error('Live test not found.');
  if (!['ended', 'completed', 'cancelled'].includes(liveTest.status))
    throw new Error('A Live Test paper can be released to practice only after the Live Test ends.');
  const paper = (await fetchSourceTestsMap([liveTest.testId])).get(liveTest.testId);
  if (!paper) throw new Error('The Live Test paper no longer exists.');
  if (!paper.isLiveOnly) throw new Error('This paper is already available for practice.');
  const released = await updateTest(paper.id, { isLiveOnly: false });
  notifyExamsUpdated();
  return released;
}

/**
 * Duplicate a Live Test as a new Draft for tomorrow. A live-only paper is copied with its
 * questions, so the new event never shares (or locks) the original's paper.
 */
export async function duplicateLiveTest(id: string): Promise<LiveTest> {
  const liveTest = await getLiveTestById(id);
  if (!liveTest) throw new Error('Live test not found.');
  const startAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  const logo = liveTest.logo || liveTest.examLogo || undefined;
  const common = {
    title: `${liveTest.title} (Copy)`,
    startAt,
    durationMinutes: liveTest.durationMinutes ?? 0,
    totalQuestions: liveTest.totalQuestions ?? 0,
    totalMarks: liveTest.totalMarks ?? 0,
    negativeMarking: liveTest.negativeMarking ?? 0,
    rankingEnabled: Boolean(liveTest.rankingEnabled),
    subscriptionRequired: Boolean(liveTest.subscriptionRequired),
    logo,
    examLogo: logo,
  };

  if (!liveTest.test?.isLiveOnly) {
    return scheduleLiveTest({
      ...common,
      testId: liveTest.testId,
      registrationDeadline: new Date(Date.now() + 23.5 * 3600 * 1000).toISOString(),
    });
  }

  const copy = await duplicateTest(liveTest.testId);
  if (!copy) throw new Error('The Live Test paper could not be copied.');
  try {
    return await scheduleLiveTest({
      ...common,
      testId: copy.id,
      registrationDeadline: startAt,
      status: 'draft',
    });
  } catch (err) {
    await deleteTest(copy.id).catch(() => undefined);
    throw err;
  }
}

/** Update Live Test schedule or status */
export async function updateLiveTest(id: string, updates: Partial<LiveTest>): Promise<LiveTest> {
  const currentList = await getLiveTests();
  const existing = currentList.find((lt) => lt.id === id);

  if (!existing) throw new Error('Live test not found.');
  // A running event's paper and timing are fixed: students are already answering it.
  if (existing.status === 'live') {
    if (updates.testId && updates.testId !== existing.testId)
      throw new Error('The source test of a running Live Test cannot be changed.');
    if (
      updates.durationMinutes !== undefined &&
      Number(updates.durationMinutes) !== Number(existing.durationMinutes)
    )
      throw new Error('The duration of a running Live Test cannot be changed.');
  }
  const testId = updates.testId || existing.testId;
  const sourceTestsMap = testId ? await fetchSourceTestsMap([testId]) : new Map<string, MockTest>();
  const sourceTest = sourceTestsMap.get(testId) || existing?.test || null;
  if (updates.testId && updates.testId !== existing?.testId)
    assertFullMockSource(updates.testId, sourceTestsMap.get(updates.testId) || null);
  if (sourceTest?.isLiveOnly && testId === existing.testId) {
    updates = await syncLivePaper(existing, sourceTest, updates);
  }

  // Map the requested status onto the stored columns (Draft = unpublished). Without an explicit
  // status, keep a cancellation and otherwise let deriveLiveTestStatus compute from the schedule.
  const dbFields = updates.status ? toDbStatusFields(updates.status) : null;
  const nextStatus =
    dbFields?.status ?? (existing.status === 'cancelled' ? 'cancelled' : 'upcoming');
  const nextIsPublished = dbFields?.isPublished ?? existing.isPublished;

  const updatedItem = enrichLiveTest(
    {
      ...(existing || { id, testId }),
      ...updates,
      status: nextStatus,
      isPublished: nextIsPublished,
      updatedAt: new Date().toISOString(),
    },
    sourceTest
  );

  const nextList = currentList.some((lt) => lt.id === id)
    ? currentList.map((lt) => (lt.id === id ? updatedItem : lt))
    : [updatedItem, ...currentList];

  if (!isSupabaseConfigured) await syncLiveTestsToRemote(sortLiveTests(nextList));

  if (isSupabaseConfigured) {
    try {
      const payload: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (updates.title !== undefined) {
        payload.title = updates.title;
      }
      if (updates.logo !== undefined || updates.examLogo !== undefined) {
        payload.logo = updates.logo || updates.examLogo;
        payload.exam_logo = updates.logo || updates.examLogo;
      }
      if (updates.totalQuestions !== undefined) {
        payload.total_questions = updates.totalQuestions;
      }
      if (updates.durationMinutes !== undefined) {
        payload.duration_minutes = updates.durationMinutes;
      }
      if (updates.startAt) {
        payload.start_at = updates.startAt;
        payload.scheduled_start_time = updates.startAt;
        payload.scheduled_end_time = updatedItem.scheduledEndTime;
      }
      if (updates.registrationDeadline !== undefined) {
        payload.registration_deadline = updates.registrationDeadline;
      }
      if (dbFields) {
        payload.status = dbFields.status;
        if (dbFields.isPublished !== undefined) payload.is_published = dbFields.isPublished;
      }
      if (updates.rankingEnabled !== undefined) payload.ranking_enabled = updates.rankingEnabled;
      if (updates.subscriptionRequired !== undefined) {
        payload.subscription_required = updates.subscriptionRequired;
      }
      if (updates.enrolledCount !== undefined) {
        payload.enrolled_count = updates.enrolledCount;
      }

      let nextInstructions: string | undefined = updates.instructions;
      const targetBg = updates.bgImageUrl !== undefined ? updates.bgImageUrl : updates.cardBgImage;
      if (targetBg !== undefined) {
        const rawBase =
          updates.instructions !== undefined ? updates.instructions : existing.instructions || '';
        nextInstructions = targetBg
          ? JSON.stringify({
              instructions: rawBase,
              bgImageUrl: targetBg,
            })
          : rawBase;
      }

      requireSavedRow(
        await supabase
          .from('live_tests')
          .update({
            ...payload,
            ...(updates.testId ? { test_id: updates.testId } : {}),
            ...(nextInstructions !== undefined ? { instructions: nextInstructions } : {}),
          })
          .eq('id', id)
          .select('id')
          .single(),
        id
      );

      try {
        await syncLiveTestsToRemote(sortLiveTests(nextList));
      } catch {
        // ignore
      }
    } catch (err) {
      throw new Error(
        err instanceof Error && err.message
          ? `Live test could not be saved: ${err.message}`
          : 'Live test could not be saved. Check the backend schema and permissions.'
      );
    }
  }

  notifyExamsUpdated();
  return updatedItem;
}

/** Upload Exam/Test Logo for Live Test to Supabase Storage */
export async function uploadLiveTestLogo(file: File, _id: string = 'custom'): Promise<string> {
  validateRasterFile(file, 'banners');
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

/** Upload Card Background Image for Live Test to Supabase Storage */
export async function uploadLiveTestBackground(
  file: File,
  _id: string = 'custom'
): Promise<string> {
  validateRasterFile(file, 'banners');
  if (isSupabaseConfigured) return uploadValidatedImage(file, 'banners');
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Image read failed'));
    reader.readAsDataURL(file);
  });
}

/** Cancel a live test */
export async function cancelLiveTest(id: string): Promise<boolean> {
  return (await updateLiveTest(id, { status: 'cancelled' })).status === 'cancelled';
}

/** Delete a live test */
export async function deleteLiveTest(id: string): Promise<boolean> {
  if (isSupabaseConfigured) {
    const before = await getLiveTests();
    const target = before.find((lt) => lt.id === id);
    const deleted = await deleteAdminRecord('live_tests', id);
    // A live-only paper has no other home: archive it once no Live Test uses it any more
    // (archived, not deleted, so attempts and results stay intact).
    if (
      deleted &&
      target?.test?.isLiveOnly &&
      !before.some((lt) => lt.id !== id && lt.testId === target.testId)
    ) {
      await archiveTest(target.testId);
    }
    notifyExamsUpdated();
    return deleted;
  }
  const rows = await getLiveTests();
  if (!rows.some((r) => r.id === id)) throw new Error('Live test not found.');
  await syncLiveTestsToRemote(rows.filter((r) => r.id !== id));
  notifyExamsUpdated();
  return true;
}

/** Sync participations list to app_settings for cross-device registration & leaderboard support */
async function syncParticipationsToRemote(list: LiveTestParticipant[]): Promise<void> {
  saveStoredParticipations(list);
  if (!isSupabaseConfigured) return;

  try {
    const settingRow = {
      id: APP_SETTINGS_PARTICIPANTS_ID,
      category: 'live_tests',
      key: APP_SETTINGS_PARTICIPANTS_ID,
      value: list.slice(-500), // Keep latest 500 participations compact
      description: 'Live Mock Test Student Participations & Submissions',
      updated_at: new Date().toISOString(),
    };
    await supabase.from('app_settings').upsert(settingRow, { onConflict: 'id' });
  } catch {
    // Ignore if student role cannot write directly to app_settings;
    // student submissions are also recorded in `public.test_attempts`!
  }
}

async function fetchRemoteParticipations(): Promise<LiveTestParticipant[]> {
  const local = getStoredParticipations();
  if (!isSupabaseConfigured) return local;

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('id', APP_SETTINGS_PARTICIPANTS_ID)
      .maybeSingle();

    if (!error && data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      if (Array.isArray(parsed)) {
        // Merge remote and local participations by `liveTestId + userId`
        const mergedMap = new Map<string, LiveTestParticipant>();
        for (const p of parsed) {
          if (p && p.liveTestId && p.userId) {
            mergedMap.set(`${p.liveTestId}:${p.userId}`, p);
          }
        }
        for (const p of local) {
          if (p && p.liveTestId && p.userId) {
            const key = `${p.liveTestId}:${p.userId}`;
            const prev = mergedMap.get(key);
            if (
              !prev ||
              p.status === 'completed' ||
              (p.score !== undefined && prev.score === undefined)
            ) {
              mergedMap.set(key, p);
            }
          }
        }
        const merged = Array.from(mergedMap.values());
        saveStoredParticipations(merged);
        return merged;
      }
    }
  } catch {
    // Ignore
  }
  return local;
}

/** Register student for an upcoming live test */
export async function registerForLiveTest(
  liveTestId: string,
  userId: string
): Promise<LiveTestParticipant> {
  const allParts = await fetchRemoteParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return existing;

  const participation: LiveTestParticipant = {
    id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    liveTestId,
    userId,
    registeredAt: new Date().toISOString(),
    status: 'registered',
  };

  const nextParts = [...allParts, participation];
  await syncParticipationsToRemote(nextParts);

  // Update enrolled count on the live test
  try {
    const currentTests = await getLiveTests();
    const target = currentTests.find((t) => t.id === liveTestId);
    if (target) {
      const nextCount = (target.enrolledCount || 0) + 1;
      await updateLiveTest(liveTestId, {
        enrolledCount: nextCount,
        participantsCount: Math.max(target.participantsCount || 0, nextCount),
      });
    }
  } catch {
    // Ignore count update failure
  }

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participants').upsert(
        {
          live_test_id: liveTestId,
          user_id: userId,
          status: 'registered',
          registered_at: participation.registeredAt,
        },
        { onConflict: 'live_test_id,user_id' }
      );
    } catch {
      // Handled via local & app_settings
    }
  }

  return participation;
}

/** Check if student is registered for a live test */
export async function isLiveTestRegistered(liveTestId: string, userId: string): Promise<boolean> {
  const allParts = getStoredParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  if (existing) return true;

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('live_test_participants')
        .select('id')
        .eq('live_test_id', liveTestId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!error && data) return true;
    } catch {
      // Ignore
    }

    const remoteParts = await fetchRemoteParticipations();
    if (remoteParts.some((p) => p.liveTestId === liveTestId && p.userId === userId)) {
      return true;
    }
  }
  return false;
}

/**
 * Join live test event:
 * Validates start timing (no early entry), updates status to 'started', sets joined_at
 */
export async function joinLiveTestEvent(
  liveTestId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const liveTest = await getLiveTestById(liveTestId);
  if (!liveTest) return { success: false, error: 'Live test event not found.' };

  if (liveTest.status === 'cancelled') {
    return { success: false, error: 'This live test event has been cancelled.' };
  }

  const now = Date.now();
  const startTime = new Date(liveTest.startAt).getTime();
  if (now < startTime) {
    return {
      success: false,
      error: 'The Live Test has not started yet. Please wait until scheduled start time.',
    };
  }

  const duration = liveTest.durationMinutes;
  if (!duration) {
    return { success: false, error: 'This Live Test has no duration set yet.' };
  }
  const endTime = startTime + duration * 60 * 1000;
  if (now > endTime || liveTest.status === 'ended') {
    return { success: false, error: 'This Live Test event has already ended.' };
  }

  // Record started state
  const allParts = getStoredParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);
  const joinedAt = new Date().toISOString();

  if (existing) {
    if (existing.status !== 'completed') {
      existing.status = 'started';
    }
    existing.joinedAt = joinedAt;
  } else {
    allParts.push({
      id: `part-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      liveTestId,
      userId,
      registeredAt: joinedAt,
      joinedAt,
      status: 'started',
    });
  }
  await syncParticipationsToRemote(allParts);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participants').upsert(
        {
          live_test_id: liveTestId,
          user_id: userId,
          status: 'started',
          joined_at: joinedAt,
        },
        { onConflict: 'live_test_id,user_id' }
      );
    } catch {
      // Handled locally
    }
  }

  return { success: true };
}

/** Record student's submission from existing test runner into live test participant record */
export async function recordLiveTestSubmission(
  liveTestId: string,
  userId: string,
  submission: {
    attemptId: string;
    score: number;
    accuracy: number;
    timeTaken: number;
  }
): Promise<void> {
  const completedAt = new Date().toISOString();
  const allParts = await fetchRemoteParticipations();
  const existing = allParts.find((p) => p.liveTestId === liveTestId && p.userId === userId);

  let fullName: string | undefined;
  let avatarUrl: string | undefined;
  let district: string | undefined;

  if (isSupabaseConfigured) {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, district')
        .eq('id', userId)
        .maybeSingle();
      if (profile) {
        fullName = (profile as any).full_name || undefined;
        avatarUrl = (profile as any).avatar_url || undefined;
        district = (profile as any).district || undefined;
      }
    } catch {
      // Ignore profile fetch error
    }
  }

  if (existing) {
    existing.status = 'completed';
    existing.completedAt = completedAt;
    existing.attemptId = submission.attemptId;
    existing.score = submission.score;
    existing.accuracy = submission.accuracy;
    existing.timeTaken = submission.timeTaken;
    if (fullName) existing.fullName = fullName;
    if (avatarUrl) existing.avatarUrl = avatarUrl;
    if (district) existing.district = district;
  } else {
    allParts.push({
      id: `part-${Date.now()}`,
      liveTestId,
      userId,
      registeredAt: completedAt,
      joinedAt: completedAt,
      completedAt,
      status: 'completed',
      attemptId: submission.attemptId,
      score: submission.score,
      accuracy: submission.accuracy,
      timeTaken: submission.timeTaken,
      fullName,
      avatarUrl,
      district,
    });
  }

  await syncParticipationsToRemote(allParts);

  if (isSupabaseConfigured) {
    try {
      await supabase.from('live_test_participants').upsert(
        {
          live_test_id: liveTestId,
          user_id: userId,
          status: 'completed',
          completed_at: completedAt,
          attempt_id: submission.attemptId,
          score: submission.score,
          accuracy: submission.accuracy,
          time_taken: submission.timeTaken,
        },
        { onConflict: 'live_test_id,user_id' }
      );
    } catch {
      // Handled via test_attempts & local store
    }
  }
}

/**
 * Deterministic Leaderboard Ranking:
 * 1. Higher score (score DESC)
 * 2. Higher accuracy (accuracy DESC)
 * 3. Lower time taken (timeTaken ASC)
 */
export interface LiveTestStats {
  /** Distinct students who started the paper during the live window. */
  participants: number;
  /** Distinct students who submitted it during the live window. */
  submitted: number;
  /** Mean of each submitter's best score, or null when nobody submitted. */
  avgScore: number | null;
  /** Mean time spent on those best attempts, in seconds. */
  avgTimeSeconds: number | null;
  /** Districts of participants with a known district, most frequent first. */
  topDistricts: { name: string; count: number; percent: number }[];
  /** Submitters ranked by best score, then less time. */
  leaderboard: { rank: number; userId: string; name: string; score: number; timeSeconds: number }[];
}

/**
 * Which Live Test each uploaded live question belongs to (question id -> live test id), so the
 * Question Bank's Live Test mode can show and filter them by event.
 */
export async function getLiveQuestionIndex(liveTests: LiveTest[]): Promise<Record<string, string>> {
  const liveByPaper = new Map<string, string>();
  for (const lt of liveTests) if (lt.testId) liveByPaper.set(lt.testId, lt.id);
  const index: Record<string, string> = {};
  if (liveByPaper.size === 0) return index;

  if (!isSupabaseConfigured) {
    for (const tq of localTestQuestions) {
      const liveId = liveByPaper.get(tq.testId);
      if (liveId) index[tq.questionId] = liveId;
    }
    return index;
  }

  const { data, error } = await supabase
    .from('test_questions')
    .select('test_id, question_id')
    .in('test_id', Array.from(liveByPaper.keys()));
  if (error) throw new Error(error.message);
  for (const row of (data || []) as { test_id: string; question_id: string }[]) {
    const liveId = liveByPaper.get(String(row.test_id));
    if (liveId) index[String(row.question_id)] = liveId;
  }
  return index;
}

export const EMPTY_LIVE_TEST_STATS: LiveTestStats = {
  participants: 0,
  submitted: 0,
  avgScore: null,
  avgTimeSeconds: null,
  topDistricts: [],
  leaderboard: [],
};

interface LiveAttemptRow {
  id: string;
  test_id: string;
  user_id: string;
  status: string | null;
  score: number | null;
  time_spent_seconds: number | null;
  start_time: string | null;
}

/**
 * Real participation numbers for each Live Test, read from `test_attempts` (only attempts
 * started inside the event's window count, so practice attempts of a released paper do not).
 */
export async function getLiveTestsStats(
  liveTests: LiveTest[]
): Promise<Record<string, LiveTestStats>> {
  const result: Record<string, LiveTestStats> = {};
  for (const lt of liveTests) result[lt.id] = { ...EMPTY_LIVE_TEST_STATS };
  if (!isSupabaseConfigured) return result;

  const testIds = Array.from(new Set(liveTests.map((lt) => lt.testId).filter(Boolean)));
  if (testIds.length === 0) return result;

  const attempts = await loadAllPages<LiveAttemptRow>(async (limit, offset) => {
    const { data, error } = await supabase
      .from('test_attempts')
      .select('id, test_id, user_id, status, score, time_spent_seconds, start_time')
      .in('test_id', testIds)
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);
    if (error) throw new Error(error.message);
    return (data || []) as LiveAttemptRow[];
  }, 1000);

  const perLive = new Map<string, LiveAttemptRow[]>();
  for (const lt of liveTests) {
    const start = new Date(lt.startAt).getTime();
    if (isNaN(start)) continue;
    const end = start + Math.max(1, Number(lt.durationMinutes) || 0) * 60 * 1000;
    perLive.set(
      lt.id,
      attempts.filter((a) => {
        const t = a.start_time ? new Date(a.start_time).getTime() : NaN;
        return a.test_id === lt.testId && t >= start && t <= end;
      })
    );
  }

  const userIds = Array.from(
    new Set(Array.from(perLive.values()).flatMap((rows) => rows.map((a) => a.user_id)))
  );
  const profiles = new Map<string, { name?: string; district?: string }>();
  for (let i = 0; i < userIds.length; i += 200) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, district')
      .in('id', userIds.slice(i, i + 200));
    if (error) throw new Error(error.message);
    for (const row of (data || []) as { id: string; full_name?: string; district?: string }[]) {
      profiles.set(String(row.id), {
        name: row.full_name?.trim() || undefined,
        district: row.district?.trim() || undefined,
      });
    }
  }

  for (const [liveId, rows] of perLive) {
    const participantIds = new Set(rows.map((a) => a.user_id));
    const best = new Map<string, LiveAttemptRow>();
    for (const a of rows) {
      if (a.status !== 'completed') continue;
      const prev = best.get(a.user_id);
      const better =
        !prev ||
        Number(a.score || 0) > Number(prev.score || 0) ||
        (Number(a.score || 0) === Number(prev.score || 0) &&
          Number(a.time_spent_seconds || 0) < Number(prev.time_spent_seconds || 0));
      if (better) best.set(a.user_id, a);
    }
    const bestRows = Array.from(best.values());
    const mean = (values: number[]) =>
      values.length ? values.reduce((sum, v) => sum + v, 0) / values.length : null;

    const districtCounts = new Map<string, number>();
    for (const id of participantIds) {
      const district = profiles.get(id)?.district;
      if (district) districtCounts.set(district, (districtCounts.get(district) || 0) + 1);
    }
    const withDistrict = Array.from(districtCounts.values()).reduce((sum, n) => sum + n, 0);

    result[liveId] = {
      participants: participantIds.size,
      submitted: bestRows.length,
      avgScore: mean(bestRows.map((a) => Number(a.score || 0))),
      avgTimeSeconds: mean(bestRows.map((a) => Number(a.time_spent_seconds || 0))),
      topDistricts: Array.from(districtCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
          name,
          count,
          percent: Math.round((count / withDistrict) * 100),
        })),
      leaderboard: bestRows
        .sort(
          (a, b) =>
            Number(b.score || 0) - Number(a.score || 0) ||
            Number(a.time_spent_seconds || 0) - Number(b.time_spent_seconds || 0)
        )
        .map((a, idx) => ({
          rank: idx + 1,
          userId: a.user_id,
          name: profiles.get(a.user_id)?.name || 'Student',
          score: Number(a.score || 0),
          timeSeconds: Number(a.time_spent_seconds || 0),
        })),
    };
  }
  return result;
}

export async function getLiveTestLeaderboard(liveTestId: string): Promise<LiveTestParticipant[]> {
  const candidatesByUserId = new Map<string, LiveTestParticipant>();

  // 1. Seed from local & app_settings participations
  const storedParts = await fetchRemoteParticipations();
  for (const p of storedParts) {
    if (p.liveTestId === liveTestId && (p.status === 'completed' || p.score !== undefined)) {
      candidatesByUserId.set(p.userId, { ...p });
    }
  }

  if (isSupabaseConfigured) {
    // 2. Try RPC `get_live_test_leaderboard` if available
    try {
      const { data, error } = await supabase.rpc('get_live_test_leaderboard', {
        p_live_test_id: liveTestId,
      });

      if (!error && Array.isArray(data) && data.length > 0) {
        for (const row of data) {
          candidatesByUserId.set(String(row.user_id), {
            id: String(row.participant_id || `part-${row.user_id}`),
            liveTestId,
            userId: String(row.user_id),
            registeredAt: row.completed_at || new Date().toISOString(),
            completedAt: row.completed_at,
            status: 'completed',
            score: Number(row.score || 0),
            accuracy: Number(row.accuracy || 0),
            timeTaken: Number(row.time_taken || 0),
            rank: Number(row.rank || 1),
            fullName: row.full_name || 'Student',
            avatarUrl: row.avatar_url,
            district: row.district || 'West Bengal',
          });
        }
      }
    } catch {
      // Fallback to test_attempts
    }

    // 3. Also enrich from `public.test_attempts` for the underlying `testId` so all real student
    // submissions in Supabase appear on the statewide leaderboard even without migration 044!
    try {
      const liveTest = await getLiveTestById(liveTestId);
      const windowStart = liveTest ? new Date(liveTest.startAt).getTime() : NaN;
      if (liveTest?.testId && !isNaN(windowStart)) {
        // Only attempts started during the live window count — practice attempts of the same
        // underlying test before or after the event must not appear on the live leaderboard.
        const windowEnd =
          windowStart + Math.max(1, Number(liveTest.durationMinutes) || 0) * 60 * 1000;
        const { data: attemptsData, error: attemptsErr } = await supabase
          .from('test_attempts')
          .select('id, user_id, score, accuracy, time_spent_seconds, end_time, created_at')
          .eq('test_id', liveTest.testId)
          .eq('status', 'completed')
          .gte('start_time', new Date(windowStart).toISOString())
          .lte('start_time', new Date(windowEnd).toISOString())
          .order('score', { ascending: false })
          .limit(200);

        if (!attemptsErr && Array.isArray(attemptsData) && attemptsData.length > 0) {
          const userIds = Array.from(
            new Set(attemptsData.map((a: any) => String(a.user_id)).filter(Boolean))
          );

          const profilesMap = new Map<
            string,
            { fullName?: string; avatarUrl?: string; district?: string }
          >();
          if (userIds.length > 0) {
            try {
              const { data: profData } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, district')
                .in('id', userIds);
              if (Array.isArray(profData)) {
                for (const pr of profData as any[]) {
                  profilesMap.set(String(pr.id), {
                    fullName: pr.full_name || undefined,
                    avatarUrl: pr.avatar_url || undefined,
                    district: pr.district || undefined,
                  });
                }
              }
            } catch {
              // Ignore profile lookup error
            }
          }

          for (const att of attemptsData as any[]) {
            const uId = String(att.user_id);
            const prof = profilesMap.get(uId);
            const existing = candidatesByUserId.get(uId);
            const attScore = Number(att.score || 0);
            const attAcc = Number(att.accuracy || 0);
            const attTime = Number(att.time_spent_seconds || 0);

            if (!existing || attScore > (existing.score ?? -Infinity)) {
              candidatesByUserId.set(uId, {
                id: existing?.id || `part-${att.id}`,
                liveTestId,
                userId: uId,
                attemptId: String(att.id),
                registeredAt: existing?.registeredAt || att.created_at || new Date().toISOString(),
                completedAt: att.end_time || att.created_at || new Date().toISOString(),
                status: 'completed',
                score: attScore,
                accuracy: attAcc,
                timeTaken: attTime,
                fullName: prof?.fullName || existing?.fullName || 'Student',
                avatarUrl: prof?.avatarUrl || existing?.avatarUrl,
                district: prof?.district || existing?.district || 'West Bengal',
              });
            } else if (existing && !existing.fullName && prof?.fullName) {
              existing.fullName = prof.fullName;
              existing.avatarUrl = prof.avatarUrl;
              existing.district = prof.district;
            }
          }
        }
      }
    } catch {
      // Ignore attempts query error
    }
  }

  // Deterministic tie-breaking sort
  const participants = Array.from(candidatesByUserId.values()).sort((a, b) => {
    // 1. Higher score
    const scoreDiff = (b.score || 0) - (a.score || 0);
    if (scoreDiff !== 0) return scoreDiff;

    // 2. Higher accuracy
    const accDiff = (b.accuracy || 0) - (a.accuracy || 0);
    if (accDiff !== 0) return accDiff;

    // 3. Lower time taken
    const timeDiff = (a.timeTaken || 999999) - (b.timeTaken || 999999);
    if (timeDiff !== 0) return timeDiff;

    return (a.completedAt || '').localeCompare(b.completedAt || '');
  });

  return participants.map((p, idx) => ({
    ...p,
    rank: idx + 1,
  }));
}

/**
 * Subscribe to real-time Live Test updates across tabs and Supabase channels
 */
export function subscribeToLiveTestUpdates(callback: () => void): () => void {
  const handleLocal = () => callback();
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === PARTICIPANTS_STORAGE_KEY) {
      callback();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('pk_live_tests_updated', handleLocal);
    window.addEventListener('storage', handleStorage);
  }

  let broadcastChannel: any = null;
  let postgresChannel: any = null;

  if (isSupabaseConfigured) {
    try {
      broadcastChannel = supabase
        .channel('live_tests_sync_channel')
        .on('broadcast', { event: 'live_tests_updated' }, () => {
          callback();
        })
        .subscribe();

      postgresChannel = supabase
        .channel('realtime:live_tests_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'app_settings',
            filter: `id=eq.${APP_SETTINGS_LIVE_TESTS_ID}`,
          },
          () => {
            callback();
          }
        )
        .subscribe();
    } catch {
      // Ignore realtime subscription errors
    }
  }

  return () => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('pk_live_tests_updated', handleLocal);
      window.removeEventListener('storage', handleStorage);
    }
    if (broadcastChannel && isSupabaseConfigured) {
      try {
        supabase.removeChannel(broadcastChannel);
      } catch {
        // ignore
      }
    }
    if (postgresChannel && isSupabaseConfigured) {
      try {
        supabase.removeChannel(postgresChannel);
      } catch {
        // ignore
      }
    }
  };
}

/** Backward-compatible aliases */
export const createLiveTest = scheduleLiveTest;
export const joinLiveTest = registerForLiveTest;

export const adminLiveTestsApi = {
  getLiveTests,
  getActiveLiveTest,
  getLiveTestById,
  isTestLockedForEditing,
  scheduleLiveTest,
  createLiveTest,
  createLiveTestWithPaper,
  duplicateLiveTest,
  releaseLivePaperToPractice,
  updateLiveTest,
  cancelLiveTest,
  deleteLiveTest,
  registerForLiveTest,
  joinLiveTest,
  isLiveTestRegistered,
  joinLiveTestEvent,
  recordLiveTestSubmission,
  getLiveTestLeaderboard,
  getLiveTestsStats,
  getLiveQuestionIndex,
  subscribeToLiveTestUpdates,
  uploadLiveTestLogo,
  uploadLiveTestBackground,
};
