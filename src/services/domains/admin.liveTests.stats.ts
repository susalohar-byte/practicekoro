import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { loadAllPages } from '@/utils/loadAllPages';
import { localTestQuestions } from '@/services/domains/localStore';
import type { LiveTest, LiveTestParticipant } from '@/types';
import { getLiveTestById } from './admin.liveTests.read';
import { fetchRemoteParticipations } from './admin.liveTests.participants';

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
