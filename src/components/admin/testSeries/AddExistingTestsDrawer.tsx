import React, { useMemo, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { MockTest, TestSeries } from '@/types';
import {
  seriesTestIncompatibility,
  type SeriesMembership,
} from '@/services/domains/admin.contentLinks';
import { cn } from '@/lib/utils';
import {
  TestStatusBadge,
  TestTypeBadge,
  testExamIds,
  testExamLabel,
  testKind,
  testSubjectTopic,
  type ExamOption,
  type TestTypeFilter,
} from './seriesTestHelpers';

export interface AddExistingTestsDrawerProps {
  series: Pick<TestSeries, 'id' | 'title' | 'examId'>;
  /** Every admin test, with associatedExamIds filled from test_exams. */
  tests: MockTest[];
  exams: ExamOption[];
  memberships: SeriesMembership[];
  /** Test ids currently in this series (including staged, unsaved additions). */
  includedIds: string[];
  isLoading?: boolean;
  error?: string | null;
  onAdd: (testIds: string[]) => void;
  onClose: () => void;
}

/**
 * Picks EXISTING tests to add to a series. It never creates tests: individual tests are made in
 * Mock Test Management. Selected tests are appended to the series' staged list (saved later).
 */
export const AddExistingTestsDrawer: React.FC<AddExistingTestsDrawerProps> = ({
  series,
  tests,
  exams,
  memberships,
  includedIds,
  isLoading = false,
  error = null,
  onAdd,
  onClose,
}) => {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TestTypeFilter>('all');
  const [examFilter, setExamFilter] = useState<string>(series.examId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | MockTest['status']>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const examTitles = useMemo(() => new Map(exams.map((e) => [e.id, e.title])), [exams]);
  const included = useMemo(() => new Set(includedIds), [includedIds]);

  const otherSeriesCount = useMemo(() => {
    const map = new Map<string, Set<string>>();
    for (const m of memberships) {
      if (m.seriesId === series.id) continue;
      if (!map.has(m.testId)) map.set(m.testId, new Set());
      map.get(m.testId)!.add(m.seriesId);
    }
    return map;
  }, [memberships, series.id]);

  // Everything except the exam filter, so we can say how many the exam filter hides.
  const matchesNonExam = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tests.filter((t) => {
      if (typeFilter !== 'all' && testKind(t) !== typeFilter) return false;
      if (statusFilter !== 'all' && t.status !== statusFilter) return false;
      if (!q) return true;
      return [t.title, t.subjectName, t.chapterName, t.topicName, testExamLabel(t, examTitles)]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [tests, search, typeFilter, statusFilter, examTitles]);

  const visible = useMemo(() => {
    if (examFilter === 'all') return matchesNonExam;
    // Topic Tests are exam-independent: an exam filter never hides them.
    return matchesNonExam.filter(
      (t) => testKind(t) === 'topic' || testExamIds(t).includes(examFilter)
    );
  }, [matchesNonExam, examFilter]);

  const hiddenByExam = matchesNonExam.length - visible.length;

  const rows = useMemo(
    () =>
      visible.map((t) => ({
        test: t,
        already: included.has(t.id),
        reason: seriesTestIncompatibility(series, t),
      })),
    [visible, included, series]
  );
  const selectable = rows.filter((r) => !r.already && !r.reason).map((r) => r.test.id);
  const allVisibleSelected = selectable.length > 0 && selectable.every((id) => selected.has(id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAdd = () => {
    // Preserve catalogue order; never include duplicates or tests already in the series.
    const ids = tests.map((t) => t.id).filter((id) => selected.has(id) && !included.has(id));
    if (ids.length) onAdd(ids);
  };

  const selectClass =
    'p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F8FAFC] dark:bg-[#1E293B] text-xs font-bold cursor-pointer';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-existing-tests-title"
        className="h-full w-full max-w-2xl bg-white dark:bg-[#0B132B] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col text-xs"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3">
          <div>
            <h3
              id="add-existing-tests-title"
              className="text-base font-extrabold text-slate-900 dark:text-white"
            >
              Add Existing Tests
            </h3>
            <p className="text-slate-500 mt-0.5">
              Choose tests for <strong>{series.title}</strong>. Tests are created in Mock Test
              Management; adding them here only links them to this series. Added tests are stored
              when you click Save in Included Tests.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close add existing tests"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2 border-b border-slate-100 dark:border-slate-800">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              aria-label="Search tests"
              placeholder="Search by title, subject, topic or exam…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-[#F8FAFC] dark:bg-[#1E293B] border border-slate-200 dark:border-slate-700 rounded-xl"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Test type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TestTypeFilter)}
              className={selectClass}
            >
              <option value="all">All types</option>
              <option value="full_mock">Full Mock</option>
              <option value="topic">Topic Test</option>
              <option value="pyq">Official PYQ</option>
            </select>
            <select
              aria-label="Exam"
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className={selectClass}
            >
              <option value="all">All exams</option>
              {exams.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                  {e.id === series.examId ? ' (series target)' : ''}
                </option>
              ))}
            </select>
            <select
              aria-label="Publication status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | MockTest['status'])}
              className={selectClass}
            >
              <option value="all">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <button
              type="button"
              disabled={selectable.length === 0}
              onClick={() =>
                setSelected((prev) => {
                  const next = new Set(prev);
                  for (const id of selectable)
                    if (allVisibleSelected) next.delete(id);
                    else next.add(id);
                  return next;
                })
              }
              className="ml-auto px-2.5 py-1.5 font-bold border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
            >
              {allVisibleSelected ? 'Clear visible' : 'Select all visible'}
            </button>
          </div>
          {examFilter !== 'all' && (
            <p className="text-[11px] text-slate-500">
              Showing tests linked to this exam plus all exam-independent Topic Tests.
              {hiddenByExam > 0 && (
                <>
                  {' '}
                  {hiddenByExam} test{hiddenByExam === 1 ? '' : 's'} for other exams hidden.{' '}
                  <button
                    type="button"
                    onClick={() => setExamFilter('all')}
                    className="font-bold text-[#026BFC] hover:underline cursor-pointer"
                  >
                    Show all exams
                  </button>
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex-1 overflow-y-auto" aria-busy={isLoading}>
          {isLoading ? (
            <p role="status" className="p-8 text-center text-slate-400">
              Loading tests…
            </p>
          ) : error ? (
            <p role="alert" className="m-4 p-3 rounded-xl bg-rose-50 text-rose-700 font-semibold">
              {error}
            </p>
          ) : tests.length === 0 ? (
            <p className="p-8 text-center text-slate-400">
              No tests exist yet. Create tests in Mock Test Management, then add them here.
            </p>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-slate-400">No tests match these filters.</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {rows.map(({ test, already, reason }) => {
                const disabled = already || Boolean(reason);
                const others = otherSeriesCount.get(test.id)?.size ?? 0;
                const subjectTopic = testSubjectTopic(test);
                return (
                  <li key={test.id} data-testid={`add-test-${test.id}`}>
                    <label
                      className={cn(
                        'p-3 flex items-start gap-3',
                        disabled
                          ? 'opacity-70 cursor-not-allowed'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer'
                      )}
                    >
                      <input
                        type="checkbox"
                        aria-label={`Select ${test.title}`}
                        checked={already || selected.has(test.id)}
                        disabled={disabled}
                        onChange={() => toggle(test.id)}
                        className="mt-0.5 rounded border-slate-300 text-[#026BFC] cursor-pointer disabled:cursor-not-allowed"
                      />
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {test.title}
                          </span>
                          <TestTypeBadge test={test} />
                          <TestStatusBadge status={test.status} />
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {testExamLabel(test, examTitles)}
                          {subjectTopic && <> · {subjectTopic}</>} · {test.totalQuestions ?? 0}{' '}
                          questions · {test.durationMinutes ?? 0} min
                        </p>
                        <div className="flex flex-wrap gap-2 text-[11px]">
                          {others > 0 && (
                            <span className="text-slate-500">Also in {others} other series</span>
                          )}
                          {already && (
                            <span className="font-bold text-emerald-700 dark:text-emerald-300">
                              Already in this series
                            </span>
                          )}
                          {!already && reason && (
                            <span className="font-bold text-rose-700 dark:text-rose-300">
                              Not compatible: {reason}
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
          <span className="font-bold text-slate-600 dark:text-slate-300" aria-live="polite">
            {selected.size} selected
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={handleAdd}
              className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold disabled:opacity-40 cursor-pointer"
            >
              Add {selected.size} test{selected.size === 1 ? '' : 's'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
