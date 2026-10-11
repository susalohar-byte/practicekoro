import type { Subject } from '@/types';
/** Existing schema: one exam owner, or NULL = shared across every exam. */
export function subjectAvailableForExam(subject: Subject, examId: string) {
  return !subject.examId || subject.examId === examId;
}
export function subjectsForExam(subjects: Subject[], examId: string) {
  return subjects
    .filter((subject) => subjectAvailableForExam(subject, examId))
    .sort(
      (a, b) =>
        a.orderIndex - b.orderIndex || a.name.localeCompare(b.name) || a.id.localeCompare(b.id)
    );
}
export function subjectManagementPath(examId: string, subjectId?: string) {
  const query = new URLSearchParams({ examId });
  if (subjectId) query.set('subjectId', subjectId);
  return `/admin/subjects?${query}`;
}
/** Importing in an exam context must not silently create global/foreign records. */
export function applyExamImportScope(rows: Omit<Subject, 'id'>[], examId: string) {
  if (!examId) return rows;
  if (rows.some((row) => row.examId && row.examId !== examId))
    throw new Error(
      'The import contains subjects for another exam. Clear the exam scope to import them.'
    );
  const scoped = rows.map((row) => ({ ...row, examId }));
  const seen = new Set<string>();
  for (const row of scoped) {
    const key = row.slug.trim().toLowerCase();
    if (seen.has(key))
      throw new Error('Imported slugs must be unique within the selected exam scope.');
    seen.add(key);
  }
  return scoped;
}
