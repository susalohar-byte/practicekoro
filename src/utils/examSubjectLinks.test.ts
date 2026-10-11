import { describe, expect, it } from 'vitest';
import type { Subject } from '@/types';
import { subjectsForExam, subjectManagementPath } from './examSubjectLinks';
describe('Existing exam-subject relationship model', () => {
  it('includes owned and global subjects, excludes other owners, orders actual records', () => {
    const rows = [
      { id: 'other', examId: 'b', name: 'Other', orderIndex: 0 },
      { id: 'owned', examId: 'a', name: 'Owned', orderIndex: 2 },
      { id: 'shared', name: 'Shared', orderIndex: 1 },
    ] as Subject[];
    expect(subjectsForExam(rows, 'a').map((x) => x.id)).toEqual(['shared', 'owned']);
    expect(rows[0].id).toBe('other');
  });
  it('encodes real identifiers without adding unrelated route parameters', () => {
    expect(subjectManagementPath('exam&a', 'subject/b')).toBe(
      '/admin/subjects?examId=exam%26a&subjectId=subject%2Fb'
    );
  });
});
import { applyExamImportScope } from './examSubjectLinks';
it('scope imports use the selected exam rather than implicitly shared ownership', () => {
  const row = { name: 'Math', slug: 'math' } as Omit<Subject, 'id'>;
  expect(applyExamImportScope([row], 'a')[0].examId).toBe('a');
  expect(row.examId).toBeUndefined();
  expect(() => applyExamImportScope([{ ...row, examId: 'b' }], 'a')).toThrow('another exam');
  expect(() => applyExamImportScope([row, { ...row, examId: 'a' }], 'a')).toThrow('unique within');
});
