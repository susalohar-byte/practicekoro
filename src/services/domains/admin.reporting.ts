import { isSupabaseConfigured, supabaseRuntime as supabase } from '@/lib/supabase';
import { withApiCache } from '@/services/apiCache';
import type { AdminDashboardV2Stats, DateRangeRevenueStats } from '@/types';
import type { Tables } from '@/types/database.generated';
import {
  getDateRangeBounds,
  getKolkataDateString,
  parseKolkataStartOfDay,
  parseKolkataEndOfDay,
  generateChartBuckets,
  type DateRangeBounds,
} from './admin.dashboard';

/** A select query that can be paged with `.range()`; `Row` is inferred from the query. */
export interface PageableQuery<Row> {
  range(
    from: number,
    to: number
  ): PromiseLike<{
    data: Row[] | null;
    error: { message: string } | null;
    count: number | null;
  }>;
}

/**
 * The row type of a paged query. A column list built at runtime cannot be parsed by the
 * client (it reports `GenericStringError`), so those rows are `unknown` to the caller.
 */
export type PagedRow<Row> = Row extends { error: true } ? unknown : Row;

/** Every read is authorized by the caller's Supabase session/RLS; never a service key. */
export async function readCompleteQuery<Row>(
  build: () => PageableQuery<Row>
): Promise<PagedRow<Row>[]> {
  const rows: PagedRow<Row>[] = [];
  const seen = new Set<string>();
  let offset = 0;
  let expected = 0;
  do {
    const { data, error, count } = await build().range(offset, offset + 499);
    if (error) throw new Error(error.message);
    if (!Array.isArray(data) || typeof count !== 'number')
      throw new Error('The backend did not confirm a complete reporting result.');
    // Active platforms keep writing while a report pages through results: follow the
    // latest confirmed count instead of failing, and drop rows that shift across pages.
    expected = count;
    if (!data.length) {
      if (offset < expected) throw new Error('Reporting data was truncated. Please retry.');
      break;
    }
    offset += data.length;
    for (const row of data) {
      const id = (row as { id?: unknown } | null)?.id;
      const key = row && id != null ? String(id) : null;
      if (key !== null) {
        if (seen.has(key)) continue;
        seen.add(key);
      }
      rows.push(row as PagedRow<Row>);
    }
  } while (offset < expected);
  return rows;
}
/** PostgREST/Postgres codes for a function that is not deployed yet. */
const MISSING_FUNCTION_CODES = new Set(['PGRST202', '42883']);
const warnedMissingRpcs = new Set<string>();

/**
 * Call a server-side reporting aggregate. Returns null when the function is not
 * deployed yet, so callers fall back to aggregating rows in the browser; any other
 * failure is surfaced instead of silently replaced.
 */
export async function callReportingRpc<T>(
  name: string,
  args: Record<string, unknown>
): Promise<T | null> {
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    if (MISSING_FUNCTION_CODES.has(String(error.code ?? ''))) {
      if (!warnedMissingRpcs.has(name)) {
        warnedMissingRpcs.add(name);
        console.warn(`${name} is not deployed yet; aggregating this report in the browser.`);
      }
      return null;
    }
    throw new Error(error.message);
  }
  return data as T;
}
/** Earliest reporting event in range; null when the function is not deployed. */
export function getEarliestReportingEvent(
  b: DateRangeBounds,
  allPaymentStatuses: boolean
): Promise<{ earliest: string | null } | null> {
  return callReportingRpc<{ earliest: string | null }>('admin_reporting_earliest', {
    p_start: b.startIso,
    p_end: b.endIso,
    p_all_payment_statuses: allPaymentStatuses,
  });
}
// Reporting rows: only the columns each browser-fallback query selects.
export type ReportProfileRow = Pick<Tables<'profiles'>, 'id' | 'created_at'> &
  Partial<Pick<Tables<'profiles'>, 'full_name' | 'district'>>;
export type ReportAttemptRow = Pick<
  Tables<'test_attempts'>,
  'id' | 'user_id' | 'test_id' | 'status' | 'created_at'
> &
  Partial<Pick<Tables<'test_attempts'>, 'score' | 'total_marks'>>;
/** The owning attempt of an answer (`test_attempts!inner(user_id)`). */
type AnswerOwner = { user_id: string } | { user_id: string }[] | null;
export type ReportAnswerRow = Pick<
  Tables<'attempt_answers'>,
  'id' | 'selected_option' | 'created_at'
> & { test_attempts?: AnswerOwner };
/** `PAYMENT_REVENUE_COLUMNS`; `requires_refund` is the text `raw_response->>requires_refund`. */
export type PaymentRevenueRow = Pick<
  Tables<'payments'>,
  'id' | 'amount' | 'refund_amount' | 'status' | 'created_at'
> & { requires_refund: string | null };
/** The fields `netPaymentAmount` reads. */
export interface NetPaymentInput {
  status: string;
  amount: number;
  refund_amount?: number | null;
  requires_refund?: string | boolean | null;
}

/** An untyped select on the runtime client; filters (eq, gte, in, …) return this same type. */
const selectRows = (table: string, columns: string) =>
  supabase.from(table).select(columns, { count: 'exact' });
type RowsQuery = ReturnType<typeof selectRows>;
const selectCount = (table: string) =>
  supabase.from(table).select('*', { count: 'exact', head: true });
type CountQuery = ReturnType<typeof selectCount>;

const paiseToRupees = (paise: unknown) => Math.round(Number(paise || 0)) / 100;
const toRange = (startMs: number, endMs: number) => ({
  start: new Date(startMs).toISOString(),
  end: new Date(endMs).toISOString(),
});

/** `Row` names the columns `columns` selects (a runtime column list is not parsed). */
function rows<Row>(
  table: string,
  columns: string,
  filter: (q: RowsQuery) => RowsQuery = (q) => q
): Promise<Row[]> {
  return readCompleteQuery(() => {
    let query = selectRows(table, columns);
    query =
      table === 'test_exams'
        ? query.order('test_id', { ascending: true }).order('exam_id', { ascending: true })
        : query.order('id', { ascending: true });
    return filter(query);
  }) as Promise<Row[]>;
}
async function count(
  table: string,
  filter: (q: CountQuery) => CountQuery = (q) => q
): Promise<number> {
  const r = await filter(selectCount(table));
  if (r.error) throw new Error(r.error.message);
  if (typeof r.count !== 'number') throw new Error(`${table} count was not confirmed.`);
  return r.count;
}
const PAYMENT_REVENUE_COLUMNS =
  'id, amount, refund_amount, status, created_at, requires_refund:raw_response->>requires_refund';
const within = (value: string, b: DateRangeBounds) =>
  Date.parse(value) >= Date.parse(b.startIso) && Date.parse(value) <= Date.parse(b.endIso);
export function netPaymentAmount(p: NetPaymentInput): number {
  // Pending and failed payments retain nothing; refunded ones keep any unrefunded remainder.
  if (p.status !== 'completed' && p.status !== 'refunded') return 0;
  // Captured after the purchase stopped being eligible: access was never granted and
  // the money is owed back to the student.
  if (p.requires_refund === true || String(p.requires_refund) === 'true') return 0;
  const refunded = p.refund_amount ?? (p.status === 'refunded' ? p.amount : 0);
  return Math.max(
    0,
    (Math.round(Number(p.amount || 0) * 100) - Math.round(Number(refunded || 0) * 100)) / 100
  );
}
export interface DashboardPeriod {
  newStudents: number;
  activeStudents: number;
  testsAttempted: number;
  completedTests: number;
  questionsAnswered: number;
  netRevenue: number;
  previous: Omit<
    DashboardPeriod,
    'previous' | 'growthSeries' | 'attemptSeries' | 'revenueSeries' | 'attemptCounts'
  > | null;
  growthSeries: { label: string; newStudents: number; activeStudents: number }[];
  attemptSeries: { label: string; totalAttempts: number; uniqueStudents: number }[];
  revenueSeries: { label: string; amount: number; highlighted: boolean }[];
  attemptCounts: Record<string, number>;
}
export function aggregateDashboardPeriod(
  b: DateRangeBounds,
  profiles: ReportProfileRow[],
  attempts: ReportAttemptRow[],
  answers: ReportAnswerRow[],
  payments: PaymentRevenueRow[]
): DashboardPeriod {
  const summarize = (range: DateRangeBounds) => {
    const a = attempts.filter((r) => within(r.created_at, range));
    return {
      newStudents: profiles.filter((r) => within(r.created_at, range)).length,
      activeStudents: new Set(a.map((r) => r.user_id).filter(Boolean)).size,
      testsAttempted: a.length,
      completedTests: a.filter((r) => r.status === 'completed').length,
      questionsAnswered: answers.filter(
        (r) => r.selected_option != null && within(r.created_at, range)
      ).length,
      netRevenue:
        payments
          .filter((r) => within(r.created_at, range))
          .reduce((n, r) => n + Math.round(netPaymentAmount(r) * 100), 0) / 100,
    };
  };
  const current = summarize(b);
  const previous =
    b.prevStartIso && b.prevEndIso
      ? summarize({ ...b, startIso: b.prevStartIso, endIso: b.prevEndIso })
      : null;
  // All-time charts start at the earliest actual event, not a made-up 1970 history.
  const dated = [...profiles, ...attempts, ...answers, ...payments]
    .filter((r) => within(r.created_at, b))
    .map((r) => Date.parse(r.created_at));
  const chartStart =
    b.isAllTime && dated.length
      ? parseKolkataStartOfDay(
          getKolkataDateString(
            new Date(dated.reduce((min, value) => Math.min(min, value), Infinity))
          )
        ).toISOString()
      : b.startIso;
  const buckets = b.isAllTime && !dated.length ? [] : generateChartBuckets(chartStart, b.endIso, 7);
  const growthSeries = buckets.map((k) => {
    const a = attempts.filter(
      (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
    );
    return {
      label: k.label,
      newStudents: profiles.filter(
        (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
      ).length,
      activeStudents: new Set(a.map((r) => r.user_id).filter(Boolean)).size,
    };
  });
  const attemptSeries = buckets.map((k) => {
    const a = attempts.filter(
      (r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs
    );
    return {
      label: k.label,
      totalAttempts: a.length,
      uniqueStudents: new Set(a.map((r) => r.user_id).filter(Boolean)).size,
    };
  });
  const revenueSeries = buckets.map((k) => ({
    label: k.label,
    amount:
      payments
        .filter((r) => Date.parse(r.created_at) >= k.startMs && Date.parse(r.created_at) <= k.endMs)
        .reduce((n, r) => n + Math.round(netPaymentAmount(r) * 100), 0) / 100,
    highlighted: false,
  }));
  const attemptCounts: Record<string, number> = {};
  for (const a of attempts.filter((r) => within(r.created_at, b)))
    if (a.test_id) attemptCounts[a.test_id] = (attemptCounts[a.test_id] || 0) + 1;
  return { ...current, previous, growthSeries, attemptSeries, revenueSeries, attemptCounts };
}
interface DashboardRangeTotals {
  new_students: number;
  active_students: number;
  tests_attempted: number;
  completed_tests: number;
  questions_answered: number;
  net_revenue_paise: number;
}

/** Same result as aggregateDashboardPeriod, with the totals computed in Postgres. */
async function getDashboardPeriodFromServer(b: DateRangeBounds): Promise<DashboardPeriod | null> {
  let chartStart: string | null = b.startIso;
  if (b.isAllTime) {
    const first = await getEarliestReportingEvent(b, false);
    if (first === null) return null;
    // All-time charts start at the earliest actual event, not a made-up 1970 history.
    chartStart = first.earliest
      ? parseKolkataStartOfDay(getKolkataDateString(new Date(first.earliest))).toISOString()
      : null;
  }
  const buckets = chartStart ? generateChartBuckets(chartStart, b.endIso, 7) : [];
  const hasPrevious = Boolean(b.prevStartIso && b.prevEndIso);
  const ranges = [
    { start: b.startIso, end: b.endIso },
    ...(hasPrevious ? [{ start: b.prevStartIso!, end: b.prevEndIso! }] : []),
    ...buckets.map((k) => toRange(k.startMs, k.endMs)),
  ];
  const result = await callReportingRpc<{
    ranges: DashboardRangeTotals[];
    attempt_counts: Record<string, number>;
  }>('admin_dashboard_range_stats', { p_ranges: ranges });
  if (result === null) return null;
  if (!Array.isArray(result?.ranges) || result.ranges.length !== ranges.length)
    throw new Error('The backend did not confirm a complete reporting result.');
  const totals = (r: DashboardRangeTotals) => ({
    newStudents: Number(r.new_students),
    activeStudents: Number(r.active_students),
    testsAttempted: Number(r.tests_attempted),
    completedTests: Number(r.completed_tests),
    questionsAnswered: Number(r.questions_answered),
    netRevenue: paiseToRupees(r.net_revenue_paise),
  });
  const bucketTotals = result.ranges.slice(hasPrevious ? 2 : 1);
  return {
    ...totals(result.ranges[0]),
    previous: hasPrevious ? totals(result.ranges[1]) : null,
    growthSeries: buckets.map((k, i) => ({
      label: k.label,
      newStudents: Number(bucketTotals[i].new_students),
      activeStudents: Number(bucketTotals[i].active_students),
    })),
    attemptSeries: buckets.map((k, i) => ({
      label: k.label,
      totalAttempts: Number(bucketTotals[i].tests_attempted),
      uniqueStudents: Number(bucketTotals[i].active_students),
    })),
    revenueSeries: buckets.map((k, i) => ({
      label: k.label,
      amount: paiseToRupees(bucketTotals[i].net_revenue_paise),
      highlighted: false,
    })),
    attemptCounts: Object.fromEntries(
      Object.entries(result.attempt_counts || {}).map(([id, n]) => [id, Number(n)])
    ),
  };
}

export async function getDashboardPeriodData(b: DateRangeBounds): Promise<DashboardPeriod> {
  if (!isSupabaseConfigured) return aggregateDashboardPeriod(b, [], [], [], []);
  const fromServer = await getDashboardPeriodFromServer(b);
  if (fromServer) return fromServer;
  const start = b.prevStartIso || b.startIso;
  const filter = (q: RowsQuery) => q.gte('created_at', start).lte('created_at', b.endIso);
  const [p, studentRows, a, r, m] = await Promise.all([
    rows<ReportProfileRow>('profiles', 'id, created_at', (q) => filter(q.eq('role', 'student'))),
    rows<{ id: string }>('profiles', 'id', (q) => q.eq('role', 'student')),
    rows<ReportAttemptRow>('test_attempts', 'id, user_id, test_id, status, created_at', filter),
    rows<ReportAnswerRow>(
      'attempt_answers',
      'id, selected_option, created_at, test_attempts!inner(user_id)',
      (q) => filter(q.not('selected_option', 'is', null))
    ),
    rows<PaymentRevenueRow>('payments', PAYMENT_REVENUE_COLUMNS, (q) =>
      filter(q.in('status', ['completed', 'refunded']))
    ),
  ]);
  // Student reporting excludes staff/admin test runs, matching the Analytics aggregation.
  const students = new Set<string | undefined>(studentRows.map((s) => s.id));
  const owner = (x: ReportAnswerRow) =>
    (Array.isArray(x.test_attempts) ? x.test_attempts[0] : x.test_attempts)?.user_id;
  return aggregateDashboardPeriod(
    b,
    p,
    a.filter((x) => students.has(x.user_id)),
    r.filter((x) => students.has(owner(x))),
    m
  );
}
async function getDashboardOverviewFromServer(
  today: DateRangeBounds,
  month: DateRangeBounds,
  yearStartMs: number
): Promise<AdminDashboardV2Stats | null> {
  const [stats, period] = await Promise.all([
    callReportingRpc<Record<string, number>>('admin_dashboard_overview_stats', {
      p_today_start: today.startIso,
      p_month_start: month.startIso,
      p_year_start: new Date(yearStartMs).toISOString(),
    }),
    getDashboardPeriodData(getDateRangeBounds('Last 30 Days')),
  ]);
  if (stats === null) return null;
  const n = (key: string) => Number(stats[key] ?? 0);
  const totalStudents = n('total_students');
  const proStudents = n('pro_students');
  return {
    totalStudents,
    newStudents: period.newStudents,
    activeStudents: period.activeStudents,
    totalRevenue: paiseToRupees(stats.revenue_total_paise),
    todayRevenue: paiseToRupees(stats.revenue_today_paise),
    monthRevenue: paiseToRupees(stats.revenue_month_paise),
    yearRevenue: paiseToRupees(stats.revenue_year_paise),
    freeStudents: Math.max(0, totalStudents - proStudents),
    proStudents,
    activeSubscriptions: n('active_subscriptions'),
    testsAttempted: n('tests_attempted'),
    completedTests: n('completed_tests'),
    questionsAnswered: n('questions_answered'),
    totalExams: n('total_exams'),
    totalTests: n('total_tests'),
    topicTests: n('topic_tests'),
    fullMockTests: n('full_mock_tests'),
    pyqTests: n('pyq_tests'),
    totalQuestions: n('total_questions'),
    topicQuestions: n('topic_questions'),
    fullMockQuestions: n('full_mock_questions'),
    pyqQuestions: n('pyq_questions'),
    revenueTrend: [],
    recentActivity: [],
  };
}
export async function getDashboardOverview(): Promise<AdminDashboardV2Stats> {
  return withApiCache(
    'admin_dashboard_overview_v2',
    async () => {
      const now = new Date();
      const today = getDateRangeBounds('Today');
      const month = getDateRangeBounds('This Month');
      const year = parseKolkataStartOfDay(
        getKolkataDateString(now).slice(0, 4) + '-01-01'
      ).getTime();
      const fromServer = await getDashboardOverviewFromServer(today, month, year);
      if (fromServer) return fromServer;
      const [totalStudents, totalExams, totalQuestions, tests, subs, payments, period] =
        await Promise.all([
          count('profiles', (q) => q.eq('role', 'student')),
          count('exams'),
          count('questions'),
          rows<Pick<Tables<'tests'>, 'id' | 'test_type'>>('tests', 'id, test_type'),
          rows<Pick<Tables<'subscriptions'>, 'id' | 'user_id'>>(
            'subscriptions',
            'id, user_id',
            (q) => q.eq('status', 'active').gt('expires_at', now.toISOString())
          ),
          rows<PaymentRevenueRow>('payments', PAYMENT_REVENUE_COLUMNS, (q) =>
            q.in('status', ['completed', 'refunded'])
          ),
          getDashboardPeriodData(getDateRangeBounds('Last 30 Days')),
        ]);
      const revenueSince = (time: number) =>
        payments
          .filter((p) => Date.parse(p.created_at) >= time)
          .reduce((n, p) => n + Math.round(netPaymentAmount(p) * 100), 0) / 100;
      const proStudents = new Set(subs.map((s) => s.user_id)).size;
      return {
        totalStudents,
        newStudents: period.newStudents,
        activeStudents: period.activeStudents,
        totalRevenue: revenueSince(0),
        todayRevenue: revenueSince(Date.parse(today.startIso)),
        monthRevenue: revenueSince(Date.parse(month.startIso)),
        yearRevenue: revenueSince(year),
        freeStudents: Math.max(0, totalStudents - proStudents),
        proStudents,
        activeSubscriptions: subs.length,
        testsAttempted: await count('test_attempts'),
        completedTests: await count('test_attempts', (q) => q.eq('status', 'completed')),
        questionsAnswered: await count('attempt_answers', (q) =>
          q.not('selected_option', 'is', null)
        ),
        totalExams,
        totalTests: tests.length,
        topicTests: tests.filter((t) =>
          ['topic', 'chapter_mock', 'subject_mock'].includes(t.test_type)
        ).length,
        fullMockTests: tests.filter((t) => t.test_type === 'full_mock').length,
        pyqTests: tests.filter((t) => t.test_type === 'pyq').length,
        totalQuestions,
        topicQuestions: await count('questions', (q) => q.eq('source_type', 'topic')),
        fullMockQuestions: await count('questions', (q) => q.eq('source_type', 'other')),
        pyqQuestions: await count('questions', (q) => q.eq('source_type', 'pyq')),
        revenueTrend: [],
        recentActivity: [],
      };
    },
    30_000
  );
}
/** Active, unexpired subscriptions grouped by plan id. Empty without a backend. */
export async function getActiveSubscriptionCountsByPlan(): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const subs = await rows<Pick<Tables<'subscriptions'>, 'id' | 'plan_id'>>(
    'subscriptions',
    'id, plan_id',
    (q) => q.eq('status', 'active').gt('expires_at', new Date().toISOString())
  );
  const counts: Record<string, number> = {};
  for (const sub of subs) {
    const planId = String(sub.plan_id ?? '');
    if (planId) counts[planId] = (counts[planId] || 0) + 1;
  }
  return counts;
}
interface RevenueRangeTotals {
  earliest: string | null;
  total_net_paise: number;
  transactions: number;
  signups: number;
  payment_days: { date: string; net_paise: number; transactions: number }[];
  signup_days: { date: string; count: number }[];
}

/** Daily trend built from Kolkata-day totals computed in Postgres. */
function buildRevenueRange(
  b: DateRangeBounds,
  preset: string,
  earliestMs: number | null,
  totalCents: number,
  transactions: number,
  signups: number,
  paymentDays: Map<string, { cents: number; transactions: number }>,
  signupDays: Map<string, number>
): DateRangeRevenueStats {
  const startDay =
    b.isAllTime && earliestMs !== null
      ? getKolkataDateString(new Date(earliestMs))
      : getKolkataDateString(new Date(b.startIso));
  const endDay = getKolkataDateString(new Date(b.endIso));
  const dailyTrend = [];
  let day = parseKolkataStartOfDay(startDay).getTime();
  if (!b.isAllTime || earliestMs !== null)
    while (day <= Date.parse(b.endIso)) {
      const date = getKolkataDateString(new Date(day));
      const bucket = paymentDays.get(date);
      dailyTrend.push({
        date,
        label: new Date(day).toLocaleDateString('en-IN', {
          timeZone: 'Asia/Kolkata',
          month: 'short',
          day: 'numeric',
        }),
        amount: (bucket?.cents || 0) / 100,
        transactions: bucket?.transactions || 0,
        signups: signupDays.get(date) || 0,
      });
      day += 86400000;
    }
  const totalRevenue = totalCents / 100;
  const avgOrderValue = transactions ? totalRevenue / transactions : 0;
  return {
    startDate: startDay,
    endDate: endDay,
    preset: preset as DateRangeRevenueStats['preset'],
    label: b.label,
    totalRevenue,
    totalTransactions: transactions,
    transactionCount: transactions,
    avgOrderValue,
    averageOrderValue: avgOrderValue,
    newStudentSignups: signups,
    newSignupsCount: signups,
    dailyTrend,
  };
}

async function getRevenueRangeFromServer(
  b: DateRangeBounds,
  preset: string
): Promise<DateRangeRevenueStats | null> {
  const r = await callReportingRpc<RevenueRangeTotals>('admin_revenue_range_stats', {
    p_start: b.startIso,
    p_end: b.endIso,
  });
  if (r === null) return null;
  const paymentDays = new Map(
    (r.payment_days || []).map((d) => [
      d.date,
      { cents: Math.round(Number(d.net_paise || 0)), transactions: Number(d.transactions || 0) },
    ])
  );
  const signupDays = new Map((r.signup_days || []).map((d) => [d.date, Number(d.count || 0)]));
  return buildRevenueRange(
    b,
    preset,
    r.earliest ? Date.parse(r.earliest) : null,
    Math.round(Number(r.total_net_paise || 0)),
    Number(r.transactions || 0),
    Number(r.signups || 0),
    paymentDays,
    signupDays
  );
}

/** Accept full ISO bounds without converting them through the browser's timezone. */
export async function getAuthoritativeRevenueRange(
  start?: string,
  end?: string,
  preset = 'this_month'
): Promise<DateRangeRevenueStats> {
  const presets: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    '7d': 'Last 7 Days',
    last_7_days: 'Last 7 Days',
    this_month: 'This Month',
    '30d': 'Last 30 Days',
    last_30_days: 'Last 30 Days',
    all_time: 'All Time',
  };
  let b = getDateRangeBounds(presets[preset] || 'This Month');
  if (preset === 'this_year')
    b = getDateRangeBounds(
      'Custom Range',
      getKolkataDateString(new Date()).slice(0, 4) + '-01-01',
      getKolkataDateString(new Date())
    );
  if (preset === 'custom') {
    if (!start) throw new Error('Start date is required.');
    const s = start.includes('T') ? new Date(start) : parseKolkataStartOfDay(start);
    const e = end
      ? end.includes('T')
        ? new Date(end)
        : parseKolkataEndOfDay(end)
      : parseKolkataEndOfDay(getKolkataDateString(new Date()));
    if (!Number.isFinite(s.getTime()) || !Number.isFinite(e.getTime()) || s > e)
      throw new Error('Choose a valid reporting date range.');
    b = {
      startIso: s.toISOString(),
      endIso: e.toISOString(),
      label: 'Custom Range',
      daysCount: Math.round((e.getTime() - s.getTime() + 1) / 86400000),
      isAllTime: false,
    };
  }
  const fromServer = await getRevenueRangeFromServer(b, preset);
  if (fromServer) return fromServer;
  const filter = (q: RowsQuery) => q.gte('created_at', b.startIso).lte('created_at', b.endIso);
  const [payments, profiles] = await Promise.all([
    rows<PaymentRevenueRow>('payments', PAYMENT_REVENUE_COLUMNS, (q) =>
      filter(q.in('status', ['completed', 'refunded']))
    ),
    rows<ReportProfileRow>('profiles', 'id, created_at', (q) => filter(q.eq('role', 'student'))),
  ]);
  const earliest = [...payments, ...profiles].map((r) => Date.parse(r.created_at));
  const paymentDays = new Map<string, { cents: number; transactions: number }>();
  const signupDays = new Map<string, number>();
  for (const payment of payments) {
    // Same net-revenue rule as totalRevenue, so the trend always sums to the headline:
    // partially refunded payments contribute their unrefunded remainder.
    const cents = Math.round(netPaymentAmount(payment) * 100);
    if (!cents && payment.status !== 'completed') continue;
    const date = getKolkataDateString(new Date(payment.created_at));
    const bucket = paymentDays.get(date) || { cents: 0, transactions: 0 };
    bucket.cents += cents;
    if (payment.status === 'completed') bucket.transactions++;
    paymentDays.set(date, bucket);
  }
  for (const profile of profiles) {
    const date = getKolkataDateString(new Date(profile.created_at));
    signupDays.set(date, (signupDays.get(date) || 0) + 1);
  }
  return buildRevenueRange(
    b,
    preset,
    earliest.length ? earliest.reduce((min, value) => Math.min(min, value), Infinity) : null,
    payments.reduce((n, p) => n + Math.round(netPaymentAmount(p) * 100), 0),
    payments.filter((p) => p.status === 'completed').length,
    profiles.length,
    paymentDays,
    signupDays
  );
}

export async function getDashboardSystemActivity(b: DateRangeBounds) {
  if (!isSupabaseConfigured) return [];
  const selectLatest = (table: string, columns: string) =>
    supabase
      .from(table)
      .select(columns)
      .gte('created_at', b.startIso)
      .lte('created_at', b.endIso)
      .order('created_at', { ascending: false })
      .limit(20);
  type LatestQuery = ReturnType<typeof selectLatest>;
  const latest = async <Row>(
    table: string,
    columns: string,
    filter: (q: LatestQuery) => LatestQuery = (q) => q
  ) => {
    const r = await filter(selectLatest(table, columns));
    if (r.error) throw new Error(r.error.message);
    if (!Array.isArray(r.data)) throw new Error('Activity response was not confirmed.');
    return r.data as Row[];
  };
  const [payments, subs, profiles, tests, exams] = await Promise.all([
    latest<Pick<Tables<'payments'>, 'id' | 'amount' | 'status' | 'created_at'>>(
      'payments',
      'id, amount, status, created_at',
      (q) => q.eq('status', 'completed')
    ),
    latest<Pick<Tables<'subscriptions'>, 'id' | 'status' | 'created_at'>>(
      'subscriptions',
      'id, status, created_at'
    ),
    latest<ReportProfileRow>('profiles', 'id, created_at', (q) => q.eq('role', 'student')),
    latest<Pick<Tables<'tests'>, 'id' | 'title' | 'created_at'>>('tests', 'id, title, created_at'),
    latest<Pick<Tables<'exams'>, 'id' | 'title' | 'created_at'>>('exams', 'id, title, created_at'),
  ]);
  return [
    ...payments.map((p) => ({
      id: p.id,
      type: 'payment',
      description: `Payment recorded: ₹${Number(p.amount).toLocaleString('en-IN')}`,
      timestamp: p.created_at,
    })),
    ...subs.map((s) => ({
      id: s.id,
      type: 'subscription',
      description: 'Subscription record created',
      timestamp: s.created_at,
    })),
    ...profiles.map((p) => ({
      id: p.id,
      type: 'registration',
      description: 'Student registered',
      timestamp: p.created_at,
    })),
    ...tests.map((t) => ({
      id: t.id,
      type: 'test_created',
      description: `Test created: ${t.title}`,
      timestamp: t.created_at,
    })),
    ...exams.map((e) => ({
      id: e.id,
      type: 'exam_created',
      description: `Exam configured: ${e.title}`,
      timestamp: e.created_at,
    })),
  ];
}
export async function getDashboardExamAttemptCounts(
  attemptCounts: Record<string, number>
): Promise<Record<string, number>> {
  if (!isSupabaseConfigured) return {};
  const [tests, links] = await Promise.all([
    rows<Pick<Tables<'tests'>, 'id' | 'exam_id'>>('tests', 'id, exam_id'),
    rows<Pick<Tables<'test_exams'>, 'test_id' | 'exam_id'>>('test_exams', 'test_id, exam_id'),
  ]);
  const pairs = new Set<string>();
  const totals: Record<string, number> = {};
  for (const t of [...tests.map((t) => ({ test_id: t.id, exam_id: t.exam_id })), ...links]) {
    const pair = JSON.stringify([t.test_id, t.exam_id]);
    if (!t.exam_id || pairs.has(pair)) continue;
    pairs.add(pair);
    totals[t.exam_id] = (totals[t.exam_id] || 0) + (attemptCounts[t.test_id] || 0);
  }
  return totals;
}
export const adminReportingApi = {
  getDashboardPeriodData,
  getDashboardSystemActivity,
  getDashboardExamAttemptCounts,
  getDashboardLeaderboard,
  getDashboardAuditLogs,
};

export async function getDashboardLeaderboard(b: DateRangeBounds) {
  if (!isSupabaseConfigured) return [];
  // The deployed student leaderboard only accepts a lower bound. Do not silently
  // present it as an end-bounded historical leaderboard.
  const attempts = await rows<
    Pick<
      Tables<'test_attempts'>,
      'id' | 'user_id' | 'score' | 'total_marks' | 'status' | 'created_at'
    >
  >('test_attempts', 'id, user_id, score, total_marks, status, created_at', (q) =>
    q.gte('created_at', b.startIso).lte('created_at', b.endIso).eq('status', 'completed')
  );
  const users: Record<string, { total: number; n: number }> = {};
  for (const a of attempts)
    if (a.user_id && Number(a.total_marks) > 0) {
      const u = users[a.user_id] || (users[a.user_id] = { total: 0, n: 0 });
      u.total += (Number(a.score) / Number(a.total_marks)) * 100;
      u.n++;
    }
  const ids = Object.keys(users);
  if (!ids.length) return [];
  const profiles: ReportProfileRow[] = [];
  for (let i = 0; i < ids.length; i += 100)
    profiles.push(
      ...(await rows<ReportProfileRow>('profiles', 'id, full_name, district', (q) =>
        q.eq('role', 'student').in('id', ids.slice(i, i + 100))
      ))
    );
  return profiles
    .map((p) => ({
      display_name: p.full_name || 'Student',
      district: p.district,
      average_percentage: users[p.id].total / users[p.id].n,
      tests_count: users[p.id].n,
    }))
    .sort(
      (a, b) =>
        b.average_percentage - a.average_percentage || a.display_name.localeCompare(b.display_name)
    )
    .slice(0, 5)
    .map((p, i) => ({ ...p, rank: i + 1 }));
}
export async function getDashboardAuditLogs(b: DateRangeBounds) {
  if (!isSupabaseConfigured) return { logs: [] };
  const r = await supabase
    .from('admin_audit_logs')
    .select('id, entity_id, action, admin_name, details, created_at')
    .gte('created_at', b.startIso)
    .lte('created_at', b.endIso)
    .order('created_at', { ascending: false })
    .limit(200);
  if (r.error) throw new Error(r.error.message);
  if (!Array.isArray(r.data)) throw new Error('Audit feed was not confirmed.');
  return {
    logs: r.data.map((r) => ({
      id: r.id,
      entityId: r.entity_id,
      action: r.action,
      adminName: r.admin_name,
      details: r.details,
      createdAt: r.created_at,
    })),
  };
}
