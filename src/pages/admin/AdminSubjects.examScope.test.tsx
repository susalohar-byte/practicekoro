import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({
  exams: vi.fn(),
  subjects: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
}));
vi.mock('@/lib/supabase', () => ({ isSupabaseConfigured: true }));
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: m.exams,
    getAllAdminSubjects: m.subjects,
    getAllAdminChapters: async () => [],
    getAllAdminTests: async () => [],
    getSubjectReportingData: async () => ({ questions: [], attempts: [], warnings: [] }),
    createSubject: m.create,
    updateSubject: m.update,
  },
}));
import { AdminSubjects } from './AdminSubjects';
const exam = {
  id: 'exam-a',
  title: 'Exam A',
  slug: 'exam-a',
  category: 'Other',
  isActive: true,
  orderIndex: 0,
};
const subject = (id: string, examId?: string) => ({
  id,
  name: id,
  slug: id.toLowerCase(),
  examId,
  isActive: true,
  orderIndex: 0,
  iconName: 'BookOpen',
});
function mount(path = '/admin/subjects?examId=exam-a') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AdminSubjects />
    </MemoryRouter>
  );
}
async function ready() {
  mount();
  await screen.findByText('Exam A');
  await waitFor(() => expect(screen.getByRole('button', { name: 'Create Subject' })).toBeEnabled());
}
async function create() {
  fireEvent.click(screen.getByRole('button', { name: 'Create Subject' }));
  const dialog = screen.getByRole('dialog', { name: 'Subject editor' });
  fireEvent.change(within(dialog).getByLabelText('Subject name'), { target: { value: 'Physics' } });
  fireEvent.submit(within(dialog).getByLabelText('Subject name').closest('form')!);
  return dialog;
}
beforeEach(() => {
  vi.clearAllMocks();
  m.exams.mockResolvedValue([exam]);
  m.subjects.mockResolvedValue([
    subject('Owned', 'exam-a'),
    subject('Shared'),
    subject('Foreign', 'exam-b'),
  ]);
  m.create.mockImplementation(async (input) => ({ ...input, id: 'saved' }));
  m.update.mockImplementation(async (id, input) => ({ ...subject(id), ...input }));
});
describe('Manage subjects retains exam context', () => {
  it('filters to exam-specific and shared subjects, excluding foreign records', async () => {
    await ready();
    const table = screen.getByRole('table', { name: 'Subjects' });
    expect(within(table).getByText('Owned')).toBeInTheDocument();
    expect(within(table).getByText('Shared')).toBeInTheDocument();
    expect(within(table).queryByText('Foreign')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clear exam scope' })).toHaveAttribute(
      'href',
      '/admin/subjects'
    );
  });
  it('persists selected exam association on create and immediately shows the saved record', async () => {
    await ready();
    await create();
    await waitFor(() =>
      expect(m.create).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Physics', examId: 'exam-a' })
      )
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Subject editor' })).not.toBeInTheDocument()
    );
    expect(screen.getAllByText('Physics').length).toBeGreaterThan(0);
  });
  it('cannot claim linked creation if backend omits the requested association', async () => {
    m.create.mockResolvedValue({ ...subject('saved'), name: 'Physics' });
    await ready();
    await create();
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'did not confirm the selected exam association'
    );
    expect(screen.getByRole('dialog', { name: 'Subject editor' })).toBeInTheDocument();
  });
  it('preserves shared ownership on edit rather than moving it to the selected exam', async () => {
    await ready();
    fireEvent.click(screen.getByRole('button', { name: 'Actions for Shared' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit Subject' }));
    const dialog = screen.getByRole('dialog', { name: 'Subject editor' });
    expect(within(dialog).getByText('Subject scope: Shared · all exams')).toBeInTheDocument();
    fireEvent.submit(within(dialog).getByLabelText('Subject name').closest('form')!);
    await waitFor(() => expect(m.update).toHaveBeenCalled());
    expect(m.update.mock.calls[0][1]).not.toHaveProperty('examId');
  });
  it('rejects an unknown exam and disables creation instead of saving globally', async () => {
    m.exams.mockResolvedValue([]);
    mount();
    expect(await screen.findByRole('alert')).toHaveTextContent('selected exam no longer exists');
    expect(screen.getByRole('button', { name: 'Create Subject' })).toBeDisabled();
    expect(m.create).not.toHaveBeenCalled();
  });
  it('deep links only an actual subject visible in the selected scope', async () => {
    mount('/admin/subjects?examId=exam-a&subjectId=Owned');
    await screen.findByText('Exam A');
    await screen.findByRole('button', { name: /Topics \(0\)/ });
    expect(screen.getAllByText('Owned').length).toBeGreaterThan(1);
  });
  it('unscoped creation remains explicitly shared and does not load exam context', async () => {
    mount('/admin/subjects');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create Subject' })).toBeEnabled()
    );
    await create();
    await waitFor(() => expect(m.create).toHaveBeenCalled());
    expect(m.create.mock.calls[0][0]).not.toHaveProperty('examId');
    expect(m.exams).not.toHaveBeenCalled();
  });
});
