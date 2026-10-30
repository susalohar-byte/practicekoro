import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SolutionQuestion } from '@/types/models';
import {
  clearSavedQuestionsCache,
  deleteSavedQuestion,
  readSavedQuestions,
  writeSavedQuestion,
} from './savedQuestions';

const q = (id: string): SolutionQuestion => ({
  id,
  order: 1,
  textEnglish: `Question ${id}`,
  textBengali: null,
  imageUrl: null,
  options: { A: 'a', B: 'b', C: 'c', D: 'd' },
  marks: 1,
  negativeMarks: 0.25,
  selected: null,
  correct: 'A',
  isCorrect: false,
  marksAwarded: 0,
  explanation: null,
  explanationBengali: null,
  isBookmarked: true,
});

beforeEach(() => localStorage.clear());

describe('saved questions cache', () => {
  it('stores questions per student', () => {
    writeSavedQuestion('u1', q('q1'));
    writeSavedQuestion('u1', q('q2'));
    writeSavedQuestion('u2', q('q9'));
    expect(Object.keys(readSavedQuestions('u1')).sort()).toEqual(['q1', 'q2']);
    expect(Object.keys(readSavedQuestions('u2'))).toEqual(['q9']);
    expect(readSavedQuestions('nobody')).toEqual({});
  });

  it('overwrites an existing copy of the same question', () => {
    writeSavedQuestion('u1', q('q1'));
    writeSavedQuestion('u1', { ...q('q1'), textEnglish: 'Updated' });
    expect(readSavedQuestions('u1').q1.textEnglish).toBe('Updated');
  });

  it('deletes one question and clears the whole cache', () => {
    writeSavedQuestion('u1', q('q1'));
    writeSavedQuestion('u1', q('q2'));
    deleteSavedQuestion('u1', 'q1');
    expect(Object.keys(readSavedQuestions('u1'))).toEqual(['q2']);
    clearSavedQuestionsCache('u1');
    expect(localStorage.getItem('pk-saved-questions:u1')).toBeNull();
  });

  it('survives corrupt JSON and blocked storage', () => {
    localStorage.setItem('pk-saved-questions:u1', 'not-json');
    expect(readSavedQuestions('u1')).toEqual({});
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeSavedQuestion('u1', q('q1'))).not.toThrow();
    expect(() => deleteSavedQuestion('u1', 'q1')).not.toThrow();
    spy.mockRestore();
  });
});
