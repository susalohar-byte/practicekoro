import {
  ArrowLeft,
  Plus,
  Save,
  CheckCircle2,
  Shuffle,
  CheckSquare,
  Upload,
  BookOpen,
  FolderTree,
  Award,
  Clock,
  Target,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Link } from 'react-router-dom';
import type { MockTest } from '@/types';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface TestQuestionsHeaderProps {
  testQuestionsState: AdminTestQuestionsState;
  test: MockTest;
  targetQuestionCount: number;
  completionPercentage: number;
  isTargetAchieved: boolean;
}

export function TestQuestionsHeader({
  testQuestionsState,
  test,
  targetQuestionCount,
  completionPercentage,
  isTargetAchieved,
}: TestQuestionsHeaderProps) {
  const {
    activeTab,
    assignedQuestions,
    availableSwitchTests,
    currentTestId,
    eligibleBankQuestions,
    handleSaveAssigned,
    handleSelectTest,
    isSaving,
    isTestLocked,
    liveMode,
    selectedQuestionIds,
    setCreateError,
    setIsBulkModalOpen,
    setIsCreateModalOpen,
    setNewExplanation,
    setNewOptionA,
    setNewOptionB,
    setNewOptionC,
    setNewOptionD,
    setNewQuestionText,
    testChapter,
    testExam,
    testSubject,
    totalAssignedMarks,
    unassignedEligibleQuestions,
  } = testQuestionsState;
  return (
    <>
      {/* ===================================================================== */}
      {/* 1. TOP HEADER & CONTEXT COMMAND CENTER (Subject -> Topic -> Test)      */}
      {/* ===================================================================== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#060c1d] via-[#09142f] to-[#0c1b3f] border border-[#1b2b57] p-6 sm:p-8 shadow-2xl admin-dark-card text-white">
        {/* Ambient background glows */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#0075FF]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-4 max-w-4xl">
            {/* Navigation & Switch Test Pill */}
            <div className="flex items-center gap-3 flex-wrap">
              <Link
                to={liveMode ? '/admin/live-tests' : '/admin/tests'}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 hover:bg-white/15 text-xs text-slate-200 hover:text-white font-semibold transition-all border border-white/10 shadow-xs"
                style={{ color: '#e2e8f0' }}
              >
                <ArrowLeft className="w-3.5 h-3.5" />{' '}
                {liveMode ? 'Back to Live Tests' : 'Back to Mock Tests'}
              </Link>

              {availableSwitchTests.length > 0 && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#091124]/90 border border-[#1d3163] shadow-xs">
                  <span
                    className="text-[10px] uppercase font-black text-sky-400 tracking-wider flex items-center gap-1"
                    style={{ color: '#38bdf8' }}
                  >
                    <Shuffle className="w-3 h-3" />
                    Switch Test:
                  </span>
                  <select
                    value={currentTestId}
                    onChange={(e) => handleSelectTest(e.target.value)}
                    style={{
                      backgroundColor: '#091124',
                      color: '#ffffff',
                      borderColor: 'transparent',
                    }}
                    className="text-xs font-bold rounded-md py-0.5 focus:outline-none focus:ring-1 focus:ring-[#0075FF] max-w-[280px] truncate cursor-pointer"
                  >
                    {availableSwitchTests.map((t) => (
                      <option
                        key={t.id}
                        value={t.id}
                        style={{ backgroundColor: '#091124', color: '#ffffff' }}
                      >
                        {t.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Test Hierarchy & Title */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Specific Context Hierarchy Badge */}
                {(test.testType === 'topic' || test.testType === 'chapter_mock') && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-extrabold bg-[#0075FF]/20 text-[#38bdf8] border border-[#0075FF]/40 shadow-xs">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5 text-sky-300" />
                      {testSubject?.name || test.subjectName || 'Subject'}
                    </span>
                    <span className="text-slate-500 font-normal">→</span>
                    <span
                      className="flex items-center gap-1 text-white"
                      style={{ color: '#ffffff' }}
                    >
                      <FolderTree className="w-3.5 h-3.5 text-[#0075FF]" />
                      {testChapter?.name || test.chapterName || test.topicName || 'Topic'}
                    </span>
                  </div>
                )}
                {test.testType === 'full_mock' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-xs">
                    <Award className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {testExam?.title || test.examTitle || 'Full Mock Exam'} • Full Mock Test
                    </span>
                  </div>
                )}
                {test.testType === 'pyq' && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>
                      {testExam?.title || test.examTitle || 'Exam'} • PYQ (
                      {test.year || 'Previous Year'} {test.shift || ''})
                    </span>
                  </div>
                )}

                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800/90 text-slate-300 border border-slate-700"
                  style={{ color: '#cbd5e1' }}
                >
                  {test.testType.replace('_', ' ')}
                </span>
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-snug"
                style={{ color: '#ffffff' }}
              >
                {test.title}
              </h1>

              {/* Sub-meta specs bar */}
              <div
                className="flex items-center gap-3 text-xs text-slate-300 flex-wrap pt-0.5"
                style={{ color: '#cbd5e1' }}
              >
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  <span>Duration:</span>
                  <strong className="text-white font-mono" style={{ color: '#ffffff' }}>
                    {test.durationMinutes}m
                  </strong>
                </div>
                <span className="text-slate-600 dark:text-slate-500">•</span>
                <div className="flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>Target Marks:</span>
                  <strong className="text-white font-mono" style={{ color: '#ffffff' }}>
                    {test.totalMarks}
                  </strong>
                  <span className="text-slate-400">
                    (Assigned:{' '}
                    <strong className="text-emerald-400 font-mono" style={{ color: '#34d399' }}>
                      {totalAssignedMarks}
                    </strong>
                    )
                  </span>
                </div>
                <span className="text-slate-600 dark:text-slate-500">•</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-rose-400 font-bold">Negative:</span>
                  <strong className="text-white font-mono" style={{ color: '#ffffff' }}>
                    {test.negativeMarking > 0 ? `-${test.negativeMarking}` : 'None'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Test Readiness Live Progress Bar */}
            {targetQuestionCount > 0 && (
              <div className="pt-2 max-w-xl space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span
                    className="text-slate-300 flex items-center gap-1.5"
                    style={{ color: '#cbd5e1' }}
                  >
                    <Target className="w-3.5 h-3.5 text-sky-400" />
                    Test Readiness: {assignedQuestions.length} of {targetQuestionCount} Questions
                  </span>
                  <span
                    className={`font-mono text-xs font-black ${
                      isTargetAchieved ? 'text-emerald-400' : 'text-sky-300'
                    }`}
                    style={{ color: isTargetAchieved ? '#34d399' : '#7dd3fc' }}
                  >
                    {completionPercentage}%{' '}
                    {isTargetAchieved
                      ? '• Ready'
                      : `• (${targetQuestionCount - assignedQuestions.length} needed)`}
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800/80 border border-slate-700/60 overflow-hidden p-0.5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isTargetAchieved
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm shadow-emerald-500/50'
                        : 'bg-gradient-to-r from-[#0075FF] via-sky-400 to-indigo-500'
                    }`}
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-2.5 shrink-0 flex-wrap">
            <Button
              size="sm"
              variant="outline"
              disabled={isTestLocked}
              className="border-slate-700 text-xs font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#091124', color: '#ffffff', borderColor: '#1d3163' }}
              leftIcon={<Upload className="w-3.5 h-3.5 text-sky-400" />}
              onClick={() => {
                if (isTestLocked) return;
                setIsBulkModalOpen(true);
              }}
              title={
                isTestLocked
                  ? 'Questions locked for active Live Test'
                  : 'Bulk import questions from TXT file directly into this test'
              }
            >
              + Bulk Add (TXT)
            </Button>

            <Button
              size="sm"
              variant="outline"
              disabled={isTestLocked}
              className="border-slate-700 text-xs font-bold hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#091124', color: '#ffffff', borderColor: '#1d3163' }}
              leftIcon={<Plus className="w-3.5 h-3.5 text-emerald-400" />}
              onClick={() => {
                if (isTestLocked) return;
                setNewQuestionText('');
                setNewOptionA('');
                setNewOptionB('');
                setNewOptionC('');
                setNewOptionD('');
                setNewExplanation('');
                setCreateError('');
                setIsCreateModalOpen(true);
              }}
              title={
                isTestLocked
                  ? 'Questions locked for active Live Test'
                  : 'Create new question for this test'
              }
            >
              + Create Question
            </Button>

            {activeTab === 'assigned' && (
              <Button
                size="sm"
                className="bg-gradient-to-r from-[#0075FF] to-[#0052E0] hover:from-[#026BFC] hover:to-[#0047C7] text-white text-xs font-bold shadow-lg shadow-[#0075FF]/30 hover:scale-[1.02] transition-transform"
                leftIcon={<Save className="w-4 h-4" />}
                onClick={handleSaveAssigned}
                disabled={isSaving || isTestLocked}
                title={isTestLocked ? 'Questions locked for active Live Test' : undefined}
              >
                {isSaving ? 'Saving...' : 'Save Order & Marks'}
              </Button>
            )}
          </div>
        </div>

        {/* 3 Core Metric KPI Counters (bank metrics do not apply to a Live Test paper) */}
        {!liveMode && (
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-6 pt-5 border-t border-slate-800/80"
            style={{ borderColor: '#1b2c58' }}
          >
            {/* KPI 1 */}
            <div className="p-4 rounded-2xl bg-[#081229]/90 border border-[#172852] flex items-center justify-between shadow-sm hover:border-[#0075FF]/40 transition-colors">
              <div className="space-y-0.5">
                <p
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                  style={{ color: '#94a3b8' }}
                >
                  Available in Topic / Bank
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl sm:text-3xl font-black text-white"
                    style={{ color: '#ffffff' }}
                  >
                    {eligibleBankQuestions.length}
                  </span>
                  <span className="text-xs font-semibold text-sky-400" style={{ color: '#38bdf8' }}>
                    ({unassignedEligibleQuestions.length} unassigned)
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-[#0075FF]/15 text-[#38bdf8] flex items-center justify-center border border-[#0075FF]/30 shrink-0 shadow-inner">
                <FolderTree className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="p-4 rounded-2xl bg-[#081229]/90 border border-[#172852] flex items-center justify-between shadow-sm hover:border-emerald-500/40 transition-colors">
              <div className="space-y-0.5">
                <p
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                  style={{ color: '#94a3b8' }}
                >
                  Already in Test
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl sm:text-3xl font-black text-emerald-400"
                    style={{ color: '#34d399' }}
                  >
                    {assignedQuestions.length}
                  </span>
                  {targetQuestionCount > 0 && (
                    <span
                      className="text-xs font-semibold text-slate-400"
                      style={{ color: '#94a3b8' }}
                    >
                      / {targetQuestionCount} Target
                    </span>
                  )}
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0 shadow-inner">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="p-4 rounded-2xl bg-[#081229]/90 border border-[#172852] flex items-center justify-between shadow-sm hover:border-sky-500/40 transition-colors">
              <div className="space-y-0.5">
                <p
                  className="text-[10px] font-black uppercase tracking-wider text-slate-400"
                  style={{ color: '#94a3b8' }}
                >
                  Selected to Add
                </p>
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-2xl sm:text-3xl font-black text-[#38bdf8]"
                    style={{ color: '#38bdf8' }}
                  >
                    {selectedQuestionIds.length}
                  </span>
                  <span
                    className="text-xs font-semibold text-slate-400"
                    style={{ color: '#94a3b8' }}
                  >
                    ready to attach
                  </span>
                </div>
              </div>
              <div className="w-11 h-11 rounded-2xl bg-sky-500/15 text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0 shadow-inner">
                <CheckSquare className="w-5 h-5" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
