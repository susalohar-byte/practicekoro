import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  getAllAdminSubjects: vi.fn(),
  getAllAdminChapters: vi.fn(),
  getExamSubjectTopicMappings: vi.fn(),
  saveExamSubjectTopicMappings: vi.fn(),
}));
vi.mock('@/services/api', () => ({ api }));

import { ExamSubjectTopicMapper } from './ExamSubjectTopicMapper';

const subject = (id: string, name: string, orderIndex: number) => ({
  id,
  name,
  orderIndex,
  isActive: true,
});
const topic = (id: string, subjectId: string, name: string, orderIndex: number) => ({
  id,
  subjectId,
  name,
  orderIndex,
  isActive: true,
});

beforeEach(() => {
  vi.clearAllMocks();
  api.getAllAdminSubjects.mockResolvedValue([
    subject('hist', 'History', 1),
    subject('geo', 'Geography', 2),
  ]);
  api.getAllAdminChapters.mockResolvedValue([
    topic('modern', 'hist', 'Modern India', 1),
    topic('ancient', 'hist', 'Ancient India', 2),
    topic('rivers', 'geo', 'Rivers', 3),
  ]);
  api.getExamSubjectTopicMappings.mockResolvedValue({
    subjectIds: [],
    topicIds: [],
    subjectMappingAvailable: true,
  });
  api.saveExamSubjectTopicMappings.mockResolvedValue({ subjectsPersisted: true });
});

const renderMapper = () =>
  render(
    <MemoryRouter>
      <ExamSubjectTopicMapper examId="wbp" examTitle="WBP Constable" />
    </MemoryRouter>
  );
const subjectBox = (name: string) =>
  screen.getByText(name, { selector: 'span' }).closest('label')!.querySelector('input')!;
const topicBox = (name: string) => screen.getByRole('checkbox', { name });

describe('ExamSubjectTopicMapper', () => {
  it('selecting a subject adds all of its topics to the exam', async () => {
    renderMapper();
    await waitFor(() => expect(screen.getByText('History')).toBeInTheDocument());

    fireEvent.click(subjectBox('History'));
    expect(topicBox('Modern India')).toBeChecked();
    expect(topicBox('Ancient India')).toBeChecked();
    expect(screen.getByText('2/2 topics')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Rivers' })).toBeNull();

    // A single topic can still be left out
    fireEvent.click(topicBox('Ancient India'));
    fireEvent.click(screen.getByRole('button', { name: 'Save Mappings' }));
    await waitFor(() =>
      expect(api.saveExamSubjectTopicMappings).toHaveBeenCalledWith('wbp', ['hist'], ['modern'])
    );
  });

  it('unselecting a subject removes its topics', async () => {
    renderMapper();
    await waitFor(() => expect(screen.getByText('History')).toBeInTheDocument());

    fireEvent.click(subjectBox('History'));
    fireEvent.click(subjectBox('History'));
    expect(screen.getByText('Subjects & Topics (0 / 0)')).toBeInTheDocument();
  });
});
