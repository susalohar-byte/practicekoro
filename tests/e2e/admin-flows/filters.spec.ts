import { expect, test } from '@playwright/test';
import { SupabaseStub } from './support/supabaseStub';

const EXAMS = [
  { id: 'exam-wbp', title: 'WBP Constable', slug: 'wbp', category: 'Police' },
  { id: 'exam-wbpsc', title: 'WBPSC Clerkship', slug: 'wbpsc', category: 'PSC' },
  { id: 'exam-tet', title: 'Primary TET', slug: 'tet', category: 'Teaching' },
];
const SUBJECTS = [
  { id: 'subj-history', name: 'History', slug: 'history', is_active: true },
  { id: 'subj-geo', name: 'Geography', slug: 'geography', is_active: true },
];
const CHAPTERS = [
  { id: 'ch-modern', subject_id: 'subj-history', name: 'Modern India', slug: 'modern' },
  { id: 'ch-ancient', subject_id: 'subj-history', name: 'Ancient India', slug: 'ancient' },
  { id: 'ch-rivers', subject_id: 'subj-geo', name: 'Rivers', slug: 'rivers' },
].map((c, i) => ({ ...c, is_active: true, order_index: i + 1, tests: [{ count: 0 }] }));

const subjectName = (id?: string) => SUBJECTS.find((s) => s.id === id)?.name;
const chapterName = (id?: string) => CHAPTERS.find((c) => c.id === id)?.name;
const row = (r: Record<string, any>) => ({
  status: 'published',
  is_active: true,
  total_questions: 10,
  duration_minutes: 10,
  created_at: new Date().toISOString(),
  exams: null,
  test_series: null,
  subjects: r.subject_id ? { name: subjectName(r.subject_id) } : null,
  chapters: r.chapter_id ? { name: chapterName(r.chapter_id) } : null,
  ...r,
});
// Only the WBPSC full mock names an exam on the test row; everything else reaches its exam
// through test_exams (extra exams) or exam_topics (an exam's syllabus topics).
const TESTS = [
  row({
    id: 't-fm-wbpsc',
    title: 'WBPSC Full Mock 01',
    test_type: 'full_mock',
    exam_id: 'exam-wbpsc',
  }),
  row({ id: 't-fm-wbp', title: 'WBP Full Mock 01', test_type: 'full_mock', exam_id: null }),
  row({
    id: 't-modern',
    title: 'Modern India Test 01',
    test_type: 'topic',
    subject_id: 'subj-history',
    chapter_id: 'ch-modern',
  }),
  row({
    id: 't-ancient',
    title: 'Ancient India Test 01',
    test_type: 'topic',
    subject_id: 'subj-history',
    chapter_id: 'ch-ancient',
  }),
  row({
    id: 't-rivers',
    title: 'Rivers Test 01',
    test_type: 'topic',
    subject_id: 'subj-geo',
    chapter_id: 'ch-rivers',
  }),
];

test('exam filter lists every exam and finds tests linked through exam mappings', async ({
  page,
}) => {
  const stub = new SupabaseStub();
  stub.on('rest', 'exams', () => EXAMS);
  stub.on('rest', 'subjects', () => SUBJECTS);
  stub.on('rest', 'chapters', () => CHAPTERS);
  stub.on('rest', 'tests', (call) => (call.method === 'GET' ? TESTS : undefined));
  stub.on('rest', 'test_exams', () => [{ test_id: 't-fm-wbp', exam_id: 'exam-wbp' }]);
  stub.on('rest', 'exam_topics', () => [
    { exam_id: 'exam-wbp', topic_id: 'ch-modern' },
    { exam_id: 'exam-wbp', topic_id: 'ch-rivers' },
    { exam_id: 'exam-wbpsc', topic_id: 'ch-ancient' },
  ]);
  await stub.install(page);
  await page.goto('/admin/mock-tests');

  const exam = page.getByLabel('Exam', { exact: true });
  await expect(exam.locator('option')).toHaveText([
    'All Exams',
    'WBP Constable (3)',
    'WBPSC Clerkship (2)',
    'Primary TET (0)',
  ]);

  const titles = page.getByRole('row').filter({ hasText: /Test 01|Mock 01/ });
  await expect(titles).toHaveCount(5);

  // WBP: its full mock (via test_exams) and the topic tests on its topics (via exam_topics)
  await exam.selectOption('exam-wbp');
  await expect(titles).toHaveCount(3);
  for (const t of ['WBP Full Mock 01', 'Modern India Test 01', 'Rivers Test 01']) {
    await expect(page.getByRole('row').filter({ hasText: t })).toBeVisible();
  }

  // Topic Test tab, WBP, then subject and topic narrow further
  await page.getByRole('button', { name: /^Topic Test/ }).click();
  await expect(titles).toHaveCount(2);
  const subject = page.getByLabel('Subject', { exact: true });
  await expect(subject.locator('option')).toHaveText([
    'All Subjects',
    'History (1)',
    'Geography (1)',
  ]);
  await subject.selectOption('subj-history');
  await expect(page.getByLabel('Topic', { exact: true }).locator('option')).toHaveText([
    'All Topics',
    'Modern India (1)',
  ]);
  await expect(titles).toHaveCount(1);
  await expect(page.getByRole('row').filter({ hasText: 'Modern India Test 01' })).toBeVisible();

  // Switching exam clears the subject and shows that exam's topic tests
  await exam.selectOption('exam-wbpsc');
  await expect(subject).toHaveValue('');
  await expect(titles).toHaveCount(1);
  await expect(page.getByRole('row').filter({ hasText: 'Ancient India Test 01' })).toBeVisible();
});
