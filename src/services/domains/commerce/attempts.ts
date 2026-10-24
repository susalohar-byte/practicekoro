import { readCompleteQuery, callReportingRpc } from '@/services/domains/admin.reporting';
import { deleteAdminRecord } from '@/services/domains/admin.mutations';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { ADMIN_EMAILS, isAdminEmail } from '@/lib/authPolicy';
import { loadAllPages } from '@/utils/loadAllPages';
import type { RankingStudent, AdminRankingFilter } from '@/types';

import type {
  AdminTestAttempt,
  AttemptListRow,
  AttemptProfileRow,
  RankingAttemptRow,
  RankingProfileRow,
  RankingTestRow,
} from '@/services/domains/commerce/rows';

/** Test attempts and student rankings. */

const TOPIC_TEST_TYPES = ['topic', 'topic_test', 'chapter_mock', 'subject_mock'];
const FULL_MOCK_TEST_TYPES = ['full_mock', 'full'];
const PYQ_TEST_TYPES = ['pyq', 'previous_year'];

interface RankingCriteria {
  since: Date | null;
  /** Lower-cased test types allowed by the test-type filter; null = all. */
  testTypes: string[] | null;
  /** Lower-cased test types allowed by the scope tab; null = all. */
  scopeTypes: string[] | null;
  exam: string | null;
  subject: string | null;
}

function rankingCriteria(filters?: AdminRankingFilter): RankingCriteria {
  let since: Date | null = null;
  if (filters?.timePeriod && filters.timePeriod !== 'All Time') {
    const period = filters.timePeriod.toLowerCase();
    const now = new Date();
    if (period === 'today') {
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'this week') {
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    } else if (period === 'this month') {
      since = new Date(now.getFullYear(), now.getMonth(), 1);
    }
  }
  let testTypes: string[] | null = null;
  if (filters?.testType && filters.testType !== 'All Types') {
    const typeFilter = filters.testType.toLowerCase();
    if (typeFilter.includes('live')) testTypes = FULL_MOCK_TEST_TYPES;
    else if (typeFilter.includes('full mock')) testTypes = FULL_MOCK_TEST_TYPES;
    else if (typeFilter.includes('topic')) testTypes = TOPIC_TEST_TYPES;
    else if (typeFilter.includes('pyq')) testTypes = PYQ_TEST_TYPES;
  }
  const scopeTypes =
    filters?.scope === 'By Topic'
      ? TOPIC_TEST_TYPES
      : filters?.scope === 'By Test Series' || filters?.scope === 'Live Tests'
        ? FULL_MOCK_TEST_TYPES
        : null;
  return {
    since,
    testTypes,
    scopeTypes,
    exam: filters?.exam && filters.exam !== 'All Exams' ? filters.exam : null,
    subject: filters?.subject && filters.subject !== 'All Subjects' ? filters.subject : null,
  };
}

/** One ranked student's totals: returned by admin_rankings_aggregate or built in the browser. */
interface RankingAggregate {
  user_id: string;
  full_name: string | null;
  email: string | null;
  district: string | null;
  avatar_url: string | null;
  profile_created_at: string | null;
  tests_attempted: number;
  total_score: number;
  total_max: number;
  total_correct: number;
  total_wrong: number;
  total_skipped: number;
  latest_at: string | null;
  max_percentage: number;
  /** In order of first appearance among the student's attempts (newest first). */
  subjects: { subject: string; score: number; marks: number }[];
  /** The three most recent attempts, newest first. */
  recent: { title: string; score: number; max: number; at: string | null }[];
}

/** Browser aggregation used until admin_rankings_aggregate is deployed. */
async function aggregateRankingsInBrowser(criteria: RankingCriteria): Promise<RankingAggregate[]> {
  // Read every row (PostgREST caps unpaged reads), and fail loudly on errors.
  const [rawAttempts, profileRows, testRows, examRows, subjectRows] = (await Promise.all([
    readCompleteQuery(() =>
      supabase
        .from('test_attempts')
        .select(
          'id, user_id, test_id, status, score, total_marks, correct_count, wrong_count, skipped_count, accuracy, time_spent_seconds, created_at, end_time',
          { count: 'exact' }
        )
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .order('id', { ascending: true })
    ),
    readCompleteQuery(() =>
      supabase
        .from('profiles')
        .select('id, full_name, email, phone, avatar_url, district, role, created_at', {
          count: 'exact',
        })
        .order('id', { ascending: true })
    ),
    readCompleteQuery(() =>
      supabase
        .from('tests')
        .select('id, title, test_type, exam_id, subject_id, total_questions, total_marks', {
          count: 'exact',
        })
        .order('id', { ascending: true })
    ),
    readCompleteQuery(() =>
      supabase
        .from('exams')
        .select('id, title', { count: 'exact' })
        .order('id', { ascending: true })
    ),
    readCompleteQuery(() =>
      supabase
        .from('subjects')
        .select('id, name', { count: 'exact' })
        .order('id', { ascending: true })
    ),
  ])) as [
    RankingAttemptRow[],
    RankingProfileRow[],
    RankingTestRow[],
    { id: string; title: string | null }[],
    { id: string; name: string | null }[],
  ];

  const profilesMap = new Map<string, RankingProfileRow>();
  profileRows.forEach((p) => {
    if (p.id) profilesMap.set(p.id, p);
  });
  const testsMap = new Map<string, RankingTestRow>();
  testRows.forEach((t) => {
    if (t.id) testsMap.set(t.id, t);
  });
  const examsMap = new Map<string, string>();
  examRows.forEach((e) => {
    if (e.id) examsMap.set(e.id, e.title || '');
  });
  const subjectsMap = new Map<string, string>();
  subjectRows.forEach((s) => {
    if (s.id) subjectsMap.set(s.id, s.name || '');
  });
  const testType = (a: RankingAttemptRow) =>
    (testsMap.get(a.test_id ?? '')?.test_type || '').toLowerCase();
  const examTerm = criteria.exam?.toLowerCase().trim();
  const subjectTerm = criteria.subject?.toLowerCase().trim();

  const completedAttempts = rawAttempts.filter((a) => {
    // Only students are ranked: staff (admin/instructor) and unknown accounts are excluded.
    const p = profilesMap.get(a.user_id ?? '');
    if (!p) return false;
    if (p.role && p.role !== 'student') return false;
    if (p.email && isAdminEmail(p.email)) return false;
    if (criteria.since && new Date(a.created_at || a.end_time || 0) < criteria.since) return false;
    if (criteria.testTypes && !criteria.testTypes.includes(testType(a))) return false;
    if (criteria.scopeTypes && !criteria.scopeTypes.includes(testType(a))) return false;
    const test = testsMap.get(a.test_id ?? '');
    if (criteria.exam) {
      const examTitle = (test?.exam_id ? examsMap.get(test.exam_id) || '' : '')
        .toLowerCase()
        .trim();
      if (!(test?.exam_id === criteria.exam || (!!examTitle && examTitle.includes(examTerm!))))
        return false;
    }
    if (criteria.subject) {
      const subjName = (test?.subject_id ? subjectsMap.get(test.subject_id) || '' : '')
        .toLowerCase()
        .trim();
      if (!(
        test?.subject_id === criteria.subject ||
        (!!subjName && subjName.includes(subjectTerm!))
      ))
        return false;
    }
    return true;
  });

  const byUser = new Map<string, RankingAggregate>();
  for (const att of completedAttempts) {
    if (!att.user_id) continue;
    let row = byUser.get(att.user_id);
    if (!row) {
      // completedAttempts only keeps attempts whose profile exists.
      const profile = profilesMap.get(att.user_id)!;
      row = {
        user_id: att.user_id,
        full_name: profile.full_name ?? null,
        email: profile.email ?? null,
        district: profile.district ?? null,
        avatar_url: profile.avatar_url ?? null,
        profile_created_at: profile.created_at ?? null,
        tests_attempted: 0,
        total_score: 0,
        total_max: 0,
        total_correct: 0,
        total_wrong: 0,
        total_skipped: 0,
        latest_at: null,
        max_percentage: 0,
        subjects: [],
        recent: [],
      };
      byUser.set(att.user_id, row);
    }
    const test = testsMap.get(att.test_id ?? '');
    const sc = Number(att.score || 0);
    const max = Number(att.total_marks || test?.total_marks || 0);
    row.tests_attempted++;
    row.total_score += sc;
    row.total_max += max;
    row.total_correct += Number(att.correct_count || 0);
    row.total_wrong += Number(att.wrong_count || 0);
    row.total_skipped += Number(att.skipped_count || 0);
    row.max_percentage = Math.max(row.max_percentage, Math.round((sc / Math.max(1, max)) * 100));
    const at = att.end_time || att.created_at || null;
    const time = new Date(at || 0).getTime();
    if (time > (row.latest_at ? Date.parse(row.latest_at) : 0))
      row.latest_at = new Date(time).toISOString();
    const subject =
      (test?.subject_id ? subjectsMap.get(test.subject_id) : '') ||
      (test?.exam_id ? examsMap.get(test.exam_id) : '') ||
      'Other';
    let subjectRow = row.subjects.find((s) => s.subject === subject);
    if (!subjectRow) {
      subjectRow = { subject, score: 0, marks: 0 };
      row.subjects.push(subjectRow);
    }
    subjectRow.score += sc;
    subjectRow.marks += max;
    if (row.recent.length < 3)
      row.recent.push({ title: test?.title || 'Deleted test', score: sc, max, at });
  }
  return [...byUser.values()];
}

function formatRankingTimeAgo(dateInput: string | Date | number | null | undefined): string {
  if (!dateInput) return 'Active recently';
  const now = Date.now();
  const time = new Date(dateInput).getTime();
  if (isNaN(time)) return 'Active recently';
  const diffSec = Math.max(0, Math.round((now - time) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min${diffMin > 1 ? 's' : ''} ago`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  const diffDays = Math.round(diffHour / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(time).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function rankingInitials(name: string): string {
  if (!name) return 'ST';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const RECENT_ICON_BG = [
  'bg-blue-100 text-blue-600',
  'bg-purple-100 text-purple-600',
  'bg-amber-100 text-amber-600',
];
const SUBJECT_BAR_COLORS = [
  'bg-blue-600',
  'bg-cyan-500',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-emerald-500',
];

/** Rank students (avgScore, tests, accuracy) and apply the search after ranking. */
function buildRankingStudents(rows: RankingAggregate[], search?: string): RankingStudent[] {
  const students: RankingStudent[] = rows.map((row) => {
    const rawName = (row.full_name || '').trim();
    const name = rawName || (row.email ? row.email.split('@')[0] : 'Unknown student');
    const districtName = (row.district || '').trim();
    const totalScore = Number(row.total_score || 0);
    const totalMaxMarks = Number(row.total_max || 0);
    const totalCorrect = Number(row.total_correct || 0);
    const totalWrong = Number(row.total_wrong || 0);
    const totalSkipped = Number(row.total_skipped || 0);
    const avgScore = Math.round((totalScore / Math.max(1, totalMaxMarks)) * 100);
    const accuracy =
      totalCorrect + totalWrong > 0
        ? Math.round((totalCorrect / (totalCorrect + totalWrong)) * 100)
        : avgScore;
    const maxPercentage = Math.max(0, Number(row.max_percentage || 0));
    const latestMs = row.latest_at ? Date.parse(row.latest_at) : 0;
    return {
      rank: 0,
      studentId: `PK${String(row.user_id)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 6)
        .toUpperCase()}`,
      name,
      district: districtName || 'Not specified',
      location: districtName ? `${districtName}, West Bengal` : 'Not specified',
      avatar: row.avatar_url || undefined,
      initials: rankingInitials(name),
      initialsBg: 'bg-emerald-100 text-emerald-600 border border-emerald-200',
      testsAttempted: Number(row.tests_attempted || 0),
      questionsAnswered: totalCorrect + totalWrong + totalSkipped,
      accuracy,
      avgScore,
      bestScore: maxPercentage || avgScore,
      lastActive: formatRankingTimeAgo(latestMs || row.profile_created_at),
      subjectPerformance: (row.subjects || []).map((s, i) => ({
        subject: s.subject,
        scorePercent: Math.round((Number(s.score) / Math.max(1, Number(s.marks))) * 100),
        barColor: SUBJECT_BAR_COLORS[i % SUBJECT_BAR_COLORS.length],
      })),
      recentAttempts: (row.recent || []).slice(0, 3).map((a, i) => ({
        title: a.title,
        scorePercent: Math.round((Number(a.score) / Math.max(1, Number(a.max))) * 100),
        timeAgo: formatRankingTimeAgo(a.at),
        iconBg: RECENT_ICON_BG[i],
      })),
    };
  });

  // Sort students by: avgScore DESC, then testsAttempted DESC, then accuracy DESC
  students.sort((a, b) => {
    if (b.avgScore !== a.avgScore) return b.avgScore - a.avgScore;
    if (b.testsAttempted !== a.testsAttempted) return b.testsAttempted - a.testsAttempted;
    return b.accuracy - a.accuracy;
  });
  students.forEach((s, idx) => {
    s.rank = idx + 1;
  });

  if (search && search.trim()) {
    const q = search.toLowerCase().trim();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.studentId.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q)
    );
  }
  return students;
}

export const attemptsApi = {
  async getAllAdminTestAttempts(limit?: number, offset?: number): Promise<AdminTestAttempt[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    const fetchPage = async (
      pageLimit: number,
      pageOffset: number
    ): Promise<AdminTestAttempt[]> => {
      const { data, error } = await supabase
        .from('test_attempts')
        .select(
          `
          id,
          user_id,
          test_id,
          status,
          start_time,
          end_time,
          time_spent_seconds,
          score,
          total_marks,
          correct_count,
          wrong_count,
          skipped_count,
          accuracy,
          rank,
          percentile,
          created_at,
          tests:test_id(id, title, test_type, exam_id, total_questions, duration_minutes, exams:exam_id(title))
        `
        )
        .order('created_at', { ascending: false })
        .order('id')
        .range(pageOffset, pageOffset + pageLimit - 1);

      if (error || !Array.isArray(data)) {
        throw error || new Error('Failed to fetch test attempts page');
      }

      // test_attempts.user_id references auth.users, so profiles are looked up separately.
      // Many-to-one joins (tests, exams) come back as single objects.
      const rows = data as unknown as AttemptListRow[];
      const userIds = [
        ...new Set(rows.map((d) => d.user_id).filter((id): id is string => Boolean(id))),
      ];
      const profilesById = new Map<string, AttemptProfileRow>();
      if (userIds.length) {
        const { data: profileRows, error: profileError } = await supabase
          .from('profiles')
          .select('id, full_name, email, avatar_url')
          .in('id', userIds);
        if (profileError) throw profileError;
        ((profileRows || []) as AttemptProfileRow[]).forEach((p) => profilesById.set(p.id, p));
      }

      return rows.map((d) => {
        const profile: Partial<AttemptProfileRow> =
          (d.user_id && profilesById.get(d.user_id)) || {};
        const test: Partial<NonNullable<AttemptListRow['tests']>> = d.tests || {};
        const exam = test.exams || { title: null };

        const timeSec = d.time_spent_seconds || 0;
        const timeMin = Math.round(timeSec / 60);

        const attemptedDate = new Date(d.created_at || Date.now());
        const dateStr = attemptedDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        });
        const timeStr = attemptedDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        let displayType: AdminTestAttempt['type'] = 'Full Mock';
        if (
          ['topic_test', 'topic', 'chapter_mock', 'subject_mock'].includes(test.test_type || '')
        ) {
          displayType = 'Topic Test';
        } else if (test.test_type === 'pyq' || test.test_type === 'previous_year') {
          displayType = 'Official PYQ';
        }

        return {
          id: d.id,
          studentId: d.user_id ? `PK${String(d.user_id).slice(0, 6).toUpperCase()}` : '—',
          studentName: profile.full_name || profile.email?.split('@')[0] || 'Unknown student',
          studentEmail: profile.email || '',
          studentAvatar: profile.avatar_url || undefined,
          studentInitials: profile.full_name ? profile.full_name.slice(0, 2).toUpperCase() : 'ST',
          studentAvatarColor: 'bg-blue-600',
          testName: test.title || 'Deleted test',
          exam: exam.title || '—',
          type: displayType,
          score: Number(d.score || 0),
          totalMarks: Number(d.total_marks ?? 0),
          accuracy: Number(d.accuracy || 0),
          timeTaken: timeSec ? `${Math.max(1, timeMin)} min` : '—',
          timeTakenSeconds: timeSec,
          status: d.status === 'completed' ? 'Completed' : 'Not Completed',
          createdAt: d.created_at ?? undefined,
          attemptedAtDate: dateStr,
          attemptedAtTime: timeStr,
          startedAt: d.start_time ? new Date(d.start_time).toLocaleString('en-GB') : dateStr,
          submittedAt: d.end_time ? new Date(d.end_time).toLocaleString('en-GB') : dateStr,
          totalQuestions: Number(
            test.total_questions ||
              (d.correct_count || 0) + (d.wrong_count || 0) + (d.skipped_count || 0)
          ),
          correctAnswers: Number(d.correct_count || 0),
          wrongAnswers: Number(d.wrong_count || 0),
          skippedAnswers: Number(d.skipped_count || 0),
        };
      });
    };

    try {
      if (typeof limit === 'number' && typeof offset === 'number') {
        return await fetchPage(limit, offset);
      }
      return await loadAllPages(fetchPage, 100);
    } catch (err) {
      // Surface the failure; an empty list would read as "no attempts".
      console.warn('Failed to load admin test attempts from database:', err);
      throw err instanceof Error ? err : new Error('Failed to load test attempts');
    }
  },

  async getAdminRankings(filters?: AdminRankingFilter): Promise<RankingStudent[]> {
    if (!isSupabaseConfigured) {
      return [];
    }

    try {
      const criteria = rankingCriteria(filters);
      // Totals are computed in Postgres; the browser path only runs until it is deployed.
      const aggregates =
        (await callReportingRpc<RankingAggregate[]>('admin_rankings_aggregate', {
          p_since: criteria.since ? criteria.since.toISOString() : null,
          p_test_types: criteria.testTypes,
          p_scope_types: criteria.scopeTypes,
          p_exam: criteria.exam,
          p_subject: criteria.subject,
          p_excluded_emails: ADMIN_EMAILS,
        })) ?? (await aggregateRankingsInBrowser(criteria));
      if (!Array.isArray(aggregates))
        throw new Error('The backend did not confirm a complete rankings result.');
      return buildRankingStudents(aggregates, filters?.search);
    } catch (err) {
      console.warn('Failed to calculate admin rankings:', err);
      throw err instanceof Error ? err : new Error('Failed to load rankings');
    }
  },

  async deleteAdminTestAttempt(attemptId: string): Promise<{ success: boolean; error?: string }> {
    if (isSupabaseConfigured) {
      try {
        await deleteAdminRecord('test_attempts', attemptId);
        return { success: true };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Deletion failed' };
      }
    }
    return { success: true };
  },

  async bulkDeleteAdminTestAttempts(
    attemptIds: string[]
  ): Promise<{ success: boolean; error?: string }> {
    for (const id of attemptIds) {
      const result = await attemptsApi.deleteAdminTestAttempt(id);
      if (!result.success) return result;
    }
    return { success: true };
  },
};
