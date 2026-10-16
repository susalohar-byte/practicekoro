import { supabaseRuntime as supabase } from '@/lib/supabase';
import type {
  DateRangePreset,
  PlatformAnalyticsData,
  StudentRankRow,
  QuestionInsightRow,
} from '@/types';
import {
  readCompleteQuery,
  netPaymentAmount,
  callReportingRpc,
  getEarliestReportingEvent,
} from './admin.reporting';
import {
  getDateRangeBounds,
  getKolkataDateString,
  generateChartBuckets,
  type DateRangeBounds,
} from './admin.dashboard';

export function analyticsRange(
  preset: DateRangePreset,
  start?: string,
  end?: string
): DateRangeBounds {
  const names: Partial<Record<DateRangePreset, string>> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    last_7_days: 'Last 7 Days',
    '30d': 'Last 30 Days',
    last_30_days: 'Last 30 Days',
    this_month: 'This Month',
    all_time: 'All Time',
    custom: 'Custom Range',
  };
  if (preset === 'this_year') {
    const today = getKolkataDateString(new Date());
    return getDateRangeBounds('Custom Range', `${today.slice(0, 4)}-01-01`, today);
  }
  return getDateRangeBounds(names[preset] || 'Last 30 Days', start, end);
}
const inRange = (r: any, b: DateRangeBounds) =>
  Date.parse(r.created_at) >= Date.parse(b.startIso) &&
  Date.parse(r.created_at) <= Date.parse(b.endIso);
const rate = (correct: number, total: number) =>
  total ? Math.round((correct / total) * 1000) / 10 : 0;

/** Complete authorized rows only: no secret/service key, no simulated production metrics. */
export async function getAuthoritativeAnalytics(
  preset: DateRangePreset,
  start?: string,
  end?: string
): Promise<PlatformAnalyticsData> {
  const b = analyticsRange(preset, start, end);
  const fromServer = await getAnalyticsFromServer(b);
  if (fromServer) return fromServer;
  const read = (table: string, columns: string, filter: (q: any) => any = (q) => q) =>
    readCompleteQuery(() =>
      filter(
        supabase.from(table).select(columns, { count: 'exact' }).order('id', { ascending: true })
      )
    );
  const dated = (q: any) => q.gte('created_at', b.startIso).lte('created_at', b.endIso);
  const readProfiles = async () => {
    try {
      return await read('profiles', 'id,full_name,email,role,created_at,district,gender', (q) =>
        q.eq('role', 'student')
      );
    } catch (err: any) {
      console.warn('Profiles query with gender failed, trying without gender:', err?.message);
      try {
        return await read('profiles', 'id,full_name,email,role,created_at,district', (q) =>
          q.eq('role', 'student')
        );
      } catch (err2: any) {
        console.warn('Profiles query with district failed, trying minimal:', err2?.message);
        return await read('profiles', 'id,full_name,email,role,created_at', (q) =>
          q.eq('role', 'student')
        );
      }
    }
  };
  // Current calendar month is loaded independently so it never depends on the selected range.
  const month = getDateRangeBounds('This Month');
  const [profiles, attempts, answers, payments, subscriptions, monthPayments] = await Promise.all([
    readProfiles(),
    read('test_attempts', 'id,user_id,status,score,created_at', dated),
    read(
      'attempt_answers',
      'id,attempt_id,question_id,selected_option,is_correct,created_at,test_attempts!inner(user_id),questions(id,question_text,question_bengali_text,difficulty,subject_id,chapter_id,subjects:subjects!questions_subject_id_fkey(id,name),chapters:chapters!questions_chapter_id_fkey(id,name))',
      (q) => dated(q).not('selected_option', 'is', null)
    ),
    read('payments', 'id,user_id,amount,refund_amount,status,created_at', dated),
    read('subscriptions', 'id,user_id,status,expires_at', (q) =>
      q.eq('status', 'active').gt('expires_at', new Date().toISOString())
    ),
    read('payments', 'id,user_id,amount,refund_amount,status,created_at', (q) =>
      q.gte('created_at', month.startIso).lte('created_at', month.endIso)
    ),
  ]);
  return aggregateAnalytics(b, profiles, attempts, answers, payments, subscriptions, monthPayments);
}

/** Aggregates returned by admin_analytics_overview (see migration 20261016150000). */
export interface ServerAnalyticsAggregates {
  total_students: number;
  new_students: number;
  tests_attempted: number;
  questions_answered: number;
  correct_answers: number;
  active_students: number;
  districts: { district: string; count: number }[];
  genders: { gender: string; count: number }[];
  students: {
    user_id: string;
    full_name: string | null;
    email: string | null;
    total_tests: number;
    total_score: number;
    questions_attempted: number;
    correct_count: number;
    last_active: string | null;
    is_pro: boolean;
  }[];
  questions: {
    question_id: string;
    question_text: string | null;
    question_bengali_text: string | null;
    difficulty: string | null;
    subject_name: string | null;
    chapter_name: string | null;
    total: number;
    wrong: number;
    correct: number;
  }[];
  subjects: { subject_id: string; subject_name: string | null; total: number; correct: number }[];
  chapters: {
    chapter_id: string;
    chapter_name: string | null;
    subject_name: string | null;
    total: number;
    correct: number;
  }[];
  buckets: {
    attempts: number;
    completed: number;
    score_sum: number;
    answers: number;
    correct: number;
    net_paise: number;
    transactions: number;
    signups: number;
    subjects: {
      subject_id: string;
      subject_name: string | null;
      attempts: number;
      correct: number;
    }[];
  }[];
  total_net_paise: number;
  month_net_paise: number;
  paid_students: number;
  active_subscriptions: number;
}

async function getAnalyticsFromServer(b: DateRangeBounds): Promise<PlatformAnalyticsData | null> {
  let chartStart: number | null = Date.parse(b.startIso);
  if (b.isAllTime) {
    const first = await getEarliestReportingEvent(b, true);
    if (first === null) return null;
    chartStart = first.earliest ? Date.parse(first.earliest) : null;
  }
  const buckets =
    chartStart === null
      ? []
      : generateChartBuckets(new Date(chartStart).toISOString(), b.endIso, 8);
  // Current calendar month is independent of the selected range.
  const month = getDateRangeBounds('This Month');
  const agg = await callReportingRpc<ServerAnalyticsAggregates>('admin_analytics_overview', {
    p_start: b.startIso,
    p_end: b.endIso,
    p_month_start: month.startIso,
    p_month_end: month.endIso,
    p_buckets: buckets.map((k) => ({
      start: new Date(k.startMs).toISOString(),
      end: new Date(k.endMs).toISOString(),
    })),
  });
  if (agg === null) return null;
  if (!Array.isArray(agg?.buckets) || agg.buckets.length !== buckets.length)
    throw new Error('The backend did not confirm a complete reporting result.');
  return assembleServerAnalytics(buckets, agg);
}

/** Build the same PlatformAnalyticsData as aggregateAnalytics from server totals. */
export function assembleServerAnalytics(
  buckets: ReturnType<typeof generateChartBuckets>,
  agg: ServerAnalyticsAggregates
): PlatformAnalyticsData {
  const num = (v: unknown) => Number(v ?? 0);
  const studentRankings: StudentRankRow[] = agg.students
    .map((s) => {
      const row: StudentRankRow = {
        rank: 0,
        userId: s.user_id,
        name: s.full_name || 'Unnamed student',
        email: s.email || '',
        totalTests: num(s.total_tests),
        questionsAttempted: num(s.questions_attempted),
        correctCount: num(s.correct_count),
        accuracy: rate(num(s.correct_count), num(s.questions_attempted)),
        totalScore: num(s.total_score),
        isPro: Boolean(s.is_pro),
      };
      if (s.last_active) row.lastActive = s.last_active;
      return row;
    })
    .sort(
      (a, c) =>
        c.totalScore - a.totalScore || c.accuracy - a.accuracy || a.userId.localeCompare(c.userId)
    )
    .map((s, i) => ({ ...s, rank: i + 1 }));
  return {
    demographics: {
      districts: agg.districts
        .map((d) => ({ district: d.district, studentCount: num(d.count) }))
        .sort((a, b) => b.studentCount - a.studentCount || a.district.localeCompare(b.district)),
      genders: agg.genders
        .map((g) => ({ gender: g.gender, studentCount: num(g.count) }))
        .sort((a, b) => b.studentCount - a.studentCount || a.gender.localeCompare(b.gender)),
    },
    historicalSubjectTrends: buckets.map((k, i) => ({
      date: k.dateStr,
      label: k.label,
      subjects: agg.buckets[i].subjects.map((s) => ({
        subjectId: s.subject_id,
        subjectName: s.subject_name || 'Subject unavailable',
        attempts: num(s.attempts),
        accuracy: rate(num(s.correct), num(s.attempts)),
      })),
    })),
    studentPerformance: {
      totalStudents: num(agg.total_students),
      newStudents: num(agg.new_students),
      activeStudents: num(agg.active_students),
      testsAttempted: num(agg.tests_attempted),
      questionsAnswered: num(agg.questions_answered),
      overallAccuracy: rate(num(agg.correct_answers), num(agg.questions_answered)),
      topStudent: studentRankings[0],
      performanceTrend: buckets.map((k, i) => {
        const t = agg.buckets[i];
        return {
          date: k.dateStr,
          label: k.label,
          attemptsCount: num(t.attempts),
          averageAccuracy: rate(num(t.correct), num(t.answers)),
          averageScore: num(t.completed) ? num(t.score_sum) / num(t.completed) : 0,
        };
      }),
    },
    studentRankings,
    questionInsights: {
      mostWrongQuestions: agg.questions
        .map((q) => ({
          questionId: q.question_id,
          questionText: q.question_text || 'Question text unavailable',
          questionBengaliText: q.question_bengali_text ?? undefined,
          subjectName: q.subject_name || 'Subject unavailable',
          chapterName: q.chapter_name || 'Topic unavailable',
          difficulty: (q.difficulty ?? undefined) as QuestionInsightRow['difficulty'],
          totalAttempts: num(q.total),
          wrongCount: num(q.wrong),
          failureRate: rate(num(q.wrong), num(q.total)),
          accuracyRate: rate(num(q.correct), num(q.total)),
        }))
        .sort((a, c) => c.failureRate - a.failureRate || c.totalAttempts - a.totalAttempts),
      weakestTopics: agg.chapters
        .map((t) => ({
          chapterId: t.chapter_id,
          chapterName: t.chapter_name || 'Topic unavailable',
          subjectName: t.subject_name || 'Subject unavailable',
          totalQuestionsAttempted: num(t.total),
          accuracyRate: rate(num(t.correct), num(t.total)),
        }))
        .sort((a, c) => a.accuracyRate - c.accuracyRate),
      weakestSubjects: agg.subjects
        .map((s) => ({
          subjectId: s.subject_id,
          subjectName: s.subject_name || 'Subject unavailable',
          totalQuestionsAttempted: num(s.total),
          accuracyRate: rate(num(s.correct), num(s.total)),
        }))
        .sort((a, c) => a.accuracyRate - c.accuracyRate),
    },
    revenue: {
      totalRevenue: Math.round(num(agg.total_net_paise)) / 100,
      monthlyRevenue: Math.round(num(agg.month_net_paise)) / 100,
      paidStudents: num(agg.paid_students),
      activeSubscriptions: num(agg.active_subscriptions),
      revenueTrend: buckets.map((k, i) => {
        const t = agg.buckets[i];
        return {
          date: k.dateStr,
          label: k.label,
          amount: Math.round(num(t.net_paise)) / 100,
          transactions: num(t.transactions),
          signups: num(t.signups),
        };
      }),
    },
  };
}

export function aggregateAnalytics(
  b: DateRangeBounds,
  profiles: any[],
  attempts: any[],
  answers: any[],
  payments: any[],
  subscriptions: any[],
  /** Payments of the current Kolkata calendar month, independent of the selected range. */
  monthPayments: any[] = []
): PlatformAnalyticsData {
  profiles = profiles.filter((p) => p.role === 'student');
  const students = new Map(profiles.map((p) => [p.id, p]));
  attempts = attempts.filter((a) => students.has(a.user_id) && inRange(a, b));
  const owner = (a: any) =>
    (Array.isArray(a.test_attempts) ? a.test_attempts[0] : a.test_attempts)?.user_id;
  answers = answers.filter(
    (a) => a.selected_option != null && students.has(owner(a)) && inRange(a, b)
  );
  payments = payments.filter((p) => inRange(p, b));
  const pro = new Set(
    subscriptions
      .filter(
        (s) =>
          s.status === 'active' && Date.parse(s.expires_at) > Date.now() && students.has(s.user_id)
      )
      .map((s) => s.user_id)
  );
  const perStudent = new Map<string, StudentRankRow>();
  const entry = (id: string) => {
    if (!perStudent.has(id)) {
      const p = students.get(id)!;
      perStudent.set(id, {
        rank: 0,
        userId: id,
        name: p.full_name || 'Unnamed student',
        email: p.email || '',
        totalTests: 0,
        questionsAttempted: 0,
        correctCount: 0,
        accuracy: 0,
        totalScore: 0,
        isPro: pro.has(id),
      });
    }
    return perStudent.get(id)!;
  };
  for (const a of attempts) {
    const e = entry(a.user_id);
    // In-progress and abandoned attempts are not finished tests and carry no final score.
    if (a.status === 'completed') {
      e.totalTests++;
      e.totalScore += Number(a.score || 0);
    }
    if (!e.lastActive || Date.parse(a.created_at) > Date.parse(e.lastActive))
      e.lastActive = a.created_at;
  }
  const questionMap = new Map<string, QuestionInsightRow>();
  const topics = new Map<
    string,
    {
      chapterId: string;
      chapterName: string;
      subjectName: string;
      totalQuestionsAttempted: number;
      correct: number;
    }
  >();
  const subjects = new Map<
    string,
    { subjectId: string; subjectName: string; totalQuestionsAttempted: number; correct: number }
  >();
  for (const a of answers) {
    const e = entry(owner(a));
    e.questionsAttempted++;
    if (a.is_correct === true) e.correctCount++;
    const q = Array.isArray(a.questions) ? a.questions[0] : a.questions;
    // Deleted/unavailable question metadata does not fabricate a question or topic name.
    if (!q) continue;
    const subject = Array.isArray(q.subjects) ? q.subjects[0] : q.subjects;
    const chapter = Array.isArray(q.chapters) ? q.chapters[0] : q.chapters;
    if (!questionMap.has(a.question_id))
      questionMap.set(a.question_id, {
        questionId: a.question_id,
        questionText: q.question_text || 'Question text unavailable',
        questionBengaliText: q.question_bengali_text,
        subjectName: subject?.name || 'Subject unavailable',
        chapterName: chapter?.name || 'Topic unavailable',
        difficulty: q.difficulty,
        totalAttempts: 0,
        wrongCount: 0,
        failureRate: 0,
        accuracyRate: 0,
      });
    const item = questionMap.get(a.question_id)!;
    item.totalAttempts++;
    if (a.is_correct === false) item.wrongCount++;
    if (a.is_correct === true) item.accuracyRate++;
    if (q.subject_id) {
      if (!subjects.has(q.subject_id))
        subjects.set(q.subject_id, {
          subjectId: q.subject_id,
          subjectName: subject?.name || 'Subject unavailable',
          totalQuestionsAttempted: 0,
          correct: 0,
        });
      const s = subjects.get(q.subject_id)!;
      s.totalQuestionsAttempted++;
      if (a.is_correct === true) s.correct++;
    }
    if (q.chapter_id) {
      if (!topics.has(q.chapter_id))
        topics.set(q.chapter_id, {
          chapterId: q.chapter_id,
          chapterName: chapter?.name || 'Topic unavailable',
          subjectName: subject?.name || 'Subject unavailable',
          totalQuestionsAttempted: 0,
          correct: 0,
        });
      const t = topics.get(q.chapter_id)!;
      t.totalQuestionsAttempted++;
      if (a.is_correct === true) t.correct++;
    }
  }
  const studentRankings = [...perStudent.values()]
    .map((s) => ({ ...s, accuracy: rate(s.correctCount, s.questionsAttempted) }))
    .sort(
      (a, c) =>
        c.totalScore - a.totalScore || c.accuracy - a.accuracy || a.userId.localeCompare(c.userId)
    )
    .map((s, i) => ({ ...s, rank: i + 1 }));
  const dated = [...profiles.filter((p) => inRange(p, b)), ...attempts, ...answers, ...payments];
  const chartStart =
    b.isAllTime && dated.length
      ? Math.min(...dated.map((r) => Date.parse(r.created_at)))
      : Date.parse(b.startIso);
  const buckets =
    b.isAllTime && !dated.length
      ? []
      : generateChartBuckets(new Date(chartStart).toISOString(), b.endIso, 8);
  const bucketRows = (rows: any[], k: (typeof buckets)[number]) =>
    rows.filter(
      (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
    );
  const correct = answers.filter((a) => a.is_correct === true).length;
  const districts = new Map<string, number>();
  const genders = new Map<string, number>();
  for (const p of profiles) {
    const district =
      typeof p.district === 'string' && p.district.trim() ? p.district.trim() : 'Not specified';
    districts.set(district, (districts.get(district) || 0) + 1);

    const rawGender = typeof p.gender === 'string' ? p.gender.trim().toLowerCase() : '';
    const normGender =
      rawGender === 'male' || rawGender === 'm'
        ? 'Male'
        : rawGender === 'female' || rawGender === 'f'
          ? 'Female'
          : rawGender === 'transgender' || rawGender === 'other'
            ? 'Other'
            : 'Not specified';
    genders.set(normGender, (genders.get(normGender) || 0) + 1);
  }

  const historicalSubjectTrends = buckets.map((k) => {
    const r = bucketRows(answers, k);
    const subMap = new Map<string, { id: string; name: string; correct: number; total: number }>();
    for (const ans of r) {
      const q = Array.isArray(ans.questions) ? ans.questions[0] : ans.questions;
      if (!q || !q.subject_id) continue;
      const sub = Array.isArray(q.subjects) ? q.subjects[0] : q.subjects;
      const sName = sub?.name || 'Subject unavailable';
      if (!subMap.has(q.subject_id)) {
        subMap.set(q.subject_id, { id: q.subject_id, name: sName, correct: 0, total: 0 });
      }
      const item = subMap.get(q.subject_id)!;
      item.total++;
      if (ans.is_correct === true) item.correct++;
    }
    return {
      date: k.dateStr,
      label: k.label,
      subjects: [...subMap.values()].map((s) => ({
        subjectId: s.id,
        subjectName: s.name,
        attempts: s.total,
        accuracy: rate(s.correct, s.total),
      })),
    };
  });

  return {
    demographics: {
      districts: [...districts]
        .map(([district, studentCount]) => ({ district, studentCount }))
        .sort((a, b) => b.studentCount - a.studentCount || a.district.localeCompare(b.district)),
      genders: [...genders]
        .map(([gender, studentCount]) => ({ gender, studentCount }))
        .sort((a, b) => b.studentCount - a.studentCount || a.gender.localeCompare(b.gender)),
    },
    historicalSubjectTrends,
    studentPerformance: {
      totalStudents: profiles.length,
      newStudents: profiles.filter((p) => inRange(p, b)).length,
      activeStudents: new Set([...attempts.map((a) => a.user_id), ...answers.map(owner)]).size,
      testsAttempted: attempts.length,
      questionsAnswered: answers.length,
      overallAccuracy: rate(correct, answers.length),
      topStudent: studentRankings[0],
      performanceTrend: buckets.map((k) => {
        const a = bucketRows(attempts, k),
          r = bucketRows(answers, k),
          done = a.filter((x) => x.status === 'completed');
        return {
          date: k.dateStr,
          label: k.label,
          attemptsCount: a.length,
          averageAccuracy: rate(r.filter((x) => x.is_correct === true).length, r.length),
          averageScore: done.length
            ? done.reduce((sum, x) => sum + Number(x.score || 0), 0) / done.length
            : 0,
        };
      }),
    },
    studentRankings,
    questionInsights: {
      mostWrongQuestions: [...questionMap.values()]
        .map((q) => ({
          ...q,
          failureRate: rate(q.wrongCount, q.totalAttempts),
          accuracyRate: rate(q.accuracyRate, q.totalAttempts),
        }))
        .sort((a, c) => c.failureRate - a.failureRate || c.totalAttempts - a.totalAttempts),
      weakestTopics: [...topics.values()]
        .map(({ correct, ...t }) => ({
          ...t,
          accuracyRate: rate(correct, t.totalQuestionsAttempted),
        }))
        .sort((a, c) => a.accuracyRate - c.accuracyRate),
      weakestSubjects: [...subjects.values()]
        .map(({ correct, ...s }) => ({
          ...s,
          accuracyRate: rate(correct, s.totalQuestionsAttempted),
        }))
        .sort((a, c) => a.accuracyRate - c.accuracyRate),
    },
    revenue: {
      totalRevenue:
        payments.reduce((sum, p) => sum + Math.round(netPaymentAmount(p) * 100), 0) / 100,
      monthlyRevenue:
        monthPayments
          .filter(
            (p) =>
              getKolkataDateString(new Date(p.created_at)).slice(0, 7) ===
              getKolkataDateString(new Date()).slice(0, 7)
          )
          .reduce((sum, p) => sum + Math.round(netPaymentAmount(p) * 100), 0) / 100,
      paidStudents: new Set(
        payments
          .filter((p) => netPaymentAmount(p) > 0 && students.has(p.user_id))
          .map((p) => p.user_id)
      ).size,
      activeSubscriptions: pro.size,
      revenueTrend: buckets.map((k) => {
        const p = bucketRows(payments, k);
        return {
          date: k.dateStr,
          label: k.label,
          amount: p.reduce((sum, x) => sum + Math.round(netPaymentAmount(x) * 100), 0) / 100,
          transactions: p.filter((x) => x.status === 'completed').length,
          signups: bucketRows(profiles, k).length,
        };
      }),
    },
  };
}

export interface AdminDistrictRankingRow {
  district: string;
  studentCount: number;
  attemptsCount: number;
  /** Mean of score/total_marks over completed attempts; null when no attempt has marks. */
  avgPercentage: number | null;
  topStudentName: string | null;
  topStudentScore: number | null;
}

/** Look up rows by id in fixed-size batches so `.in()` never builds an oversized URL. */
async function selectInChunks(table: string, columns: string, ids: string[]): Promise<any[]> {
  const CHUNK = 200;
  const out: any[] = [];
  for (let i = 0; i < ids.length; i += CHUNK) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .in('id', ids.slice(i, i + CHUNK));
    if (error) throw new Error(error.message);
    out.push(...(data || []));
  }
  return out;
}

/** Direct table query fallback for district aggregates when RPC get_admin_district_rankings is not yet migrated */
async function getAdminDistrictRankingsDirectFallback(
  params: { examId?: string | null; fromIso?: string | null; toIso?: string | null } = {}
): Promise<AdminDistrictRankingRow[]> {
  // 1. Fetch every completed attempt in range. Page through all rows: a single .limit() is
  // silently capped by the server's max_rows and would undercount districts.
  const attempts = await readCompleteQuery(() => {
    let attemptsQuery = supabase
      .from('test_attempts')
      .select('id, user_id, test_id, score, total_marks, created_at', { count: 'exact' })
      .eq('status', 'completed')
      .order('id', { ascending: true });
    if (params.fromIso) attemptsQuery = attemptsQuery.gte('created_at', params.fromIso);
    if (params.toIso) attemptsQuery = attemptsQuery.lte('created_at', params.toIso);
    return attemptsQuery;
  });
  if (attempts.length === 0) return [];

  // 2. Filter by exam if examId provided
  let filteredAttempts = attempts;
  if (params.examId) {
    const [testsDirect, testsAssoc] = await Promise.all([
      readCompleteQuery(() =>
        supabase
          .from('tests')
          .select('id', { count: 'exact' })
          .eq('exam_id', params.examId)
          .order('id', { ascending: true })
      ),
      readCompleteQuery(() =>
        supabase
          .from('test_exams')
          .select('test_id', { count: 'exact' })
          .eq('exam_id', params.examId)
          .order('test_id', { ascending: true })
      ),
    ]);
    const validTestIds = new Set<string>();
    testsDirect.forEach((t: any) => validTestIds.add(t.id));
    testsAssoc.forEach((t: any) => validTestIds.add(t.test_id));
    filteredAttempts = attempts.filter((a) => validTestIds.has(a.test_id));
  }

  if (filteredAttempts.length === 0) return [];

  // 3. User IDs and Profile lookup (chunked so the request URL stays within limits)
  const userIds = Array.from(new Set(filteredAttempts.map((a) => a.user_id))).filter(Boolean);
  const profiles = await selectInChunks('profiles', 'id, full_name, district, role', userIds);

  const profileMap = new Map<string, { fullName: string; district: string }>();
  profiles.forEach((p: any) => {
    if (p.role === 'student' || !p.role) {
      profileMap.set(p.id, {
        fullName: p.full_name || 'Aspirant',
        district: (p.district || '').trim(),
      });
    }
  });

  // Missing total marks map
  const testsNeedingMarks = Array.from(
    new Set(
      filteredAttempts
        .filter((a) => !a.total_marks || Number(a.total_marks) === 0)
        .map((a) => a.test_id)
    )
  );
  const testMarksMap = new Map<string, number>();
  if (testsNeedingMarks.length > 0) {
    const testRows = await selectInChunks('tests', 'id, total_marks', testsNeedingMarks);
    testRows.forEach((t: any) => {
      if (t.total_marks) testMarksMap.set(t.id, Number(t.total_marks));
    });
  }

  // 4. Aggregations per district
  interface DistrictBucket {
    originalSpellings: Map<string, number>;
    userScores: Map<string, { fullName: string; pcts: number[] }>;
    allPcts: number[];
    attemptsCount: number;
    studentIds: Set<string>;
  }

  const buckets = new Map<string, DistrictBucket>();

  for (const att of filteredAttempts) {
    const prof = profileMap.get(att.user_id);
    if (!prof) continue; // Filter out non-students

    const rawDistrict = prof.district;
    const districtKey = rawDistrict.toLowerCase().trim();

    let bucket = buckets.get(districtKey);
    if (!bucket) {
      bucket = {
        originalSpellings: new Map(),
        userScores: new Map(),
        allPcts: [],
        attemptsCount: 0,
        studentIds: new Set(),
      };
      buckets.set(districtKey, bucket);
    }

    if (rawDistrict) {
      bucket.originalSpellings.set(
        rawDistrict,
        (bucket.originalSpellings.get(rawDistrict) || 0) + 1
      );
    }
    bucket.studentIds.add(att.user_id);
    bucket.attemptsCount += 1;

    const totalMarks = Number(att.total_marks) || testMarksMap.get(att.test_id) || 0;
    const score = Number(att.score) || 0;
    if (totalMarks > 0) {
      const pct = (score * 100) / totalMarks;
      bucket.allPcts.push(pct);

      let user = bucket.userScores.get(att.user_id);
      if (!user) {
        user = { fullName: prof.fullName, pcts: [] };
        bucket.userScores.set(att.user_id, user);
      }
      user.pcts.push(pct);
    }
  }

  // 5. Build rows
  const rows: AdminDistrictRankingRow[] = [];
  for (const [key, bucket] of buckets.entries()) {
    let displayDistrict = 'Not specified';
    if (key !== '') {
      let maxCount = -1;
      for (const [spelling, cnt] of bucket.originalSpellings.entries()) {
        if (cnt > maxCount) {
          maxCount = cnt;
          displayDistrict = spelling;
        }
      }
    }

    const studentCount = bucket.studentIds.size;
    const avgPercentage =
      bucket.allPcts.length > 0
        ? Number((bucket.allPcts.reduce((a, b) => a + b, 0) / bucket.allPcts.length).toFixed(2))
        : null;

    let topStudentName: string | null = null;
    let topStudentScore: number | null = null;
    for (const user of bucket.userScores.values()) {
      if (user.pcts.length > 0) {
        const userAvg = Number(
          (user.pcts.reduce((a, b) => a + b, 0) / user.pcts.length).toFixed(2)
        );
        if (topStudentScore === null || userAvg > topStudentScore) {
          topStudentScore = userAvg;
          topStudentName = user.fullName;
        }
      }
    }

    rows.push({
      district: displayDistrict,
      studentCount,
      attemptsCount: bucket.attemptsCount,
      avgPercentage,
      topStudentName,
      topStudentScore,
    });
  }

  // Sort rows: avgPercentage DESC NULLS LAST, attemptsCount DESC, district ASC
  rows.sort((a, b) => {
    if (a.avgPercentage === null && b.avgPercentage !== null) return 1;
    if (a.avgPercentage !== null && b.avgPercentage === null) return -1;
    if (a.avgPercentage !== null && b.avgPercentage !== null) {
      const diff = b.avgPercentage - a.avgPercentage;
      if (Math.abs(diff) > 0.001) return diff;
    }
    if (b.attemptsCount !== a.attemptsCount) {
      return b.attemptsCount - a.attemptsCount;
    }
    return a.district.localeCompare(b.district);
  });

  return rows;
}

/** Real district aggregates from completed student attempts (admin-only RPC with fallback). */
export async function getAdminDistrictRankings(
  params: { examId?: string | null; fromIso?: string | null; toIso?: string | null } = {}
): Promise<AdminDistrictRankingRow[]> {
  const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

  // Attempt 1: Fast RPC function. Only a genuinely missing function falls back to the
  // direct table read; any other RPC error (permissions, bad input, timeout) is surfaced.
  const { data, error } = await supabase.rpc('get_admin_district_rankings', {
    p_exam_id: params.examId || null,
    p_from: params.fromIso || null,
    p_to: params.toIso || null,
  });

  if (!error) {
    if (!Array.isArray(data)) throw new Error('District rankings returned an invalid response.');
    return data.map((r: any) => ({
      district: String(r.district || 'Not specified'),
      studentCount: Number(r.student_count || 0),
      attemptsCount: Number(r.attempts_count || 0),
      avgPercentage: num(r.avg_percentage),
      topStudentName: r.top_student_name || null,
      topStudentScore: num(r.top_student_score),
    }));
  }

  const isMissingFunction = error.code === 'PGRST202' || error.code === '42883';
  if (!isMissingFunction) throw new Error(error.message);
  console.warn('RPC get_admin_district_rankings is not installed, using direct fallback...');

  // Attempt 2: Fallback query directly on tables. Report its real failure rather than a
  // generic "not installed" message that hides permission or network errors.
  try {
    return await getAdminDistrictRankingsDirectFallback(params);
  } catch (fallbackErr: unknown) {
    console.error('Direct fallback query for district rankings failed:', fallbackErr);
    throw fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr));
  }
}
