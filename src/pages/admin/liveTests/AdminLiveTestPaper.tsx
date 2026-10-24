import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Award,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Edit2,
  Eye,
  FileText,
  Filter,
  Layers,
  LayoutGrid,
  List,
  Lock,
  Plus,
  Radio,
  Save,
  Search,
  Send,
  SlidersHorizontal,
  Sparkles,
  Target,
  Trash2,
  Unlock,
  Upload,
  Wand2,
  X,
} from 'lucide-react';
import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import { Button } from '@/components/common/Button';
import { MathText } from '@/components/common/MathText';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import type { LiveTest } from '@/types';
import { useAdminTestQuestions } from '../testQuestions/useAdminTestQuestions';
import { BulkTxtImportModal } from '../testQuestions/BulkTxtImportModal';
import { CreateQuestionModal } from '../testQuestions/CreateQuestionModal';
import { SectionalMarkingPanel } from '../testQuestions/SectionalMarkingPanel';

const ENDED_STATUSES: ReadonlyArray<LiveTest['status']> = ['ended', 'completed', 'cancelled'];

const SAMPLE_TXT_LIVE = `1. ভারতের প্রথম রাষ্ট্রপতি কে ছিলেন?
A) জওহরলাল নেহেরু
B) ড. রাজেন্দ্র প্রসাদ
C) সর্দার বল্লভভাই প্যাটেল
D) ড. বি. আর. আম্বেদকর
Answer: B
Explanation: ড. রাজেন্দ্র প্রসাদ ছিলেন ভারতের প্রথম রাষ্ট্রপতি।

2. Who was the first President of India?
A) Jawaharlal Nehru
B) Dr. Rajendra Prasad
C) Sardar Vallabhbhai Patel
D) Dr. B.R. Ambedkar
Answer: B
Explanation: Dr. Rajendra Prasad was the first President of India.`;

interface LiveTestWorkspaceInnerProps {
  liveTest: LiveTest;
  onPublish: () => Promise<void>;
  onRelease: () => Promise<void>;
  busy: boolean;
  message: { type: 'success' | 'error'; text: string } | null;
}

/**
 * Modern Question Paper Workspace matching the Question Bank layout:
 * - Clean Data Table on the left with search, subject filter, and inline marks & reorder controls
 * - Side-by-side Inspector Drawer on the right to review bilingual text, math, options, and explanations
 * - Quick-edit mode in drawer to instantly fix typos or answers
 * - View mode toggle (Table View vs Detailed Card View)
 */
function LiveTestWorkspaceInner({
  liveTest,
  onPublish,
  onRelease,
  busy,
  message,
}: LiveTestWorkspaceInnerProps) {
  const testQuestionsState = useAdminTestQuestions({
    testId: liveTest.testId,
    liveMode: true,
  });

  const {
    assignedQuestions,
    setAssignedQuestions,
    handleApplyDefaultsToAll,
    handleRemoveQuestion,
    handleSaveAssigned,
    isSaving,
    isSectionalOpen,
    isTestLocked,
    isLoading,
    moveQuestion,
    referencesLoading,
    saveError,
    saveMessage,
    saveSuccess,
    setIsBulkModalOpen,
    setIsCreateModalOpen,
    setIsSectionalOpen,
    setCreateError,
    setNewExplanation,
    setNewOptionA,
    setNewOptionB,
    setNewOptionC,
    setNewOptionD,
    setNewQuestionText,
    test,
    totalAssignedMarks,
    updateQuestionMarks,
  } = testQuestionsState;

  // View & Filter States
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [pageSize, setPageSize] = useState<number | 'all'>(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedSample, setCopiedSample] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Drawer Quick Edit States
  const [drawerTab, setDrawerTab] = useState<'preview' | 'edit'>('preview');
  const [editBengaliText, setEditBengaliText] = useState('');
  const [editEnglishText, setEditEnglishText] = useState('');
  const [editOptionA, setEditOptionA] = useState('');
  const [editOptionB, setEditOptionB] = useState('');
  const [editOptionC, setEditOptionC] = useState('');
  const [editOptionD, setEditOptionD] = useState('');
  const [editCorrectOption, setEditCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [editExplanation, setEditExplanation] = useState('');
  const [editExplanationBengali, setEditExplanationBengali] = useState('');
  const [editMarks, setEditMarks] = useState<number>(1);
  const [isSavingQuestion, setIsSavingQuestion] = useState(false);
  const [drawerFeedback, setDrawerFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const isDraft = liveTest.status === 'draft';
  const isEnded = ENDED_STATUSES.includes(liveTest.status);
  const isLiveOnly = Boolean(liveTest.test?.isLiveOnly ?? test?.isLiveOnly);

  // Targets from LiveTest with fallback to underlying MockTest
  const targetQuestionCount = liveTest.totalQuestions || test?.totalQuestions || 0;
  const targetMarks = liveTest.totalMarks || test?.totalMarks || 0;
  const durationMinutes = liveTest.durationMinutes || test?.durationMinutes || 60;
  const negativeMarking = liveTest.negativeMarking ?? test?.negativeMarking ?? 0;

  const completionPercentage =
    targetQuestionCount > 0
      ? Math.min(100, Math.round((assignedQuestions.length / targetQuestionCount) * 100))
      : 100;
  const isTargetAchieved =
    targetQuestionCount > 0 && assignedQuestions.length >= targetQuestionCount;

  // Active question references
  const activeQuestion = useMemo(() => {
    if (!activeQuestionId) return null;
    return assignedQuestions.find((q) => q.questionId === activeQuestionId) || null;
  }, [assignedQuestions, activeQuestionId]);

  const activeQuestionIndex = useMemo(() => {
    if (!activeQuestionId) return -1;
    return assignedQuestions.findIndex((q) => q.questionId === activeQuestionId);
  }, [assignedQuestions, activeQuestionId]);

  // Sync drawer edit form when active question changes
  useEffect(() => {
    if (activeQuestion) {
      setEditBengaliText(activeQuestion.questionBengaliText || '');
      setEditEnglishText(activeQuestion.questionText || '');
      setEditOptionA(activeQuestion.optionA || '');
      setEditOptionB(activeQuestion.optionB || '');
      setEditOptionC(activeQuestion.optionC || '');
      setEditOptionD(activeQuestion.optionD || '');
      setEditCorrectOption(
        (activeQuestion.correctOption?.toUpperCase() as 'A' | 'B' | 'C' | 'D') || 'A'
      );
      setEditExplanation(activeQuestion.explanation || '');
      setEditExplanationBengali(activeQuestion.explanationBengali || '');
      setEditMarks(activeQuestion.marks ?? 1);
      setDrawerTab('preview');
      setDrawerFeedback(null);
    }
  }, [activeQuestion]);

  // Unique subjects for filter dropdown
  const uniqueSubjects = useMemo(() => {
    const map = new Map<string, string>();
    assignedQuestions.forEach((q) => {
      if (q.subjectId && q.subjectName) {
        map.set(q.subjectId, q.subjectName);
      } else if (q.subjectName) {
        map.set(q.subjectName, q.subjectName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [assignedQuestions]);

  // Filtered questions
  const filteredQuestions = useMemo(() => {
    return assignedQuestions.filter((item) => {
      if (subjectFilter !== 'all') {
        const match =
          item.subjectId === subjectFilter ||
          item.subjectName?.toLowerCase() === subjectFilter.toLowerCase();
        if (!match) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        item.questionText?.toLowerCase().includes(q) ||
        item.questionBengaliText?.toLowerCase().includes(q) ||
        item.optionA?.toLowerCase().includes(q) ||
        item.optionB?.toLowerCase().includes(q) ||
        item.optionC?.toLowerCase().includes(q) ||
        item.optionD?.toLowerCase().includes(q) ||
        item.explanation?.toLowerCase().includes(q) ||
        item.explanationBengali?.toLowerCase().includes(q) ||
        item.subjectName?.toLowerCase().includes(q)
      );
    });
  }, [assignedQuestions, searchQuery, subjectFilter]);

  // Pagination calculation
  const totalPages = useMemo(() => {
    if (pageSize === 'all') return 1;
    return Math.max(1, Math.ceil(filteredQuestions.length / pageSize));
  }, [filteredQuestions.length, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, subjectFilter, pageSize]);

  const paginatedQuestions = useMemo(() => {
    if (pageSize === 'all') return filteredQuestions;
    const start = (currentPage - 1) * pageSize;
    return filteredQuestions.slice(start, start + pageSize);
  }, [filteredQuestions, currentPage, pageSize]);

  // Drawer handlers
  const handlePrevQuestion = () => {
    if (activeQuestionIndex > 0) {
      const prevQ = assignedQuestions[activeQuestionIndex - 1];
      if (prevQ) setActiveQuestionId(prevQ.questionId);
    }
  };

  const handleNextQuestion = () => {
    if (activeQuestionIndex < assignedQuestions.length - 1) {
      const nextQ = assignedQuestions[activeQuestionIndex + 1];
      if (nextQ) setActiveQuestionId(nextQ.questionId);
    }
  };

  const handleMoveCurrentUp = () => {
    if (activeQuestionIndex > 0 && !isTestLocked) {
      moveQuestion(activeQuestionIndex, activeQuestionIndex - 1);
    }
  };

  const handleMoveCurrentDown = () => {
    if (activeQuestionIndex < assignedQuestions.length - 1 && !isTestLocked) {
      moveQuestion(activeQuestionIndex, activeQuestionIndex + 1);
    }
  };

  const handleRemoveCurrent = () => {
    if (activeQuestionIndex >= 0 && !isTestLocked) {
      handleRemoveQuestion(activeQuestionIndex);
      setActiveQuestionId(null);
    }
  };

  const handleSaveQuestionEdits = async () => {
    if (!activeQuestion || isTestLocked) return;
    try {
      setIsSavingQuestion(true);
      setDrawerFeedback(null);
      const updates = {
        questionText: editEnglishText,
        questionBengaliText: editBengaliText,
        optionA: editOptionA,
        optionB: editOptionB,
        optionC: editOptionC,
        optionD: editOptionD,
        correctOption: editCorrectOption,
        explanation: editExplanation,
        explanationBengali: editExplanationBengali,
      };
      await api.updateQuestion(activeQuestion.questionId, updates);

      setAssignedQuestions((prev) =>
        prev.map((q) =>
          q.questionId === activeQuestion.questionId
            ? {
                ...q,
                ...updates,
                marks: editMarks,
              }
            : q
        )
      );

      if (activeQuestionIndex >= 0 && editMarks !== activeQuestion.marks) {
        updateQuestionMarks(activeQuestionIndex, editMarks);
      }

      setDrawerFeedback({ type: 'success', text: 'Question updated successfully!' });
      setDrawerTab('preview');
      setTimeout(() => setDrawerFeedback(null), 3000);
    } catch (err) {
      setDrawerFeedback({
        type: 'error',
        text: getErrorMessage(err, 'Failed to update question.'),
      });
    } finally {
      setIsSavingQuestion(false);
    }
  };

  const openCreateQuestionModal = () => {
    if (isTestLocked) return;
    setNewQuestionText('');
    setNewOptionA('');
    setNewOptionB('');
    setNewOptionC('');
    setNewOptionD('');
    setNewExplanation('');
    setCreateError('');
    setIsCreateModalOpen(true);
  };

  if (isLoading || referencesLoading || !test) {
    return <AdminPageSkeleton label="Loading Live Test Questions..." variant="detail" />;
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-24 animate-in fade-in duration-200">
      {/* 1. TOP NAVIGATION & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/live-tests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Live Tests</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
            {liveTest.examTitle || test.examTitle || 'Exams'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900">Question Paper Workspace</span>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Draft Paper • Editing Mode
            </span>
          )}
          {!isDraft && !isEnded && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              Published • Questions Locked
            </span>
          )}
          {isEnded && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Ended • Concluded
            </span>
          )}
        </div>
      </div>

      {/* 2. ALERTS & NOTIFICATIONS */}
      {message && (
        <div
          className={cn(
            'flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-bold border shadow-xs animate-in fade-in',
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          )}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage || 'Paper questions and marks saved successfully.'}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* 3. HERO OVERVIEW COMMAND CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {/* Exam Emblem Logo */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={liveTest.logo || liveTest.examLogo || '/images/exams/logo_wbp.png'}
                alt={liveTest.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                }}
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {liveTest.examTitle || test.examTitle || 'Full Mock Exam'} • Full Mock
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {liveTest.subscriptionRequired ? 'Pro Pass only' : 'Free for all students'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-600" />
                  Exclusive Live Paper
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight line-clamp-1">
                {liveTest.title}
              </h1>

              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                {isDraft &&
                  'Draft Paper — Upload all questions for this live exam below. Live test questions are completely confidential and hidden from students and the public Question Bank until released.'}
                {!isDraft &&
                  !isEnded &&
                  'Published Exam — All questions are locked to guarantee integrity. Move the Live Test back to Draft to modify questions.'}
                {isEnded &&
                  (isLiveOnly
                    ? 'Exam Ended — Paper is still hidden. Click "Release to Practice" to make it an open practice mock test.'
                    : 'Exam Ended — This paper has been released to practice for all students.')}
              </p>
            </div>
          </div>

          {/* Top Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap lg:self-center">
            {isDraft && (
              <>
                <button
                  type="button"
                  disabled={isTestLocked}
                  onClick={() => setIsBulkModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Bulk import questions from TXT file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Bulk Add (TXT)</span>
                </button>

                <button
                  type="button"
                  disabled={isTestLocked}
                  onClick={openCreateQuestionModal}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Create single question manually"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Create Question</span>
                </button>

                <button
                  type="button"
                  onClick={onPublish}
                  disabled={busy || assignedQuestions.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  title={
                    assignedQuestions.length === 0
                      ? 'Add at least one question before publishing'
                      : 'Publish Live Test'
                  }
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{busy ? 'Publishing…' : 'Publish Live Test'}</span>
                </button>
              </>
            )}

            {!isDraft && !isEnded && (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Questions Locked</span>
              </span>
            )}

            {isEnded && isLiveOnly && (
              <button
                type="button"
                onClick={onRelease}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{busy ? 'Releasing…' : 'Release to Practice'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 4. KEY METRICS BENTO GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Questions */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>QUESTIONS</span>
              <span
                className={cn(
                  'text-[11px] font-bold',
                  isTargetAchieved ? 'text-emerald-600' : 'text-blue-600'
                )}
              >
                {completionPercentage}%
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">
                {assignedQuestions.length}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {targetQuestionCount > 0 ? targetQuestionCount : 'Any'} target
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  isTargetAchieved ? 'bg-emerald-500' : 'bg-blue-600'
                )}
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
          </div>
        </div>

        {/* Metric 2: Total Marks */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Award className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>TOTAL MARKS</span>
              {targetMarks > 0 && totalAssignedMarks === targetMarks ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  Matched ✓
                </span>
              ) : targetMarks > 0 ? (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Target {targetMarks}
                </span>
              ) : null}
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">
                {totalAssignedMarks}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                / {targetMarks > 0 ? `${targetMarks}` : 'marks'}
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-500',
                  targetMarks > 0 && totalAssignedMarks === targetMarks
                    ? 'bg-emerald-500'
                    : 'bg-amber-500'
                )}
                style={{
                  width: `${
                    targetMarks > 0
                      ? Math.min(100, Math.round((totalAssignedMarks / targetMarks) * 100))
                      : 100
                  }%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Metric 3: Duration */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>DURATION</span>
              <span className="text-[10px] font-semibold text-purple-600 bg-purple-50 px-1.5 py-0.2 rounded">
                Window
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">{durationMinutes}</span>
              <span className="text-xs text-slate-400 font-medium">Minutes</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">Fixed countdown window</p>
          </div>
        </div>

        {/* Metric 4: Negative Marking */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3.5 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
            <Target className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>NEGATIVE MARK</span>
              <span
                className={cn(
                  'text-[10px] font-bold',
                  negativeMarking > 0 ? 'text-rose-600' : 'text-emerald-600'
                )}
              >
                {negativeMarking > 0 ? 'Active' : 'None'}
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg font-black text-slate-900 font-mono">
                {negativeMarking > 0 ? `-${negativeMarking}` : '0.00'}
              </span>
              <span className="text-xs text-slate-400 font-medium">per wrong</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              {negativeMarking > 0
                ? 'Deducted per incorrect response'
                : 'No penalty for incorrect response'}
            </p>
          </div>
        </div>
      </div>

      {/* 5. QUESTION PAPER TOOLBAR (WHEN QUESTIONS EXIST) */}
      {assignedQuestions.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Count, Search, Subject Filter */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-bold">
                Paper Questions ({assignedQuestions.length})
              </span>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search questions in paper..."
                  className="pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 sm:w-60 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-slate-400 hover:text-slate-600 text-xs absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Subject filter dropdown */}
              {uniqueSubjects.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs cursor-pointer"
                  >
                    <option value="all">All Subjects ({assignedQuestions.length})</option>
                    {uniqueSubjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Right: View toggle & Action Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* View Switcher: Table View vs Cards View */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'table'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                  title="Question Bank Style Table"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Table View</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                    viewMode === 'cards'
                      ? 'bg-white text-blue-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  )}
                  title="Expanded Detailed Cards"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Cards</span>
                </button>
              </div>

              {/* Page size dropdown (for table view) */}
              {viewMode === 'table' && (
                <select
                  value={pageSize}
                  onChange={(e) =>
                    setPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))
                  }
                  className="py-1.5 px-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none shadow-2xs cursor-pointer"
                  title="Questions per page"
                >
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                  <option value={100}>100 / page</option>
                  <option value="all">Show All</option>
                </select>
              )}

              <Button
                size="sm"
                variant="outline"
                className={cn(
                  'text-xs font-bold shadow-2xs',
                  isSectionalOpen
                    ? 'bg-indigo-50 border-indigo-400 text-indigo-700'
                    : 'border-slate-200 text-slate-700 bg-white hover:bg-slate-50'
                )}
                leftIcon={<SlidersHorizontal className="w-3.5 h-3.5 text-indigo-600" />}
                onClick={() => setIsSectionalOpen((v) => !v)}
              >
                Sectional Marking
              </Button>

              <Button
                size="sm"
                variant="outline"
                disabled={isTestLocked}
                className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs"
                leftIcon={<Wand2 className="w-3.5 h-3.5 text-amber-500" />}
                onClick={handleApplyDefaultsToAll}
                title="Auto-fill uniform standard scoring across all questions"
              >
                Auto Standard Marks
              </Button>

              <Button
                size="sm"
                disabled={isSaving || isTestLocked}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                leftIcon={<Save className="w-3.5 h-3.5" />}
                onClick={handleSaveAssigned}
              >
                {isSaving ? 'Saving…' : 'Save Order & Marks'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SECTIONAL MARKING DRAWER PANEL */}
      <SectionalMarkingPanel testQuestionsState={testQuestionsState} />

      {/* 7. QUESTIONS CONTENT AREA */}
      {assignedQuestions.length === 0 ? (
        /* HERO EMPTY STATE STUDIO */
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
          {/* Studio Header */}
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70 mb-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>Paper Questions Setup</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900 tracking-tight">
              Add Questions to this Live Test Paper
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Live mock tests use exclusive, unreleased questions. They will remain completely
              confidential and hidden from students until the live exam starts.
            </p>
          </div>

          {/* 2 Big Action Cards Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
            {/* Card 1: Bulk Add via TXT */}
            <div
              onClick={() => {
                if (isTestLocked) return;
                setIsBulkModalOpen(true);
              }}
              className="group p-6 rounded-2xl border-2 border-blue-200/90 hover:border-blue-600 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/20 hover:bg-blue-50/60 transition-all cursor-pointer space-y-4 shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                    <Upload className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                    Recommended • Fastest
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    Bulk Add via TXT
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Paste or upload entire question papers at once. Automatic detection of
                    questions, 4 options (A-D), Bengali text, correct answer keys, and explanations.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span>Open Bulk TXT Uploader →</span>
                </button>
              </div>
            </div>

            {/* Card 2: Create Single Question */}
            <div
              onClick={() => {
                if (isTestLocked) return;
                openCreateQuestionModal();
              }}
              className="group p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-gradient-to-br from-slate-50/40 via-white to-emerald-50/20 hover:bg-emerald-50/40 transition-all cursor-pointer space-y-4 shadow-xs hover:shadow-md flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                    Interactive Editor
                  </span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                    Create Question Manually
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Step-by-step editor modal with bilingual English/Bengali input, LaTeX
                    mathematics formulas, custom option keys, and diagram support.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  className="w-full py-2.5 px-4 bg-white border border-slate-300 group-hover:border-emerald-500 text-slate-700 group-hover:text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-emerald-600" />
                  <span>Create Single Question →</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cheatsheet Format Box with 1-Click Copy Sample */}
          <div className="max-w-3xl mx-auto text-left bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span className="text-xs font-bold text-slate-800">
                  Accepted TXT Format Example
                </span>
                <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md hidden sm:inline-block">
                  Bengali & English
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(SAMPLE_TXT_LIVE);
                  setCopiedSample(true);
                  setTimeout(() => setCopiedSample(false), 2000);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
              >
                {copiedSample ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Sample</span>
                  </>
                )}
              </button>
            </div>

            <pre className="text-[11px] font-mono text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 overflow-x-auto leading-relaxed shadow-2xs">
              {SAMPLE_TXT_LIVE}
            </pre>
          </div>
        </div>
      ) : (
        /* 8. MAIN QUESTIONS SPLIT GRID (QUESTION BANK STYLE) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT: TABLE / CARDS PANEL */}
          <div
            className={cn(
              'transition-all duration-300 space-y-3',
              activeQuestion ? 'lg:col-span-8' : 'lg:col-span-12'
            )}
          >
            {viewMode === 'table' ? (
              /* TABLE VIEW: QUESTION BANK STYLE */
              <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8FAFC] border-b border-slate-200/80">
                      <tr className="text-slate-500 font-semibold text-[11px] uppercase tracking-wider">
                        <th className="py-3 px-3 w-16 text-center">#</th>
                        <th className="py-3 px-4 min-w-[240px]">Question (Preview)</th>
                        <th className="py-3 px-3">Subject / Section</th>
                        <th className="py-3 px-3 text-center">Correct Key</th>
                        <th className="py-3 px-3 text-center">Marks</th>
                        <th className="py-3 px-3 text-center">Actions</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 font-medium">
                      {paginatedQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            No questions found matching &ldquo;{searchQuery}&rdquo;.
                          </td>
                        </tr>
                      ) : (
                        paginatedQuestions.map((q) => {
                          const originalIndex = assignedQuestions.findIndex(
                            (item) => item.questionId === q.questionId
                          );
                          const isActive = activeQuestionId === q.questionId;

                          return (
                            <tr
                              key={q.questionId}
                              onClick={() => setActiveQuestionId(q.questionId)}
                              className={cn(
                                'hover:bg-slate-50/90 transition-colors cursor-pointer group',
                                isActive &&
                                  'bg-blue-50/70 border-l-4 border-l-blue-600 font-semibold'
                              )}
                            >
                              {/* Order & Reorder Column */}
                              <td
                                className="py-3 px-2 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <input
                                    type="number"
                                    min={1}
                                    max={assignedQuestions.length}
                                    value={originalIndex + 1}
                                    disabled={isTestLocked}
                                    onChange={(e) => {
                                      const val = parseInt(e.target.value, 10);
                                      if (
                                        !isNaN(val) &&
                                        val >= 1 &&
                                        val <= assignedQuestions.length
                                      ) {
                                        moveQuestion(originalIndex, val - 1);
                                      }
                                    }}
                                    className="w-9 h-7 rounded-lg bg-blue-50/70 border border-blue-200 text-blue-700 font-mono font-bold text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                    title="Type number to jump position"
                                  />
                                  <div className="flex flex-col gap-0.5">
                                    <button
                                      type="button"
                                      disabled={isTestLocked || originalIndex === 0}
                                      onClick={() => moveQuestion(originalIndex, originalIndex - 1)}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-2.5 h-2.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={
                                        isTestLocked ||
                                        originalIndex === assignedQuestions.length - 1
                                      }
                                      onClick={() => moveQuestion(originalIndex, originalIndex + 1)}
                                      className="p-0.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 disabled:opacity-20 cursor-pointer"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                </div>
                              </td>

                              {/* Question Preview Column */}
                              <td className="py-3 px-4 max-w-[340px]">
                                <div className="space-y-0.5">
                                  {q.questionBengaliText && (
                                    <p className="text-xs font-semibold text-slate-900 truncate leading-snug">
                                      {q.questionBengaliText}
                                    </p>
                                  )}
                                  <p
                                    className={cn(
                                      'text-xs truncate leading-snug',
                                      q.questionBengaliText
                                        ? 'text-slate-500 text-[11px]'
                                        : 'font-semibold text-slate-900'
                                    )}
                                  >
                                    {q.questionText || '—'}
                                  </p>
                                </div>
                              </td>

                              {/* Subject Badge */}
                              <td className="py-3 px-3 text-slate-700">
                                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 truncate inline-block max-w-[140px]">
                                  {q.subjectName || 'General'}
                                </span>
                              </td>

                              {/* Correct Option Key */}
                              <td className="py-3 px-3 text-center">
                                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/90 inline-flex items-center gap-1 shadow-2xs">
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Option ({q.correctOption?.toUpperCase() || '—'})</span>
                                </span>
                              </td>

                              {/* Marks Column */}
                              <td
                                className="py-3 px-3 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="number"
                                  step="0.25"
                                  min="0"
                                  value={q.marks}
                                  disabled={isTestLocked}
                                  onChange={(e) =>
                                    updateQuestionMarks(
                                      originalIndex,
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-14 px-2 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-black font-mono text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                                  title="Edit individual question marks"
                                />
                              </td>

                              {/* Actions Column */}
                              <td
                                className="py-3 px-3 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => setActiveQuestionId(q.questionId)}
                                    className={cn(
                                      'p-1.5 rounded-lg border transition-colors cursor-pointer',
                                      isActive
                                        ? 'bg-blue-600 text-white border-blue-600'
                                        : 'bg-white border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-300'
                                    )}
                                    title="Inspect Question Details"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isTestLocked}
                                    onClick={() => handleRemoveQuestion(originalIndex)}
                                    className="p-1.5 rounded-lg border border-transparent text-slate-400 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors disabled:opacity-30 cursor-pointer"
                                    title="Remove Question from Paper"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Pagination Footer */}
                {pageSize !== 'all' && totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-3.5 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 gap-2">
                    <div>
                      Showing{' '}
                      <strong className="text-slate-800">{(currentPage - 1) * pageSize + 1}</strong>{' '}
                      to{' '}
                      <strong className="text-slate-800">
                        {Math.min(currentPage * pageSize, filteredQuestions.length)}
                      </strong>{' '}
                      of <strong className="text-slate-800">{filteredQuestions.length}</strong>{' '}
                      questions
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5 inline mr-0.5" /> Prev
                      </button>

                      <div className="px-2 text-xs font-bold text-slate-700">
                        Page {currentPage} of {totalPages}
                      </div>

                      <button
                        type="button"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed text-xs font-bold transition-colors cursor-pointer"
                      >
                        Next <ChevronRight className="w-3.5 h-3.5 inline ml-0.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* CARDS VIEW FALLBACK */
              <div className="space-y-3.5">
                {filteredQuestions.length === 0 ? (
                  <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
                    No questions found matching &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  filteredQuestions.map((q, idx) => (
                    <div
                      key={q.questionId}
                      className="bg-white rounded-2xl border border-slate-200/80 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-start justify-between gap-4"
                    >
                      {/* Left Reorder Steppers */}
                      <div className="flex items-center md:flex-col gap-1.5 shrink-0">
                        <input
                          type="number"
                          min={1}
                          max={assignedQuestions.length}
                          value={idx + 1}
                          disabled={isTestLocked}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val) && val >= 1 && val <= assignedQuestions.length) {
                              moveQuestion(idx, val - 1);
                            }
                          }}
                          className="w-10 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-mono font-black text-xs text-center focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          title="Type number to jump position"
                        />
                        <div className="flex md:flex-col gap-1">
                          <button
                            type="button"
                            disabled={isTestLocked || idx === 0}
                            onClick={() => moveQuestion(idx, idx - 1)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={isTestLocked || idx === assignedQuestions.length - 1}
                            onClick={() => moveQuestion(idx, idx + 1)}
                            className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors border border-slate-200 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Question Body */}
                      <div className="min-w-0 flex-1 space-y-2.5">
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="font-mono font-black text-slate-400">Q#{idx + 1}</span>
                          {q.correctOption && (
                            <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Correct: Option ({q.correctOption.toUpperCase()})
                            </span>
                          )}
                          {q.subjectName && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {q.subjectName}
                            </span>
                          )}
                        </div>

                        <div className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                          <MathText>{q.questionText}</MathText>
                        </div>

                        {q.questionBengaliText && (
                          <div className="text-xs sm:text-sm text-slate-700 leading-relaxed font-sans">
                            <MathText>{q.questionBengaliText}</MathText>
                          </div>
                        )}

                        {/* 4 Options Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                          {[
                            { key: 'A', text: q.optionA },
                            { key: 'B', text: q.optionB },
                            { key: 'C', text: q.optionC },
                            { key: 'D', text: q.optionD },
                          ].map((opt) => {
                            const isCorrect = q.correctOption?.toUpperCase() === opt.key;
                            return (
                              <div
                                key={opt.key}
                                className={cn(
                                  'p-2.5 rounded-xl border flex items-center gap-2.5 transition-colors',
                                  isCorrect
                                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold'
                                    : 'bg-slate-50/70 border-slate-200 text-slate-700'
                                )}
                              >
                                <span
                                  className={cn(
                                    'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0',
                                    isCorrect
                                      ? 'bg-emerald-600 text-white'
                                      : 'bg-slate-200 text-slate-700'
                                  )}
                                >
                                  {opt.key}
                                </span>
                                <span className="flex-1">
                                  <MathText>{opt.text || '—'}</MathText>
                                </span>
                                {isCorrect && (
                                  <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Short Notes / Explanation */}
                        {(q.explanationBengali || q.explanation) && (
                          <div className="pt-1.5">
                            <ShortNotesBox
                              explanation={q.explanationBengali || q.explanation}
                              isMathematics={isMathematicsQuestion(q)}
                              defaultExpanded={false}
                            />
                          </div>
                        )}
                      </div>

                      {/* Marks & Remove Button */}
                      <div className="flex flex-row md:flex-col items-end justify-between md:justify-start gap-3 shrink-0 border-t md:border-t-0 md:border-l border-slate-100 pt-2 md:pt-0 md:pl-4">
                        <div className="space-y-1 text-right">
                          <label className="text-[10px] uppercase font-black text-slate-400 block">
                            Marks
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            min="0"
                            value={q.marks}
                            disabled={isTestLocked}
                            onChange={(e) =>
                              updateQuestionMarks(idx, parseFloat(e.target.value) || 0)
                            }
                            className="w-16 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-black text-center text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 shadow-2xs"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(idx)}
                          disabled={isTestLocked || isSaving}
                          className="disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-1.5 text-xs font-bold border border-transparent hover:border-rose-200 cursor-pointer"
                          title="Remove question from this Live Test paper"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* RIGHT: QUESTION DETAILS DRAWER (QUESTION BANK STYLE) */}
          {activeQuestion && (
            <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden sticky top-4 animate-in slide-in-from-right-4 duration-200">
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900">Question Details</h3>
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono">
                    #{activeQuestionIndex + 1}
                  </span>
                  <span
                    className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-100 transition-colors truncate max-w-[100px]"
                    title={`Click to copy database ID: ${activeQuestion.questionId}`}
                    onClick={() => {
                      navigator.clipboard.writeText(activeQuestion.questionId);
                      setCopiedId(activeQuestion.questionId);
                      setTimeout(() => setCopiedId(null), 2000);
                    }}
                  >
                    {copiedId === activeQuestion.questionId
                      ? 'Copied!'
                      : `#${activeQuestion.questionId.slice(0, 8)}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveQuestionId(null)}
                  title="Close Details Panel"
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Question Navigator (Prev / Next Slider) */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-100/70 border-b border-slate-200/80 text-xs">
                <button
                  type="button"
                  disabled={activeQuestionIndex <= 0}
                  onClick={handlePrevQuestion}
                  className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="text-[11px] font-bold text-slate-500">
                  Question <strong className="text-slate-900">{activeQuestionIndex + 1}</strong> of{' '}
                  <strong className="text-slate-900">{assignedQuestions.length}</strong>
                </div>

                <button
                  type="button"
                  disabled={activeQuestionIndex >= assignedQuestions.length - 1}
                  onClick={handleNextQuestion}
                  className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mode Switcher: Preview vs Quick Edit */}
              <div className="flex items-center border-b border-slate-100 px-4 text-xs font-bold text-slate-500 bg-white">
                <button
                  type="button"
                  onClick={() => setDrawerTab('preview')}
                  className={cn(
                    'py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer',
                    drawerTab === 'preview'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerTab('edit')}
                  disabled={isTestLocked}
                  className={cn(
                    'py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40',
                    drawerTab === 'edit'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  )}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Quick Edit</span>
                </button>
              </div>

              {/* Drawer Feedback */}
              {drawerFeedback && (
                <div
                  className={cn(
                    'm-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in',
                    drawerFeedback.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  )}
                >
                  {drawerFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{drawerFeedback.text}</span>
                </div>
              )}

              {/* DRAWER BODY: TAB 1 (PREVIEW) */}
              {drawerTab === 'preview' ? (
                <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {/* Bengali Question Text */}
                  {activeQuestion.questionBengaliText && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Question (Bengali)
                      </span>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-sm font-semibold text-slate-900 leading-relaxed">
                        <MathText>{activeQuestion.questionBengaliText}</MathText>
                      </div>
                    </div>
                  )}

                  {/* English Question Text */}
                  {activeQuestion.questionText && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Question (English)
                      </span>
                      <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 leading-relaxed">
                        <MathText>{activeQuestion.questionText}</MathText>
                      </div>
                    </div>
                  )}

                  {/* Options List */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                      Options & Correct Answer
                    </span>
                    <div className="space-y-1.5">
                      {[
                        { key: 'A', text: activeQuestion.optionA },
                        { key: 'B', text: activeQuestion.optionB },
                        { key: 'C', text: activeQuestion.optionC },
                        { key: 'D', text: activeQuestion.optionD },
                      ].map((opt) => {
                        const isCorrect = activeQuestion.correctOption?.toUpperCase() === opt.key;
                        return (
                          <div
                            key={opt.key}
                            className={cn(
                              'p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-colors',
                              isCorrect
                                ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                                : 'bg-white border-slate-200 text-slate-700'
                            )}
                          >
                            <span
                              className={cn(
                                'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0',
                                isCorrect
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 text-slate-600'
                              )}
                            >
                              {opt.key}
                            </span>
                            <span className="flex-1 min-w-0">
                              <MathText>{opt.text || '—'}</MathText>
                            </span>
                            {isCorrect && (
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shrink-0">
                                Correct ✓
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Explanation / Solution */}
                  {(activeQuestion.explanationBengali || activeQuestion.explanation) && (
                    <div className="space-y-1 pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                        Solution & Explanation
                      </span>
                      <ShortNotesBox
                        explanation={
                          activeQuestion.explanationBengali || activeQuestion.explanation
                        }
                        isMathematics={isMathematicsQuestion(activeQuestion)}
                        defaultExpanded={true}
                      />
                    </div>
                  )}

                  {/* Question Metadata */}
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Subject
                      </span>
                      <span className="font-bold text-slate-800 truncate block">
                        {activeQuestion.subjectName || 'General'}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Marks Weight
                      </span>
                      <span className="font-bold text-emerald-700 font-mono">
                        +{activeQuestion.marks || 1} Marks
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* DRAWER BODY: TAB 2 (QUICK EDIT) */
                <div className="p-4 space-y-3.5 max-h-[calc(100vh-280px)] overflow-y-auto">
                  {/* Edit Bengali Text */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Question (Bengali)
                    </label>
                    <textarea
                      rows={3}
                      value={editBengaliText}
                      onChange={(e) => setEditBengaliText(e.target.value)}
                      placeholder="বাংলা প্রশ্ন লিখুন..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Edit English Text */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Question (English)
                    </label>
                    <textarea
                      rows={2}
                      value={editEnglishText}
                      onChange={(e) => setEditEnglishText(e.target.value)}
                      placeholder="Enter question in English..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Edit Options */}
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Options (A-D)
                    </label>
                    {[
                      { key: 'A' as const, val: editOptionA, set: setEditOptionA },
                      { key: 'B' as const, val: editOptionB, set: setEditOptionB },
                      { key: 'C' as const, val: editOptionC, set: setEditOptionC },
                      { key: 'D' as const, val: editOptionD, set: setEditOptionD },
                    ].map((opt) => (
                      <div key={opt.key} className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 border border-slate-200">
                          {opt.key}
                        </span>
                        <input
                          type="text"
                          value={opt.val}
                          onChange={(e) => opt.set(e.target.value)}
                          placeholder={`Option ${opt.key}`}
                          className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  {/* Correct Option Selector */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Correct Answer Key
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {(['A', 'B', 'C', 'D'] as const).map((key) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setEditCorrectOption(key)}
                          className={cn(
                            'py-2 rounded-xl text-xs font-black transition-all border cursor-pointer',
                            editCorrectOption === key
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          )}
                        >
                          Option {key}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Edit Explanation */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Explanation (Bengali / English)
                    </label>
                    <textarea
                      rows={2}
                      value={editExplanationBengali || editExplanation}
                      onChange={(e) => {
                        setEditExplanationBengali(e.target.value);
                        setEditExplanation(e.target.value);
                      }}
                      placeholder="ব্যাখ্যা বা Short Notes লিখুন..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Edit Marks */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-600 uppercase">
                      Question Marks
                    </label>
                    <input
                      type="number"
                      step="0.25"
                      min="0"
                      value={editMarks}
                      onChange={(e) => setEditMarks(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Save Button */}
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={isSavingQuestion}
                      onClick={handleSaveQuestionEdits}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                    >
                      {isSavingQuestion ? 'Saving…' : 'Save Question Changes'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDrawerTab('preview')}
                      className="text-xs font-bold border-slate-200"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {/* Drawer Footer Actions */}
              <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={activeQuestionIndex <= 0 || isTestLocked}
                    onClick={handleMoveCurrentUp}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    title="Move Question Up in Paper"
                  >
                    <ArrowUp className="w-3.5 h-3.5 inline" /> Up
                  </button>

                  <button
                    type="button"
                    disabled={activeQuestionIndex >= assignedQuestions.length - 1 || isTestLocked}
                    onClick={handleMoveCurrentDown}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                    title="Move Question Down in Paper"
                  >
                    <ArrowDown className="w-3.5 h-3.5 inline" /> Down
                  </button>
                </div>

                <button
                  type="button"
                  disabled={isTestLocked}
                  onClick={handleRemoveCurrent}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
                  title="Remove from paper"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 9. STICKY BOTTOM SUMMARY BAR (WHEN QUESTIONS EXIST) */}
      {assignedQuestions.length > 0 && (
        <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Live Test Paper Summary</h4>
            <p className="text-xs text-slate-500">
              {assignedQuestions.length} Questions Assigned • Total Sum:{' '}
              <strong className="text-emerald-600 font-mono font-bold">
                {totalAssignedMarks} Marks
              </strong>{' '}
              {targetMarks > 0 && <span>(Target: {targetMarks} Marks)</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDraft && (
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => setIsBulkModalOpen(true)}
              >
                + Add More TXT
              </Button>
            )}

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveAssigned}
              disabled={isSaving || isTestLocked}
            >
              {isSaving ? 'Saving Changes…' : 'Save Order & Marks'}
            </Button>
          </div>
        </div>
      )}

      {/* 10. MODALS */}
      <BulkTxtImportModal testQuestionsState={testQuestionsState} test={test} />
      <CreateQuestionModal testQuestionsState={testQuestionsState} test={test} />
    </div>
  );
}

/**
 * Question workspace of one Live Test's paper, opened from the Live Tests page. Questions are
 * uploaded here (Bulk TXT / Create Question) while the Live Test is a Draft; publishing the
 * Live Test validates the paper and locks it.
 */
export const AdminLiveTestPaper: React.FC = () => {
  const { liveTestId } = useParams<{ liveTestId: string }>();
  const [liveTest, setLiveTest] = useState<LiveTest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [workspaceKey, setWorkspaceKey] = useState(0);

  const load = useCallback(async () => {
    if (!liveTestId) return;
    try {
      setLoading(true);
      setLiveTest(await api.getLiveTestById(liveTestId));
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Live Test could not be loaded.') });
    } finally {
      setLoading(false);
    }
  }, [liveTestId]);

  useEffect(() => {
    load();
  }, [load]);

  const handlePublish = async () => {
    if (!liveTest) return;
    try {
      setBusy(true);
      setMessage(null);
      const updated = await api.updateLiveTest(liveTest.id, { status: 'upcoming' });
      setLiveTest(updated);
      setWorkspaceKey((k) => k + 1);
      setMessage({
        type: 'success',
        text: 'Live Test published successfully. Students can register now; questions are locked.',
      });
    } catch (err) {
      setMessage({
        type: 'error',
        text: getErrorMessage(err, 'Live Test could not be published.'),
      });
    } finally {
      setBusy(false);
    }
  };

  const handleRelease = async () => {
    if (!liveTest) return;
    try {
      setBusy(true);
      setMessage(null);
      await api.releaseLivePaperToPractice(liveTest.id);
      await load();
      setWorkspaceKey((k) => k + 1);
      setMessage({
        type: 'success',
        text: 'Paper released to Practice: it is now an open Full Mock test available for practice.',
      });
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err, 'Paper could not be released.') });
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <AdminPageSkeleton label="Loading Live Test Paper" variant="detail" />;

  if (!liveTest) {
    return (
      <div className="max-w-xl mx-auto mt-16 space-y-4">
        <div className="p-6 rounded-2xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          {message?.text || 'This Live Test was not found.'}
        </div>
        <Link
          to="/admin/live-tests"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Live Tests
        </Link>
      </div>
    );
  }

  return (
    <LiveTestWorkspaceInner
      key={workspaceKey}
      liveTest={liveTest}
      onPublish={handlePublish}
      onRelease={handleRelease}
      busy={busy}
      message={message}
    />
  );
};
