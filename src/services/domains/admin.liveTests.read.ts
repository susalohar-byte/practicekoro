import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { localLiveTests } from '@/services/domains/localStore';
import type { LiveTest } from '@/types';
import {
  APP_SETTINGS_LIVE_TESTS_ID,
  getStoredLiveTests,
  saveStoredLiveTests,
  mapRowToMockTest,
  fetchSourceTestsMap,
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
