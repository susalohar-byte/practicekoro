import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { readCompleteQuery } from '@/services/domains/admin.reporting';

/**
 * Relationship layer between existing content records (migration 20261012100000):
 *  - exam_subjects / exam_topics: which existing Subjects and Topics an exam covers.
 *  - test_series_tests: which existing tests a Test Series contains, in display order.
 * These functions never create or delete Subjects, Topics, Tests or Questions.
 */

export interface ExamCurriculum {
  subjectIds: string[];
  topicIds: string[];
}

export interface SeriesMembership {
  seriesId: string;
  testId: string;
  orderIndex: number;
}

/** Minimal shapes so the pure helpers stay testable without the full models. */
export interface CompatSeries {
  examId?: string | null;
}
export interface CompatTest {
  title: string;
  testType: string;
  examId?: string | null;
  associatedExamIds?: string[];
}

export const TEST_TYPE_LABELS: Record<string, string> = {
  full_mock: 'Full Mock',
  pyq: 'Official PYQ',
  topic: 'Topic Test',
  chapter_mock: 'Topic Test (legacy)',
  subject_mock: 'Subject Test (legacy)',
};

function requireDatabase() {
  if (!isSupabaseConfigured)
    throw new Error('Connect to the database to save content assignments.');
}

/**
 * Mirrors public.series_test_incompatibility(): a series that targets an exam accepts Full
 * Mocks and Official PYQs only when they are linked to that exam. Topic Tests are always
 * accepted because they are exam-independent. Returns null when compatible.
 */
export function seriesTestIncompatibility(series: CompatSeries, test: CompatTest): string | null {
  if (!series.examId) return null;
  if (test.testType !== 'full_mock' && test.testType !== 'pyq') return null;
  if (test.examId === series.examId) return null;
  if (test.associatedExamIds?.includes(series.examId)) return null;
  return `${TEST_TYPE_LABELS[test.testType]} for a different exam than this series targets`;
}

/** Drops topics whose parent subject is no longer selected (mirrors the DB parent rule). */
export function pruneTopicsToSubjects(
  topicIds: string[],
  subjectIds: string[],
  topics: { id: string; subjectId: string }[]
): string[] {
  const subjects = new Set(subjectIds);
  const parent = new Map(topics.map((t) => [t.id, t.subjectId]));
  return topicIds.filter((id) => subjects.has(parent.get(id) ?? ''));
}

export async function getExamCurriculum(examId: string): Promise<ExamCurriculum> {
  if (!isSupabaseConfigured || !examId) return { subjectIds: [], topicIds: [] };
  const [subjects, topics] = await Promise.all([
    supabase.from('exam_subjects').select('subject_id').eq('exam_id', examId).order('order_index'),
    supabase.from('exam_topics').select('topic_id').eq('exam_id', examId).order('order_index'),
  ]);
  const error = subjects.error || topics.error;
  if (error) throw new Error(error.message);
  return {
    subjectIds: (subjects.data ?? []).map((r: { subject_id: string }) => r.subject_id),
    topicIds: (topics.data ?? []).map((r: { topic_id: string }) => r.topic_id),
  };
}

/** Every exam's assignments in two paged reads (avoids one request per exam in lists). */
export async function getAllExamCurricula(): Promise<Record<string, ExamCurriculum>> {
  if (!isSupabaseConfigured) return {};
  const [subjects, topics] = await Promise.all([
    readCompleteQuery(() =>
      supabase
        .from('exam_subjects')
        .select('exam_id,subject_id', { count: 'exact' })
        .order('exam_id')
        .order('order_index')
        .order('subject_id')
    ),
    readCompleteQuery(() =>
      supabase
        .from('exam_topics')
        .select('exam_id,topic_id', { count: 'exact' })
        .order('exam_id')
        .order('order_index')
        .order('topic_id')
    ),
  ]);
  const map: Record<string, ExamCurriculum> = {};
  const entry = (examId: string) => (map[examId] ??= { subjectIds: [], topicIds: [] });
  for (const r of subjects as { exam_id: string; subject_id: string }[])
    entry(r.exam_id).subjectIds.push(r.subject_id);
  for (const r of topics as { exam_id: string; topic_id: string }[])
    entry(r.exam_id).topicIds.push(r.topic_id);
  return map;
}

/** Atomically replaces an exam's subject and topic assignments. */
export async function saveExamCurriculum(
  examId: string,
  subjectIds: string[],
  topicIds: string[]
): Promise<{ subjectCount: number; topicCount: number }> {
  requireDatabase();
  const { data, error } = await supabase.rpc('admin_save_exam_curriculum', {
    p_exam_id: examId,
    p_subject_ids: subjectIds,
    p_topic_ids: topicIds,
  });
  if (error) throw new Error(error.message);
  if (
    data?.success !== true ||
    data.subject_count !== subjectIds.length ||
    data.topic_count !== topicIds.length
  )
    throw new Error('The subject and topic assignments were not confirmed.');
  return { subjectCount: data.subject_count, topicCount: data.topic_count };
}

/** Ordered test IDs of one series. */
export async function getSeriesTestIds(seriesId: string): Promise<string[]> {
  if (!isSupabaseConfigured || !seriesId) return [];
  const { data, error } = await supabase
    .from('test_series_tests')
    .select('test_id')
    .eq('series_id', seriesId)
    .order('order_index')
    .order('test_id');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { test_id: string }) => r.test_id);
}

/** Every membership row, for series counts and "already in N series" indicators. */
export async function getSeriesMemberships(): Promise<SeriesMembership[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('test_series_tests')
    .select('series_id,test_id,order_index')
    .order('series_id')
    .order('order_index');
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: { series_id: string; test_id: string; order_index: number }) => ({
    seriesId: r.series_id,
    testId: r.test_id,
    orderIndex: r.order_index,
  }));
}

/** Replaces a series' test list: adds, removes and reorders in one call. Tests are never deleted. */
export async function saveSeriesTests(seriesId: string, testIds: string[]): Promise<number> {
  requireDatabase();
  if (new Set(testIds).size !== testIds.length)
    throw new Error('A test can appear only once in a series.');
  const { data, error } = await supabase.rpc('admin_set_series_tests', {
    p_series_id: seriesId,
    p_test_ids: testIds,
  });
  if (error) throw new Error(error.message);
  if (data?.success !== true || data.test_count !== testIds.length)
    throw new Error('The series test list was not confirmed.');
  return data.test_count;
}

export const adminContentLinksApi = {
  getExamCurriculum,
  getAllExamCurricula,
  saveExamCurriculum,
  getSeriesTestIds,
  getSeriesMemberships,
  saveSeriesTests,
};
