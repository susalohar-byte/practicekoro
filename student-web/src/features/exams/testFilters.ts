import type { MockTest, Topic } from '@/types/models';

/** One choice in a filter chip row: an id, its label and how many tests match. */
export interface FilterOption {
  id: string;
  label: string;
  count: number;
}

export type ExamStage = 'Prelims' | 'Mains';
export const EXAM_STAGES: ExamStage[] = ['Prelims', 'Mains'];

const PRELIMS_RE = /\bprelim(s|inary|inaries)?\b|প্রিলি/i;
// Mains is also called the Final Written / Final Exam (e.g. WBP Constable).
const MAINS_RE = /\bmains?\b|\bfinal\s+(written|exam)\b|মেইন|মেন্স|ফাইনাল/i;

/** 'Prelims', 'Mains' or null, read from paper_name first, then the title (same rule as the app). */
export function testStage(test: Pick<MockTest, 'paperName' | 'title'>): ExamStage | null {
  for (const text of [test.paperName, test.title]) {
    if (!text?.trim()) continue;
    const prelims = PRELIMS_RE.test(text);
    const mains = MAINS_RE.test(text);
    if (prelims && !mains) return 'Prelims';
    if (mains && !prelims) return 'Mains';
  }
  return null;
}

/** Subject of a test: its own subject_id, else the subject of its topic. */
export function subjectOfTest(test: MockTest, topicsById: Map<string, Topic>): string | null {
  if (test.subjectId) return test.subjectId;
  return (test.chapterId && topicsById.get(test.chapterId)?.subjectId) || null;
}

function countBy(tests: MockTest[], key: (t: MockTest) => string | null): Map<string, number> {
  const counts = new Map<string, number>();
  for (const t of tests) {
    const k = key(t);
    if (k) counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

/** Subjects (in the given order) that have at least one of the tests. */
export function subjectOptions(
  tests: MockTest[],
  topicsById: Map<string, Topic>,
  subjects: { id: string; label: string }[]
): FilterOption[] {
  const counts = countBy(tests, (t) => subjectOfTest(t, topicsById));
  return subjects.filter((s) => counts.has(s.id)).map((s) => ({ ...s, count: counts.get(s.id)! }));
}

/** Topics of one subject (in topic order) that have at least one of the tests. */
export function topicOptions(
  tests: MockTest[],
  subjectId: string,
  topics: Topic[],
  topicsById: Map<string, Topic>
): FilterOption[] {
  const counts = countBy(tests, (t) =>
    t.chapterId && topicsById.has(t.chapterId) && subjectOfTest(t, topicsById) === subjectId ? t.chapterId : null
  );
  return topics
    .filter((topic) => counts.has(topic.id))
    .map((topic) => ({ id: topic.id, label: topic.title, count: counts.get(topic.id)! }));
}

/** Prelims / Mains choices, only when the tests include both stages. */
export function stageOptions(tests: MockTest[]): FilterOption[] {
  const counts = countBy(tests, testStage);
  if (!EXAM_STAGES.every((s) => counts.has(s))) return [];
  return EXAM_STAGES.map((s) => ({ id: s, label: s, count: counts.get(s)! }));
}

/** Tests narrowed by the chosen subject, topic and stage (null = any). */
export function applyTestFilters(
  tests: MockTest[],
  topicsById: Map<string, Topic>,
  filters: { subjectId?: string | null; topicId?: string | null; stage?: string | null }
): MockTest[] {
  return tests.filter(
    (t) =>
      (!filters.subjectId || subjectOfTest(t, topicsById) === filters.subjectId) &&
      (!filters.topicId || t.chapterId === filters.topicId) &&
      (!filters.stage || testStage(t) === filters.stage)
  );
}
