import { expect, test, type Locator, type Page } from '@playwright/test';
import { SupabaseStub, eqFilter } from './support/supabaseStub';

const SUBJECT = { id: 'subj-history', name: 'History', slug: 'history', is_active: true };
const CHAPTER = {
  id: 'chap-modern-india',
  subject_id: SUBJECT.id,
  name: 'Modern India',
  slug: 'modern-india',
  is_active: true,
  order_index: 1,
  tests: [{ count: 0 }],
};
const EXAM = { id: 'exam-wbp', title: 'WBP Constable', slug: 'wbp', category: 'Police' };

const validQuestion = (n: number) => ({
  question_id: `q-${n}`,
  question_order: n,
  questions: {
    id: `q-${n}`,
    question_text: `Who chaired the drafting committee? (${n})`,
    option_a: 'Nehru',
    option_b: 'B. R. Ambedkar',
    option_c: 'Patel',
    option_d: 'Prasad',
    correct_option: 'B',
  },
});

/** In-memory `tests` table plus the catalog reads the Mock Tests page makes. */
function stubCatalog(stub: SupabaseStub) {
  const tests = new Map<string, Record<string, any>>();
  const questionsByTest = new Map<string, unknown[]>();
  const withJoins = (row: Record<string, any>): Record<string, any> => ({
    exams: null,
    subjects: row.subject_id === SUBJECT.id ? { name: SUBJECT.name } : null,
    chapters: row.chapter_id === CHAPTER.id ? { name: CHAPTER.name } : null,
    test_series: null,
    created_at: row.created_at ?? new Date().toISOString(),
    ...row,
  });

  stub.on('rest', 'exams', () => [EXAM]);
  stub.on('rest', 'subjects', () => [SUBJECT]);
  stub.on('rest', 'chapters', () => [CHAPTER]);
  stub.on('rest', 'test_exams', () => []);
  stub.on('rest', 'tests', (call) => {
    const id = eqFilter(call, 'id');
    if (call.method === 'GET') {
      const rows = [...tests.values()].filter((r) => !id || r.id === id).map(withJoins);
      return rows;
    }
    if (call.method === 'POST') {
      const row = withJoins({ ...call.body });
      tests.set(row.id, row);
      return [row];
    }
    if (call.method === 'PATCH' && id) {
      const row = withJoins({ ...tests.get(id), ...call.body });
      tests.set(id, row);
      return [row];
    }
    return undefined;
  });
  stub.on('rest', 'test_questions', (call) => {
    if (call.method !== 'GET') return undefined;
    const id = eqFilter(call, 'test_id');
    return id ? (questionsByTest.get(id) ?? []) : [];
  });

  return { tests, questionsByTest };
}

/** Labels on this form are not linked to their controls; the control follows its label. */
const fieldAfterLabel = (scope: Page | Locator, label: string, control = 'select') =>
  scope.locator(`xpath=.//label[normalize-space()='${label}']/following-sibling::${control}[1]`);

async function fillTopicTestForm(page: Page, title: string) {
  await page.goto('/admin/mock-tests');
  await page.getByRole('button', { name: 'Create Mock Test' }).click();
  const dialog = page.locator('form').filter({ hasText: 'Test Mode *' });
  await dialog
    .getByRole('button', { name: /Topic Test/ })
    .first()
    .click();
  await fieldAfterLabel(dialog, 'Subject *').selectOption(SUBJECT.id);
  await fieldAfterLabel(dialog, 'Topic *').selectOption(CHAPTER.id);
  await dialog.getByPlaceholder('e.g. WBP Constable Full Mock 01').fill(title);
  return dialog;
}

test.describe('Mock test publishing', () => {
  test('a Topic Test with no exam publishes once it has questions', async ({ page }) => {
    const stub = new SupabaseStub();
    const db = stubCatalog(stub);
    await stub.install(page);

    const dialog = await fillTopicTestForm(page, 'Modern India Topic Test 01');
    await dialog.getByRole('button', { name: 'Create Mock Test' }).click();
    await expect(dialog).toBeHidden();

    const [insert] = stub.callsTo('rest', 'tests').filter((c) => c.method === 'POST');
    expect(insert.body).toMatchObject({
      test_type: 'topic',
      exam_id: null,
      subject_id: SUBJECT.id,
      chapter_id: CHAPTER.id,
      status: 'draft',
    });
    const testId = insert.body.id as string;

    // Questions get linked (Manage Questions) — the server now reports them for validation.
    db.questionsByTest.set(testId, [validQuestion(1), validQuestion(2)]);

    const panel = page.locator('form').filter({ hasText: 'Save Changes' });
    if (!(await panel.isVisible())) {
      const row = page.getByRole('row').filter({ hasText: 'Modern India Topic Test 01' });
      await row.getByRole('button').last().click();
      await page.getByRole('button', { name: 'Edit Test & Icon' }).click();
    }
    await expect(panel).toBeVisible();
    await fieldAfterLabel(panel, 'Status').selectOption('published');
    await panel.getByRole('button', { name: 'Save Changes' }).click();

    // The row flips to Published, and no "not published" alert was raised.
    const row = page.getByRole('row').filter({ hasText: 'Modern India Topic Test 01' });
    await expect(row.getByText('Published', { exact: true })).toBeVisible();
    expect(stub.dialogs).toEqual([]);
    const publishPatch = stub
      .callsTo('rest', 'tests')
      .find((c) => c.method === 'PATCH' && c.body?.status === 'published');
    expect(publishPatch?.body).toMatchObject({ status: 'published', is_active: true });
    expect(db.tests.get(testId)?.status).toBe('published');
  });

  // App bug, found by this spec: handleSaveSettings (src/pages/admin/AdminTests.tsx) sets the
  // success message and calls setSelectedTest(updated) in the same update; the effect that syncs
  // the form on selectedTest changes then runs setSaveSuccessMsg(null), so "Changes saved
  // successfully!" is cleared as soon as it renders. Unskip once the message survives the sync.
  test('saving test settings shows the success message', async ({ page }) => {
    const stub = new SupabaseStub();
    stubCatalog(stub);
    await stub.install(page);
    const dialog = await fillTopicTestForm(page, 'Message Check Test');
    await dialog.getByRole('button', { name: 'Create Mock Test' }).click();
    const row = page.getByRole('row').filter({ hasText: 'Message Check Test' });
    await row.getByRole('button').last().click();
    await page.getByRole('button', { name: 'Edit Test & Icon' }).click();
    const panel = page.locator('form').filter({ hasText: 'Save Changes' });
    await panel.getByRole('button', { name: 'Save Changes' }).click();
    await expect(page.getByText('Changes saved successfully!')).toBeVisible();
  });

  test('a new test with zero questions cannot be published at creation', async ({ page }) => {
    const stub = new SupabaseStub();
    const db = stubCatalog(stub);
    await stub.install(page);

    const dialog = await fillTopicTestForm(page, 'Empty Topic Test');
    // The UI disables "Published" here; force the value to prove the service still refuses.
    await fieldAfterLabel(dialog, 'Publication Status').evaluate((select: HTMLSelectElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!;
      setter.call(select, 'published');
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await dialog.getByRole('button', { name: 'Create Mock Test' }).click();
    await expect(dialog).toBeHidden();

    const writes = stub.callsTo('rest', 'tests').filter((c) => c.method !== 'GET');
    const [insert] = writes.filter((c) => c.method === 'POST');
    expect(insert.body).toMatchObject({ status: 'draft', is_active: false });
    expect(writes.some((c) => c.body?.status === 'published')).toBe(false);
    expect(db.tests.get(insert.body.id)?.status).toBe('draft');

    const row = page.getByRole('row').filter({ hasText: 'Empty Topic Test' });
    await expect(row.getByText(/Draft/i)).toBeVisible();
  });
});
