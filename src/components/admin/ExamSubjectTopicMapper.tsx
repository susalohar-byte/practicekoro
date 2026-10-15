import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, ChevronDown, ChevronRight, Search } from 'lucide-react';
import { api } from '@/services/api';
import type { Chapter, Subject } from '@/types';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

interface ExamSubjectTopicMapperProps {
  examId: string;
  examTitle: string;
  onSaved?: (counts: { subjects: number; topics: number }) => void;
}

/**
 * Assigns existing central Subjects and Topics to an Exam. Only mapping rows are written
 * (exam_subjects / exam_topics); subjects, topics and tests are never created or deleted.
 */
export const ExamSubjectTopicMapper: React.FC<ExamSubjectTopicMapperProps> = ({
  examId,
  examTitle,
  onSaved,
}) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<Set<string>>(new Set());
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());
  const [initial, setInitial] = useState({ subjects: '', topics: '' });
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError('');
    setMessage(null);
    Promise.all([
      api.getAllAdminSubjects(),
      api.getAllAdminChapters(),
      api.getExamSubjectTopicMappings(examId),
    ])
      .then(([allSubjects, allChapters, mapping]) => {
        if (cancelled) return;
        setSubjects([...allSubjects].sort((a, b) => a.orderIndex - b.orderIndex));
        setChapters([...allChapters].sort((a, b) => a.orderIndex - b.orderIndex));
        setSelectedSubjects(new Set(mapping.subjectIds));
        setSelectedTopics(new Set(mapping.topicIds));
        setExpanded(new Set(mapping.subjectIds));
        setInitial({
          subjects: [...mapping.subjectIds].sort().join('|'),
          topics: [...mapping.topicIds].sort().join('|'),
        });
        if (!mapping.subjectMappingAvailable)
          setMessage({
            type: 'info',
            text: 'Subject-only mappings need the exam_subjects migration. Until then, subjects are saved through their selected topics.',
          });
      })
      .catch((error) => {
        if (!cancelled) setLoadError(getErrorMessage(error, 'Mappings could not be loaded.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [examId]);

  const topicsBySubject = useMemo(() => {
    const map = new Map<string, Chapter[]>();
    for (const chapter of chapters) {
      if (!map.has(chapter.subjectId)) map.set(chapter.subjectId, []);
      map.get(chapter.subjectId)!.push(chapter);
    }
    return map;
  }, [chapters]);

  const term = search.trim().toLowerCase();
  const visibleSubjects = useMemo(
    () =>
      subjects.filter(
        (s) =>
          !term ||
          s.name.toLowerCase().includes(term) ||
          (topicsBySubject.get(s.id) || []).some((t) => t.name.toLowerCase().includes(term))
      ),
    [subjects, topicsBySubject, term]
  );

  const isDirty =
    [...selectedSubjects].sort().join('|') !== initial.subjects ||
    [...selectedTopics].sort().join('|') !== initial.topics;

  const toggleSubject = (subjectId: string) => {
    const nextSubjects = new Set(selectedSubjects);
    if (nextSubjects.has(subjectId)) {
      // Deselecting a subject also removes its topic mappings (records stay intact).
      nextSubjects.delete(subjectId);
      const nextTopics = new Set(selectedTopics);
      for (const t of topicsBySubject.get(subjectId) || []) nextTopics.delete(t.id);
      setSelectedTopics(nextTopics);
    } else {
      nextSubjects.add(subjectId);
      setExpanded((prev) => new Set(prev).add(subjectId));
    }
    setSelectedSubjects(nextSubjects);
    setMessage(null);
  };

  const toggleTopic = (topic: Chapter) => {
    const nextTopics = new Set(selectedTopics);
    if (nextTopics.has(topic.id)) nextTopics.delete(topic.id);
    else {
      nextTopics.add(topic.id);
      setSelectedSubjects((prev) => new Set(prev).add(topic.subjectId));
    }
    setSelectedTopics(nextTopics);
    setMessage(null);
  };

  const setAllTopics = (subjectId: string, checked: boolean) => {
    const nextTopics = new Set(selectedTopics);
    for (const t of topicsBySubject.get(subjectId) || []) {
      if (checked) nextTopics.add(t.id);
      else nextTopics.delete(t.id);
    }
    if (checked) setSelectedSubjects((prev) => new Set(prev).add(subjectId));
    setSelectedTopics(nextTopics);
    setMessage(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      // Keep the save consistent: topics are only sent with their parent subject.
      const subjectIds = subjects.filter((s) => selectedSubjects.has(s.id)).map((s) => s.id);
      const subjectSet = new Set(subjectIds);
      const topicIds = chapters
        .filter((c) => selectedTopics.has(c.id) && subjectSet.has(c.subjectId))
        .map((c) => c.id);
      const result = await api.saveExamSubjectTopicMappings(examId, subjectIds, topicIds);
      setInitial({
        subjects: [...subjectIds].sort().join('|'),
        topics: [...topicIds].sort().join('|'),
      });
      setMessage(
        result.subjectsPersisted
          ? { type: 'success', text: 'Subject and topic mappings saved.' }
          : {
              type: 'info',
              text: 'Topic mappings saved. Subjects without topics are kept only after the exam_subjects migration is applied.',
            }
      );
      onSaved?.({ subjects: subjectIds.length, topics: topicIds.length });
    } catch (error) {
      setMessage({ type: 'error', text: getErrorMessage(error, 'Mappings could not be saved.') });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[11px] text-slate-500 py-4 text-center">Loading subjects and topics…</p>
    );
  }
  if (loadError) {
    return (
      <p className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-[11px] text-rose-600">
        {loadError}
      </p>
    );
  }

  return (
    <div className="space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-bold text-slate-900 dark:text-white">
          Subjects &amp; Topics ({selectedSubjects.size} / {selectedTopics.size})
        </span>
        <div className="flex items-center gap-3">
          <Link
            to="/admin/subjects"
            className="text-xs text-[#026BFC] hover:underline font-semibold"
          >
            Subjects
          </Link>
          <Link to="/admin/topics" className="text-xs text-[#026BFC] hover:underline font-semibold">
            Topics
          </Link>
        </div>
      </div>
      <p className="text-[11px] text-slate-500">
        Select existing subjects and topics for {examTitle}. Removing a mapping never deletes the
        subject, topic or its tests.
      </p>

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects or topics..."
          aria-label="Search subjects or topics"
          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#026BFC]/30"
        />
      </div>

      <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
        {visibleSubjects.length === 0 && (
          <p className="text-[11px] text-slate-400 py-3 text-center">
            {subjects.length === 0
              ? 'No subjects exist yet. Create them on the Subjects page.'
              : 'No matches.'}
          </p>
        )}
        {visibleSubjects.map((subject) => {
          const topics = (topicsBySubject.get(subject.id) || []).filter(
            (t) =>
              !term ||
              subject.name.toLowerCase().includes(term) ||
              t.name.toLowerCase().includes(term)
          );
          const allTopics = topicsBySubject.get(subject.id) || [];
          const checked = selectedSubjects.has(subject.id);
          const open = expanded.has(subject.id) || !!term;
          const mappedCount = allTopics.filter((t) => selectedTopics.has(t.id)).length;
          return (
            <div
              key={subject.id}
              className={cn(
                'rounded-xl border',
                checked
                  ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/50'
                  : 'bg-slate-50 dark:bg-slate-900/60 border-slate-100 dark:border-slate-800'
              )}
            >
              <div className="p-2 flex items-center gap-2">
                <button
                  type="button"
                  aria-label={open ? `Collapse ${subject.name}` : `Expand ${subject.name}`}
                  onClick={() =>
                    setExpanded((prev) => {
                      const next = new Set(prev);
                      if (next.has(subject.id)) next.delete(subject.id);
                      else next.add(subject.id);
                      return next;
                    })
                  }
                  className="text-slate-400 hover:text-slate-700"
                >
                  {open ? (
                    <ChevronDown className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5" />
                  )}
                </button>
                <label className="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSubject(subject.id)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <BookOpen className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate">
                    {subject.name}
                  </span>
                  {!subject.isActive && (
                    <span className="text-[10px] text-slate-400">Inactive</span>
                  )}
                </label>
                <span className="text-[10px] text-slate-400 shrink-0">
                  {mappedCount}/{allTopics.length} topics
                </span>
              </div>
              {open && allTopics.length > 0 && (
                <div className="pl-9 pr-2 pb-2 space-y-1">
                  <div className="flex items-center gap-3 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setAllTopics(subject.id, true)}
                      className="text-[#026BFC] hover:underline font-semibold"
                    >
                      Select all
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllTopics(subject.id, false)}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                  {topics.map((topic) => (
                    <label key={topic.id} className="flex items-center gap-2 cursor-pointer py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedTopics.has(topic.id)}
                        onChange={() => toggleTopic(topic)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3 h-3"
                      />
                      <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">
                        {topic.name}
                      </span>
                      {!topic.isActive && (
                        <span className="text-[10px] text-slate-400">Inactive</span>
                      )}
                    </label>
                  ))}
                </div>
              )}
              {open && allTopics.length === 0 && (
                <p className="pl-9 pb-2 text-[10px] text-slate-400">
                  No topics under this subject yet.
                </p>
              )}
            </div>
          );
        })}
      </div>

      {message && (
        <p
          role="status"
          className={cn(
            'p-2 rounded-xl text-[11px]',
            message.type === 'success' && 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30',
            message.type === 'error' && 'bg-rose-50 text-rose-600 dark:bg-rose-950/30',
            message.type === 'info' && 'bg-amber-50 text-amber-700 dark:bg-amber-950/30'
          )}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={!isDirty || saving}
          className="px-3 py-1.5 rounded-lg bg-[#026BFC] text-white text-xs font-semibold disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save Mappings'}
        </button>
      </div>
    </div>
  );
};
