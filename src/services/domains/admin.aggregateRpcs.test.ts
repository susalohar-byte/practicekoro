import { beforeEach, describe, expect, it, vi } from 'vitest';

const m = vi.hoisted(() => ({
  rpc: vi.fn(),
  tables: [] as string[],
}));
vi.mock('@/lib/supabase', () => {
  // Browser fallback reads: every table is empty, with a confirmed count.
  const from = (table: string) => {
    m.tables.push(table);
    const q: any = new Proxy(
      {},
      {
        get: (_t, key) =>
          key === 'then'
            ? (yes: any, no: any) =>
                Promise.resolve({ data: [], count: 0, error: null }).then(yes, no)
            : () => q,
      }
    );
    return q;
  };
  return {
    isSupabaseConfigured: true,
    supabaseRuntime: { rpc: m.rpc, from },
    supabase: { rpc: m.rpc, from },
  };
});

import {
  getDashboardPeriodData,
  getDashboardOverview,
  getAuthoritativeRevenueRange,
} from './admin.reporting';
import { assembleServerAnalytics, getAuthoritativeAnalytics } from './admin.analytics';
import { adminCommerceApi } from './adminCommerce';
import { getDateRangeBounds, generateChartBuckets } from './admin.dashboard';
import { invalidateApiCache } from '@/services/apiCache';

const missing = { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } };
const totals = (n: number) => ({
  new_students: n,
  active_students: n + 1,
  tests_attempted: n + 2,
  completed_tests: n + 3,
  questions_answered: n + 4,
  net_revenue_paise: n * 100 + 50,
});

beforeEach(() => {
  m.rpc.mockReset();
  m.tables = [];
  invalidateApiCache();
});

describe('dashboard period aggregates', () => {
  it('maps server range totals without reading tables', async () => {
    const b = getDateRangeBounds('Last 7 Days');
    m.rpc.mockImplementation(async (_name: string, args: any) => ({
      data: {
        ranges: args.p_ranges.map((_r: unknown, i: number) => totals(i)),
        attempt_counts: { t1: 4 },
      },
      error: null,
    }));
    const period = await getDashboardPeriodData(b);
    const [name, args] = m.rpc.mock.calls[0];
    expect(name).toBe('admin_dashboard_range_stats');
    // Current range, previous range, then one entry per chart bucket.
    expect(args.p_ranges[0]).toEqual({ start: b.startIso, end: b.endIso });
    expect(args.p_ranges[1]).toEqual({ start: b.prevStartIso, end: b.prevEndIso });
    expect(args.p_ranges).toHaveLength(2 + period.growthSeries.length);
    expect(period).toMatchObject({
      newStudents: 0,
      activeStudents: 1,
      testsAttempted: 2,
      completedTests: 3,
      questionsAnswered: 4,
      netRevenue: 0.5,
      previous: { newStudents: 1, netRevenue: 1.5 },
      attemptCounts: { t1: 4 },
    });
    expect(period.revenueSeries[0]).toEqual({
      label: period.growthSeries[0].label,
      amount: 2.5,
      highlighted: false,
    });
    expect(m.tables).toEqual([]);
  });

  it('starts all-time charts at the earliest event and has no buckets without activity', async () => {
    m.rpc.mockImplementation(async (name: string, args: any) =>
      name === 'admin_reporting_earliest'
        ? { data: { earliest: null }, error: null }
        : { data: { ranges: args.p_ranges.map(() => totals(0)), attempt_counts: {} }, error: null }
    );
    const period = await getDashboardPeriodData(getDateRangeBounds('All Time'));
    expect(m.rpc.mock.calls[0][1]).toMatchObject({ p_all_payment_statuses: false });
    expect(period.growthSeries).toEqual([]);
    expect(m.rpc.mock.calls[1][1].p_ranges).toHaveLength(1);
  });

  it('falls back to browser aggregation only when the function is not deployed', async () => {
    m.rpc.mockResolvedValue(missing);
    const period = await getDashboardPeriodData(getDateRangeBounds('Today'));
    expect(period.testsAttempted).toBe(0);
    expect(m.tables).toContain('test_attempts');
  });

  it('surfaces other server errors instead of falling back', async () => {
    m.rpc.mockResolvedValue({ data: null, error: { code: '42501', message: 'Insufficient' } });
    await expect(getDashboardPeriodData(getDateRangeBounds('Today'))).rejects.toThrow(
      'Insufficient'
    );
    expect(m.tables).toEqual([]);
  });
});

describe('dashboard overview aggregates', () => {
  it('maps counters and paise revenue', async () => {
    m.rpc.mockImplementation(async (name: string, args: any) =>
      name === 'admin_dashboard_overview_stats'
        ? {
            data: {
              total_students: 10,
              pro_students: 3,
              active_subscriptions: 4,
              revenue_total_paise: 123456,
              revenue_today_paise: 9999,
              revenue_month_paise: 50000,
              revenue_year_paise: 100000,
              tests_attempted: 7,
              completed_tests: 5,
              questions_answered: 40,
              total_exams: 2,
              total_tests: 6,
              topic_tests: 3,
              full_mock_tests: 2,
              pyq_tests: 1,
              total_questions: 90,
              topic_questions: 50,
              full_mock_questions: 30,
              pyq_questions: 10,
            },
            error: null,
          }
        : { data: { ranges: args.p_ranges.map(() => totals(2)), attempt_counts: {} }, error: null }
    );
    const overview = await getDashboardOverview();
    expect(overview).toMatchObject({
      totalStudents: 10,
      proStudents: 3,
      freeStudents: 7,
      activeSubscriptions: 4,
      totalRevenue: 1234.56,
      todayRevenue: 99.99,
      newStudents: 2,
      activeStudents: 3,
      totalQuestions: 90,
      pyqTests: 1,
    });
    expect(m.tables).toEqual([]);
  });
});

describe('revenue range aggregates', () => {
  it('builds the daily Kolkata trend from server day totals', async () => {
    m.rpc.mockResolvedValue({
      data: {
        earliest: null,
        total_net_paise: 24950,
        transactions: 2,
        signups: 1,
        payment_days: [{ date: '2026-03-02', net_paise: 24950, transactions: 2 }],
        signup_days: [{ date: '2026-03-03', count: 1 }],
      },
      error: null,
    });
    const r = await getAuthoritativeRevenueRange('2026-03-01', '2026-03-03', 'custom');
    expect(m.rpc).toHaveBeenCalledWith('admin_revenue_range_stats', {
      p_start: '2026-02-28T18:30:00.000Z',
      p_end: '2026-03-03T18:29:59.999Z',
    });
    expect(r.totalRevenue).toBe(249.5);
    expect(r.averageOrderValue).toBe(124.75);
    expect(r.dailyTrend.map((d) => [d.date, d.amount, d.transactions, d.signups])).toEqual([
      ['2026-03-01', 0, 0, 0],
      ['2026-03-02', 249.5, 2, 0],
      ['2026-03-03', 0, 0, 1],
    ]);
  });
});

describe('analytics aggregates', () => {
  const agg = {
    total_students: 3,
    new_students: 1,
    tests_attempted: 4,
    questions_answered: 10,
    correct_answers: 7,
    active_students: 2,
    districts: [
      { district: 'Not specified', count: 1 },
      { district: 'Kolkata', count: 2 },
    ],
    genders: [{ gender: 'Male', count: 3 }],
    students: [
      {
        user_id: 'b',
        full_name: null,
        email: null,
        total_tests: 1,
        total_score: 10,
        questions_attempted: 4,
        correct_count: 1,
        last_active: null,
        is_pro: false,
      },
      {
        user_id: 'a',
        full_name: 'Asha',
        email: 'a@x.com',
        total_tests: 2,
        total_score: 10,
        questions_attempted: 6,
        correct_count: 6,
        last_active: '2026-03-02T10:00:00+00:00',
        is_pro: true,
      },
    ],
    questions: [
      {
        question_id: 'q1',
        question_text: null,
        question_bengali_text: null,
        difficulty: 'hard',
        subject_name: null,
        chapter_name: 'Algebra',
        total: 4,
        wrong: 3,
        correct: 1,
      },
    ],
    subjects: [{ subject_id: 's1', subject_name: 'Maths', total: 4, correct: 1 }],
    chapters: [
      { chapter_id: 'c1', chapter_name: null, subject_name: 'Maths', total: 4, correct: 1 },
    ],
    buckets: [
      {
        attempts: 3,
        completed: 2,
        score_sum: 15,
        answers: 10,
        correct: 7,
        net_paise: 9999,
        transactions: 1,
        signups: 1,
        subjects: [{ subject_id: 's1', subject_name: null, attempts: 4, correct: 1 }],
      },
    ],
    total_net_paise: 9999,
    month_net_paise: 4950,
    paid_students: 1,
    active_subscriptions: 1,
  };

  it('assembles the same report shape as the browser aggregation', () => {
    const buckets = generateChartBuckets('2026-03-01T00:00:00.000Z', '2026-03-01T23:59:59.999Z', 8);
    const data = assembleServerAnalytics(buckets, agg);
    expect(data.studentRankings.map((s) => [s.rank, s.userId, s.name, s.accuracy])).toEqual([
      [1, 'a', 'Asha', 100],
      [2, 'b', 'Unnamed student', 25],
    ]);
    expect(data.studentRankings[0].lastActive).toBe('2026-03-02T10:00:00+00:00');
    expect('lastActive' in data.studentRankings[1]).toBe(false);
    expect(data.demographics?.districts[0]).toEqual({ district: 'Kolkata', studentCount: 2 });
    expect(data.studentPerformance).toMatchObject({
      totalStudents: 3,
      overallAccuracy: 70,
      topStudent: { userId: 'a' },
    });
    expect(data.studentPerformance.performanceTrend[0]).toMatchObject({
      attemptsCount: 3,
      averageAccuracy: 70,
      averageScore: 7.5,
    });
    expect(data.questionInsights.mostWrongQuestions[0]).toMatchObject({
      questionText: 'Question text unavailable',
      subjectName: 'Subject unavailable',
      failureRate: 75,
      accuracyRate: 25,
    });
    expect(data.questionInsights.weakestTopics[0].chapterName).toBe('Topic unavailable');
    expect(data.historicalSubjectTrends?.[0].subjects[0]).toEqual({
      subjectId: 's1',
      subjectName: 'Subject unavailable',
      attempts: 4,
      accuracy: 25,
    });
    expect(data.revenue).toMatchObject({
      totalRevenue: 99.99,
      monthlyRevenue: 49.5,
      paidStudents: 1,
      revenueTrend: [{ amount: 99.99, transactions: 1, signups: 1 }],
    });
  });

  it('sends chart buckets to the server and rejects a short bucket list', async () => {
    m.rpc.mockResolvedValue({ data: { ...agg, buckets: [] }, error: null });
    await expect(getAuthoritativeAnalytics('7d')).rejects.toThrow('complete reporting result');
    const [name, args] = m.rpc.mock.calls[0];
    expect(name).toBe('admin_analytics_overview');
    expect(args.p_buckets.length).toBeGreaterThan(0);
  });

  it('falls back to browser aggregation when the function is not deployed', async () => {
    m.rpc.mockResolvedValue(missing);
    const data = await getAuthoritativeAnalytics('7d');
    expect(data.studentPerformance.totalStudents).toBe(0);
    expect(m.tables).toContain('attempt_answers');
  });
});

describe('rankings aggregates', () => {
  const row = (id: string, score: number, max: number, extra: Record<string, unknown> = {}) => ({
    user_id: id,
    full_name: `Student ${id}`,
    email: `${id}@x.com`,
    district: ' Nadia ',
    avatar_url: null,
    profile_created_at: '2026-01-01T00:00:00Z',
    tests_attempted: 1,
    total_score: score,
    total_max: max,
    total_correct: 3,
    total_wrong: 1,
    total_skipped: 1,
    latest_at: null,
    max_percentage: Math.round((score / max) * 100),
    subjects: [{ subject: 'Maths', score, marks: max }],
    recent: [{ title: 'Mock 1', score, max, at: null }],
    ...extra,
  });

  it('maps filters to server arguments and ranks the returned students', async () => {
    m.rpc.mockResolvedValue({ data: [row('low', 10, 100), row('high', 80, 100)], error: null });
    const list = await adminCommerceApi.getAdminRankings({
      scope: 'By Topic',
      testType: 'PYQ',
      exam: 'WBP',
      subject: 'All Subjects',
      timePeriod: 'All Time',
    });
    expect(m.rpc).toHaveBeenCalledWith(
      'admin_rankings_aggregate',
      expect.objectContaining({
        p_since: null,
        p_test_types: ['pyq', 'previous_year'],
        p_scope_types: ['topic', 'topic_test', 'chapter_mock', 'subject_mock'],
        p_exam: 'WBP',
        p_subject: null,
      })
    );
    expect(list.map((s) => [s.rank, s.name, s.avgScore, s.accuracy])).toEqual([
      [1, 'Student high', 80, 75],
      [2, 'Student low', 10, 75],
    ]);
    expect(list[0]).toMatchObject({
      district: 'Nadia',
      location: 'Nadia, West Bengal',
      questionsAnswered: 5,
      bestScore: 80,
      subjectPerformance: [{ subject: 'Maths', scorePercent: 80, barColor: 'bg-blue-600' }],
      recentAttempts: [{ title: 'Mock 1', scorePercent: 80, iconBg: 'bg-blue-100 text-blue-600' }],
    });
    expect(m.tables).toEqual([]);
  });

  it('applies search after ranking so ranks stay global', async () => {
    m.rpc.mockResolvedValue({ data: [row('low', 10, 100), row('high', 80, 100)], error: null });
    const list = await adminCommerceApi.getAdminRankings({ search: 'low' });
    expect(list.map((s) => [s.rank, s.name])).toEqual([[2, 'Student low']]);
  });

  it('falls back to browser aggregation when the function is not deployed', async () => {
    m.rpc.mockResolvedValue(missing);
    expect(await adminCommerceApi.getAdminRankings()).toEqual([]);
    expect(m.tables).toEqual(
      expect.arrayContaining(['test_attempts', 'profiles', 'tests', 'exams', 'subjects'])
    );
  });
});
