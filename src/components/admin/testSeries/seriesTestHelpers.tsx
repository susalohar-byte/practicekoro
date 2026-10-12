import type { MockTest } from '@/types';
import { TEST_TYPE_LABELS } from '@/services/domains/admin.contentLinks';
import { cn } from '@/lib/utils';

export type TestTypeFilter = 'all' | 'full_mock' | 'topic' | 'pyq';
export type ExamOption = { id: string; title: string };

/** Full Mock / Official PYQ / Topic Test; legacy chapter/subject mocks count as Topic Tests. */
export function testKind(test: Pick<MockTest, 'testType'>): Exclude<TestTypeFilter, 'all'> {
  if (test.testType === 'full_mock') return 'full_mock';
  if (test.testType === 'pyq') return 'pyq';
  return 'topic';
}

export function testTypeLabel(test: Pick<MockTest, 'testType'>): string {
  if (test.testType === 'subject_mock') return 'Topic Test (legacy)';
  return TEST_TYPE_LABELS[test.testType] ?? 'Topic Test (legacy)';
}

/** Every exam a test is linked to (primary exam first, then test_exams links). */
export function testExamIds(test: Pick<MockTest, 'examId' | 'associatedExamIds'>): string[] {
  const ids = [test.examId, ...(test.associatedExamIds ?? [])].filter(Boolean) as string[];
  return Array.from(new Set(ids));
}

export function testExamLabel(test: MockTest, examTitles: Map<string, string>): string {
  const ids = testExamIds(test);
  if (ids.length === 0) return testKind(test) === 'topic' ? 'Exam-independent' : 'No exam linked';
  const first = test.examTitle || examTitles.get(ids[0]) || ids[0];
  return ids.length > 1 ? `${first} +${ids.length - 1}` : first;
}

export function testSubjectTopic(test: MockTest): string {
  const topic = test.topicName || test.chapterName;
  if (test.subjectName && topic) return `${test.subjectName} › ${topic}`;
  return test.subjectName || topic || '';
}

export function TestStatusBadge({ status }: { status: MockTest['status'] }) {
  const label = status === 'published' ? 'Published' : status === 'archived' ? 'Archived' : 'Draft';
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap',
        status === 'published' &&
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
        status === 'archived' &&
          'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        status !== 'published' &&
          status !== 'archived' &&
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800'
      )}
    >
      {label}
    </span>
  );
}

export function TestTypeBadge({ test }: { test: Pick<MockTest, 'testType'> }) {
  const kind = testKind(test);
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded text-[10px] font-black whitespace-nowrap',
        kind === 'full_mock' && 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300',
        kind === 'pyq' && 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300',
        kind === 'topic' &&
          'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
      )}
    >
      {testTypeLabel(test)}
    </span>
  );
}
