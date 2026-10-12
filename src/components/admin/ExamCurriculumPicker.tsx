import { useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronRight, ExternalLink, RefreshCw, Search } from 'lucide-react';
import type { Chapter, Subject } from '@/types';
import { pruneTopicsToSubjects } from '@/services/domains/admin.contentLinks';

export interface CurriculumSelection {
  subjectIds: string[];
  topicIds: string[];
}

interface ExamCurriculumPickerProps {
  subjects: Subject[];
  /** Topics are stored as chapters; `subjectId` is the parent subject. */
  topics: Chapter[];
  subjectIds: string[];
  topicIds: string[];
  /** Subjects already assigned when the form opened (shown with an "Assigned" indicator). */
  initialSubjectIds?: string[];
  onChange: (next: CurriculumSelection) => void;
  loading?: boolean;
  error?: string;
  /** Reloads the subject/topic lists, e.g. after creating records in another tab. */
  onRefresh?: () => void;
  disabled?: boolean;
}

interface PendingRemoval {
  message: string;
  next: CurriculumSelection;
}

const byOrder = <T extends { orderIndex: number; name: string; id: string }>(a: T, b: T) =>
  a.orderIndex - b.orderIndex || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);

const matches = (name: string, query: string) =>
  name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());

const newTab = { target: '_blank', rel: 'noopener noreferrer' } as const;

/**
 * Assign-only picker: lists existing Subjects and Topics so an exam can reference them.
 * It never creates or deletes records — creation lives on /admin/subjects and /admin/topics.
 */
export function ExamCurriculumPicker({
  subjects,
  topics,
  subjectIds,
  topicIds,
  initialSubjectIds = [],
  onChange,
  loading = false,
  error,
  onRefresh,
  disabled = false,
}: ExamCurriculumPickerProps) {
  const headingId = useId();
  const [subjectQuery, setSubjectQuery] = useState('');
  const [topicQuery, setTopicQuery] = useState('');
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<PendingRemoval | null>(null);

  const sortedSubjects = useMemo(() => [...subjects].sort(byOrder), [subjects]);
  const topicsBySubject = useMemo(() => {
    const map = new Map<string, Chapter[]>();
    for (const topic of [...topics].sort(byOrder)) {
      const list = map.get(topic.subjectId) ?? [];
      list.push(topic);
      map.set(topic.subjectId, list);
    }
    return map;
  }, [topics]);
  const selectedSubjects = useMemo(() => new Set(subjectIds), [subjectIds]);
  const selectedTopics = useMemo(() => new Set(topicIds), [topicIds]);
  const initiallyAssigned = useMemo(() => new Set(initialSubjectIds), [initialSubjectIds]);
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? 'this subject';

  const visibleSubjects = sortedSubjects.filter((s) => matches(s.name, subjectQuery));
  const chosenSubjects = sortedSubjects.filter((s) => selectedSubjects.has(s.id));

  /** Keeps ids in display order; ids missing from the list (e.g. not loaded) are preserved. */
  const orderSubjects = (ids: Set<string>) => {
    const known = sortedSubjects.filter((s) => ids.has(s.id)).map((s) => s.id);
    const unknown = subjectIds.filter((id) => ids.has(id) && !known.includes(id));
    return [...known, ...unknown];
  };
  const orderTopics = (ids: Set<string>) => {
    const known = [...topics]
      .sort(byOrder)
      .filter((t) => ids.has(t.id))
      .map((t) => t.id);
    const unknown = topicIds.filter((id) => ids.has(id) && !known.includes(id));
    return [...known, ...unknown];
  };

  /** Applies a subject change; asks for confirmation if selected topics would be unassigned. */
  const applySubjects = (nextIds: Set<string>, removedLabel: string) => {
    const nextSubjectIds = orderSubjects(nextIds);
    const nextTopicIds = pruneTopicsToSubjects(topicIds, nextSubjectIds, topics);
    const dropped = topicIds.length - nextTopicIds.length;
    const next = { subjectIds: nextSubjectIds, topicIds: nextTopicIds };
    if (dropped > 0) {
      setPending({
        message: `Removing ${removedLabel} also unassigns its ${dropped} selected topic${dropped === 1 ? '' : 's'}. Subjects and topics are not deleted.`,
        next,
      });
      return;
    }
    onChange(next);
  };

  const toggleSubject = (id: string) => {
    const next = new Set(selectedSubjects);
    if (next.has(id)) {
      next.delete(id);
      applySubjects(next, subjectName(id));
    } else {
      next.add(id);
      onChange({ subjectIds: orderSubjects(next), topicIds });
    }
  };

  const selectAllVisible = () => {
    const next = new Set(selectedSubjects);
    visibleSubjects.forEach((s) => next.add(s.id));
    onChange({ subjectIds: orderSubjects(next), topicIds });
  };

  const clearVisible = () => {
    const removing = visibleSubjects.filter((s) => selectedSubjects.has(s.id));
    if (!removing.length) return;
    const next = new Set(selectedSubjects);
    removing.forEach((s) => next.delete(s.id));
    applySubjects(next, removing.length === 1 ? removing[0].name : `${removing.length} subjects`);
  };

  const setTopics = (ids: Set<string>) => onChange({ subjectIds, topicIds: orderTopics(ids) });
  const toggleTopic = (id: string) => {
    const next = new Set(selectedTopics);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setTopics(next);
  };

  const toggleGroup = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const inputClass =
    'w-full min-h-10 rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-900 dark:border-slate-700 dark:bg-[#070D1E] dark:text-white';
  const smallButton =
    'min-h-8 rounded-lg px-2 text-[11px] font-semibold text-[#026BFC] hover:bg-blue-50 disabled:opacity-40 dark:text-blue-300 dark:hover:bg-blue-950/40';
  const isDisabled = disabled || loading || !!error;

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 id={headingId} className="text-sm font-bold text-slate-900 dark:text-white">
          Assigned Subjects &amp; Topics
        </h4>
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            to="/admin/subjects"
            {...newTab}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-[#026BFC] hover:bg-slate-50 dark:border-slate-700 dark:text-blue-300"
          >
            Add Subject <ExternalLink className="h-3 w-3" aria-hidden />
            <span className="sr-only">(opens Subjects page in a new tab)</span>
          </Link>
          <Link
            to="/admin/topics"
            {...newTab}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-[#026BFC] hover:bg-slate-50 dark:border-slate-700 dark:text-blue-300"
          >
            Manage Topics <ExternalLink className="h-3 w-3" aria-hidden />
            <span className="sr-only">(opens Topics page in a new tab)</span>
          </Link>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex min-h-8 items-center gap-1 rounded-lg border border-slate-200 px-2 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:text-slate-200"
            >
              <RefreshCw className="h-3 w-3" aria-hidden />
              Refresh lists
            </button>
          )}
        </div>
      </div>
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Assign existing subjects and topics to this exam. Create new ones on the Subjects and Topics
        pages (they open in a new tab), then use Refresh lists.
      </p>

      {pending && (
        <div
          role="alertdialog"
          aria-label="Confirm removing subjects"
          className="space-y-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
        >
          <p>{pending.message}</p>
          <div className="flex gap-2">
            <button
              type="button"
              autoFocus
              onClick={() => {
                onChange(pending.next);
                setPending(null);
              }}
              className="min-h-8 rounded-lg bg-amber-600 px-3 font-semibold text-white hover:bg-amber-700"
            >
              Remove
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="min-h-8 rounded-lg border border-amber-300 bg-white px-3 font-semibold text-amber-900 dark:bg-transparent dark:text-amber-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <p role="status" className="text-xs text-slate-500">
          Loading subjects and topics…
        </p>
      ) : error ? (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200"
        >
          {error}
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {/* Subjects */}
          <fieldset className="min-w-0 space-y-2" disabled={isDisabled}>
            <legend className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Subjects · {subjectIds.length} selected
            </legend>
            <label className="relative block">
              <span className="sr-only">Search subjects</span>
              <Search className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400" aria-hidden />
              <input
                type="search"
                value={subjectQuery}
                onChange={(e) => setSubjectQuery(e.target.value)}
                placeholder="Search subjects…"
                className={inputClass}
              />
            </label>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={selectAllVisible}
                disabled={!visibleSubjects.length}
                className={smallButton}
              >
                Select all
              </button>
              <button
                type="button"
                onClick={clearVisible}
                disabled={!visibleSubjects.some((s) => selectedSubjects.has(s.id))}
                className={smallButton}
              >
                Clear selection
              </button>
            </div>
            {sortedSubjects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700">
                No subjects exist yet. Create them on the Subjects page, then refresh.
              </p>
            ) : visibleSubjects.length === 0 ? (
              <p className="text-xs text-slate-500">No subjects match “{subjectQuery}”.</p>
            ) : (
              <ul className="max-h-64 space-y-1 overflow-y-auto pr-1" aria-label="Subjects">
                {visibleSubjects.map((subject) => (
                  <li key={subject.id}>
                    <label className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-xs hover:bg-slate-50 dark:hover:bg-slate-900/60">
                      <input
                        type="checkbox"
                        checked={selectedSubjects.has(subject.id)}
                        onChange={() => toggleSubject(subject.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="min-w-0 flex-1 break-words font-medium text-slate-800 dark:text-slate-200">
                        {subject.name}
                      </span>
                      {!subject.isActive && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Inactive
                        </span>
                      )}
                      {initiallyAssigned.has(subject.id) && (
                        <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-[#026BFC] dark:bg-blue-950/40 dark:text-blue-300">
                          Assigned
                        </span>
                      )}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

          {/* Topics */}
          <fieldset className="min-w-0 space-y-2" disabled={isDisabled}>
            <legend className="mb-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
              Topics · {topicIds.length} selected
            </legend>
            {chosenSubjects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300 p-3 text-xs text-slate-500 dark:border-slate-700">
                Select a subject to choose its topics.
              </p>
            ) : (
              <>
                <label className="relative block">
                  <span className="sr-only">Search topics</span>
                  <Search
                    className="absolute left-2.5 top-3 h-3.5 w-3.5 text-slate-400"
                    aria-hidden
                  />
                  <input
                    type="search"
                    value={topicQuery}
                    onChange={(e) => setTopicQuery(e.target.value)}
                    placeholder="Search topics…"
                    className={inputClass}
                  />
                </label>
                <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                  {chosenSubjects.map((subject) => {
                    const all = topicsBySubject.get(subject.id) ?? [];
                    const visible = all.filter((t) => matches(t.name, topicQuery));
                    const chosen = all.filter((t) => selectedTopics.has(t.id)).length;
                    const open = !collapsed.has(subject.id);
                    const groupId = `${headingId}-topics-${subject.id}`;
                    return (
                      <div
                        key={subject.id}
                        role="group"
                        aria-label={`${subject.name} topics`}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/40"
                      >
                        <div className="flex flex-wrap items-center gap-1 px-2 py-1.5">
                          <button
                            type="button"
                            aria-expanded={open}
                            aria-controls={groupId}
                            onClick={() => toggleGroup(subject.id)}
                            className="flex min-h-8 min-w-0 flex-1 items-center gap-1 text-left text-xs font-semibold text-slate-800 dark:text-slate-200"
                          >
                            {open ? (
                              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                            )}
                            <span className="break-words">{subject.name}</span>
                            <span className="ml-1 shrink-0 font-normal text-slate-500">
                              {chosen} of {all.length} selected
                            </span>
                          </button>
                          {all.length > 0 && (
                            <>
                              <button
                                type="button"
                                aria-label={`Select all topics in ${subject.name}`}
                                disabled={!visible.length}
                                onClick={() => {
                                  const next = new Set(selectedTopics);
                                  visible.forEach((t) => next.add(t.id));
                                  setTopics(next);
                                }}
                                className={smallButton}
                              >
                                Select all
                              </button>
                              <button
                                type="button"
                                aria-label={`Clear topics in ${subject.name}`}
                                disabled={!visible.some((t) => selectedTopics.has(t.id))}
                                onClick={() => {
                                  const next = new Set(selectedTopics);
                                  visible.forEach((t) => next.delete(t.id));
                                  setTopics(next);
                                }}
                                className={smallButton}
                              >
                                Clear
                              </button>
                            </>
                          )}
                        </div>
                        {open && (
                          <div
                            id={groupId}
                            className="border-t border-slate-200 px-2 py-1.5 dark:border-slate-800"
                          >
                            {all.length === 0 ? (
                              <p className="text-[11px] text-slate-500">
                                No topics yet — create them on the{' '}
                                <Link
                                  to={`/admin/topics?${new URLSearchParams({ subject: subject.id })}`}
                                  {...newTab}
                                  className="font-semibold text-[#026BFC] underline dark:text-blue-300"
                                >
                                  Topics page
                                </Link>
                              </p>
                            ) : visible.length === 0 ? (
                              <p className="text-[11px] text-slate-500">No topics match.</p>
                            ) : (
                              <ul className="space-y-0.5">
                                {visible.map((topic) => (
                                  <li key={topic.id}>
                                    <label className="flex min-h-8 cursor-pointer items-center gap-2 rounded-lg px-1 text-xs hover:bg-white dark:hover:bg-slate-900">
                                      <input
                                        type="checkbox"
                                        checked={selectedTopics.has(topic.id)}
                                        onChange={() => toggleTopic(topic.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                      />
                                      <span className="min-w-0 flex-1 break-words text-slate-700 dark:text-slate-300">
                                        {topic.name}
                                      </span>
                                      {!topic.isActive && (
                                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                          Inactive
                                        </span>
                                      )}
                                    </label>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </fieldset>
        </div>
      )}
    </section>
  );
}
