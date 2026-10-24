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
  Clock,
  Copy,
  FileText,
  Layers,
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
 * Modern, dedicated Live Test Paper Workspace for uploading, previewing, and ordering questions.
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

  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSample, setCopiedSample] = useState(false);

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

  // Instant client-side search across question text and options
  const filteredQuestions = useMemo(() => {
    if (!searchQuery.trim()) return assignedQuestions;
    const q = searchQuery.toLowerCase();
    return assignedQuestions.filter(
      (item) =>
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
  }, [assignedQuestions, searchQuery]);

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
                src={
                  liveTest.logo ||
                  liveTest.examLogo ||
                  '/images/exams/logo_wbp.png'
                }
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

      {/* 4. KEY METRICS BENTO GRID (COMPACT & MODERN) */}
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
              <span className="text-lg font-black text-slate-900 font-mono">
                {durationMinutes}
              </span>
              <span className="text-xs text-slate-400 font-medium">Minutes</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 truncate">
              Fixed countdown window
            </p>
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

      {/* 5. QUESTIONS MANAGEMENT TOOLBAR (WHEN QUESTIONS EXIST) */}
      {assignedQuestions.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-base font-bold text-slate-900">
              Paper Questions ({assignedQuestions.length})
            </h2>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search questions in paper..."
                className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 w-52 sm:w-64 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-slate-400 hover:text-slate-600 text-xs absolute right-2.5 top-1/2 -translate-y-1/2"
                >
                  ×
                </button>
              )}
            </div>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 flex-wrap">
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
                    Paste or upload entire question papers at once. Automatic detection of questions,
                    4 options (A-D), Bengali text, correct answer keys, and explanations.
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
                    Step-by-step editor modal with bilingual English/Bengali input, LaTeX mathematics
                    formulas, custom option keys, and diagram support.
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
        /* ASSIGNED QUESTIONS LIST */
        <div className="space-y-3.5">
          {filteredQuestions.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500">
              No questions found matching "{searchQuery}".
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
                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
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
                      onChange={(e) => updateQuestionMarks(idx, parseFloat(e.target.value) || 0)}
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

          {/* Sticky Bottom Summary Bar */}
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
        </div>
      )}

      {/* 8. MODALS */}
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
