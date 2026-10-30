import { supabase } from '@/lib/supabase';
import { num } from '@/lib/format';
import type { Exam, HeroBanner, LiveTest, MockTest, Subject, Topic } from '@/types/models';

// Catalog reads mirror CatalogRepository in the Flutter app, without its offline sample
// catalog: the web panel shows only what the admin has published.

type Row = Record<string, unknown>;

/** A PostgREST `relation(count)` embed. */
type CountRel = { count: number | null }[] | null;

// Row shapes for the columns each mapper reads. The client is untyped, so every field is
// optional and nullable; the mappers fall back to defaults exactly as before.
type Text = string | null;
type Numeric = number | string | null;

export interface ExamRow {
  id: string | number;
  title?: Text;
  name?: Text;
  slug?: Text;
  short_name?: Text;
  subtitle?: Text;
  category?: Text;
  description?: Text;
  icon_name?: Text;
  banner_url?: Text;
  order_index?: Numeric;
  tests?: CountRel;
}

export interface SubjectRow {
  id: string | number;
  exam_id?: Text;
  name?: Text;
  name_english?: Text;
  name_bengali?: Text;
  name_bn?: Text;
  slug?: Text;
  icon_name?: Text;
  order_index?: Numeric;
  chapters?: CountRel;
  tests?: CountRel;
}

export interface TopicRow {
  id: string | number;
  subject_id?: Text;
  title?: Text;
  name?: Text;
  title_bengali?: Text;
  name_bn?: Text;
  slug?: Text;
  tests?: CountRel;
}

export interface TestRow {
  id: string | number;
  exam_id?: Text;
  subject_id?: Text;
  chapter_id?: Text;
  test_series_id?: Text;
  title?: Text;
  description?: Text;
  total_questions?: Numeric;
  duration_minutes?: Numeric;
  total_marks?: Numeric;
  negative_marking?: Numeric;
  passing_marks?: Numeric;
  is_premium?: boolean | null;
  is_pro?: boolean | null;
  test_type?: Text;
  category?: Text;
  year?: Numeric;
  paper_name?: Text;
  shift?: Text;
  exam_date?: Text;
  icon_url?: Text;
  order_index?: Numeric;
  created_at?: Text;
  is_live_only?: boolean | null;
}

interface LiveTestParentRow {
  id?: string | number | null;
  title?: Text;
  exam_id?: Text;
  duration_minutes?: Numeric;
  total_questions?: Numeric;
  total_marks?: Numeric;
  negative_marking?: Numeric;
  exams?: { title?: Text } | null;
}

export interface LiveTestRow {
  id: string | number;
  test_id?: string | number | null;
  title?: Text;
  exam_id?: Text;
  exam_title?: Text;
  status?: Text;
  start_at?: Text;
  scheduled_start_time?: Text;
  scheduled_end_time?: Text;
  registration_deadline?: Text;
  duration_minutes?: Numeric;
  total_questions?: Numeric;
  total_marks?: Numeric;
  negative_marking?: Numeric;
  enrolled_count?: Numeric;
  logo?: Text;
  exam_logo?: Text;
  ranking_enabled?: boolean | null;
  subscription_required?: boolean | null;
  instructions?: Text;
  tests?: LiveTestParentRow | LiveTestParentRow[] | null;
}

interface HeroBannerRow {
  id?: string | number | null;
  title?: Text;
  subtitle?: Text;
  badge_text?: Text;
  image_url?: Text;
  mobile_image_url?: Text;
  banner_type?: Text;
  show_text_overlay?: boolean | null;
  primary_cta_text?: Text;
  primary_cta_link?: Text;
  placement?: Text;
  starts_at?: Text;
  expires_at?: Text;
  is_active?: boolean | null;
  display_order?: Numeric;
}

function countOf(rel: unknown): number {
  if (Array.isArray(rel) && rel.length > 0 && typeof rel[0] === 'object' && rel[0]) {
    return num((rel[0] as Row).count) ?? 0;
  }
  return 0;
}

/** MockTestModel.normalizeCategory */
export function normalizeCategory(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return 'Full Test';
  const l = raw.toLowerCase();
  if (l.includes('pyq') || l.includes('previous') || l.includes('year')) return 'PYQ';
  if (l.includes('topic') || l.includes('chapter') || l.includes('subject')) return 'Topic Test';
  if (l.includes('full') || l.includes('mock')) return 'Full Test';
  return raw;
}

export function toExam(r: ExamRow): Exam {
  return {
    id: String(r.id),
    title: r.title ?? r.name ?? '',
    slug: r.slug ?? '',
    shortName: r.short_name ?? null,
    subtitle: r.subtitle ?? null,
    category: r.category ?? null,
    description: r.description ?? null,
    iconUrl: r.icon_name ?? null,
    bannerUrl: r.banner_url ?? null,
    totalTests: countOf(r.tests),
    orderIndex: num(r.order_index) ?? 0,
  };
}

/** SubjectModel._inferBengaliName — used only when the admin left the Bengali name empty. */
function inferBengaliName(name: string): string {
  const l = name.toLowerCase();
  const map: [string[], string][] = [
    [['history'], 'ইতিহাস'],
    [['math', 'arith'], 'গণিত'],
    [['science'], 'সাধারণ বিজ্ঞান'],
    [['polity', 'constitution'], 'ভারতের সংবিধান ও রাষ্ট্রব্যবস্থা'],
    [['bengali'], 'বাংলা সাহিত্য'],
    [['geography'], 'ভূগোল'],
    [['environment'], 'পরিবেশ বিদ্যা'],
    [['reasoning', 'logic'], 'রিজনিং'],
    [['english'], 'ইংরেজি'],
    [['computer'], 'কম্পিউটার'],
    [['static'], 'স্ট্যাটিক জিকে'],
    [['current', 'affair'], 'সাম্প্রতিক ঘটনাপ্রবাহ'],
    [['gk', 'knowledge', 'awareness'], 'সাধারণ জ্ঞান'],
    [['economy', 'economic'], 'অর্থনীতি'],
  ];
  for (const [keys, bn] of map) if (keys.some((k) => l.includes(k))) return bn;
  return name;
}

export function toSubject(r: SubjectRow): Subject {
  const en = r.name_english ?? r.name ?? '';
  const bn = (r.name_bengali ?? r.name_bn ?? '').trim();
  return {
    id: String(r.id),
    examId: r.exam_id ?? null,
    nameEnglish: en,
    nameBengali: bn || inferBengaliName(en),
    slug: r.slug ?? '',
    iconName: r.icon_name ?? null,
    chapterCount: countOf(r.chapters),
    totalTests: countOf(r.tests),
    orderIndex: num(r.order_index) ?? 0,
  };
}

/** TopicModel.fromJson — splits "Indus Valley (সিন্ধু সভ্যতা)" into English + Bengali. */
export function toTopic(r: TopicRow): Topic {
  const raw: string = r.title ?? r.name ?? '';
  let title = raw;
  let bn: string | null = r.title_bengali ?? r.name_bn ?? null;
  if (!bn) {
    const m = /^(.*?)\s*\((.*?)\)\s*$/.exec(raw);
    if (m) {
      title = m[1].trim() || raw;
      bn = m[2].trim() || null;
    }
  }
  return {
    id: String(r.id),
    subjectId: r.subject_id ?? '',
    title,
    titleBengali: bn,
    slug: r.slug ?? '',
    totalTests: countOf(r.tests),
  };
}

export function toTest(r: TestRow): MockTest {
  return {
    id: String(r.id),
    examId: r.exam_id ?? null,
    subjectId: r.subject_id ?? null,
    chapterId: r.chapter_id ?? null,
    testSeriesId: r.test_series_id ?? null,
    title: r.title ?? '',
    description: r.description ?? null,
    totalQuestions: num(r.total_questions) ?? 0,
    durationMinutes: num(r.duration_minutes) ?? 0,
    totalMarks: num(r.total_marks) ?? 0,
    negativeMarking: num(r.negative_marking) ?? 0,
    passingMarks: num(r.passing_marks),
    isPro: r.is_premium === true || r.is_pro === true,
    category: normalizeCategory(r.test_type ?? r.category),
    year: num(r.year),
    paperName: r.paper_name ?? null,
    shift: r.shift ?? null,
    examDate: r.exam_date ?? null,
    iconUrl: r.icon_url ?? null,
    orderIndex: num(r.order_index) ?? 0,
    createdAt: r.created_at ?? null,
    isLiveOnly: r.is_live_only === true,
  };
}

/** MockTestModel.paperYear: tests.year, else a 4-digit year in the title. */
export function paperYear(t: MockTest): number | null {
  if (t.year) return t.year;
  const m = /\b(19|20)\d{2}\b/.exec(t.title);
  return m ? Number(m[0]) : null;
}

// Explicit column lists keep every response down to what the mappers above read.
const EXAM_COLUMNS =
  'id, title, slug, short_name, subtitle, category, description, icon_name, banner_url, order_index, tests(count)';
const SUBJECT_COLUMNS = 'id, exam_id, name, slug, icon_name, order_index, chapters(count), tests(count)';
const TOPIC_COLUMNS = 'id, subject_id, name, slug, order_index, tests(count)';
const LIVE_TEST_COLUMNS =
  'id, test_id, title, exam_id, status, start_at, scheduled_start_time, scheduled_end_time, registration_deadline, duration_minutes, total_questions, total_marks, negative_marking, enrolled_count, logo, exam_logo, ranking_enabled, subscription_required, instructions, tests(id, title, exam_id, duration_minutes, total_questions, total_marks, negative_marking, exams(title))';

const TEST_COLUMNS =
  'id, exam_id, subject_id, chapter_id, test_series_id, title, description, test_type, duration_minutes, total_questions, total_marks, passing_marks, negative_marking, is_premium, order_index, created_at, year, paper_name, shift, exam_date, icon_url, is_live_only';

export async function fetchExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select(EXAM_COLUMNS)
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toExam);
}

export async function fetchExam(examId: string): Promise<Exam | null> {
  const { data, error } = await supabase
    .from('exams')
    .select(EXAM_COLUMNS)
    .eq('id', examId)
    .maybeSingle();
  if (error) throw error;
  return data ? toExam(data) : null;
}

export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select(SUBJECT_COLUMNS)
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toSubject);
}

export async function fetchTopics(subjectId?: string | null): Promise<Topic[]> {
  let q = supabase.from('chapters').select(TOPIC_COLUMNS).eq('is_active', true);
  if (subjectId) q = q.eq('subject_id', subjectId);
  const { data, error } = await q.order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTopic);
}

/** Mock tests of an exam (Live Test papers open from the Live Test only). */
export async function fetchExamTests(examId: string): Promise<MockTest[]> {
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('exam_id', examId)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTest).filter((t) => !t.isLiveOnly);
}

/** Every published test (used by PYQ, Search and Practice). */
export async function fetchAllTests(): Promise<MockTest[]> {
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('is_active', true)
    .order('order_index', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTest).filter((t) => !t.isLiveOnly);
}

export async function fetchTopicTests(topicId: string): Promise<MockTest[]> {
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('chapter_id', topicId)
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toTest).filter((t) => !t.isLiveOnly);
}

export async function fetchTest(testId: string): Promise<MockTest | null> {
  const { data, error } = await supabase
    .from('tests')
    .select(TEST_COLUMNS)
    .eq('id', testId)
    .maybeSingle();
  if (error) throw error;
  return data ? toTest(data) : null;
}

function parseDate(v: unknown): Date | null {
  if (!v) return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function toLiveTest(r: LiveTestRow): LiveTest {
  const t: LiveTestParentRow | null =
    r.tests && typeof r.tests === 'object' && !Array.isArray(r.tests) ? r.tests : null;
  const exam: { title?: Text } | null = t?.exams && typeof t.exams === 'object' ? t.exams : null;
  const duration = num(r.duration_minutes) ?? num(t?.duration_minutes) ?? 0;
  const start = parseDate(r.scheduled_start_time ?? r.start_at);
  const end =
    parseDate(r.scheduled_end_time) ?? (start ? new Date(start.getTime() + duration * 60_000) : null);
  return {
    id: String(r.id),
    testId: String(r.test_id ?? t?.id ?? r.id),
    title: r.title ?? t?.title ?? 'Live Mock Test',
    examId: r.exam_id ?? t?.exam_id ?? null,
    examTitle: r.exam_title ?? exam?.title ?? null,
    status: (r.status ?? 'upcoming').toString(),
    startAt: start,
    endAt: end,
    registrationDeadline: parseDate(r.registration_deadline),
    durationMinutes: duration,
    totalQuestions: num(r.total_questions) ?? num(t?.total_questions) ?? 0,
    totalMarks: num(r.total_marks) ?? num(t?.total_marks) ?? 0,
    negativeMarking: num(r.negative_marking) ?? num(t?.negative_marking) ?? 0,
    enrolledCount: num(r.enrolled_count) ?? 0,
    logo: r.logo ?? r.exam_logo ?? null,
    rankingEnabled: r.ranking_enabled !== false,
    subscriptionRequired: r.subscription_required === true,
    instructions: r.instructions ?? null,
  };
}

/** LiveTestModel.isLive */
export function isLiveNow(t: LiveTest, now = new Date()): boolean {
  const s = t.status.toLowerCase();
  if (s === 'cancelled' || s === 'ended' || s === 'completed') return false;
  if (s === 'live') return true;
  if (!t.startAt || !t.endAt) return false;
  return now >= t.startAt && now < t.endAt;
}

/** LiveTestModel.isUpcoming */
export function isUpcoming(t: LiveTest, now = new Date()): boolean {
  if (isLiveNow(t, now)) return false;
  const s = t.status.toLowerCase();
  if (s === 'cancelled' || s === 'ended' || s === 'completed') return false;
  if (!t.startAt) return s === 'upcoming';
  return now < t.startAt;
}

export async function fetchLiveTests(examId?: string | null): Promise<LiveTest[]> {
  let q = supabase
    .from('live_tests')
    .select(LIVE_TEST_COLUMNS)
    .eq('is_published', true);
  if (examId) q = q.eq('exam_id', examId);
  const { data, error } = await q.order('start_at', { ascending: true });
  if (error) throw error;
  const now = new Date();
  // The embed is many-to-one at runtime; the untyped client's parser guesses an array.
  return ((data ?? []) as unknown as LiveTestRow[]).map(toLiveTest).filter((t) => isLiveNow(t, now) || isUpcoming(t, now));
}

/** Home hero banners the admin configured (`hero_banners`; RLS returns only live rows). */
const HERO_BANNER_COLUMNS =
  'id, title, subtitle, badge_text, image_url, mobile_image_url, banner_type, show_text_overlay, ' +
  'primary_cta_text, primary_cta_link, placement, starts_at, expires_at, is_active, display_order';

export async function fetchHomeBanners(): Promise<HeroBanner[]> {
  const { data, error } = await supabase
    .from('hero_banners')
    .select(HERO_BANNER_COLUMNS)
    .order('display_order', { ascending: true });
  if (error) throw error;
  const now = new Date();
  return ((data ?? []) as unknown as HeroBannerRow[])
    .filter((b) => {
      if (b.is_active !== true) return false;
      const placement = (b.placement ?? '').toString().trim() || 'home_hero';
      if (placement !== 'home_hero' && placement !== 'all' && placement !== 'undefined') return false;
      const starts = parseDate(b.starts_at);
      const expires = parseDate(b.expires_at);
      if (starts && starts > now) return false;
      if (expires && expires < now) return false;
      return true;
    })
    .map((b) => ({
      id: String(b.id ?? ''),
      title: b.title ?? '',
      subtitle: b.subtitle ?? null,
      badgeText: b.badge_text ?? null,
      imageUrl: (b.image_url ?? '').toString().trim(),
      mobileImageUrl: b.mobile_image_url || null,
      showTextOverlay: b.show_text_overlay === true || b.banner_type === 'text_overlay',
      ctaText: b.primary_cta_text ?? 'Start Now',
      ctaLink: b.primary_cta_link ?? '/exams',
      displayOrder: num(b.display_order) ?? 1,
    }))
    .filter((b) => b.imageUrl.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function recordBannerClick(bannerId: string): Promise<void> {
  await supabase.rpc('increment_banner_click', { p_banner_id: bannerId });
}
