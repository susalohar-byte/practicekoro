import { supabase } from '@/lib/supabase';
import { num } from '@/lib/format';
import type { Exam, HeroBanner, LiveTest, MockTest, Subject, Topic } from '@/types/models';

// Catalog reads mirror CatalogRepository in the Flutter app, without its offline sample
// catalog: the web panel shows only what the admin has published.

type Row = Record<string, any>;

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

export function toExam(r: Row): Exam {
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

export function toSubject(r: Row): Subject {
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
export function toTopic(r: Row): Topic {
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

export function toTest(r: Row): MockTest {
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

const TEST_COLUMNS =
  'id, exam_id, subject_id, chapter_id, test_series_id, title, description, test_type, duration_minutes, total_questions, total_marks, passing_marks, negative_marking, is_premium, order_index, created_at, year, paper_name, shift, exam_date, icon_url, is_live_only';

export async function fetchExams(): Promise<Exam[]> {
  const { data, error } = await supabase
    .from('exams')
    .select('*, tests(count)')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toExam);
}

export async function fetchExam(examId: string): Promise<Exam | null> {
  const { data, error } = await supabase
    .from('exams')
    .select('*, tests(count)')
    .eq('id', examId)
    .maybeSingle();
  if (error) throw error;
  return data ? toExam(data) : null;
}

export async function fetchSubjects(): Promise<Subject[]> {
  const { data, error } = await supabase
    .from('subjects')
    .select('*, chapters(count), tests(count)')
    .eq('is_active', true)
    .order('order_index', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toSubject);
}

export async function fetchTopics(subjectId?: string | null): Promise<Topic[]> {
  let q = supabase.from('chapters').select('*, tests(count)').eq('is_active', true);
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

export function toLiveTest(r: Row): LiveTest {
  const t: Row | null = r.tests && typeof r.tests === 'object' && !Array.isArray(r.tests) ? r.tests : null;
  const exam: Row | null = t?.exams && typeof t.exams === 'object' ? t.exams : null;
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
    .select('*, tests(id, title, exam_id, duration_minutes, total_questions, total_marks, negative_marking, exams(title))')
    .eq('is_published', true);
  if (examId) q = q.eq('exam_id', examId);
  const { data, error } = await q.order('start_at', { ascending: true });
  if (error) throw error;
  const now = new Date();
  return (data ?? []).map(toLiveTest).filter((t) => isLiveNow(t, now) || isUpcoming(t, now));
}

/** Home hero banners the admin configured (app_settings.banners_hero_list). */
export async function fetchHomeBanners(): Promise<HeroBanner[]> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('id', 'banners_hero_list')
    .maybeSingle();
  if (error) throw error;
  let list: unknown = data?.value;
  if (typeof list === 'string') {
    try {
      list = JSON.parse(list);
    } catch {
      list = [];
    }
  }
  if (!Array.isArray(list)) return [];
  const now = new Date();
  return list
    .filter((b): b is Row => !!b && typeof b === 'object')
    .filter((b) => {
      const active = b.isActive ?? b.is_active ?? true;
      if (active !== true) return false;
      const placement = (b.placement ?? '').toString().trim() || 'home_hero';
      if (placement !== 'home_hero' && placement !== 'all' && placement !== 'undefined') return false;
      const starts = parseDate(b.startsAt ?? b.starts_at);
      const expires = parseDate(b.expiresAt ?? b.expires_at);
      if (starts && starts > now) return false;
      if (expires && expires < now) return false;
      return true;
    })
    .map((b) => ({
      id: String(b.id ?? ''),
      title: b.title ?? '',
      subtitle: b.subtitle ?? null,
      badgeText: b.badgeText ?? b.badge_text ?? null,
      imageUrl: (b.imageUrl ?? b.image_url ?? '').toString().trim(),
      mobileImageUrl: (b.mobileImageUrl ?? b.mobile_image_url ?? null) || null,
      showTextOverlay:
        b.showTextOverlay === true || b.show_text_overlay === true || b.bannerType === 'text_overlay',
      ctaText: b.primaryCtaText ?? b.primary_cta_text ?? 'Start Now',
      ctaLink: b.primaryCtaLink ?? b.primary_cta_link ?? '/exams',
      displayOrder: num(b.displayOrder ?? b.display_order) ?? 1,
    }))
    .filter((b) => b.imageUrl.length > 0)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export async function recordBannerClick(bannerId: string): Promise<void> {
  await supabase.rpc('increment_banner_click', { p_banner_id: bannerId });
}
