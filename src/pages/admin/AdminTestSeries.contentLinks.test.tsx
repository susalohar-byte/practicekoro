import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { MockTest, TestSeries } from '@/types';

const m = vi.hoisted(() => ({
  getTestSeries: vi.fn(),
  getAllAdminTests: vi.fn(),
  getTestExamLinks: vi.fn(),
  getSeriesMemberships: vi.fn(),
  getSeriesTestIds: vi.fn(),
  saveSeriesTests: vi.fn(),
  createTestSeries: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: {} }));
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: async () => [
      { id: 'exam-a', title: 'Exam A', category: 'Police' },
      { id: 'exam-b', title: 'Exam B', category: 'Police' },
    ],
    getTestSeries: m.getTestSeries,
    getAllAdminTests: m.getAllAdminTests,
    getTestExamLinks: m.getTestExamLinks,
    getSeriesMemberships: m.getSeriesMemberships,
    getPopularTestSeriesCards: async () => [],
    getSeriesTestIds: m.getSeriesTestIds,
    saveSeriesTests: m.saveSeriesTests,
    createTestSeries: m.createTestSeries,
    updateTestSeries: vi.fn(),
  },
}));

import { AdminTestSeries, accessLabel } from './AdminTestSeries';

const series = (over: Partial<TestSeries>): TestSeries =>
  ({
    id: 's1',
    examId: 'exam-a',
    examTitle: 'Exam A',
    title: 'WBP Series',
    slug: 'wbp-series',
    isPremium: false,
    orderIndex: 1,
    status: 'published',
    isActive: true,
    testCount: 3,
    ...over,
  }) as TestSeries;

const test = (over: Partial<MockTest>): MockTest =>
  ({
    slug: 'x',
    totalQuestions: 50,
    durationMinutes: 45,
    totalMarks: 50,
    passingMarks: 20,
    negativeMarking: 0,
    isPremium: false,
    orderIndex: 0,
    isActive: true,
    status: 'published',
    ...over,
  }) as MockTest;

const TESTS: MockTest[] = [
  test({ id: 't-fm-a', title: 'FM A', testType: 'full_mock', examId: 'exam-a' }),
  test({ id: 't-fm-b', title: 'FM B', testType: 'full_mock', examId: 'exam-b' }),
  test({ id: 't-fm-linked', title: 'FM Linked', testType: 'full_mock', examId: 'exam-b' }),
  test({
    id: 't-topic',
    title: 'Topic Algebra',
    testType: 'topic',
    subjectName: 'Maths',
    topicName: 'Algebra',
    status: 'draft',
  }),
  test({ id: 't-pyq-a', title: 'PYQ A', testType: 'pyq', examId: 'exam-a' }),
];

beforeEach(() => {
  vi.clearAllMocks();
  m.getTestSeries.mockResolvedValue([series({}), series({ id: 's2', title: 'Maths Drill' })]);
  m.getAllAdminTests.mockResolvedValue(TESTS);
  // FM Linked belongs to Exam B but is also linked to Exam A through test_exams.
  m.getTestExamLinks.mockResolvedValue({ 't-fm-linked': ['exam-a', 'exam-b'] });
  m.getSeriesMemberships.mockResolvedValue([
    { seriesId: 's1', testId: 't-fm-a', orderIndex: 0 },
    { seriesId: 's1', testId: 't-pyq-a', orderIndex: 1 },
    { seriesId: 's2', testId: 't-topic', orderIndex: 0 },
  ]);
  m.getSeriesTestIds.mockResolvedValue(['t-fm-a', 't-pyq-a']);
  m.saveSeriesTests.mockImplementation(async (_id: string, ids: string[]) => ids.length);
  m.createTestSeries.mockImplementation(async (input: TestSeries) => ({ ...input, id: 'new' }));
});

async function openIncludedTests() {
  render(<AdminTestSeries />);
  fireEvent.click(await screen.findByText('WBP Series'));
  fireEvent.click(screen.getByRole('button', { name: 'Tests (3)' }));
  const panel = screen.getByRole('region', { name: 'Included tests' });
  await within(panel).findByTestId('included-test-t-fm-a');
  return panel;
}

const orderOf = (panel: HTMLElement) =>
  within(panel)
    .getAllByTestId(/^included-test-/)
    .map((el) => el.dataset.testid!.replace('included-test-', ''));

describe('Test series create form', () => {
  it('creates a series without a target exam and offers only Free / Paid access', async () => {
    render(<AdminTestSeries />);
    fireEvent.click(await screen.findByRole('button', { name: /Create Test Series/ }));
    const exam = screen.getByRole('combobox', { name: 'Target Exam' }) as HTMLSelectElement;
    expect(exam.value).toBe('');
    expect(
      within(exam).getByRole('option', { name: 'No target exam (subject/topic collection)' })
    ).toBeInTheDocument();
    const access = screen.getByRole('combobox', { name: 'Access' });
    expect(
      within(access)
        .getAllByRole('option')
        .map((o) => o.textContent)
    ).toEqual(['Free', 'Paid']);
    expect(screen.queryByText(/Pro Pass|Premium/)).not.toBeInTheDocument();

    fireEvent.change(screen.getByRole('textbox', { name: 'Test Series Name' }), {
      target: { value: 'Algebra Collection' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Series' }));
    await waitFor(() => expect(m.createTestSeries).toHaveBeenCalledTimes(1));
    expect(m.createTestSeries.mock.calls[0][0]).toMatchObject({
      title: 'Algebra Collection',
      examId: '',
      isPremium: false,
    });
    expect(await screen.findByText('Test series saved.')).toBeInTheDocument();
  });

  it('labels access as Free / Paid for exports', () => {
    expect(accessLabel(false)).toBe('Free');
    expect(accessLabel(true)).toBe('Paid');
  });
});

describe('Included tests and Add Existing Tests', () => {
  it('excludes duplicates, explains incompatible tests and keeps exam-independent topic tests', async () => {
    const panel = await openIncludedTests();
    fireEvent.click(within(panel).getByRole('button', { name: 'Add Existing Tests' }));
    const dialog = screen.getByRole('dialog', { name: 'Add Existing Tests' });

    // Default exam filter is the series' target exam, yet the exam-independent topic test shows.
    const topic = within(dialog).getByTestId('add-test-t-topic');
    expect(within(topic).getByText('Also in 1 other series')).toBeInTheDocument();
    expect(
      within(topic).getByText('Exam-independent · Maths › Algebra', { exact: false })
    ).toBeInTheDocument();
    expect(within(dialog).queryByTestId('add-test-t-fm-b')).not.toBeInTheDocument();
    expect(within(dialog).getByText(/1 test for other exams hidden/)).toBeInTheDocument();

    // Already included: checked and disabled.
    const already = within(dialog).getByRole('checkbox', { name: 'Select FM A' });
    expect(already).toBeChecked();
    expect(already).toBeDisabled();
    expect(
      within(within(dialog).getByTestId('add-test-t-fm-a')).getByText('Already in this series')
    ).toBeInTheDocument();

    // Incompatible tests are shown disabled with the reason, not hidden.
    fireEvent.click(within(dialog).getByRole('button', { name: 'Show all exams' }));
    const fmB = within(dialog).getByTestId('add-test-t-fm-b');
    expect(within(fmB).getByRole('checkbox')).toBeDisabled();
    expect(
      within(fmB).getByText(
        'Not compatible: Full Mock for a different exam than this series targets'
      )
    ).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Select Topic Algebra' }));
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Select FM Linked' }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Add 2 tests' }));

    expect(screen.queryByRole('dialog', { name: 'Add Existing Tests' })).not.toBeInTheDocument();
    expect(orderOf(panel)).toEqual(['t-fm-a', 't-pyq-a', 't-fm-linked', 't-topic']);
    expect(within(panel).getByText('Unsaved changes')).toBeInTheDocument();
    expect(within(panel).getByText('Draft — hidden from students')).toBeInTheDocument();
    expect(m.saveSeriesTests).not.toHaveBeenCalled();

    fireEvent.click(within(panel).getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(m.saveSeriesTests).toHaveBeenCalledWith('s1', [
        't-fm-a',
        't-pyq-a',
        't-fm-linked',
        't-topic',
      ])
    );
    await waitFor(() => expect(within(panel).queryByText('Unsaved changes')).toBeNull());
    // Counts are re-read from the backend after saving.
    expect(m.getSeriesMemberships).toHaveBeenCalledTimes(2);
  });

  it('reorders and removes, confirming the test itself is not deleted, then saves once', async () => {
    m.getSeriesTestIds.mockResolvedValue(['t-fm-a', 't-pyq-a', 't-topic']);
    const panel = await openIncludedTests();

    fireEvent.click(within(panel).getByRole('button', { name: 'Move Topic Algebra up' }));
    expect(orderOf(panel)).toEqual(['t-fm-a', 't-topic', 't-pyq-a']);

    fireEvent.click(within(panel).getByRole('button', { name: 'Remove FM A from series' }));
    const confirm = within(panel).getByRole('alertdialog');
    expect(confirm).toHaveTextContent('The test itself is not deleted');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Remove from Series' }));
    expect(orderOf(panel)).toEqual(['t-topic', 't-pyq-a']);

    fireEvent.click(within(panel).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(m.saveSeriesTests).toHaveBeenCalledTimes(1));
    expect(m.saveSeriesTests).toHaveBeenCalledWith('s1', ['t-topic', 't-pyq-a']);
  });

  it('discards staged edits and shows server errors verbatim', async () => {
    const panel = await openIncludedTests();
    fireEvent.click(within(panel).getByRole('button', { name: 'Move PYQ A up' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Discard' }));
    expect(orderOf(panel)).toEqual(['t-fm-a', 't-pyq-a']);

    m.saveSeriesTests.mockRejectedValueOnce(
      new Error('Test "PYQ A" is linked to a different exam than this series targets.')
    );
    fireEvent.click(within(panel).getByRole('button', { name: 'Move PYQ A up' }));
    fireEvent.click(within(panel).getByRole('button', { name: 'Save' }));
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'Test "PYQ A" is linked to a different exam than this series targets.'
    );
    expect(within(panel).getByText('Unsaved changes')).toBeInTheDocument();
  });
});
