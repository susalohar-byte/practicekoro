import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
const m = vi.hoisted(() => ({
  exams: vi.fn(),
  subjects: vi.fn(),
  subject: vi.fn(),
  topics: vi.fn(),
  createSubject: vi.fn(),
  createTopic: vi.fn(),
}));
vi.mock('@/services/api', () => ({
  api: {
    getAllAdminExams: m.exams,
    getAllAdminSubjects: m.subjects,
    getSubjectById: m.subject,
    getAllAdminChapters: m.topics,
    createSubject: m.createSubject,
    createChapter: m.createTopic,
  },
}));
import { ExamCurriculumDialog, type CurriculumTarget } from './ExamCurriculumDialog';
import { ExamLinkedSubjects } from './ExamLinkedSubjects';
import type { Exam, Subject } from '@/types';
const exam = {
  id: 'exam-a',
  title: 'Exam A',
  slug: 'exam-a',
  category: 'Other',
  isActive: true,
  orderIndex: 0,
} as Exam;
const subject = {
  id: 'subject-a',
  examId: 'exam-a',
  name: 'Mathematics',
  slug: 'math',
  isActive: true,
  orderIndex: 0,
  iconName: 'BookOpen',
} as Subject;
beforeEach(() => {
  vi.resetAllMocks();
  m.exams.mockResolvedValue([exam]);
  m.subjects.mockResolvedValue([]);
  m.subject.mockResolvedValue(subject);
  m.topics.mockResolvedValue([]);
  m.createSubject.mockImplementation(async (input) => ({ ...input, id: 'new-subject' }));
  m.createTopic.mockImplementation(async (input) => ({ ...input, id: 'new-topic' }));
});
async function open(target: CurriculumTarget = { kind: 'subject', exam }) {
  const saved = vi.fn(),
    close = vi.fn();
  render(<ExamCurriculumDialog target={target} onClose={close} onSaved={saved} />);
  await screen.findByLabelText(target.kind === 'subject' ? 'Subject name' : 'Topic name');
  return { saved, close };
}
function fill(name = 'Algebra') {
  fireEvent.change(screen.getByLabelText(/^(Subject|Topic) name$/), { target: { value: name } });
}
function submit() {
  fireEvent.submit(screen.getByLabelText(/^(Subject|Topic) name$/).closest('form')!);
}
describe('Inline exam curriculum creation', () => {
  it('creates a draft subject belonging only to selected exam and refreshes after confirmation', async () => {
    const { saved } = await open();
    fill();
    submit();
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(m.createSubject).toHaveBeenCalledWith(
      expect.objectContaining({
        examId: 'exam-a',
        name: 'Algebra',
        slug: 'algebra',
        isActive: false,
      })
    );
    expect(m.createTopic).not.toHaveBeenCalled();
  });
  it('creates a topic under verified subject without moving existing ownership', async () => {
    const { saved } = await open({ kind: 'topic', exam, subject });
    fill();
    fireEvent.click(screen.getByLabelText(/Publish on platform/));
    submit();
    await waitFor(() => expect(saved).toHaveBeenCalled());
    expect(m.topics).toHaveBeenCalledWith(subject.id);
    expect(m.createTopic).toHaveBeenCalledWith(
      expect.objectContaining({ subjectId: subject.id, isActive: true })
    );
    expect(m.createSubject).not.toHaveBeenCalled();
  });
  it('requires explicit acknowledgement for shared topics', async () => {
    m.subject.mockResolvedValue({ ...subject, examId: undefined });
    const { saved } = await open({
      kind: 'topic',
      exam,
      subject: { ...subject, examId: undefined },
    });
    fill();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Confirm');
    expect(m.createTopic).not.toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText(/I understand this topic/));
    submit();
    await waitFor(() => expect(saved).toHaveBeenCalled());
  });
  it('fails closed for inaccessible exam and permits verified retry', async () => {
    m.exams.mockResolvedValue([]);
    render(
      <ExamCurriculumDialog
        target={{ kind: 'subject', exam }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('no longer exists');
    expect(screen.queryByLabelText('Subject name')).not.toBeInTheDocument();
    m.exams.mockResolvedValue([exam]);
    fireEvent.click(screen.getByRole('button', { name: 'Retry verification' }));
    await screen.findByLabelText('Subject name');
  });
  it('rejects a foreign subject before exposing a writable form', async () => {
    m.subject.mockResolvedValue({ ...subject, examId: 'exam-b' });
    render(
      <ExamCurriculumDialog
        target={{ kind: 'topic', exam, subject }}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />
    );
    expect(await screen.findByRole('alert')).toHaveTextContent('not available');
    expect(m.topics).not.toHaveBeenCalled();
  });
  it('rejects duplicate slugs in parent scope', async () => {
    m.subjects.mockResolvedValue([{ ...subject, slug: 'algebra' }]);
    await open();
    fill();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('already exists');
    expect(m.createSubject).not.toHaveBeenCalled();
  });
  it('handles Bengali name with separate valid slug and respects display order', async () => {
    m.topics.mockResolvedValue([{ slug: 'existing', orderIndex: 7 }]);
    await open({ kind: 'topic', exam, subject });
    fill('গণিত');
    fireEvent.change(screen.getByLabelText('URL slug'), { target: { value: 'ganit' } });
    submit();
    await waitFor(() =>
      expect(m.createTopic).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'গণিত', slug: 'ganit', orderIndex: 8 })
      )
    );
  });
  it('shows API write errors without false success or closing editor', async () => {
    m.createTopic.mockRejectedValue(new Error('Permission denied'));
    const { saved, close } = await open({ kind: 'topic', exam, subject });
    fill();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('Permission denied');
    expect(saved).not.toHaveBeenCalled();
    expect(close).not.toHaveBeenCalled();
  });
  it('does not report success when backend confirms a different parent', async () => {
    m.createSubject.mockResolvedValue({ ...subject, id: 'new', examId: 'exam-b' });
    const { saved } = await open();
    fill();
    submit();
    expect(await screen.findByRole('alert')).toHaveTextContent('did not confirm');
    expect(saved).not.toHaveBeenCalled();
  });
  it('prevents duplicate submits and escape while a write is pending', async () => {
    let resolve!: (value: Subject) => void;
    m.createSubject.mockReturnValue(
      new Promise<Subject>((r) => {
        resolve = r;
      })
    );
    const { saved, close } = await open();
    fill();
    submit();
    submit();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(m.createSubject).toHaveBeenCalledTimes(1);
    expect(close).not.toHaveBeenCalled();
    resolve({ ...subject, id: 'new' });
    await waitFor(() => expect(saved).toHaveBeenCalled());
  });
  it('offers direct actions and parent-preserving topic management link', async () => {
    const refresh = vi.fn();
    render(
      <MemoryRouter>
        <ExamLinkedSubjects exam={exam} subjects={[subject]} loading={false} onRetry={refresh} />
      </MemoryRouter>
    );
    expect(screen.getByRole('link', { name: 'Manage Topics' })).toHaveAttribute(
      'href',
      '/admin/topics?examId=exam-a&subject=subject-a'
    );
    fireEvent.click(screen.getByRole('button', { name: 'Add Subject' }));
    await screen.findByLabelText('Subject name');
    fill();
    submit();
    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('saved');
  });
});
