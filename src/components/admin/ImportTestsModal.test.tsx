import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportTestsModal } from './ImportTestsModal';
import { api } from '@/services/api';
import type { Chapter, Exam, MockTest, Subject } from '@/types';

const exams = [{ id: 'e1', title: 'WBP Constable' }] as Exam[];
const subjects = [
  { id: 's1', name: 'General Science' },
  { id: 's2', name: 'History' },
] as Subject[];
const chapters = [
  { id: 't1', name: 'Heat', subjectId: 's1' },
  { id: 't2', name: 'Mughals', subjectId: 's2' },
] as Chapter[];

function upload(csv: string) {
  const onImportComplete = vi.fn();
  render(
    <ImportTestsModal
      isOpen
      onClose={vi.fn()}
      exams={exams}
      subjects={subjects}
      chapters={chapters}
      onImportComplete={onImportComplete}
    />
  );
  const file = new File([csv], 'tests.csv', { type: 'text/csv' });
  // jsdom File.text() support varies; provide it explicitly.
  Object.defineProperty(file, 'text', { value: async () => csv });
  fireEvent.change(document.querySelector('input[type="file"]')!, { target: { files: [file] } });
  fireEvent.click(screen.getByRole('button', { name: 'Upload & Import' }));
  return { onImportComplete };
}

const header = 'title,testType,examName,subjectName,topicName,year';
let createSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.restoreAllMocks();
  createSpy = vi.spyOn(api, 'createTest').mockResolvedValue({ id: 'x' } as MockTest);
});

describe('ImportTestsModal row validation', () => {
  it('shows row-level errors and imports nothing when any row is invalid', async () => {
    const { onImportComplete } = upload(
      [
        header,
        'Good,full_mock,WBP Constable,,,',
        'Legacy,subject_mock,,History,,',
        'Wrong topic,topic,,General Science,Mughals,',
        'Bad exam,pyq,Nope,,,2020',
      ].join('\n')
    );
    const list = await screen.findByRole('list', { name: 'Row errors' });
    expect(list).toHaveTextContent('Row 3 (Legacy):');
    expect(list).toHaveTextContent(/legacy test type/);
    expect(list).toHaveTextContent('Topic "Mughals" does not belong to subject "General Science".');
    expect(list).toHaveTextContent('Unknown exam "Nope".');
    expect(list).not.toHaveTextContent('Row 2');
    expect(screen.getByText(/3 of 4 rows have problems/)).toBeInTheDocument();
    expect(createSpy).not.toHaveBeenCalled();
    expect(onImportComplete).not.toHaveBeenCalled();
  });

  it('imports valid rows with resolved IDs', async () => {
    const { onImportComplete } = upload(
      [header, 'Heat drill,topic,,General Science,Heat,', 'PYQ,pyq,WBP Constable,,,2022'].join('\n')
    );
    await waitFor(() => expect(onImportComplete).toHaveBeenCalled());
    expect(createSpy).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ testType: 'topic', subjectId: 's1', chapterId: 't1' })
    );
    expect(createSpy).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ testType: 'pyq', examId: 'e1', year: 2022 })
    );
    expect(screen.getByText('Successfully imported 2 mock tests!')).toBeInTheDocument();
  });
});
