import type { Question } from '@/types';

export type UploadMode = 'exam' | 'subject';
export type QuestionBankStatus = 'published' | 'draft' | 'under_review' | 'archived';

/** Display type derived from the stored source_type (question_type is always 'mcq' in the DB). */
export function questionBankType(q: Pick<Question, 'sourceType'>): 'PYQ' | 'Topic' | 'Full Mock' {
  if (q.sourceType === 'pyq') return 'PYQ';
  if (q.sourceType === 'topic') return 'Topic';
  return 'Full Mock';
}

/** Display status: the DB stores published questions as 'active'. */
export function questionBankStatus(q: Pick<Question, 'status'>): string {
  const s = String(q.status || 'active').toLowerCase();
  return s === 'active' ? 'published' : s;
}

/** Option list that always contains the record's current value so a select never misreports it. */
export function withCurrentOption(options: string[], current: string): string[] {
  const unique = Array.from(new Set(options.filter(Boolean)));
  return current && !unique.includes(current) ? [current, ...unique] : unique;
}

/**
 * Detects whether a string contains Bengali Unicode characters (U+0980 to U+09FF).
 */
export function hasBengali(text?: string | null): boolean {
  if (!text) return false;
  return /[\u0980-\u09FF]/.test(text);
}

/**
 * Returns 'font-tiro' class when Bengali text is detected or explicitly required.
 */
export function bengaliFontClass(text?: string | null, force = false): string {
  return force || hasBengali(text) ? 'font-tiro' : '';
}
