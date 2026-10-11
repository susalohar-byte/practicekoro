import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({ subjects: vi.fn(), legacy: vi.fn(), exams: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true, supabaseRuntime: {} }));
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: m.exams,
    getAllAdminSubjects: m.subjects,
    getSubjects: m.legacy,
    getAllAdminTests: async () => [],
    getTestSeries: async () => [],
    getExamCategories: async () => [],
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
const subject = (id: string, examId?: string, isActive = true) => ({
  id,
  name: id,
  slug: id,
  examId,
  isActive,
  orderIndex: 0,
  iconName: 'BookOpen',
  chaptersCount: 2,
});
async function open(expected: string) {
  render(
    <MemoryRouter>
      <AdminExams />
    </MemoryRouter>
  );
  fireEvent.click(await screen.findByText('Exam A'));
  fireEvent.click(await screen.findByRole('button', { name: expected }));
  return screen.getByRole('region', { name: 'Linked subjects' });
}
beforeEach(() => {
  vi.clearAllMocks();
  m.exams.mockResolvedValue([exam]);
  m.subjects.mockResolvedValue([]);
});
describe('Exam-linked subjects are authoritative', () => {
  it('counts and lists only this exam and shared subjects, including drafts', async () => {
    m.subjects.mockResolvedValue([
      subject('Foreign', 'exam-b'),
      subject('Owned', 'exam-a'),
      subject('Shared', undefined, false),
    ]);
    const panel = await open('Subjects (2)');
    expect(within(panel).getByText('Owned')).toBeInTheDocument();
    expect(within(panel).getByText('Shared')).toBeInTheDocument();
    expect(within(panel).queryByText('Foreign')).not.toBeInTheDocument();
    expect(
      within(within(panel).getByRole('link', { name: 'Shared' }).closest('li')!).getByText('Draft')
    ).toBeInTheDocument();
    expect(m.legacy).not.toHaveBeenCalled();
    expect(within(panel).getByRole('link', { name: /Manage Subjects/ })).toHaveAttribute(
      'href',
      '/admin/subjects?examId=exam-a'
    );
  });
  it('shows real zero instead of placeholder ten or invented subjects', async () => {
    const panel = await open('Subjects (0)');
    expect(within(panel).getByText('Linked Subjects (0)')).toBeInTheDocument();
    expect(within(panel).getByText(/No subjects are available/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Subjects (10)' })).not.toBeInTheDocument();
    expect(within(panel).queryByText('General Awareness & GK')).not.toBeInTheDocument();
  });
  it('failed subject reads are unavailable, and retry synchronizes drawer and count', async () => {
    m.subjects.mockRejectedValue(new Error('Subject permissions unavailable'));
    const panel = await open('Subjects (Unavailable)');
    expect(within(panel).getByRole('alert')).toHaveTextContent('Subject permissions unavailable');
    m.subjects.mockResolvedValue([subject('Recovered', 'exam-a')]);
    fireEvent.click(within(panel).getByRole('button', { name: 'Retry subjects' }));
    await screen.findByRole('button', { name: 'Subjects (1)' });
    expect(await screen.findByText('Recovered')).toBeInTheDocument();
  });
  it('search/status filters do not change the linked total or leak another exam', async () => {
    m.subjects.mockResolvedValue([
      subject('Owned', 'exam-a'),
      subject('Draft Owned', 'exam-a', false),
      subject('Foreign', 'exam-b'),
    ]);
    const panel = await open('Subjects (2)');
    fireEvent.change(within(panel).getByLabelText('Linked subject status'), {
      target: { value: 'draft' },
    });
    expect(within(panel).queryByText('Owned')).not.toBeInTheDocument();
    expect(within(panel).getByText('Draft Owned')).toBeInTheDocument();
    expect(within(panel).getByText('Linked Subjects (2)')).toBeInTheDocument();
    fireEvent.change(within(panel).getByLabelText('Search linked subjects'), {
      target: { value: 'missing' },
    });
    expect(within(panel).getByText(/No linked subjects match/)).toBeInTheDocument();
  });
  it('refreshes relationship data after a confirmed subject mutation event', async () => {
    const panel = await open('Subjects (0)');
    m.subjects.mockResolvedValue([subject('Added', 'exam-a')]);
    fireEvent(window, new Event('practicekoro:exams_updated'));
    await waitFor(() => expect(within(panel).getByText('Added')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: 'Subjects (1)' })).toBeInTheDocument();
  });
});
