import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  writes: [] as { op: 'insert' | 'update'; payload: Record<string, unknown> }[],
}));

vi.mock('@/lib/supabase', () => {
  const row = (payload: Record<string, unknown>) => ({
    id: 'q1',
    question_text: 'Q',
    option_a: '',
    option_b: 'B',
    option_c: 'C',
    option_d: 'D',
    correct_option: 'A',
    default_marks: 1,
    default_negative_marks: 0,
    is_active: true,
    ...payload,
  });
  const from = () => {
    let last: Record<string, unknown> = {};
    const chain = {
      insert(p: Record<string, unknown>) {
        mocks.writes.push({ op: 'insert', payload: p });
        last = p;
        return chain;
      },
      update(p: Record<string, unknown>) {
        mocks.writes.push({ op: 'update', payload: p });
        last = p;
        return chain;
      },
      eq: () => chain,
      select: () => chain,
      single: () => Promise.resolve({ data: row(last), error: null }),
    };
    return chain;
  };
  return { isSupabaseConfigured: true, supabaseRuntime: { from } };
});

import {
  createQuestion,
  updateQuestion,
  primeOptionImageColumns,
  OPTION_IMAGES_MIGRATION_MESSAGE,
} from './admin.questions';
import type { Question } from '@/types';

const base = {
  questionText: 'Which figure completes the pattern?',
  optionA: '',
  optionB: 'Figure 2',
  optionC: 'Figure 3',
  optionD: 'Figure 4',
  correctOption: 'A',
  defaultMarks: 1,
  defaultNegativeMarks: 0,
  isActive: true,
} as Omit<Question, 'id'> as Question;

const IMG = 'https://x.supabase.co/storage/v1/object/public/question-images/a.png';

beforeEach(() => {
  mocks.writes = [];
  primeOptionImageColumns(true);
});

describe('option images when saving questions', () => {
  it('a text-only question writes no option image columns (saves exactly as before)', async () => {
    await createQuestion({ ...base, optionA: 'Figure 1' });
    expect(
      Object.keys(mocks.writes[0].payload).some(
        (k) => k.includes('image_url') && k.startsWith('option_')
      )
    ).toBe(false);
  });

  it('saves an image-only option and maps it back', async () => {
    const saved = await createQuestion({ ...base, optionAImageUrl: IMG });
    expect(mocks.writes[0].payload).toMatchObject({ option_a: '', option_a_image_url: IMG });
    expect(mocks.writes[0].payload).not.toHaveProperty('option_b_image_url');
    expect(saved.optionAImageUrl).toBe(IMG);
    expect(saved.optionBImageUrl).toBeUndefined();
  });

  it('an edit can replace or remove an option image', async () => {
    await updateQuestion('q1', { optionAImageUrl: IMG, optionCImageUrl: '' });
    expect(mocks.writes[0].payload).toMatchObject({
      option_a_image_url: IMG,
      option_c_image_url: null,
    });
  });

  it('saves a question whose question is an image (figure / table) with no text', async () => {
    await createQuestion({
      ...base,
      questionText: '',
      imageUrl: 'https://x.supabase.co/storage/v1/object/public/question-images/grid.png',
      optionA: '12',
    });
    expect(mocks.writes[0].payload).toMatchObject({
      question_text: '',
      image_url: 'https://x.supabase.co/storage/v1/object/public/question-images/grid.png',
    });
  });

  it('an edit can replace or remove the question image', async () => {
    await updateQuestion('q1', { imageUrl: '' });
    expect(mocks.writes[0].payload).toEqual({ image_url: null });
  });

  it('before the migration: text edits still save, an image explains the missing update', async () => {
    primeOptionImageColumns(false);
    await updateQuestion('q1', { optionB: 'New text', optionCImageUrl: '' });
    expect(mocks.writes[0].payload).toEqual({ option_b: 'New text' });

    await expect(createQuestion({ ...base, optionAImageUrl: IMG })).rejects.toThrow(
      OPTION_IMAGES_MIGRATION_MESSAGE
    );
  });
});
