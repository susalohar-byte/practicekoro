import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localLiveTests } from '@/services/domains/localStore';
import type { LiveTest } from '@/types';
import {
  APP_SETTINGS_LIVE_TESTS_ID,
  LIVE_TEST_COLUMNS,
  getStoredLiveTests,
  saveStoredLiveTests,
  mapRowToMockTest,
  enrichLiveTest,
  sortLiveTests,
} from './admin.liveTests.store';

/**
 * Persist Live Tests list across all 3 tiers:
 * 1. localStorage + in-memory + window custom event
 * 2. Supabase `public.app_settings` (`id = 'live_tests_schedule_list'`)
 * 3. Broadcast on Supabase Realtime channel
 */
export async function syncLiveTestsToRemote(list: LiveTest[]): Promise<void> {
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

/** Reads `live_tests` with explicit columns (source paper embedded), narrowed by `apply`. */
async function queryLiveTests(apply: (q: any) => any = (q) => q): Promise<LiveTest[]> {
  const q = apply(supabase.from('live_tests').select(LIVE_TEST_COLUMNS).order('start_at'));
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return ((data || []) as any[]).map((r) =>
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
