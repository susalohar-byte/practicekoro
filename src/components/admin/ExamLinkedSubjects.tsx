import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import type { Exam, Subject } from '@/types';
import { subjectsForExam, subjectManagementPath } from '@/utils/examSubjectLinks';
export function ExamLinkedSubjects({
  exam,
  subjects,
  error,
  loading,
  onRetry,
}: {
  exam: Exam;
  subjects: Subject[];
  error?: string;
  loading: boolean;
  onRetry: () => void;
}) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  useEffect(() => {
    setSearch('');
    setStatus('all');
  }, [exam.id]);
  const linked = useMemo(() => subjectsForExam(subjects, exam.id), [subjects, exam.id]);
  const visible = linked.filter(
    (subject) =>
      subject.name.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()) &&
      (status === 'all' || (status === 'published' ? subject.isActive : !subject.isActive))
  );
  const shared = linked.filter((subject) => !subject.examId).length;
  return (
    <section aria-label="Linked subjects" className="space-y-4 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-bold text-slate-900 dark:text-white">
          Linked Subjects ({loading ? 'Loading…' : error ? 'Unavailable' : linked.length})
        </h3>
        <Link
          to={subjectManagementPath(exam.id)}
          className="inline-flex min-h-11 items-center font-semibold text-blue-700 dark:text-blue-300"
        >
          Manage Subjects <ArrowRight size={16} className="ml-1" />
        </Link>
      </div>
      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
        Subjects available for {exam.title}. Exam-specific subjects belong to this exam; shared
        subjects apply to all exams. Draft subjects are visible to admins only.
      </p>
      {loading ? (
        <p role="status">Loading linked subject records…</p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:bg-red-950/30 dark:text-red-200"
        >
          {error}
          <button type="button" onClick={onRetry} className="ml-3 min-h-11 font-semibold underline">
            Retry subjects
          </button>
        </div>
      ) : (
        <>
          <p className="text-slate-600 dark:text-slate-300">
            {linked.length - shared} exam-specific · {shared} shared ·{' '}
            {linked.filter((s) => s.isActive).length} published
          </p>
          <div className="flex flex-wrap gap-2">
            <label className="relative flex-1 min-w-40">
              <span className="sr-only">Search linked subjects</span>
              <Search size={16} className="absolute left-3 top-3.5 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search linked subjects…"
                className="w-full min-h-11 rounded-xl border border-slate-200 bg-white pl-9 pr-3 dark:bg-slate-900 dark:border-slate-700"
              />
            </label>
            <select
              aria-label="Linked subject status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="min-h-11 rounded-xl border border-slate-200 bg-white px-3 dark:bg-slate-900 dark:border-slate-700"
            >
              <option value="all">All status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </div>
          {visible.length ? (
            <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {visible.map((subject) => (
                <li
                  key={subject.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/60"
                >
                  <Link
                    to={subjectManagementPath(exam.id, subject.id)}
                    className="flex min-h-11 items-center gap-3 font-semibold text-slate-900 dark:text-white"
                  >
                    <BookOpen size={18} className="shrink-0 text-blue-600 dark:text-blue-300" />
                    <span className="min-w-0 flex-1 break-words">{subject.name}</span>
                    <ArrowRight size={16} className="shrink-0" />
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span>{subject.examId ? 'Exam-specific' : 'Shared · all exams'}</span>
                    <span>·</span>
                    <span>{subject.isActive ? 'Published' : 'Draft'}</span>
                    <span>·</span>
                    <span>
                      {subject.chaptersCount === undefined
                        ? 'Topic count unavailable'
                        : `${subject.chaptersCount} topics`}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-xl border border-dashed border-slate-300 p-4 text-slate-600 dark:text-slate-300">
              {linked.length
                ? 'No linked subjects match these filters.'
                : 'No subjects are available for this exam yet. Use Manage Subjects to create an exam-specific subject.'}
            </p>
          )}
          <p className="text-slate-500 dark:text-slate-400">
            Showing {visible.length} of {linked.length} subjects. Shared subjects are not separate
            per-exam links; editing them affects every exam.
          </p>
        </>
      )}
    </section>
  );
}
