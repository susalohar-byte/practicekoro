import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({
  subjects: vi.fn(),
  chapters: vi.fn(),
  legacy: vi.fn(),
  exams: vi.fn(),
  curriculum: vi.fn(),
  saveCurriculum: vi.fn(),
  series: vi.fn(),
  createExam: vi.fn(),
  updateExam: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: {} }));
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: m.exams,
    getAllAdminSubjects: m.subjects,
    getAllAdminChapters: m.chapters,
    getSubjects: m.legacy,
    getAllAdminTests: async () => [],
    getTestSeries: m.series,
    getExamCategories: async () => [],
    getExamCurriculum: m.curriculum,
    // Bulk read used by the exam list; derived from the per-exam stub so each test controls both.
    getAllExamCurricula: async () => {
      const exams = (await m.exams()) as { id: string }[];
      const entries = await Promise.all(
        exams.map(async (e) => [e.id, await m.curriculum(e.id)] as const)
      );
      return Object.fromEntries(entries);
    },
    saveExamCurriculum: m.saveCurriculum,
    createExam: m.createExam,
    updateExam: m.updateExam,
  },
}));
import { AdminExams } from './AdminExams';
const exam = {
  id: 'exam-a',
  title: 'Exam A',
  slug: 'exam-a',
  category: 'Other',
  isActive: true,
  orderIndex: 0,
};
const subject = (id: string, isActive = true) => ({
  id,
  name: id,
  slug: id,
  isActive,
  orderIndex: 0,
  iconName: 'BookOpen',
  chaptersCount: 2,
});
const topic = (id: string, subjectId: string) => ({
  id,
  subjectId,
  name: id,
  slug: id,
  orderIndex: 0,
  isActive: true,
});
const mount = () =>
  render(
    <MemoryRouter>
      <AdminExams />
    </MemoryRouter>
  );
async function openTab(name: string | RegExp) {
  mount();
  fireEvent.click(await screen.findByText('Exam A'));
  fireEvent.click(await screen.findByRole('button', { name }));
}
const form = () => screen.getByPlaceholderText('e.g. WBP Constable').closest('form')!;

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  m.exams.mockResolvedValue([exam]);
  m.subjects.mockResolvedValue([subject('Maths'), subject('Reasoning'), subject('English', false)]);
  m.chapters.mockResolvedValue([
    topic('Algebra', 'Maths'),
    topic('Geometry', 'Maths'),
    topic('Series', 'Reasoning'),
  ]);
  m.curriculum.mockResolvedValue({ subjectIds: [], topicIds: [] });
  m.saveCurriculum.mockImplementation(async (_id, s: string[], t: string[]) => ({
    subjectCount: s.length,
    topicCount: t.length,
  }));
  m.series.mockResolvedValue([]);
  m.createExam.mockImplementation(async (input) => ({ ...input, id: 'new-exam' }));
  m.updateExam.mockImplementation(async (id, input) => ({ ...exam, ...input, id }));
});

describe('Exam Subjects tab shows persisted assignments', () => {
  it('counts and lists only assigned subjects with their assigned topics', async () => {
    m.curriculum.mockResolvedValue({ subjectIds: ['Maths'], topicIds: ['Algebra'] });
    await openTab('Subjects (1)');
    const panel = screen.getByRole('region', { name: 'Assigned subjects' });
    expect(within(panel).getByText('Maths')).toBeInTheDocument();
    expect(within(panel).queryByText('Reasoning')).not.toBeInTheDocument();
    expect(within(panel).getByText('Algebra')).toBeInTheDocument();
    expect(within(panel).queryByText('Geometry')).not.toBeInTheDocument();
    expect(m.legacy).not.toHaveBeenCalled();
    expect(m.curriculum).toHaveBeenCalledWith('exam-a');
  });

  it('shows real zero with the empty state and no inline creation', async () => {
    await openTab('Subjects (0)');
    const panel = screen.getByRole('region', { name: 'Assigned subjects' });
    expect(within(panel).getByText('No subjects assigned yet')).toBeInTheDocument();
    expect(within(panel).queryByRole('button', { name: /Add Subject/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subjects (10)' })).not.toBeInTheDocument();
  });

  it('failed assignment reads are Unavailable and retry recovers', async () => {
    m.curriculum.mockRejectedValue(new Error('Permission denied'));
    await openTab('Subjects (Unavailable)');
    m.curriculum.mockResolvedValue({ subjectIds: ['Reasoning'], topicIds: [] });
    fireEvent.click(screen.getByRole('button', { name: 'Retry subjects' }));
    await screen.findByRole('button', { name: 'Subjects (1)' });
    expect(
      within(screen.getByRole('region', { name: 'Assigned subjects' })).getByText('Reasoning')
    ).toBeInTheDocument();
  });

  it('Edit assignments opens the exam modal with saved assignments preselected', async () => {
    m.curriculum.mockResolvedValue({ subjectIds: ['Maths'], topicIds: ['Geometry'] });
    await openTab('Subjects (1)');
    fireEvent.click(screen.getByRole('button', { name: 'Edit assignments' }));
    expect(await screen.findByText('Edit Exam — Exam A')).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: /Maths/ })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Reasoning/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Geometry' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Algebra' })).not.toBeChecked();
    expect(
      within(screen.getByRole('list', { name: 'Subjects' })).getByText('Assigned')
    ).toBeInTheDocument();
  });
});

describe('Exam modal saves assignments', () => {
  it('create: saves the exam first, then the selected subject and topic ids', async () => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Create Exam' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'New Exam' },
    });
    fireEvent.click(await screen.findByRole('checkbox', { name: /Maths/ }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Algebra' }));
    expect(screen.queryByRole('checkbox', { name: 'Series' })).not.toBeInTheDocument();
    fireEvent.submit(form());
    await waitFor(() =>
      expect(m.saveCurriculum).toHaveBeenCalledWith('new-exam', ['Maths'], ['Algebra'])
    );
    expect(m.createExam).toHaveBeenCalledTimes(1);
    expect(m.createExam.mock.invocationCallOrder[0]).toBeLessThan(
      m.saveCurriculum.mock.invocationCallOrder[0]
    );
    await waitFor(() => expect(screen.queryByText('Create Target Exam')).not.toBeInTheDocument());
  });

  it('edit: unchanged assignments are not rewritten; deselecting prunes topics after confirm', async () => {
    m.curriculum.mockResolvedValue({
      subjectIds: ['Maths', 'Reasoning'],
      topicIds: ['Algebra', 'Series'],
    });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Actions for Exam A' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exam' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: /Maths/ }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' })
    );
    fireEvent.submit(form());
    await waitFor(() =>
      expect(m.saveCurriculum).toHaveBeenCalledWith('exam-a', ['Reasoning'], ['Series'])
    );
    expect(m.updateExam).toHaveBeenCalledWith('exam-a', expect.anything());
  });

  it('assignment failure after create keeps the modal open in edit mode and retries without re-creating', async () => {
    m.saveCurriculum.mockRejectedValueOnce(new Error('Topic does not belong to subject'));
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Create Exam' }));
    fireEvent.change(screen.getByPlaceholderText('e.g. WBP Constable'), {
      target: { value: 'New Exam' },
    });
    fireEvent.click(await screen.findByRole('checkbox', { name: /Reasoning/ }));
    fireEvent.submit(form());
    expect(await screen.findByText(/Topic does not belong to subject/)).toBeInTheDocument();
    expect(screen.getByText(/Edit Exam — New Exam/)).toBeInTheDocument();
    fireEvent.click(within(form()).getByRole('button', { name: 'Update Exam' }));
    await waitFor(() => expect(m.saveCurriculum).toHaveBeenCalledTimes(2));
    expect(m.createExam).toHaveBeenCalledTimes(1);
    expect(m.updateExam).toHaveBeenCalledWith('new-exam', expect.anything());
    expect(m.saveCurriculum).toHaveBeenLastCalledWith('new-exam', ['Reasoning'], []);
  });

  it('never saves assignments when the saved ones could not be loaded', async () => {
    m.curriculum.mockResolvedValueOnce({ subjectIds: [], topicIds: [] });
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Actions for Exam A' }));
    m.curriculum.mockRejectedValue(new Error('Read failed'));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Exam' }));
    expect(await screen.findByText(/Read failed/)).toBeInTheDocument();
    fireEvent.submit(form());
    await waitFor(() => expect(m.updateExam).toHaveBeenCalled());
    expect(m.saveCurriculum).not.toHaveBeenCalled();
  });
});

describe('Exam Test Series tab uses real series', () => {
  it('lists series from getTestSeries(examId) with real counts', async () => {
    m.series.mockImplementation(async (examId?: string) =>
      examId === 'exam-a' || !examId
        ? [
            {
              id: 's1',
              examId: 'exam-a',
              title: 'Real Series One',
              slug: 's1',
              isPremium: false,
              orderIndex: 0,
              isActive: true,
              status: 'published',
              testCount: 7,
              fullMockCount: 4,
              pyqTestCount: 2,
              topicTestCount: 1,
            },
          ]
        : []
    );
    await openTab('Test Series (1)');
    const panel = await screen.findByRole('region', { name: 'Exam test series' });
    expect(await within(panel).findByText('Real Series One')).toBeInTheDocument();
    expect(m.series).toHaveBeenCalledWith('exam-a');
    expect(within(panel).getByText('7 Tests')).toBeInTheDocument();
    expect(within(panel).getByText('4 Full Mock')).toBeInTheDocument();
    expect(within(panel).queryByText(/Mega Full Mock Series/)).not.toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: 'Manage Test Series' })).toHaveAttribute(
      'href',
      '/admin/test-series'
    );
  });

  it('shows real zero and an empty state instead of placeholder series', async () => {
    await openTab('Test Series (0)');
    const panel = screen.getByRole('region', { name: 'Exam test series' });
    expect(
      await within(panel).findByText(/No test series target this exam yet/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Mega Full Mock Series/)).not.toBeInTheDocument();
  });

  it('shows an error with retry when series cannot be read', async () => {
    await openTab('Test Series (0)');
    m.series.mockRejectedValueOnce(new Error('Series read denied'));
    fireEvent.click(screen.getByRole('button', { name: 'Overview' }));
    fireEvent.click(screen.getByRole('button', { name: 'Test Series (0)' }));
    expect(await screen.findByText(/Series read denied/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry test series' }));
    expect(await screen.findByText(/No test series target this exam yet/)).toBeInTheDocument();
  });
});
