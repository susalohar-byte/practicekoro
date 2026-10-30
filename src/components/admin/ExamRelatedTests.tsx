import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { api } from '@/services/api';
import type { ExamRelatedTest } from '@/services/domains/admin.examMappings';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

const SECTIONS: {
  key: string;
  title: string;
  tab: string;
  match: (t: ExamRelatedTest) => boolean;
}[] = [
  {
    key: 'full_mock',
    title: 'Full Mock Tests',
    tab: 'full_mock',
    match: (t) => t.testType === 'full_mock',
  },
  { key: 'pyq', title: 'Official PYQs', tab: 'pyq', match: (t) => t.testType === 'pyq' },
  {
    key: 'topic',
    title: 'Topic Practice',
    tab: 'topic',
    match: (t) =>
      t.testType === 'topic' || t.testType === 'chapter_mock' || t.testType === 'subject_mock',
  },
];

const LINK_LABEL: Record<ExamRelatedTest['linkedVia'], string> = {
  primary_exam: 'Exam',
  exam_association: 'Linked',
  mapped_topic: 'Via topic',
};

const subtitle = (t: ExamRelatedTest) => {
  if (t.testType === 'pyq')
    return [t.year, t.paperName, t.setName && `Set ${t.setName}`].filter(Boolean).join(' · ');
  if (t.testType === 'full_mock') return `${t.durationMinutes} min`;
  return [t.subjectName, t.chapterName].filter(Boolean).join(' › ');
};

/** Read-only list of central tests related to an exam; each row links to its central record. */
export const ExamRelatedTests: React.FC<{ examId: string }> = ({ examId }) => {
  const [tests, setTests] = useState<ExamRelatedTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    api
      .getExamRelatedTests(examId)
      .then((rows) => {
        if (!cancelled) setTests(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err, 'Related tests could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  if (loading) return <p className="text-[11px] text-slate-500 py-4 text-center">Loading tests…</p>;
  if (error)
    return (
      <p className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-[11px] text-rose-600">
        {error}
      </p>
    );

  return (
    <div className="space-y-3.5 text-xs">
      <p className="text-[11px] text-slate-500">
        Tests are managed centrally in Mock Test Management. Topic Practice lists Topic Tests from
        this exam&apos;s mapped topics.
      </p>
      {SECTIONS.map((section) => {
        const rows = tests.filter(section.match).sort((a, b) => a.title.localeCompare(b.title));
        return (
          <div key={section.key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white">
                {section.title} ({rows.length})
              </span>
              <Link
                to={`/admin/mock-tests?tab=${section.tab}`}
                className="text-xs text-[#026BFC] hover:underline font-semibold"
              >
                Manage
              </Link>
            </div>
            {rows.length === 0 ? (
              <p className="text-[11px] text-slate-400">None yet.</p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {rows.map((t) => (
                  <Link
                    key={t.id}
                    to={`/admin/tests/${encodeURIComponent(t.id)}/questions`}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 flex items-center gap-2 hover:border-blue-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-800 dark:text-slate-200 block truncate">
                        {t.title}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {[subtitle(t), `${t.totalQuestions} Qs`].filter(Boolean).join(' · ')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {LINK_LABEL[t.linkedVia]}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0',
                        t.status === 'published'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                      )}
                    >
                      {t.status === 'published'
                        ? 'Published'
                        : t.status === 'archived'
                          ? 'Archived'
                          : 'Draft'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
