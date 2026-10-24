import { expect, test } from '@playwright/test';
import { SupabaseStub, eqFilter } from './support/supabaseStub';

const TEST_ID = 'test-wbp-live-mock';
const LOCK_MESSAGE =
  'Questions are locked while this test is part of an upcoming or live Live Test';

const testRow = {
  id: TEST_ID,
  title: 'WBP Live Mock',
  slug: 'wbp-live-mock',
  test_type: 'full_mock',
  exam_id: 'exam-wbp',
  subject_id: null,
  chapter_id: null,
  duration_minutes: 90,
  total_questions: 1,
  total_marks: 1,
  passing_marks: 0,
  negative_marking: 0.25,
  is_premium: false,
  is_active: true,
  status: 'published',
  exams: { title: 'WBP Constable' },
  subjects: null,
  chapters: null,
  test_series: null,
};

const assignedQuestion = {
  question_id: 'q-assigned-1',
  question_order: 1,
  marks: 1,
  negative_marks: 0,
  questions: {
    id: 'q-assigned-1',
    question_text: 'Capital of West Bengal?',
    option_a: 'Kolkata',
    option_b: 'Siliguri',
    option_c: 'Durgapur',
    option_d: 'Asansol',
    correct_option: 'A',
    subjects: null,
    chapters: null,
  },
};

const pgError = (message: string, code = '55006') => ({
  status: 400,
  body: { code, message, details: null, hint: null },
});

/** The page was opened before the test became live, so the client still thinks it is unlocked. */
function stubStaleUnlockedPage(stub: SupabaseStub) {
  stub.on('rest', 'tests', (call) =>
    call.method === 'GET' && eqFilter(call, 'id') === TEST_ID ? [testRow] : undefined
  );
  stub.on('rest', 'live_tests', () => []);
  stub.on('rest', 'test_questions', (call) => {
    if (call.method === 'GET' && eqFilter(call, 'test_id') === TEST_ID) return [assignedQuestion];
    // Server-side trigger (content_integrity_guards) rejects any direct link change.
    if (call.method !== 'GET') return pgError(LOCK_MESSAGE);
    return undefined;
  });
  stub.on('rpc', 'save_test_questions', () => pgError(LOCK_MESSAGE));
}

test.describe('Live test question lock', () => {
  test('removing a question is refused by the server and the error is shown', async ({ page }) => {
    const stub = new SupabaseStub();
    stubStaleUnlockedPage(stub);
    await stub.install(page);

    await page.goto(`/admin/tests/${TEST_ID}/questions`);
    await expect(page.getByText('Capital of West Bengal?')).toBeVisible();
    await page.getByRole('button', { name: 'Remove' }).first().click();

    await expect(page.getByText(LOCK_MESSAGE)).toBeVisible();
    expect(stub.callsTo('rpc', 'save_test_questions')).toHaveLength(1);
    await expect(page.getByText('Question removed from test.')).toHaveCount(0);
    await expect(page.getByText('Capital of West Bengal?')).toBeVisible();
  });

  test('adding questions is refused by the server, reported, and the orphan is cleaned up', async ({
    page,
  }) => {
    const stub = new SupabaseStub();
    stubStaleUnlockedPage(stub);
    stub.on('rest', 'questions', (call) =>
      call.method === 'POST' ? [{ ...call.body, id: 'q-new-1' }] : undefined
    );
    stub.on('rpc', 'admin_delete_record', (call) => ({
      success: true,
      deleted_id: call.body.p_id,
    }));
    await stub.install(page);

    await page.goto(`/admin/tests/${TEST_ID}/questions`);
    await page.getByRole('button', { name: '+ Bulk Add (TXT)' }).click();
    await page
      .getByPlaceholder(/ভারতের প্রথম রাষ্ট্রপতি/)
      .fill(
        '1. Largest district of West Bengal by area?\n(a) Purulia\n(b) Bankura\n(c) Paschim Medinipur\n(d) Bardhaman\nAnswer: (c)'
      );
    await page.getByRole('button', { name: 'Import & Attach 1 Questions' }).click();

    await expect(
      page.getByText(`Question could not be assigned to the test: ${LOCK_MESSAGE}.`)
    ).toBeVisible();
    await expect(page.getByText(/Successfully imported/)).toHaveCount(0);
    expect(stub.callsTo('rpc', 'admin_delete_record').map((c) => c.body)).toEqual([
      { p_table: 'questions', p_id: 'q-new-1' },
    ]);
  });

  test('a test in a running live event opens read-only', async ({ page }) => {
    const stub = new SupabaseStub();
    stubStaleUnlockedPage(stub);
    stub.on('rest', 'live_tests', () => [
      {
        id: 'lt-1',
        test_id: TEST_ID,
        start_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        duration_minutes: 90,
        status: 'live',
        is_published: true,
        tests: testRow,
      },
    ]);
    await stub.install(page);

    await page.goto(`/admin/tests/${TEST_ID}/questions`);
    await expect(
      page.getByText(/currently scheduled as an active or upcoming Live Test/)
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '+ Bulk Add (TXT)' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Remove' }).first()).toBeDisabled();
    expect(stub.callsTo('rpc', 'save_test_questions')).toHaveLength(0);
  });
});
