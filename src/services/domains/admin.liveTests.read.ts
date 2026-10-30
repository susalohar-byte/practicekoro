import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localLiveTests } from '@/services/domains/localStore';
import type { LiveTest } from '@/types';
import {
  LIVE_TEST_COLUMNS,
  getStoredLiveTests,
  saveStoredLiveTests,
  mapRowToMockTest,
  enrichLiveTest,
  sortLiveTests,
} from './admin.liveTests.store';
import type { LiveTestSource, SourceTestRow } from './admin.liveTests.store';
import type { FilterableQuery } from './queryFilters';

/** A `live_tests` row as selected by `LIVE_TEST_COLUMNS` (source paper embedded). */
type LiveTestQueryRow = LiveTestSource & { tests?: SourceTestRow | null };

/**
 * After a Live Test change: keep the local copy (localStorage + in-memory + window event) and
 * tell other open admin/student sessions to refetch (tiny Realtime broadcast). `public.live_tests`
 * is the only remote store; the old `app_settings.live_tests_schedule_list` mirror is retired.
 */
export async function syncLiveTestsToRemote(list: LiveTest[]): Promise<void> {
  saveStoredLiveTests(list);

  if (!isSupabaseConfigured) return;

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

/** Reads `live_tests` with explicit columns (source paper embedded), narrowed by `apply`. */
async function queryLiveTests(
  apply: <Q extends FilterableQuery>(q: Q) => Q = (q) => q
): Promise<LiveTest[]> {
  const q = apply(supabase.from('live_tests').select(LIVE_TEST_COLUMNS).order('start_at'));
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data || []) as LiveTestQueryRow[]).map((r) =>
    enrichLiveTest(r, r.tests ? mapRowToMockTest(r.tests) : null)
  );
}

function getLocalLiveTests(examId?: string): LiveTest[] {
  const stored = getStoredLiveTests();
  const sourceList = stored.length > 0 ? stored : localLiveTests;
  const enriched = sourceList
    .map((lt) => enrichLiveTest(lt))
    .filter((lt) => !examId || lt.examId === examId);
  return sortLiveTests(enriched);
}

export async function getLiveTests(examId?: string): Promise<LiveTest[]> {
  if (!isSupabaseConfigured) return getLocalLiveTests(examId);
  if (examId) return queryLiveTests((q) => q.eq('exam_id', examId));
  return queryLiveTests();
}

export async function getActiveLiveTest(): Promise<LiveTest | null> {
  // Only published, non-cancelled events can be active (same rule as the filter below).
  const all = isSupabaseConfigured
    ? await queryLiveTests((q) => q.eq('is_published', true).neq('status', 'cancelled'))
    : await getLiveTests();
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
  if (!isSupabaseConfigured) return getLocalLiveTests().find((lt) => lt.id === id) || null;
  const rows = await queryLiveTests((q) => q.eq('id', id).limit(1));
  return rows[0] || null;
}

/** Live Test events scheduled on one paper (`tests.id`). */
export async function getLiveTestsByTestId(testId: string): Promise<LiveTest[]> {
  if (!isSupabaseConfigured) return getLocalLiveTests().filter((lt) => lt.testId === testId);
  return queryLiveTests((q) => q.eq('test_id', testId));
}

/** Check if a test is locked because it is part of an active (upcoming or live) Live Test */
export async function isTestLockedForEditing(testId: string): Promise<boolean> {
  const events = await getLiveTestsByTestId(testId);
  return events.some(
    (lt) => lt.testId === testId && (lt.status === 'upcoming' || lt.status === 'live')
  );
}
