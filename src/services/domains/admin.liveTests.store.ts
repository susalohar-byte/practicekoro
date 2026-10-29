import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  localExams,
  localLiveTests,
  localLiveTestParticipations,
  localTests,
} from '@/services/domains/localStore';
import type { LiveTest, LiveTestParticipant, MockTest } from '@/types';

/**
 * Service domain for Live Tests Management & Student Participation
 *
 * Core Principle:
 * LIVE TEST = EXISTING TEST + SCHEDULED EVENT + OPTIONAL RANKING
 * A Live Test does NOT have its own questions or runner; it is a thin event layer.
 *
 * Persistence:
 * 1. `public.live_tests` & `public.live_test_participants` tables (the only remote source of
 *    Live Test events; there is no `app_settings` mirror any more).
 * 2. Local Cache: `localStorage` (`pk_live_tests_list` & `pk_live_test_participations`) + in-memory store.
 */
export const STORAGE_KEY = 'pk_live_tests_list';
export const PARTICIPANTS_STORAGE_KEY = 'pk_live_test_participations';
export const APP_SETTINGS_PARTICIPANTS_ID = 'live_tests_participants_list';

export function getStoredLiveTests(): LiveTest[] {
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

export function saveStoredLiveTests(list: LiveTest[]): void {
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

export function getStoredParticipations(): LiveTestParticipant[] {
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

export function saveStoredParticipations(list: LiveTestParticipant[]): void {
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
export function toDbStatusFields(status: string): { status: string; isPublished?: boolean } {
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
export function mapRowToMockTest(row: any): MockTest {
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

/** `tests` columns read by `mapRowToMockTest` (+ exam title); never `*` (e.g. `icon_url`). */
export const LIVE_SOURCE_TEST_COLUMNS =
  'id, title, slug, description, test_type, duration_minutes, total_questions, total_marks, ' +
  'passing_marks, negative_marking, is_premium, is_active, is_live_only, order_index, status, ' +
  'exam_id, test_series_id, exams:exam_id(id,title)';

/** `live_tests` columns read by `enrichLiveTest`, with the source paper embedded. */
export const LIVE_TEST_COLUMNS =
  'id, test_id, start_at, registration_deadline, status, ranking_enabled, subscription_required, ' +
  'created_at, updated_at, title, exam_id, scheduled_start_time, scheduled_end_time, ' +
  'duration_minutes, total_questions, total_marks, negative_marking, logo, exam_logo, ' +
  `instructions, is_published, enrolled_count, tests(${LIVE_SOURCE_TEST_COLUMNS})`;

/** Batch-fetch source MockTests from Supabase `public.tests` (with localTests fallback) */
export async function fetchSourceTestsMap(testIds: string[]): Promise<Map<string, MockTest>> {
  const map = new Map<string, MockTest>();
  const uniqueIds = Array.from(new Set(testIds.filter(Boolean)));
  if (uniqueIds.length === 0) return map;

  // 1. Seed from localTests first
  for (const id of uniqueIds) {
    const local = localTests.find((t) => t.id === id);
    if (local) map.set(id, local);
  }

  // 2. Query Supabase `public.tests` when configured
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase
        .from('tests')
        .select(LIVE_SOURCE_TEST_COLUMNS)
        .in('id', uniqueIds);

      if (!error && Array.isArray(data)) {
        for (const row of data as any[]) {
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
export function enrichLiveTest(lt: any, sourceTest?: MockTest | null): LiveTest {
  const test =
    sourceTest ||
    lt.test ||
    localTests.find((t) => t.id === lt.testId || t.id === lt.test_id) ||
    null;
  const exam = localExams.find((e) => e.id === (lt.examId || lt.exam_id || test?.examId));

  const startAt =
    lt.startAt ||
    lt.start_at ||
    lt.scheduledStartTime ||
    lt.scheduled_start_time ||
    new Date().toISOString();
  const duration = Number(test?.durationMinutes || lt.durationMinutes || lt.duration_minutes || 90);
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
    new Date(new Date(startAt).getTime() + duration * 60000).toISOString();

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
    totalQuestions: Number(test?.totalQuestions || lt.totalQuestions || lt.total_questions || 100),
    totalMarks: Number(test?.totalMarks || lt.totalMarks || lt.total_marks || 100),
    negativeMarking: Number(
      test?.negativeMarking ?? lt.negativeMarking ?? lt.negative_marking ?? 0.25
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
export function sortLiveTests(list: LiveTest[]): LiveTest[] {
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
