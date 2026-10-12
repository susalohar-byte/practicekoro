import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, Pencil, Search } from 'lucide-react';
import type { Chapter, Exam, Subject } from '@/types';
import type { ExamCurriculum } from '@/services/domains/admin.contentLinks';
import { subjectManagementPath, topicManagementPath } from '@/utils/examSubjectLinks';

/**
 * Read-only view of the subjects and topics assigned to an exam (exam_subjects / exam_topics).
 * Assignments are changed only through the exam edit form; records are never created here.
 */
export function ExamLinkedSubjects({
  exam,
  subjects,
  topics,
  curriculum,
  error,
  loading,
  onRetry,
  onEdit,
}: {
  exam: Exam;
  subjects: Subject[];
  topics: Chapter[];
  /** null when the assignments could not be read. */
  curriculum: ExamCurriculum | null | undefined;
  error?: string;
  loading: boolean;
  onRetry: () => void;
  onEdit: () => void;
}) {
  const [search, setSearch] = useState('');
  useEffect(() => setSearch(''), [exam.id]);

  const assigned = useMemo(() => {
    if (!curriculum) return [];
    const topicIds = new Set(curriculum.topicIds);
    return curriculum.subjectIds.map((id) => ({
      id,
      subject: subjects.find((s) => s.id === id),
      topics: topics
        .filter((t) => t.subjectId === id && topicIds.has(t.id))
        .sort((a, b) => a.orderIndex - b.orderIndex || a.name.localeCompare(b.name)),
    }));
  }, [curriculum, subjects, topics]);
  const unavailable = !!error || curriculum === null;
  const visible = assigned.filter((row) =>
    (row.subject?.name ?? '').toLocaleLowerCase().includes(search.trim().toLocaleLowerCase())
  );
  const editButton = (
    <button
      type="button"
      onClick={onEdit}
      className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 font-semibold text-white"
    >
      <Pencil size={16} aria-hidden />
      Edit assignments
    </button>
  );

  return (
    <section aria-label="Assigned subjects" className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-900 dark:text-white">
          Assigned Subjects (
          {loading && curriculum === undefined
            ? 'Loading…'
            : unavailable
              ? 'Unavailable'
              : assigned.length}
          )
        </h3>
        <Link
          to={subjectManagementPath(exam.id)}
          className="inline-flex min-h-11 items-center font-semibold text-blue-700 dark:text-blue-300"
        >
          Manage Subjects <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      <p className="leading-relaxed text-slate-600 dark:text-slate-300">
        Subjects and topics assigned to {exam.title}. Subjects and topics are created on their own
        pages; here you only choose which existing ones belong to this exam.
      </p>
      {loading && curriculum === undefined ? (
        <p role="status">Loading assigned subjects…</p>
      ) : unavailable ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200"
        >
          {error || 'Assigned subjects could not be loaded.'}
          <button type="button" onClick={onRetry} className="ml-3 min-h-11 font-semibold underline">
            Retry subjects
          </button>
        </div>
      ) : assigned.length === 0 ? (
        <div className="space-y-3 rounded-xl border border-dashed border-slate-300 p-4 text-slate-600 dark:text-slate-300">
          <p>No subjects assigned yet</p>
          {editButton}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            {editButton}
            <span className="text-slate-600 dark:text-slate-300">
              {assigned.length} subject{assigned.length === 1 ? '' : 's'} ·{' '}
              {curriculum?.topicIds.length ?? 0} topic
              {curriculum?.topicIds.length === 1 ? '' : 's'} assigned
            </span>
          </div>
          <label className="relative block">
            <span className="sr-only">Search assigned subjects</span>
            <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search assigned subjects…"
              className="min-h-11 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 dark:border-slate-700 dark:bg-slate-900"
            />
          </label>
          {visible.length ? (
            <ul className="max-h-96 space-y-2 overflow-y-auto pr-1">
              {visible.map(({ id, subject, topics: assignedTopics }) => (
                <li
                  key={id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  {subject ? (
                    <Link
                      to={subjectManagementPath(exam.id, subject.id)}
                      className="flex min-h-11 items-center gap-3 font-semibold text-slate-900 dark:text-white"
                    >
                      <BookOpen size={18} className="shrink-0 text-blue-600 dark:text-blue-300" />
                      <span className="min-w-0 flex-1 break-words">{subject.name}</span>
                      <ArrowRight size={16} className="shrink-0" />
                    </Link>
                  ) : (
                    <p className="font-semibold text-slate-500">Subject record unavailable</p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                    {subject && <span>{subject.isActive ? 'Published' : 'Draft'}</span>}
                    {subject && <span>·</span>}
                    <span>
                      {assignedTopics.length} of{' '}
                      {subject?.chaptersCount ?? topics.filter((t) => t.subjectId === id).length}{' '}
                      topics assigned
                    </span>
                  </div>
                  {assignedTopics.length > 0 && (
                    <ul
                      aria-label={`Assigned topics for ${subject?.name ?? 'subject'}`}
                      className="mt-2 flex flex-wrap gap-1.5"
                    >
                      {assignedTopics.map((topic) => (
                        <li
                          key={topic.id}
                          className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {topic.name}
                        </li>
                      ))}
                    </ul>
                  )}
                  {subject && (
                    <Link
                      to={topicManagementPath(exam.id, subject.id)}
                      className="mt-2 inline-flex min-h-11 items-center font-semibold text-blue-700 dark:text-blue-300"
                    >
                      Manage Topics
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-slate-600 dark:text-slate-300">
              No assigned subjects match this search.
            </p>
          )}
        </>
      )}
    </section>
  );
}
