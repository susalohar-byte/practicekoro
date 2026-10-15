import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import { readCompleteQuery } from './admin.reporting';
import type { MockTest } from '@/types';

/**
 * Exam-centric mappings (Admin Panel).
 *
 * An Exam owns no copies of subjects, topics or tests. It only points at central records:
 *   exam_subjects (exam -> subject), exam_topics (exam -> topic/chapter),
 *   tests.exam_id (primary exam) and test_exams (extra exam associations).
 * Removing a mapping never deletes the underlying Subject, Topic or Test.
 */

export interface ExamSubjectTopicMapping {
  subjectIds: string[];
  topicIds: string[];
  /** false until migration 20261016090000 is applied (subject-only picks are then derived). */
  subjectMappingAvailable: boolean;
}

export type RelatedTestLink = 'primary_exam' | 'exam_association' | 'mapped_topic';

export interface ExamRelatedTest {
  id: string;
  title: string;
  testType: MockTest['testType'];
  status: MockTest['status'];
  totalQuestions: number;
  durationMinutes: number;
  year?: number;
  paperName?: string;
  setName?: string;
  subjectId?: string;
  chapterId?: string;
  subjectName?: string;
  chapterName?: string;
  linkedVia: RelatedTestLink;
}

const isMissingRelation = (error: { code?: string; message?: string } | null) =>
  !!error &&
  (error.code === '42P01' ||
    error.code === 'PGRST205' ||
    /relation .*exam_subjects.* does not exist|could not find the table/i.test(
      error.message || ''
    ));

const isMissingFunction = (error: { code?: string; message?: string } | null) =>
  !!error &&
  (error.code === 'PGRST202' ||
    error.code === '42883' ||
    /could not find the function|function .* does not exist/i.test(error.message || ''));

export async function getExamSubjectTopicMappings(
  examId: string
): Promise<ExamSubjectTopicMapping> {
  if (!isSupabaseConfigured) return { subjectIds: [], topicIds: [], subjectMappingAvailable: true };

  // Errors propagate: an empty list would read as "nothing mapped" and the next save
  // would wipe the real mappings.
  const topicRes = await supabase
    .from('exam_topics')
    .select('topic_id, chapters:topic_id (subject_id)')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });
  if (topicRes.error)
    throw new Error(topicRes.error.message || 'Topic mappings could not be loaded.');
  const topicRows = (topicRes.data || []) as unknown as {
    topic_id: string;
    chapters: { subject_id: string } | null;
  }[];
  const topicIds = topicRows.map((r) => r.topic_id);

  const subjectRes = await supabase
    .from('exam_subjects')
    .select('subject_id')
    .eq('exam_id', examId)
    .order('order_index', { ascending: true });

  if (subjectRes.error && !isMissingRelation(subjectRes.error)) {
    throw new Error(subjectRes.error.message || 'Subject mappings could not be loaded.');
  }

  const subjectIds = new Set<string>(
    subjectRes.error ? [] : (subjectRes.data || []).map((r: { subject_id: string }) => r.subject_id)
  );
  // Parent subjects of mapped topics are always considered selected.
  for (const row of topicRows)
    if (row.chapters?.subject_id) subjectIds.add(row.chapters.subject_id);

  return {
    subjectIds: [...subjectIds],
    topicIds,
    subjectMappingAvailable: !subjectRes.error,
  };
}

export async function saveExamSubjectTopicMappings(
  examId: string,
  subjectIds: string[],
  topicIds: string[]
): Promise<{
  success: true;
  subjectCount: number;
  topicCount: number;
  subjectsPersisted: boolean;
}> {
  const subjects = [...new Set(subjectIds)];
  const topics = [...new Set(topicIds)];
  if (!isSupabaseConfigured)
    return {
      success: true,
      subjectCount: subjects.length,
      topicCount: topics.length,
      subjectsPersisted: true,
    };

  const { data, error } = await supabase.rpc('admin_save_exam_subject_topics', {
    p_exam_id: examId,
    p_subject_ids: subjects,
    p_topic_ids: topics,
  });

  if (error && isMissingFunction(error)) {
    // Migration not applied yet: fall back to the existing topic-only RPC. Subjects are
    // then implied by their mapped topics.
    const legacy = await supabase.rpc('admin_save_exam_topics', {
      p_exam_id: examId,
      p_topic_ids: topics,
    });
    if (legacy.error) throw new Error(legacy.error.message);
    if (legacy.data?.success !== true || legacy.data.saved_count !== topics.length)
      throw new Error('Topic mapping save was not confirmed.');
    return {
      success: true,
      subjectCount: subjects.length,
      topicCount: topics.length,
      subjectsPersisted: false,
    };
  }
  if (error) throw new Error(error.message);
  if (
    data?.success !== true ||
    data.subject_count !== subjects.length ||
    data.topic_count !== topics.length
  )
    throw new Error('Exam mapping save was not confirmed.');
  return {
    success: true,
    subjectCount: subjects.length,
    topicCount: topics.length,
    subjectsPersisted: true,
  };
}

type TestRow = {
  id: string;
  title: string;
  test_type: MockTest['testType'];
  status: MockTest['status'] | null;
  is_active: boolean | null;
  total_questions: number | null;
  duration_minutes: number | null;
  year: number | null;
  paper_name: string | null;
  set_name: string | null;
  exam_id: string | null;
  subject_id: string | null;
  chapter_id: string | null;
  subjects: { name: string } | null;
  chapters: { name: string } | null;
};

const TEST_COLUMNS =
  'id, title, test_type, status, is_active, total_questions, duration_minutes, year, paper_name, set_name, exam_id, subject_id, chapter_id, subjects:subject_id (name), chapters:chapter_id (name)';

/**
 * Central tests related to an exam: Full Mocks / PYQs via tests.exam_id or test_exams, and
 * Topic Tests reachable through the exam's mapped topics. Read-only references, no copies.
 */
export async function getExamRelatedTests(examId: string): Promise<ExamRelatedTest[]> {
  if (!isSupabaseConfigured) return [];

  const [primary, assoc, mappedTopics] = await Promise.all([
    readCompleteQuery(() =>
      supabase
        .from('tests')
        .select(TEST_COLUMNS, { count: 'exact' })
        .eq('exam_id', examId)
        .order('id', { ascending: true })
    ) as Promise<TestRow[]>,
    readCompleteQuery(() =>
      supabase
        .from('test_exams')
        .select('test_id', { count: 'exact' })
        .eq('exam_id', examId)
        .order('test_id', { ascending: true })
    ) as Promise<{ test_id: string }[]>,
    readCompleteQuery(() =>
      supabase
        .from('exam_topics')
        .select('topic_id', { count: 'exact' })
        .eq('exam_id', examId)
        .order('topic_id', { ascending: true })
    ) as Promise<{ topic_id: string }[]>,
  ]);

  const result = new Map<string, ExamRelatedTest>();
  const add = (row: TestRow, linkedVia: RelatedTestLink) => {
    if (result.has(row.id)) return;
    result.set(row.id, {
      id: row.id,
      title: row.title,
      testType: row.test_type,
      status: row.status || (row.is_active ? 'published' : 'draft'),
      totalQuestions: row.total_questions ?? 0,
      durationMinutes: row.duration_minutes ?? 0,
      year: row.year ?? undefined,
      paperName: row.paper_name ?? undefined,
      setName: row.set_name ?? undefined,
      subjectId: row.subject_id ?? undefined,
      chapterId: row.chapter_id ?? undefined,
      subjectName: row.subjects?.name,
      chapterName: row.chapters?.name,
      linkedVia,
    });
  };
  primary.forEach((row) => add(row, 'primary_exam'));

  const assocIds = assoc.map((r) => r.test_id).filter((id) => !result.has(id));
  const topicIds = mappedTopics.map((r) => r.topic_id);

  // PostgREST `in` filters go in the URL, so batch them.
  const BATCH = 150;
  const fetchIn = async (column: 'id' | 'chapter_id', ids: string[]) => {
    const rows: TestRow[] = [];
    for (let i = 0; i < ids.length; i += BATCH) {
      const slice = ids.slice(i, i + BATCH);
      const page = (await readCompleteQuery(() => {
        let q = supabase.from('tests').select(TEST_COLUMNS, { count: 'exact' }).in(column, slice);
        if (column === 'chapter_id') q = q.in('test_type', ['topic', 'chapter_mock']);
        return q.order('id', { ascending: true });
      })) as TestRow[];
      rows.push(...page);
    }
    return rows;
  };

  (await fetchIn('id', assocIds)).forEach((row) => add(row, 'exam_association'));
  (await fetchIn('chapter_id', topicIds)).forEach((row) => add(row, 'mapped_topic'));

  return [...result.values()];
}

/** Per-exam counts of mapped subjects and topics for the Exams list. */
export async function getExamMappingCounts(): Promise<
  Record<string, { subjects: number; topics: number }>
> {
  if (!isSupabaseConfigured) return {};
  const topics = (await readCompleteQuery(() =>
    supabase
      .from('exam_topics')
      .select('id, exam_id, chapters:topic_id (subject_id)', { count: 'exact' })
      .order('id', { ascending: true })
  )) as unknown as { exam_id: string; chapters: { subject_id: string } | null }[];

  let subjectRows: { exam_id: string; subject_id: string }[] = [];
  try {
    subjectRows = (await readCompleteQuery(() =>
      supabase
        .from('exam_subjects')
        .select('id, exam_id, subject_id', { count: 'exact' })
        .order('id', { ascending: true })
    )) as { exam_id: string; subject_id: string }[];
  } catch (error) {
    if (!isMissingRelation({ message: (error as Error).message })) throw error;
  }

  const subjects = new Map<string, Set<string>>();
  const addSubject = (examId: string, subjectId?: string | null) => {
    if (!subjectId) return;
    if (!subjects.has(examId)) subjects.set(examId, new Set());
    subjects.get(examId)!.add(subjectId);
  };
  subjectRows.forEach((r) => addSubject(r.exam_id, r.subject_id));
  const counts: Record<string, { subjects: number; topics: number }> = {};
  for (const row of topics) {
    addSubject(row.exam_id, row.chapters?.subject_id);
    counts[row.exam_id] = counts[row.exam_id] || { subjects: 0, topics: 0 };
    counts[row.exam_id].topics += 1;
  }
  for (const [examId, set] of subjects) {
    counts[examId] = counts[examId] || { subjects: 0, topics: 0 };
    counts[examId].subjects = set.size;
  }
  return counts;
}

export const adminExamMappingsApi = {
  getExamMappingCounts,
  getExamSubjectTopicMappings,
  saveExamSubjectTopicMappings,
  getExamRelatedTests,
};
