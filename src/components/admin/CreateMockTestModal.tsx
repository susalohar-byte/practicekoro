import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  BookOpen,
  Clock,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  Check,
  Upload,
  Trash2,
} from 'lucide-react';
import type { Exam, Subject, Chapter, MockTest, TestSeries } from '@/types';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { seriesTestIncompatibility } from '@/services/domains/admin.contentLinks';
import { testTypeLinkErrors, type CreatableTestType } from '@/services/domains/admin.tests';

interface CreateMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  onTestCreated: (test: MockTest) => void;
  initialType?: CreatableTestType;
}

type FieldKey = 'title' | 'exam' | 'year' | 'subject' | 'topic' | 'series';

const FieldError: React.FC<{ message?: string }> = ({ message }) =>
  message ? (
    <p role="alert" className="mt-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
      {message}
    </p>
  ) : null;

export const CreateMockTestModal: React.FC<CreateMockTestModalProps> = ({
  isOpen,
  onClose,
  exams,
  subjects,
  chapters,
  onTestCreated,
  initialType = 'full_mock',
}) => {
  const [testType, setTestType] = useState<CreatableTestType>(initialType);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [yearInput, setYearInput] = useState('');
  const [paperName, setPaperName] = useState('');
  const [setName, setSetName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isPremium, setIsPremium] = useState(false);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [seriesId, setSeriesId] = useState('');
  const [seriesList, setSeriesList] = useState<TestSeries[]>([]);
  const [seriesLoadError, setSeriesLoadError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>({});
  /** Set when the test was created but adding it to the chosen series failed. */
  const [seriesWarning, setSeriesWarning] = useState<string | null>(null);

  // Sync mode defaults when testType changes
  useEffect(() => {
    setFieldErrors({});
    if (testType === 'full_mock') {
      setDurationMinutes(90);
      setTotalMarks(100);
      setPassingMarks(40);
      setNegativeMarking(0.25);
    } else if (testType === 'topic') {
      setDurationMinutes(30);
      setTotalMarks(25);
      setPassingMarks(10);
      setNegativeMarking(0.25);
    } else if (testType === 'pyq') {
      setDurationMinutes(60);
      setTotalMarks(85);
      setPassingMarks(35);
      setNegativeMarking(0.25);
    }
  }, [testType]);

  // Series are optional; a failed list read only hides the picker.
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    setSeriesLoadError(null);
    api
      .getTestSeries()
      .then((rows) => {
        if (!cancelled) setSeriesList(rows || []);
      })
      .catch((err) => {
        if (!cancelled) {
          setSeriesList([]);
          setSeriesLoadError(getErrorMessage(err, 'Test series could not be loaded.'));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Topics are filtered by the selected subject (none until a subject is chosen).
  const availableChapters = subjectId ? chapters.filter((c) => c.subjectId === subjectId) : [];
  const linkedExamId = testType === 'topic' ? '' : examId;
  const seriesReason = (series: TestSeries) =>
    seriesTestIncompatibility(series, { title, testType, examId: linkedExamId || null });

  // Auto-generate a title suggestion if title is empty
  const handleAutoSuggestTitle = () => {
    if (testType === 'full_mock') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(`${selectedExam.title} Full Mock Test 01`);
      }
    } else if (testType === 'topic') {
      const selectedSub = subjects.find((s) => s.id === subjectId);
      const selectedTop = chapters.find((c) => c.id === chapterId);
      if (selectedTop) {
        setTitle(`${selectedTop.name} - Topic Practice Test`);
      } else if (selectedSub) {
        setTitle(`${selectedSub.name} Topic Test`);
      }
    } else if (testType === 'pyq') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(
          [selectedExam.title, yearInput, paperName, 'Official PYQ'].filter(Boolean).join(' ')
        );
      }
    }
  };

  if (!isOpen) return null;

  const clearFieldError = (key: FieldKey) =>
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const validate = (): Partial<Record<FieldKey, string>> => {
    const next: Partial<Record<FieldKey, string>> = {};
    if (!title.trim()) next.title = 'Enter a test title.';
    const year = yearInput.trim() ? Number(yearInput) : undefined;
    if (testType === 'full_mock' && !examId) next.exam = 'Select the exam this Full Mock is for.';
    if (testType === 'pyq') {
      if (!examId) next.exam = 'Select the exam this paper is from.';
      if (!yearInput.trim()) next.year = 'Enter the exam year.';
      else if (!Number.isInteger(year) || year! < 1950 || year! > 2100)
        next.year = 'Enter a valid year between 1950 and 2100.';
    }
    if (testType === 'topic') {
      if (!subjectId) next.subject = 'Select a subject.';
      if (!chapterId) next.topic = 'Select a topic.';
      else {
        const topicSubjectId = chapters.find((c) => c.id === chapterId)?.subjectId;
        const [mismatch] = testTypeLinkErrors(
          { testType, subjectId, chapterId },
          topicSubjectId
        ).filter((e) => e.includes('does not belong'));
        if (mismatch) next.topic = mismatch;
      }
    }
    const series = seriesList.find((s) => s.id === seriesId);
    const reason = series ? seriesReason(series) : null;
    if (reason) next.series = `This series cannot include this test: ${reason}.`;
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nextErrors = validate();
    setFieldErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      setError('Please fix the highlighted fields.');
      return;
    }

    setIsSubmitting(true);
    let created: MockTest;
    try {
      created = await api.createTest({
        title: title.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined,
        testType,
        // Topic Tests are exam-independent; the exam picker is hidden for them.
        examId: linkedExamId || undefined,
        subjectId: testType === 'topic' ? subjectId : undefined,
        chapterId: testType === 'topic' ? chapterId : undefined,
        year: testType === 'pyq' ? Number(yearInput) : undefined,
        paperName: testType === 'pyq' ? paperName.trim() || undefined : undefined,
        setName: testType === 'pyq' ? setName.trim() || undefined : undefined,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        negativeMarking: Number(negativeMarking),
        isPremium,
        status,
        totalQuestions: 0,
        orderIndex: 0,
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        isActive: status === 'published',
      });
    } catch (err) {
      console.error('Failed to create mock test:', err);
      // Database rule messages (e.g. "A Topic Test needs a subject and a topic") are shown as-is.
      setError(getErrorMessage(err, 'Failed to create mock test. Please check inputs.'));
      setIsSubmitting(false);
      return;
    }

    onTestCreated(created);
    if (seriesId) {
      try {
        await api.assignTestsToSeries([created.id], seriesId);
      } catch (err) {
        const seriesTitle =
          seriesList.find((s) => s.id === seriesId)?.title || 'the selected series';
        setSeriesWarning(
          `"${created.title}" was created, but it could not be added to ${seriesTitle}: ${getErrorMessage(
            err,
            'save failed'
          )}. Add it from Test Series Management.`
        );
        setIsSubmitting(false);
        return;
      }
    }
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-[#070D1E]">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500" />
              Create New Mock Test
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Configure parameters for exams, subject topics, or official previous year questions.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Selector - 3 Modes: Full Mock, Topic Test, Official PYQ */}
        <div className="p-6 pb-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-2.5">
            Test Mode *
          </label>
          <div className="grid grid-cols-3 gap-3">
            {/* 1. Full Mock */}
            <button
              type="button"
              aria-pressed={testType === 'full_mock'}
              onClick={() => setTestType('full_mock')}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                testType === 'full_mock'
                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/40 ring-1 ring-blue-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Shield className="w-4 h-4" />
                </div>
                {testType === 'full_mock' && (
                  <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Full Mock
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Complete exam pattern
                </span>
              </div>
            </button>

            {/* 2. Topic Test */}
            <button
              type="button"
              aria-pressed={testType === 'topic'}
              onClick={() => setTestType('topic')}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                testType === 'topic'
                  ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-4 h-4" />
                </div>
                {testType === 'topic' && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Topic Test
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Subject & topic specific
                </span>
              </div>
            </button>

            {/* 3. Official PYQ */}
            <button
              type="button"
              aria-pressed={testType === 'pyq'}
              onClick={() => setTestType('pyq')}
              className={cn(
                'p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between',
                testType === 'pyq'
                  ? 'border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 ring-1 ring-rose-500/30'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#070D1E]'
              )}
            >
              <div className="flex items-center justify-between w-full">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
                  <Clock className="w-4 h-4" />
                </div>
                {testType === 'pyq' && (
                  <span className="w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center">
                    <Check className="w-2.5 h-2.5" />
                  </span>
                )}
              </div>
              <div className="mt-2.5">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Official PYQ
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Past year question paper
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        {seriesWarning ? (
          <div className="p-6 pt-3 space-y-4 text-xs">
            <div
              role="alert"
              className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{seriesWarning}</span>
            </div>
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <Button type="button" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="p-6 pt-3 space-y-4 text-xs">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Conditional Linking Section based on Mode */}
            {testType === 'full_mock' && (
              <div>
                <label
                  htmlFor="create-test-exam"
                  className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                >
                  Target Exam *
                </label>
                <select
                  id="create-test-exam"
                  aria-invalid={Boolean(fieldErrors.exam)}
                  value={examId}
                  onChange={(e) => {
                    setExamId(e.target.value);
                    clearFieldError('exam');
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Exam</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.category})
                    </option>
                  ))}
                </select>
                <FieldError message={fieldErrors.exam} />
              </div>
            )}

            {testType === 'topic' && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="create-test-subject"
                      className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                    >
                      Subject *
                    </label>
                    <select
                      id="create-test-subject"
                      aria-invalid={Boolean(fieldErrors.subject)}
                      value={subjectId}
                      onChange={(e) => {
                        setSubjectId(e.target.value);
                        // Topics belong to one subject: changing it clears the topic.
                        setChapterId('');
                        clearFieldError('subject');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.subject} />
                    {subjects.length === 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        No subjects yet.{' '}
                        <a
                          href="/admin/subjects"
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Add subjects in Subject Management
                        </a>
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="create-test-topic"
                      className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                    >
                      Topic *
                    </label>
                    <select
                      id="create-test-topic"
                      aria-invalid={Boolean(fieldErrors.topic)}
                      value={chapterId}
                      disabled={!subjectId}
                      onChange={(e) => {
                        setChapterId(e.target.value);
                        clearFieldError('topic');
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 disabled:opacity-60"
                    >
                      <option value="">
                        {subjectId ? 'Select Topic' : 'Select a subject first'}
                      </option>
                      {availableChapters.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name}
                        </option>
                      ))}
                    </select>
                    <FieldError message={fieldErrors.topic} />
                    {subjectId && availableChapters.length === 0 && (
                      <p className="mt-1 text-[11px] text-slate-500">
                        This subject has no topics.{' '}
                        <a
                          href="/admin/topics"
                          className="font-semibold text-blue-600 hover:underline"
                        >
                          Add topics in Topic Management
                        </a>
                      </p>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Topic Tests are not tied to an exam; they can be added to any test series.
                </p>
              </div>
            )}

            {testType === 'pyq' && (
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label
                    htmlFor="create-test-pyq-exam"
                    className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                  >
                    Target Exam *
                  </label>
                  <select
                    id="create-test-pyq-exam"
                    aria-invalid={Boolean(fieldErrors.exam)}
                    value={examId}
                    onChange={(e) => {
                      setExamId(e.target.value);
                      clearFieldError('exam');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="">Select Exam</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                  <FieldError message={fieldErrors.exam} />
                </div>

                <div>
                  <label
                    htmlFor="create-test-year"
                    className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                  >
                    Exam Year *
                  </label>
                  <input
                    id="create-test-year"
                    type="number"
                    inputMode="numeric"
                    min={1950}
                    max={2100}
                    placeholder={String(new Date().getFullYear())}
                    aria-invalid={Boolean(fieldErrors.year)}
                    value={yearInput}
                    onChange={(e) => {
                      setYearInput(e.target.value);
                      clearFieldError('year');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                  <FieldError message={fieldErrors.year} />
                </div>

                <div>
                  <label
                    htmlFor="create-test-paper"
                    className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                  >
                    Paper / Shift
                  </label>
                  <input
                    id="create-test-paper"
                    type="text"
                    placeholder="Optional, e.g. Prelims"
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="create-test-set"
                    className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                  >
                    Set
                  </label>
                  <input
                    id="create-test-set"
                    type="text"
                    placeholder="Optional, e.g. Set A"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>
            )}

            {/* Test Title & Auto Suggest */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Test Title *
                </label>
                <button
                  type="button"
                  onClick={handleAutoSuggestTitle}
                  className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                >
                  Auto-generate name
                </button>
              </div>
              <input
                type="text"
                aria-label="Test Title"
                aria-invalid={Boolean(fieldErrors.title)}
                placeholder="e.g. WBP Constable Full Mock 01"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearFieldError('title');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <FieldError message={fieldErrors.title} />
            </div>

            {/* Description */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description (Bengali / English)
              </label>
              <textarea
                rows={2}
                placeholder="Optional overview or guidelines for this mock test..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Test Icon / Logo Upload */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
                    Test Icon / Logo
                  </label>
                  <span className="text-[11px] text-slate-400">
                    Upload custom PNG, JPG, WebP, or SVG badge to display next to test name
                  </span>
                </div>
                {iconUrl && (
                  <button
                    type="button"
                    onClick={() => setIconUrl('')}
                    className="text-[11px] font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 pt-1">
                {/* Icon Preview */}
                <div className="w-11 h-11 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-0.5">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt="Test Icon"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-full h-full rounded-lg flex items-center justify-center font-bold text-white',
                        testType === 'full_mock'
                          ? 'bg-[#026BFC]'
                          : testType === 'topic'
                            ? 'bg-[#10B981]'
                            : 'bg-[#EF4444]'
                      )}
                    >
                      {testType === 'full_mock' ? (
                        <Shield className="w-5 h-5" />
                      ) : testType === 'topic' ? (
                        <BookOpen className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                  )}
                </div>

                {/* Upload Controls */}
                <div className="flex-1 min-w-0">
                  <label
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                      isUploadingIcon
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                    )}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploadingIcon ? 'Uploading...' : iconUrl ? 'Change Icon' : 'Upload Icon'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={isUploadingIcon}
                      className="hidden"
                      onChange={async (ev) => {
                        const file = ev.target.files?.[0];
                        if (!file) return;
                        try {
                          setIsUploadingIcon(true);
                          setError(null);
                          const uploadedUrl = await api.uploadTestIcon(file, 'new-test');
                          setIconUrl(uploadedUrl);
                        } catch (err: any) {
                          setError('Failed to upload icon: ' + (err?.message || 'Error'));
                        } finally {
                          setIsUploadingIcon(false);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Duration, Marks, Negative Marking */}
            <div className="grid grid-cols-4 gap-3">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Duration (min) *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Total Marks *
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Passing Marks
                </label>
                <input
                  type="number"
                  min={0}
                  value={passingMarks}
                  onChange={(e) => setPassingMarks(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Negative Mark
                </label>
                <input
                  type="number"
                  step="0.05"
                  min={0}
                  value={negativeMarking}
                  onChange={(e) => setNegativeMarking(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Optional Test Series membership (a test may belong to several series) */}
            <div>
              <label
                htmlFor="create-test-series"
                className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
              >
                Add to Test Series (optional)
              </label>
              <select
                id="create-test-series"
                aria-invalid={Boolean(fieldErrors.series)}
                value={seriesId}
                onChange={(e) => {
                  setSeriesId(e.target.value);
                  clearFieldError('series');
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Don&apos;t add to a series</option>
                {seriesList.map((series) => {
                  const reason = seriesReason(series);
                  return (
                    <option key={series.id} value={series.id} disabled={Boolean(reason)}>
                      {series.title}
                      {reason ? ` — unavailable: ${reason}` : ''}
                    </option>
                  );
                })}
              </select>
              <FieldError message={fieldErrors.series} />
              {seriesLoadError && (
                <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-400">
                  Test series could not be loaded ({seriesLoadError}). You can add this test to a
                  series later.
                </p>
              )}
            </div>

            {/* Access & Publish Status */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft (Hidden from students)</option>
                  <option value="published">Published (Ready for practice)</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="create-test-access"
                  className="font-semibold text-slate-700 dark:text-slate-300 block mb-1"
                >
                  Access
                </label>
                <select
                  id="create-test-access"
                  value={isPremium ? 'paid' : 'free'}
                  onChange={(e) => setIsPremium(e.target.value === 'paid')}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="paid">Paid</option>
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5"
              >
                {isSubmitting ? 'Creating...' : '+ Create Mock Test'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
