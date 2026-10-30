import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { LiveTestParticipant } from '@/types';
import type { Tables } from '@/types/database.generated';
import {
  APP_SETTINGS_PARTICIPANTS_ID,
  getStoredParticipations,
  saveStoredParticipations,
} from './admin.liveTests.store';
import { getLiveTests, getLiveTestById } from './admin.liveTests.read';
import { updateLiveTest } from './admin.liveTests.write';

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

export async function fetchRemoteParticipations(): Promise<LiveTestParticipant[]> {
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

  const duration = liveTest.durationMinutes || 90;
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
        const profileRow = profile as Pick<
          Tables<'profiles'>,
          'full_name' | 'avatar_url' | 'district'
        >;
        fullName = profileRow.full_name || undefined;
        avatarUrl = profileRow.avatar_url || undefined;
        district = profileRow.district || undefined;
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
