import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { Chapter, Exam, Subject } from '@/types';
import { ExamLinkedSubjects } from './ExamLinkedSubjects';

const exam: Exam = {
  id: 'exam-a',
  title: 'Exam A',
  slug: 'exam-a',
  category: 'Other',
  isActive: true,
  orderIndex: 0,
} as Exam;
const subjects: Subject[] = [
  {
    id: 'math',
    name: 'Mathematics',
    slug: 'math',
    iconName: 'X',
    orderIndex: 0,
    isActive: true,
    chaptersCount: 3,
  },
  { id: 'gk', name: 'GK', slug: 'gk', iconName: 'X', orderIndex: 1, isActive: false },
];
const topics: Chapter[] = [
  { id: 'alg', subjectId: 'math', name: 'Algebra', slug: 'alg', orderIndex: 0, isActive: true },
  { id: 'geo', subjectId: 'math', name: 'Geometry', slug: 'geo', orderIndex: 1, isActive: true },
];

const mount = (props: Partial<Parameters<typeof ExamLinkedSubjects>[0]> = {}) => {
  const onEdit = vi.fn();
  render(
    <MemoryRouter>
      <ExamLinkedSubjects
        exam={exam}
        subjects={subjects}
        topics={topics}
        curriculum={{ subjectIds: ['math'], topicIds: ['alg'] }}
        loading={false}
        onRetry={() => {}}
        onEdit={onEdit}
        {...props}
      />
    </MemoryRouter>
  );
  return onEdit;
};

describe('ExamLinkedSubjects (assigned view)', () => {
  it('lists only assigned subjects with their assigned topics and real counts', () => {
    const onEdit = mount();
    const panel = screen.getByRole('region', { name: 'Assigned subjects' });
    expect(within(panel).getByText('Assigned Subjects (1)')).toBeInTheDocument();
    expect(within(panel).getByText('Mathematics')).toBeInTheDocument();
    expect(within(panel).queryByText('GK')).not.toBeInTheDocument();
    const list = within(panel).getByRole('list', { name: 'Assigned topics for Mathematics' });
    expect(within(list).getByText('Algebra')).toBeInTheDocument();
    expect(within(list).queryByText('Geometry')).not.toBeInTheDocument();
    expect(within(panel).getByText('1 of 3 topics assigned')).toBeInTheDocument();
    fireEvent.click(within(panel).getByRole('button', { name: 'Edit assignments' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('offers no inline creation controls', () => {
    mount();
    expect(screen.queryByRole('button', { name: /Add Subject/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Add topic/i })).not.toBeInTheDocument();
  });

  it('shows the empty state with Edit assignments', () => {
    const onEdit = mount({ curriculum: { subjectIds: [], topicIds: [] } });
    expect(screen.getByText('No subjects assigned yet')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Edit assignments' }));
    expect(onEdit).toHaveBeenCalled();
  });

  it('shows Unavailable with retry when assignments could not be read', () => {
    const onRetry = vi.fn();
    mount({ curriculum: null, onRetry });
    expect(screen.getByText('Assigned Subjects (Unavailable)')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Retry subjects' }));
    expect(onRetry).toHaveBeenCalled();
  });
});
