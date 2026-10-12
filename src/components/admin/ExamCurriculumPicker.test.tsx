import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useState } from 'react';
import type { Chapter, Subject } from '@/types';
import { ExamCurriculumPicker, type CurriculumSelection } from './ExamCurriculumPicker';

const subject = (id: string, name: string, isActive = true): Subject => ({
  id,
  name,
  slug: id,
  iconName: 'BookOpen',
  orderIndex: 0,
  isActive,
});
const topic = (id: string, subjectId: string, name: string): Chapter => ({
  id,
  subjectId,
  name,
  slug: id,
  orderIndex: 0,
  isActive: true,
});
const subjects = [
  subject('math', 'Mathematics'),
  subject('gk', 'General Knowledge'),
  subject('eng', 'English', false),
];
const topics = [
  topic('alg', 'math', 'Algebra'),
  topic('geo', 'math', 'Geometry'),
  topic('hist', 'gk', 'History'),
];

function Harness({
  initial = { subjectIds: [], topicIds: [] },
  onChange,
  initialSubjectIds,
}: {
  initial?: CurriculumSelection;
  onChange?: (next: CurriculumSelection) => void;
  initialSubjectIds?: string[];
}) {
  const [value, setValue] = useState(initial);
  return (
    <MemoryRouter>
      <ExamCurriculumPicker
        subjects={subjects}
        topics={topics}
        subjectIds={value.subjectIds}
        topicIds={value.topicIds}
        initialSubjectIds={initialSubjectIds}
        onChange={(next) => {
          setValue(next);
          onChange?.(next);
        }}
        onRefresh={() => {}}
      />
    </MemoryRouter>
  );
}

const subjectList = () => screen.getByRole('list', { name: 'Subjects' });

describe('ExamCurriculumPicker', () => {
  it('renders the assign-only section with navigation links instead of create forms', () => {
    render(<Harness />);
    expect(screen.getByRole('heading', { name: 'Assigned Subjects & Topics' })).toBeInTheDocument();
    const add = screen.getByRole('link', { name: /Add Subject/ });
    expect(add).toHaveAttribute('href', '/admin/subjects');
    expect(add).toHaveAttribute('target', '_blank');
    expect(add).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByRole('link', { name: /Manage Topics/ })).toHaveAttribute(
      'href',
      '/admin/topics'
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Subject name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh lists' })).toBeInTheDocument();
  });

  it('marks inactive and already-assigned subjects', () => {
    render(<Harness initialSubjectIds={['gk']} />);
    const english = within(subjectList()).getByText('English').closest('label')!;
    expect(within(english).getByText('Inactive')).toBeInTheDocument();
    const gk = within(subjectList()).getByText('General Knowledge').closest('label')!;
    expect(within(gk).getByText('Assigned')).toBeInTheDocument();
  });

  it('selects subjects, searches, select-all visible and clears', () => {
    const onChange = vi.fn();
    render(<Harness onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Mathematics/ }));
    expect(onChange).toHaveBeenLastCalledWith({ subjectIds: ['math'], topicIds: [] });
    expect(screen.getByText('Subjects · 1 selected')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search subjects'), { target: { value: 'eng' } });
    expect(within(subjectList()).queryByText('Mathematics')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(onChange).toHaveBeenLastCalledWith({ subjectIds: ['eng', 'math'], topicIds: [] });

    fireEvent.change(screen.getByLabelText('Search subjects'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Select all' }));
    expect(screen.getByText('Subjects · 3 selected')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }));
    expect(onChange).toHaveBeenLastCalledWith({ subjectIds: [], topicIds: [] });
  });

  it('shows topics only for selected subjects, grouped with counts and empty-group link', () => {
    render(<Harness />);
    expect(screen.queryByText('Algebra')).not.toBeInTheDocument();
    expect(screen.getByText('Select a subject to choose its topics.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('checkbox', { name: /Mathematics/ }));
    const group = screen.getByRole('group', { name: 'Mathematics topics' });
    expect(within(group).getByText('Algebra')).toBeInTheDocument();
    expect(within(group).getByText('0 of 2 selected')).toBeInTheDocument();
    expect(screen.queryByText('History')).not.toBeInTheDocument();

    fireEvent.click(
      within(group).getByRole('button', { name: 'Select all topics in Mathematics' })
    );
    expect(within(group).getByText('2 of 2 selected')).toBeInTheDocument();
    expect(screen.getByText('Topics · 2 selected')).toBeInTheDocument();
    fireEvent.click(within(group).getByRole('button', { name: 'Clear topics in Mathematics' }));
    expect(within(group).getByText('0 of 2 selected')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /English/ }));
    const empty = screen.getByRole('group', { name: 'English topics' });
    expect(within(empty).getByText(/No topics yet — create them on the/)).toBeInTheDocument();
    expect(within(empty).getByRole('link', { name: 'Topics page' })).toHaveAttribute(
      'href',
      '/admin/topics?subject=eng'
    );
  });

  it('collapses a group and filters topics by search', () => {
    render(<Harness initial={{ subjectIds: ['math'], topicIds: [] }} />);
    const toggle = screen.getByRole('button', { name: /Mathematics.*0 of 2 selected/ });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    fireEvent.change(screen.getByLabelText('Search topics'), { target: { value: 'geo' } });
    expect(screen.queryByText('Algebra')).not.toBeInTheDocument();
    expect(screen.getByText('Geometry')).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByText('Geometry')).not.toBeInTheDocument();
  });

  it('confirms before deselecting a subject with selected topics, then prunes them', () => {
    const onChange = vi.fn();
    render(
      <Harness
        initial={{ subjectIds: ['math', 'gk'], topicIds: ['alg', 'geo', 'hist'] }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /Mathematics/ }));
    const confirm = screen.getByRole('alertdialog');
    expect(confirm).toHaveTextContent(
      'Removing Mathematics also unassigns its 2 selected topics. Subjects and topics are not deleted.'
    );
    expect(onChange).not.toHaveBeenCalled();

    fireEvent.click(within(confirm).getByRole('button', { name: 'Cancel' }));
    expect(screen.getByRole('checkbox', { name: /Mathematics/ })).toBeChecked();

    fireEvent.click(screen.getByRole('checkbox', { name: /Mathematics/ }));
    fireEvent.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Remove' })
    );
    expect(onChange).toHaveBeenLastCalledWith({ subjectIds: ['gk'], topicIds: ['hist'] });
    expect(screen.queryByText('Algebra')).not.toBeInTheDocument();
  });

  it('deselects without confirmation when the subject has no selected topics', () => {
    const onChange = vi.fn();
    render(<Harness initial={{ subjectIds: ['math'], topicIds: [] }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('checkbox', { name: /Mathematics/ }));
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith({ subjectIds: [], topicIds: [] });
  });

  it('shows loading and error states', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ExamCurriculumPicker
          subjects={[]}
          topics={[]}
          subjectIds={[]}
          topicIds={[]}
          onChange={() => {}}
          loading
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('status')).toHaveTextContent('Loading subjects and topics');
    rerender(
      <MemoryRouter>
        <ExamCurriculumPicker
          subjects={[]}
          topics={[]}
          subjectIds={[]}
          topicIds={[]}
          onChange={() => {}}
          error="Permission denied"
        />
      </MemoryRouter>
    );
    expect(screen.getByRole('alert')).toHaveTextContent('Permission denied');
  });
});
