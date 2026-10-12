import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import type { MockTest, TestSeries } from '@/types';
import { api } from '@/services/api';
import {
  seriesTestIncompatibility,
  type SeriesMembership,
} from '@/services/domains/admin.contentLinks';
import { getErrorMessage } from '@/lib/errors';
import { AddExistingTestsDrawer } from './AddExistingTestsDrawer';
import {
  TestStatusBadge,
  TestTypeBadge,
  testExamLabel,
  testSubjectTopic,
  type ExamOption,
} from './seriesTestHelpers';

export interface IncludedTestsPanelProps {
  series: Pick<TestSeries, 'id' | 'title' | 'examId'>;
  /** Every admin test, with associatedExamIds filled from test_exams. */
  tests: MockTest[];
  exams: ExamOption[];
  memberships: SeriesMembership[];
  testsLoading?: boolean;
  testsError?: string | null;
  /** Set to true to open the Add Existing Tests drawer; acknowledged via onAddRequestHandled. */
  addRequested?: boolean;
  onAddRequestHandled?: () => void;
  onDirtyChange?: (dirty: boolean) => void;
  /** Called after the backend confirmed the new ordered list. */
  onSaved?: (orderedIds: string[]) => void | Promise<void>;
}

const sameOrder = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * The tests a series contains, in display order. Additions, removals and reordering are staged
 * locally and written in one atomic call (admin_set_series_tests). Removing a test from a series
 * never deletes the test or its questions.
 */
export const IncludedTestsPanel: React.FC<IncludedTestsPanelProps> = ({
  series,
  tests,
  exams,
  memberships,
  testsLoading = false,
  testsError = null,
  addRequested = false,
  onAddRequestHandled,
  onDirtyChange,
  onSaved,
}) => {
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [stagedIds, setStagedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const ids = await api.getSeriesTestIds(series.id);
      setSavedIds(ids);
      setStagedIds(ids);
    } catch (err) {
      setLoadError(getErrorMessage(err, 'The tests in this series could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, [series.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    // Never stage additions on top of a list that failed to load: saving would drop the
    // series' existing tests.
    if (!addRequested || isLoading || loadError) return;
    setIsAddOpen(true);
    onAddRequestHandled?.();
  }, [addRequested, onAddRequestHandled, isLoading, loadError]);

  const isDirty = !isLoading && !sameOrder(savedIds, stagedIds);
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);
  useEffect(() => () => onDirtyChange?.(false), [onDirtyChange]);

  const testsById = useMemo(() => new Map(tests.map((t) => [t.id, t])), [tests]);
  const examTitles = useMemo(() => new Map(exams.map((e) => [e.id, e.title])), [exams]);

  const move = (index: number, delta: -1 | 1) => {
    setNotice(null);
    setStagedIds((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const remove = (id: string) => {
    setStagedIds((prev) => prev.filter((x) => x !== id));
    setConfirmRemoveId(null);
    setNotice(null);
  };

  const add = (ids: string[]) => {
    if (isLoading || loadError) return;
    setStagedIds((prev) => [...prev, ...ids.filter((id) => !prev.includes(id))]);
    setIsAddOpen(false);
    setNotice(null);
  };

  const discard = () => {
    setStagedIds(savedIds);
    setSaveError(null);
    setConfirmRemoveId(null);
  };

  const save = async () => {
    if (isSaving || isLoading || loadError) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const ordered = [...stagedIds];
      await api.saveSeriesTests(series.id, ordered);
      setSavedIds(ordered);
      setNotice('Series tests saved.');
      await onSaved?.(ordered);
    } catch (err) {
      // Backend messages (duplicates, incompatible tests) are human-readable — show verbatim.
      setSaveError(getErrorMessage(err, 'The series tests could not be saved.'));
    } finally {
      setIsSaving(false);
    }
  };

  const confirmTest = confirmRemoveId ? testsById.get(confirmRemoveId) : undefined;

  return (
    <section aria-label="Included tests" className="space-y-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">
            Included Tests ({stagedIds.length})
          </h4>
          <p className="text-[11px] text-slate-500">
            Students see these tests in this order. Create tests in Mock Test Management.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAddOpen(true)}
          disabled={isLoading || Boolean(loadError)}
          className="px-3 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white font-bold flex items-center gap-1 shrink-0 disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Existing Tests
        </button>
      </div>

      {isDirty && (
        <div
          role="status"
          className="p-2.5 rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 flex items-center justify-between gap-2"
        >
          <span className="font-bold">Unsaved changes</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={discard}
              disabled={isSaving}
              className="px-3 py-1 rounded-lg border border-amber-300 font-bold cursor-pointer"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={isSaving}
              className="px-3 py-1 rounded-lg bg-[#026BFC] text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      )}
      {saveError && (
        <p role="alert" className="p-2.5 rounded-xl bg-rose-50 text-rose-700 font-semibold">
          {saveError}
        </p>
      )}
      {notice && !isDirty && <p className="text-emerald-700 font-semibold">{notice}</p>}

      {isLoading ? (
        <p role="status" className="p-6 text-center text-slate-400">
          Loading series tests…
        </p>
      ) : loadError ? (
        <div role="alert" className="p-3 rounded-xl bg-rose-50 text-rose-700 font-semibold">
          {loadError}{' '}
          <button type="button" onClick={load} className="underline cursor-pointer">
            Retry
          </button>
        </div>
      ) : stagedIds.length === 0 ? (
        <p className="p-6 text-center text-slate-400 border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl">
          No tests in this series yet. Use “Add Existing Tests” to include tests.
        </p>
      ) : (
        <ol className="border border-slate-200 dark:border-slate-800 rounded-2xl divide-y divide-slate-100 dark:divide-slate-800">
          {stagedIds.map((id, index) => {
            const test = testsById.get(id);
            const title = test?.title ?? 'Test not found in the test list';
            const reason = test ? seriesTestIncompatibility(series, test) : null;
            const subjectTopic = test ? testSubjectTopic(test) : '';
            return (
              <li key={id} data-testid={`included-test-${id}`} className="p-2.5 flex gap-2">
                <span className="w-5 pt-0.5 text-center text-slate-400 font-bold">{index + 1}</span>
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-bold text-slate-900 dark:text-white">{title}</span>
                    {test && <TestTypeBadge test={test} />}
                    {test && <TestStatusBadge status={test.status} />}
                  </div>
                  {test ? (
                    <p className="text-[11px] text-slate-500">
                      {testExamLabel(test, examTitles)}
                      {subjectTopic && <> · {subjectTopic}</>} · {test.totalQuestions ?? 0}{' '}
                      questions · {test.durationMinutes ?? 0} min
                    </p>
                  ) : (
                    !testsLoading && <p className="text-[11px] text-slate-500 font-mono">{id}</p>
                  )}
                  {test && test.status !== 'published' && (
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      {test.status === 'archived'
                        ? 'Archived — hidden from students'
                        : 'Draft — hidden from students'}
                    </p>
                  )}
                  {reason && (
                    <p className="text-[11px] font-semibold text-rose-700">
                      Not compatible: {reason}
                    </p>
                  )}
                </div>
                <div className="flex items-start gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label={`Move ${title} up`}
                    disabled={index === 0 || isSaving}
                    onClick={() => move(index, -1)}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Move ${title} down`}
                    disabled={index === stagedIds.length - 1 || isSaving}
                    onClick={() => move(index, 1)}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 cursor-pointer"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    aria-label={`Remove ${title} from series`}
                    title="Remove from Series"
                    disabled={isSaving}
                    onClick={() => setConfirmRemoveId(id)}
                    className="p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {confirmRemoveId && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="remove-series-test-title"
          aria-describedby="remove-series-test-desc"
          className="p-3 rounded-2xl border border-rose-200 bg-rose-50 dark:bg-rose-950/40 space-y-2"
        >
          <p
            id="remove-series-test-title"
            className="font-extrabold text-slate-900 dark:text-white"
          >
            Remove “{confirmTest?.title ?? confirmRemoveId}” from {series.title}?
          </p>
          <p id="remove-series-test-desc" className="text-slate-600 dark:text-slate-300">
            The test itself is not deleted. It stays in Mock Test Management with all its questions,
            and remains in any other series it belongs to.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmRemoveId(null)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => remove(confirmRemoveId)}
              className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold cursor-pointer"
            >
              Remove from Series
            </button>
          </div>
        </div>
      )}

      {isAddOpen && (
        <AddExistingTestsDrawer
          series={series}
          tests={tests}
          exams={exams}
          memberships={memberships}
          includedIds={stagedIds}
          isLoading={testsLoading}
          error={testsError}
          onAdd={add}
          onClose={() => setIsAddOpen(false)}
        />
      )}
    </section>
  );
};
