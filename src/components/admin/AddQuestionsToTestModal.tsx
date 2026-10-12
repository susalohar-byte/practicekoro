import { AdminSectionSkeleton } from './AdminSkeleton';
import React, { useState, useEffect } from 'react';
import { X, Search, BookOpen, Filter } from 'lucide-react';
import type { MockTest, Question, Subject, Chapter } from '@/types';
import { api } from '@/services/api';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';

interface AddQuestionsToTestModalProps {
  test: MockTest | null;
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  chapters: Chapter[];
  onQuestionsAssigned: () => void;
}

const isTopicType = (t: MockTest) => t.testType === 'topic' || t.testType === 'chapter_mock';
const topicOf = (t: MockTest) => t.chapterId || t.topicId || '';

/** A selected question is out of context for a Topic Test when it is not under the test's topic. */
const outsideTopic = (test: MockTest, q: { chapterId?: string; topicId?: string }) =>
  test.testType === 'topic' &&
  Boolean(topicOf(test)) &&
  (q.chapterId || q.topicId || '') !== topicOf(test);

export const AddQuestionsToTestModal: React.FC<AddQuestionsToTestModalProps> = ({
  test,
  isOpen,
  onClose,
  subjects,
  chapters,
  onQuestionsAssigned,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<Set<string>>(new Set());
  /** Saved marks of questions already in the test, so re-saving keeps them. */
  const [assignedMarks, setAssignedMarks] = useState<Map<string, number>>(new Map());
  /** Question metadata for everything selected (assigned rows + picked bank rows). */
  const [selectedMeta, setSelectedMeta] = useState<
    Map<string, { label: string; chapterId?: string; topicId?: string }>
  >(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(test?.subjectId || '');
  const [selectedChapterId, setSelectedChapterId] = useState<string>(test ? topicOf(test) : '');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<'pyq' | 'all'>('all');
  const [yearFilter, setYearFilter] = useState('');

  const isPyq = test?.testType === 'pyq';
  const isTopic = test?.testType === 'topic';

  const fetchQuestions = async (filters: {
    subjectId: string;
    chapterId: string;
    difficulty: string;
    search: string;
    source: 'pyq' | 'all';
    year: string;
  }) => {
    const rows = await api.getAllAdminQuestions({
      subjectId: filters.subjectId || undefined,
      chapterId: filters.chapterId || undefined,
      difficulty: filters.difficulty !== 'all' ? filters.difficulty : undefined,
      search: filters.search.trim() || undefined,
      sourceType: filters.source === 'pyq' ? 'pyq' : undefined,
    });
    const year = Number(filters.year);
    return filters.year && Number.isFinite(year) ? rows.filter((q) => q.sourceYear === year) : rows;
  };

  useEffect(() => {
    if (!test || !isOpen) return;
    // Context defaults: Topic Test -> its subject + topic; PYQ -> PYQ source + the test's year.
    const subjectId = test.subjectId || '';
    const chapterId = topicOf(test);
    const source: 'pyq' | 'all' = test.testType === 'pyq' ? 'pyq' : 'all';
    const year = test.testType === 'pyq' && test.year ? String(test.year) : '';
    setSelectedSubjectId(subjectId);
    setSelectedChapterId(chapterId);
    setSourceFilter(source);
    setYearFilter(year);
    setSearchTerm('');
    setSelectedDifficulty('all');

    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        // 1. Already assigned questions (by ID, never duplicated)
        const assigned = await api.getTestAssignedQuestions(test.id);
        if (cancelled) return;
        setSelectedQuestionIds(new Set(assigned.map((a) => a.questionId)));
        setAssignedMarks(new Map(assigned.map((a) => [a.questionId, a.marks])));
        setSelectedMeta(
          new Map(
            assigned.map((a) => [
              a.questionId,
              {
                label: a.questionBengaliText || a.questionText || a.questionId,
                chapterId: a.chapterId,
              },
            ])
          )
        );

        // 2. Available questions from the central Question Bank in the test's context
        const rows = await fetchQuestions({
          subjectId: isTopicType(test) ? subjectId : '',
          chapterId: isTopicType(test) ? chapterId : '',
          difficulty: 'all',
          search: '',
          source,
          year,
        });
        if (!cancelled) setQuestions(rows);
      } catch (err) {
        console.error('Failed to load question bank:', err);
        if (!cancelled) setLoadError(getErrorMessage(err, 'Questions could not be loaded.'));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload only when the target test or visibility changes
  }, [test?.id, test?.subjectId, test?.chapterId, test?.topicId, test?.year, isOpen]);

  const handleApplyFilter = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      setQuestions(
        await fetchQuestions({
          subjectId: selectedSubjectId,
          chapterId: selectedChapterId,
          difficulty: selectedDifficulty,
          search: searchTerm,
          source: sourceFilter,
          year: yearFilter,
        })
      );
    } catch (err) {
      console.error('Failed to filter questions:', err);
      setLoadError(getErrorMessage(err, 'Questions could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !test) return null;

  const availableChapters = chapters.filter(
    (c) => !selectedSubjectId || c.subjectId === selectedSubjectId
  );

  // Selected questions that are not under this Topic Test's topic (e.g. after the topic changed).
  const mismatched = Array.from(selectedQuestionIds)
    .map((id) => ({ id, meta: selectedMeta.get(id) }))
    .filter((x) => x.meta && outsideTopic(test, x.meta));
  const topicName = chapters.find((c) => c.id === topicOf(test))?.name || test.chapterName;

  const toggleSelectQuestion = (q: Question) => {
    const next = new Set(selectedQuestionIds);
    if (next.has(q.id)) {
      next.delete(q.id);
    } else {
      if (outsideTopic(test, q)) return; // Topic Tests only take questions from their topic.
      next.add(q.id);
      setSelectedMeta((prev) =>
        new Map(prev).set(q.id, {
          label: q.questionBengaliText || q.questionText,
          chapterId: q.chapterId,
          topicId: q.topicId,
        })
      );
    }
    setSelectedQuestionIds(next);
  };

  const handleSelectAllVisible = () => {
    const next = new Set(selectedQuestionIds);
    const meta = new Map(selectedMeta);
    questions.forEach((q) => {
      if (outsideTopic(test, q)) return;
      next.add(q.id);
      meta.set(q.id, {
        label: q.questionBengaliText || q.questionText,
        chapterId: q.chapterId,
        topicId: q.topicId,
      });
    });
    setSelectedMeta(meta);
    setSelectedQuestionIds(next);
  };

  const handleDeselectAllVisible = () => {
    const next = new Set(selectedQuestionIds);
    questions.forEach((q) => next.delete(q.id));
    setSelectedQuestionIds(next);
  };

  const handleRemoveMismatched = () => {
    const next = new Set(selectedQuestionIds);
    mismatched.forEach((m) => next.delete(m.id));
    setSelectedQuestionIds(next);
  };

  const handleSaveAssignments = async () => {
    if (!test || mismatched.length > 0) return;
    setIsSaving(true);
    try {
      // A Set keeps each question once; previously assigned questions keep their order and marks.
      const orderedIds = Array.from(selectedQuestionIds);
      const payload = orderedIds.map((qId, idx) => ({
        questionId: qId,
        orderIndex: idx + 1,
        marks: assignedMarks.get(qId) ?? 1.0,
        negativeMarks: test.negativeMarking || 0,
      }));

      await api.saveTestQuestions(test.id, payload);
      alert(`Successfully saved ${payload.length} questions to "${test.title}"!`);
      onQuestionsAssigned();
      onClose();
    } catch (err) {
      console.error('Failed to save test questions:', err);
      alert('Failed to save questions: ' + getErrorMessage(err, 'Save failed'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#070D1E] shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              Assign Questions from Central Question Bank
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Test:{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">{test.title}</span> •
              Questions are referenced without duplication.
            </p>
            {(test.examTitle || isPyq || isTopic) && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Context:{' '}
                {[
                  test.examTitle && `Exam ${test.examTitle}`,
                  isPyq && test.year && `Year ${test.year}`,
                  isPyq && test.paperName,
                  isTopic && test.subjectName && `Subject ${test.subjectName}`,
                  isTopic && topicName && `Topic ${topicName}`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#080E22] shrink-0 space-y-3">
          <div className={cn('grid gap-2.5', isPyq ? 'grid-cols-6' : 'grid-cols-4')}>
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search question text..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
              />
            </div>

            {/* Subject Dropdown */}
            <select
              aria-label="Subject filter"
              value={selectedSubjectId}
              disabled={isTopic}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                setSelectedChapterId('');
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Topic Dropdown */}
            <select
              aria-label="Topic filter"
              value={selectedChapterId}
              disabled={isTopic}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
            >
              <option value="">All Topics</option>
              {availableChapters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            {/* Difficulty */}
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
            >
              <option value="all">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>

            {isPyq && (
              <>
                <select
                  aria-label="Question source"
                  value={sourceFilter}
                  onChange={(e) => setSourceFilter(e.target.value as 'pyq' | 'all')}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
                >
                  <option value="pyq">PYQ questions</option>
                  <option value="all">All sources</option>
                </select>
                <input
                  type="number"
                  aria-label="Question year"
                  placeholder="Any year"
                  value={yearFilter}
                  onChange={(e) => setYearFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white"
                />
              </>
            )}
          </div>

          {isTopic && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Topic Tests take questions only from their own subject and topic, so these filters are
              fixed.
            </p>
          )}

          {mismatched.length > 0 && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs space-y-1.5"
            >
              <p className="font-semibold">
                {mismatched.length} selected question{mismatched.length === 1 ? ' is' : 's are'} not
                under this test&apos;s topic{topicName ? ` (${topicName})` : ''}. Remove{' '}
                {mismatched.length === 1 ? 'it' : 'them'} before saving.
              </p>
              <ul className="list-disc pl-4 max-h-20 overflow-y-auto">
                {mismatched.map((m) => (
                  <li key={m.id} className="line-clamp-1">
                    {m.meta?.label}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={handleRemoveMismatched}
                className="font-semibold underline"
              >
                Remove questions outside the topic
              </button>
            </div>
          )}

          {loadError && (
            <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
              {loadError}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Select All Visible
              </button>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <button
                type="button"
                onClick={handleDeselectAllVisible}
                className="text-slate-500 hover:text-slate-700 dark:text-slate-400 font-semibold hover:underline"
              >
                Deselect All
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleApplyFilter}
              disabled={isLoading}
              className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Filter className="w-3.5 h-3.5" />
              Apply Filter
            </Button>
          </div>
        </div>

        {/* Question List - Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {isLoading ? (
            <AdminSectionSkeleton
              label="Loading questions from Question Bank..."
              variant="table"
              className="p-4"
            />
          ) : questions.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-400">
              No questions found matching the selected filters.
            </div>
          ) : (
            questions.map((q) => {
              const isSelected = selectedQuestionIds.has(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleSelectQuestion(q)}
                  className={cn(
                    'p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3',
                    isSelected
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-[#070D1E]'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 shrink-0"
                  />

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-2">
                        {q.questionBengaliText || q.questionText}
                      </p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {q.difficulty}
                      </span>
                    </div>

                    {q.questionBengaliText && q.questionText && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                        {q.questionText}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[10.5px] text-slate-400">
                      {q.subjectName && <span>Subject: {q.subjectName}</span>}
                      {q.chapterName && <span>Topic: {q.chapterName}</span>}
                      {q.sourceType === 'pyq' && (
                        <span>
                          PYQ{q.sourceExam ? ` ${q.sourceExam}` : ''}
                          {q.sourceYear ? ` ${q.sourceYear}` : ''}
                        </span>
                      )}
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        Correct: Option {q.correctOption}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070D1E] shrink-0 flex items-center justify-between">
          <div className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Selected:{' '}
            <span className="font-bold text-blue-600 dark:text-blue-400">
              {selectedQuestionIds.size}
            </span>{' '}
            questions
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveAssignments}
              disabled={isSaving || mismatched.length > 0}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4"
            >
              {isSaving ? 'Assigning...' : `Assign ${selectedQuestionIds.size} Questions`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
