import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Shield,
  BookOpen,
  Clock,
  Sparkles,
  AlertCircle,
  Check,
  Upload,
  Trash2,
  Plus,
} from 'lucide-react';
import type { Exam, Subject, Chapter, MockTest } from '@/types';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import { useSmoothModal } from '@/hooks/useSmoothModal';

interface CreateMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  onTestCreated: (test: MockTest) => void;
  initialType?: 'full_mock' | 'topic' | 'pyq';
}

export const CreateMockTestModal: React.FC<CreateMockTestModalProps> = ({
  isOpen,
  onClose,
  exams,
  subjects,
  chapters,
  onTestCreated,
  initialType = 'full_mock',
}) => {
  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(isOpen, onClose, 200);
  const [testType, setTestType] = useState<'full_mock' | 'topic' | 'pyq'>(initialType);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [dragActiveIcon, setDragActiveIcon] = useState(false);

  const handleUploadIconFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    try {
      setIsUploadingIcon(true);
      setError(null);
      const url = await api.uploadTestIcon(file);
      setIconUrl(url);
    } catch (uploadErr) {
      setError(getErrorMessage(uploadErr, 'Failed to upload icon.'));
    } finally {
      setIsUploadingIcon(false);
    }
  };
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paperName, setPaperName] = useState('Prelims');
  const [setName, setSetName] = useState('');
  // Topic Tests are exam-independent; these optional links only make them show under exams.
  const [associatedExamIds, setAssociatedExamIds] = useState<string[]>([]);
  const [generateFromBank, setGenerateFromBank] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isPremium, setIsPremium] = useState(false);
  // New tests have no questions yet, so they start as drafts; publish from Settings once
  // questions are assigned (publishing is validated there).
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedExam = exams.find((e) => e.id === examId);

  // Start every "create" from a clean form for the requested mode.
  useEffect(() => {
    if (!isOpen) return;
    setTestType(initialType);
    setTitle('');
    setDescription('');
    setIconUrl('');
    setExamId('');
    setSubjectId('');
    setChapterId('');
    setYear(new Date().getFullYear());
    setPaperName('Prelims');
    setSetName('');
    setAssociatedExamIds([]);
    setGenerateFromBank(false);
    setIsPremium(false);
    setStatus('draft');
    setError(null);
  }, [isOpen, initialType]);

  const applyTypeDefaults = useCallback(
    (type: 'full_mock' | 'topic' | 'pyq') => {
      if (type === 'full_mock') {
        setDurationMinutes(90);
        setTotalMarks(100);
        setPassingMarks(40);
        setNegativeMarking(0.25);
        setExamId((prev) => prev || exams[0]?.id || '');
      } else if (type === 'topic') {
        setDurationMinutes(30);
        setTotalMarks(25);
        setPassingMarks(10);
        setNegativeMarking(0.25);
        setSubjectId((prev) => prev || subjects[0]?.id || '');
      } else if (type === 'pyq') {
        setDurationMinutes(60);
        setTotalMarks(85);
        setPassingMarks(35);
        setNegativeMarking(0.25);
        setExamId((prev) => prev || exams[0]?.id || '');
      }
    },
    [exams, subjects]
  );

  // Sync mode defaults when testType changes (and when the modal is opened)
  useEffect(() => {
    if (!isOpen) return;
    applyTypeDefaults(testType);
  }, [isOpen, testType, applyTypeDefaults]);

  // Filter topics based on selected subject
  const availableChapters = chapters.filter((c) => !subjectId || c.subjectId === subjectId);

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
        setTitle(`${selectedTop.name} Test 01`);
      } else if (selectedSub) {
        setTitle(`${selectedSub.name} Topic Test`);
      }
    } else if (testType === 'pyq') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(
          `${selectedExam.title} ${year} ${paperName}${setName ? ` Set ${setName}` : ''} Official PYQ`
        );
      }
    }
  };

  if (!shouldRender) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const generating = testType === 'topic' && generateFromBank;

    // Validation
    if (!generating && !title.trim()) {
      setError('Please provide a test title.');
      return;
    }

    if (testType === 'full_mock' && !examId) {
      setError('Full Mock tests must be linked to a specific competitive exam.');
      return;
    }

    if (testType === 'topic' && (!subjectId || !chapterId)) {
      setError('Topic tests must be linked to both a Subject and a Topic.');
      return;
    }

    if (testType === 'pyq' && (!examId || !year)) {
      setError('Official PYQ tests must be linked to an Exam and an Exam Year.');
      return;
    }

    setIsSubmitting(true);
    if (generating) {
      try {
        const topicName = chapters.find((c) => c.id === chapterId)?.name || 'Topic';
        const result = await api.generateTopicTests({
          subjectId,
          chapterId,
          topicName,
          associatedExamIds,
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          durationMinutes: Number(durationMinutes),
          passingMarks: Number(passingMarks),
          negativeMarking: Number(negativeMarking),
          isPremium,
        });
        result.created.forEach((t) => onTestCreated(t));
        handleSmoothClose();
      } catch (err) {
        console.error('Failed to generate topic tests:', err);
        setError(getErrorMessage(err, 'Failed to generate topic tests.'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    try {
      const created = await api.createTest({
        title: title.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined,
        testType,
        examId: testType === 'topic' ? undefined : examId || undefined,
        subjectId: testType === 'topic' ? subjectId : undefined,
        chapterId: testType === 'topic' ? chapterId : undefined,
        associatedExamIds: testType === 'topic' ? associatedExamIds : undefined,
        year: testType === 'pyq' ? year : undefined,
        paperName: testType === 'pyq' ? paperName : undefined,
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

      onTestCreated(created);
      handleSmoothClose();
    } catch (err) {
      console.error('Failed to create mock test:', err);
      setError(getErrorMessage(err, 'Failed to create mock test. Please check inputs.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={handleSmoothClose}
      className={cn(
        'fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-transparent transition-opacity duration-200 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative bg-white dark:bg-[#0A1024] border border-slate-300 dark:border-slate-700/90 rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto shadow-none transition-all duration-200 ease-out transform',
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        )}
      >
        {/* Corner Cross Button */}
        <button
          type="button"
          onClick={handleSmoothClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer group"
          aria-label="Close modal"
          title="Close"
        >
          <X className="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>

        {/* Header */}
        <div className="px-6 py-4.5 pr-14 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#070D1E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0 ring-1 ring-blue-500/20">
              <Sparkles className="w-5 h-5 text-[#026BFC]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create New Mock Test
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure test mode, syllabus targeting, duration, and scoring rules.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin text-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Mode Selector - 3 Premium Modern Interactive Cards */}
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider block mb-2.5">
                Test Mode *
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* 1. Full Mock */}
                <button
                  type="button"
                  onClick={() => {
                    setTestType('full_mock');
                    applyTypeDefaults('full_mock');
                  }}
                  className={cn(
                    'relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none',
                    testType === 'full_mock'
                      ? 'border-2 border-[#026BFC] bg-gradient-to-b from-blue-50/70 via-white to-white dark:from-blue-950/30 dark:via-[#0A1024] dark:to-[#0A1024] shadow-md shadow-blue-500/10 ring-2 ring-[#026BFC]/20'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] hover:border-blue-300 dark:hover:border-blue-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-sm hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                        testType === 'full_mock'
                          ? 'bg-gradient-to-br from-blue-500 to-[#026BFC] text-white shadow-md shadow-blue-500/30 ring-2 ring-blue-300/40 dark:ring-blue-500/40'
                          : 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40 group-hover:scale-105 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60'
                      )}
                    >
                      <Shield className="w-5 h-5" />
                    </div>
                    {testType === 'full_mock' ? (
                      <span className="w-5 h-5 rounded-full bg-[#026BFC] text-white flex items-center justify-center shadow-xs ring-2 ring-blue-200 dark:ring-blue-900/60">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 group-hover:bg-blue-50/50 dark:group-hover:bg-blue-950/50 transition-colors" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                        Full Mock
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                        Exam Pattern
                      </span>
                    </div>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-1.5 leading-snug">
                      Complete real syllabus format
                    </span>
                  </div>
                </button>

                {/* 2. Topic Test */}
                <button
                  type="button"
                  onClick={() => {
                    setTestType('topic');
                    applyTypeDefaults('topic');
                  }}
                  className={cn(
                    'relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none',
                    testType === 'topic'
                      ? 'border-2 border-emerald-500 bg-gradient-to-b from-emerald-50/70 via-white to-white dark:from-emerald-950/30 dark:via-[#0A1024] dark:to-[#0A1024] shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/20'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] hover:border-emerald-300 dark:hover:border-emerald-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-sm hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                        testType === 'topic'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300/40 dark:ring-emerald-500/40'
                          : 'bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40 group-hover:scale-105 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/60'
                      )}
                    >
                      <BookOpen className="w-5 h-5" />
                    </div>
                    {testType === 'topic' ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs ring-2 ring-emerald-200 dark:ring-emerald-900/60">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-emerald-400 group-hover:bg-emerald-50/50 dark:group-hover:bg-emerald-950/50 transition-colors" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                        Topic Test
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                        Chapter
                      </span>
                    </div>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-1.5 leading-snug">
                      Subject & chapter specific
                    </span>
                  </div>
                </button>

                {/* 3. Official PYQ */}
                <button
                  type="button"
                  onClick={() => {
                    setTestType('pyq');
                    applyTypeDefaults('pyq');
                  }}
                  className={cn(
                    'relative p-4 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer group select-none',
                    testType === 'pyq'
                      ? 'border-2 border-amber-500 bg-gradient-to-b from-amber-50/70 via-white to-white dark:from-amber-950/30 dark:via-[#0A1024] dark:to-[#0A1024] shadow-md shadow-amber-500/10 ring-2 ring-amber-500/20'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070D1E] hover:border-amber-300 dark:hover:border-amber-800/80 hover:bg-slate-50/60 dark:hover:bg-slate-900/40 hover:shadow-sm hover:-translate-y-0.5'
                  )}
                >
                  <div className="flex items-center justify-between w-full mb-3">
                    <div
                      className={cn(
                        'w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                        testType === 'pyq'
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30 ring-2 ring-amber-300/40 dark:ring-amber-500/40'
                          : 'bg-amber-50/80 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40 group-hover:scale-105 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/60'
                      )}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    {testType === 'pyq' ? (
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shadow-xs ring-2 ring-amber-200 dark:ring-amber-900/60">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-2 border-slate-200 dark:border-slate-700 group-hover:border-amber-400 group-hover:bg-amber-50/50 dark:group-hover:bg-amber-950/50 transition-colors" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[13px] font-bold text-slate-900 dark:text-white">
                        Official PYQ
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/50">
                        Past Papers
                      </span>
                    </div>
                    <span className="text-[11.5px] text-slate-500 dark:text-slate-400 block mt-1.5 leading-snug">
                      Previous year solved exams
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Conditional Linking Section based on Mode */}
            {testType === 'full_mock' && (
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Target Exam *
                </label>
                <select
                  required
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
                >
                  <option value="">Select Exam</option>
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.category})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {testType === 'topic' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject *
                  </label>
                  <select
                    required
                    value={subjectId}
                    onChange={(e) => {
                      setSubjectId(e.target.value);
                      setChapterId('');
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="">Select Subject</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Topic *
                  </label>
                  <select
                    required
                    value={chapterId}
                    onChange={(e) => setChapterId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                  >
                    <option value="">Select Topic</option>
                    {availableChapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {testType === 'topic' && (
              <div className="space-y-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Show under Exams (optional)
                  </label>
                  <p className="text-[11px] text-slate-400 mb-1.5">
                    A Topic Test needs no exam. Linking it lets the same test appear under several
                    exams without copies.
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                    {exams.map((ex) => {
                      const on = associatedExamIds.includes(ex.id);
                      return (
                        <button
                          key={ex.id}
                          type="button"
                          aria-pressed={on}
                          onClick={() =>
                            setAssociatedExamIds((prev) =>
                              on ? prev.filter((id) => id !== ex.id) : [...prev, ex.id]
                            )
                          }
                          className={cn(
                            'px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer',
                            on
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                              : 'bg-white border-slate-200 text-slate-600 dark:bg-[#070D1E] dark:border-slate-700 dark:text-slate-300'
                          )}
                        >
                          {on && <Check className="w-3 h-3 inline mr-1" />}
                          {ex.title}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateFromBank}
                    onChange={(e) => setGenerateFromBank(e.target.checked)}
                    className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
                  />
                  <span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      Generate tests from Question Bank (10 questions each)
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Uses this topic&apos;s questions not yet in any of its Topic Tests, e.g. 50
                      questions → Test 01 to Test 05. Titles are numbered automatically; tests are
                      created as drafts.
                    </span>
                  </span>
                </label>
              </div>
            )}

            {testType === 'pyq' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Exam *
                  </label>
                  <select
                    required
                    value={examId}
                    onChange={(e) => setExamId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  >
                    <option value="">Select Exam</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Year *
                  </label>
                  <input
                    type="number"
                    min={2000}
                    max={2030}
                    required
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Paper / Shift
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Prelims / Shift 1"
                    value={paperName}
                    onChange={(e) => setPaperName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Set
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A"
                    value={setName}
                    onChange={(e) => setSetName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
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
                  className="text-[11px] font-semibold text-[#026BFC] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#026BFC]" />
                  <span>Auto-generate name</span>
                </button>
              </div>
              <input
                type="text"
                required={!(testType === 'topic' && generateFromBank)}
                disabled={testType === 'topic' && generateFromBank}
                placeholder={
                  testType === 'topic' && generateFromBank
                    ? 'Auto-numbered: <Topic> Test 01, Test 02…'
                    : 'e.g. WBP Constable Full Mock 01'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
              />
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
              />
            </div>

            {/* Test Icon / Logo Upload */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
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
                    className="text-[11px] font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                )}
              </div>

              <div
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveIcon(true);
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveIcon(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveIcon(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setDragActiveIcon(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleUploadIconFile(file);
                }}
                className={cn(
                  'flex items-center gap-3 p-2 rounded-2xl transition-all border-2',
                  dragActiveIcon
                    ? 'border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                    : 'border-transparent'
                )}
              >
                {/* Icon Preview */}
                <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-0.5">
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt="Test Icon"
                      className="w-full h-full object-contain rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : selectedExam ? (
                    <ExamEmblemBadge
                      title={selectedExam.title}
                      slug={selectedExam.slug}
                      iconName={selectedExam.iconName}
                      className="w-11 h-11"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-full h-full rounded-lg flex items-center justify-center font-bold text-white',
                        testType === 'full_mock'
                          ? 'bg-[#026BFC]'
                          : testType === 'topic'
                            ? 'bg-[#10B981]'
                            : 'bg-[#F59E0B]'
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
                  <div className="flex items-center gap-2 flex-wrap">
                    <label
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                        isUploadingIcon
                          ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                          : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                      )}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingIcon
                        ? 'Uploading...'
                        : iconUrl
                          ? 'Change Custom Icon'
                          : 'Upload or Drop Icon'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingIcon}
                        className="hidden"
                        onChange={(ev) => {
                          const file = ev.target.files?.[0];
                          if (file) handleUploadIconFile(file);
                        }}
                      />
                    </label>

                    {selectedExam && !iconUrl && (
                      <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" />
                        Official {selectedExam.title} emblem applied automatically
                      </span>
                    )}
                  </div>
                  {dragActiveIcon && (
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                      Drop image to set test icon
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Duration, Marks, Negative Marking */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
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
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
                />
              </div>
            </div>

            {/* Access & Publish Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Publication Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
                >
                  <option value="draft">Draft (Hidden from students)</option>
                  <option value="published" disabled>
                    Published (add questions first, then publish from Settings)
                  </option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Access Plan
                </label>
                <select
                  value={isPremium ? 'pro' : 'free'}
                  onChange={(e) => setIsPremium(e.target.value === 'pro')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
                >
                  <option value="free">Free Practice for All</option>
                  <option value="pro">PRO Members Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sticky Actions Footer */}
          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#070D1E] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSmoothClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#026BFC] hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {testType === 'topic' && generateFromBank
                  ? isSubmitting
                    ? 'Generating...'
                    : 'Generate Topic Tests'
                  : isSubmitting
                    ? 'Creating...'
                    : 'Create Mock Test'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
