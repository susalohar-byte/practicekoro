import { expect, test } from '@playwright/test';
import { SupabaseStub, eqFilter } from './support/supabaseStub';

const TEST_ID = 'test-wbp-full-mock-01';
const fullMockRow = {
  id: TEST_ID,
  title: 'WBP Full Mock 01',
  slug: 'wbp-full-mock-01',
  test_type: 'full_mock',
  exam_id: 'exam-wbp',
  subject_id: null,
  chapter_id: null,
  duration_minutes: 90,
  total_questions: 0,
  total_marks: 0,
  passing_marks: 0,
  negative_marking: 0.25,
  is_premium: false,
  is_active: false,
  status: 'draft',
  exams: { title: 'WBP Constable' },
  subjects: null,
  chapters: null,
  test_series: null,
};

/** Question 2 has a free-text answer ("Answer: Kerala"), which must never become option A. */
const TXT_FIXTURE = `1. Who chaired the Drafting Committee of the Constitution?
(a) Jawaharlal Nehru
(b) B. R. Ambedkar
(c) Rajendra Prasad
(d) Sardar Patel
Answer: (b)
Explanation:
B. R. Ambedkar was the chairman.
1947: Committee formed.

2. Which Indian state has the highest literacy rate?
(a) Kerala
(b) Bihar
(c) Goa
(d) Mizoram
Answer: Kerala

3. 2 + 2 = ?
(a) 3
(b) 4
(c) 5
(d) 6
Answer: (b)`;

test.describe('Question and test imports', () => {
  test('TXT import keeps explanations intact, skips free-text answers and reports link failures', async ({
    page,
  }) => {
    const stub = new SupabaseStub();
    let questionSeq = 0;
    stub.on('rest', 'tests', (call) =>
      call.method === 'GET' && eqFilter(call, 'id') === TEST_ID ? [fullMockRow] : undefined
    );
    stub.on('rest', 'live_tests', () => []);
    stub.on('rest', 'questions', (call) => {
      if (call.method !== 'POST') return undefined;
      questionSeq += 1;
      return [
        { ...call.body, id: `q-imported-${questionSeq}`, created_at: '2026-10-16T00:00:00Z' },
      ];
    });
    stub.on('rest', 'test_questions', (call) => {
      if (call.method === 'POST' && call.body?.question_id === 'q-imported-2') {
        return {
          status: 400,
          body: { code: '23503', message: 'insert violates foreign key constraint', details: null },
        };
      }
      return undefined;
    });
    stub.on('rpc', 'admin_delete_record', (call) => ({
      success: true,
      deleted_id: call.body.p_id,
    }));
    await stub.install(page);

    await page.goto(`/admin/tests/${TEST_ID}/questions`);
    await page.getByRole('button', { name: '+ Bulk Add (TXT)' }).click();
    await page.getByPlaceholder(/ভারতের প্রথম রাষ্ট্রপতি/).fill(TXT_FIXTURE);

    // Three blocks detected; the "Answer: Kerala" block is invalid and is not offered for import.
    await expect(page.getByText('Valid: 2')).toBeVisible();
    await page.getByRole('button', { name: 'Import & Attach 2 Questions' }).click();

    // The failed link is surfaced to the admin (the per-row summary is covered below).
    await expect(
      page.getByText(/Question could not be assigned to the test: insert violates foreign key/)
    ).toBeVisible();
    await expect(page.getByText(/Successfully imported/)).toHaveCount(0);

    const created = stub.callsTo('rest', 'questions').filter((c) => c.method === 'POST');
    expect(created).toHaveLength(2);
    expect(created[0].body).toMatchObject({
      option_a: 'Jawaharlal Nehru',
      option_b: 'B. R. Ambedkar',
      option_c: 'Rajendra Prasad',
      option_d: 'Sardar Patel',
      correct_option: 'B',
    });
    expect(created[0].body.explanation).toContain('B. R. Ambedkar was the chairman.');
    expect(created[0].body.explanation).toContain('1947: Committee formed.');
    expect(created[1].body).toMatchObject({ option_b: '4', correct_option: 'B' });
    expect(created.some((c) => /literacy/.test(c.body.question_text))).toBe(false);

    // The question whose link failed is removed again so a retry cannot duplicate it.
    const deletes = stub.callsTo('rpc', 'admin_delete_record');
    expect(deletes.map((c) => c.body)).toEqual([{ p_table: 'questions', p_id: 'q-imported-2' }]);
  });

  // App bug, found by this spec: `api` wraps createQuestionForTest in withMutationConfirmation
  // (src/services/domains/admin.mutations.ts), which turns its `{ success: false }` into a thrown
  // error in production. handleImportBulk (src/pages/admin/AdminTestQuestions.tsx) therefore
  // stops at the first failed row, never tries the remaining rows and never shows its
  // "Imported X of Y … N failed" summary. Unskip once the per-row loop catches row errors.
  test('TXT import continues after a failed row and reports a per-row summary', async ({
    page,
  }) => {
    const stub = new SupabaseStub();
    let questionSeq = 0;
    stub.on('rest', 'tests', (call) =>
      call.method === 'GET' && eqFilter(call, 'id') === TEST_ID ? [fullMockRow] : undefined
    );
    stub.on('rest', 'live_tests', () => []);
    stub.on('rest', 'questions', (call) => {
      if (call.method !== 'POST') return undefined;
      questionSeq += 1;
      return [{ ...call.body, id: `q-imported-${questionSeq}` }];
    });
    stub.on('rest', 'test_questions', (call) =>
      call.method === 'POST' && call.body?.question_id === 'q-imported-1'
        ? {
            status: 400,
            body: { code: '23503', message: 'insert violates foreign key constraint' },
          }
        : undefined
    );
    stub.on('rpc', 'admin_delete_record', (call) => ({
      success: true,
      deleted_id: call.body.p_id,
    }));
    await stub.install(page);

    await page.goto(`/admin/tests/${TEST_ID}/questions`);
    await page.getByRole('button', { name: '+ Bulk Add (TXT)' }).click();
    await page.getByPlaceholder(/ভারতের প্রথম রাষ্ট্রপতি/).fill(TXT_FIXTURE);
    await page.getByRole('button', { name: 'Import & Attach 2 Questions' }).click();

    await expect(
      page.getByText(/Imported 1 of 2 questions\. 1 failed — Question #1/)
    ).toBeVisible();
    expect(stub.callsTo('rest', 'questions').filter((c) => c.method === 'POST')).toHaveLength(2);
  });

  test('a BOM-prefixed Excel CSV of mock tests imports every row as a draft', async ({ page }) => {
    const stub = new SupabaseStub();
    stub.on('rest', 'exams', () => [
      { id: 'exam-wbp', title: 'WBP Constable', slug: 'wbp', category: 'Police' },
    ]);
    stub.on('rest', 'subjects', () => [
      { id: 'subj-sci', name: 'General Science', slug: 'science', is_active: true },
      { id: 'subj-geo', name: 'Geography', slug: 'geography', is_active: true },
    ]);
    stub.on('rest', 'chapters', () => [
      // Same topic name under two subjects: the row's subject decides which one is used.
      { id: 'chap-geo-heat', subject_id: 'subj-geo', name: 'Heat', slug: 'heat-geo', tests: [] },
      { id: 'chap-sci-heat', subject_id: 'subj-sci', name: 'Heat', slug: 'heat-sci', tests: [] },
    ]);
    stub.on('rest', 'test_exams', () => []);
    stub.on('rest', 'tests', (call) => (call.method === 'GET' ? [] : undefined));
    stub.on('rpc', 'admin_save_test_exams', (call) => ({
      success: true,
      saved_count: call.body.p_exam_ids.length,
    }));
    await stub.install(page);

    const csv =
      '﻿title,testType,examName,subjectName,topicName,durationMinutes,totalMarks,passingMarks,negativeMarking,status,isPremium\r\n' +
      '"WBP Full Mock 07, Set A",full_mock,WBP Constable,,,90,100,40,0.25,published,false\r\n' +
      'Heat Topic Test,topic,,General Science,Heat,30,25,10,0.25,published,true\r\n';

    await page.goto('/admin/mock-tests');
    await page.getByRole('button', { name: 'Import Tests' }).click();
    await page.locator('input[type="file"][accept=".csv"]').setInputFiles({
      name: 'tests-excel.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from(csv, 'utf8'),
    });
    await page.getByRole('button', { name: 'Upload & Import' }).click();

    await expect(page.getByText(/Successfully imported 2 mock tests as drafts/)).toBeVisible();
    const inserts = stub.callsTo('rest', 'tests').filter((c) => c.method === 'POST');
    expect(inserts.map((c) => c.body)).toEqual([
      expect.objectContaining({
        title: 'WBP Full Mock 07, Set A',
        test_type: 'full_mock',
        exam_id: 'exam-wbp',
        status: 'draft',
      }),
      expect.objectContaining({
        title: 'Heat Topic Test',
        test_type: 'topic',
        subject_id: 'subj-sci',
        chapter_id: 'chap-sci-heat',
        status: 'draft',
        is_premium: true,
      }),
    ]);
    expect(stub.callsTo('rpc', 'admin_save_test_exams').map((c) => c.body)).toEqual([
      { p_test_id: inserts[0].body.id, p_exam_ids: ['exam-wbp'] },
    ]);
  });
});
