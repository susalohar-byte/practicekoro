import { Users, CheckCircle2, Clock, X, ArrowRight, Heart, Bookmark, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestAttemptDetailsPanelProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestAttemptDetailsPanel({ testAttemptsState }: TestAttemptDetailsPanelProps) {
  const {
    navigate,
    setSelectedAttemptId,
    isPanelOpen,
    setIsPanelOpen,
    activeTab,
    setActiveTab,
    answersTabFilter,
    setAnswersTabFilter,
    setIsAnswerSheetModalOpen,
    setIsTestModalOpen,
    setActiveModalAttempt,
    selectedAttempt,
    questionsList,
  } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 5. ATTEMPT DETAILS PANEL (RIGHT SIDE - EXACT MATCH) */}
      {/* ==================================================================== */}
      {isPanelOpen && selectedAttempt && (
        <div className="w-full xl:w-[380px] shrink-0 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col space-y-4 animate-in fade-in duration-200">
          {/* Header: Title & Close Button */}
          <div className="flex items-center justify-between pb-1">
            <h2 className="text-sm font-bold text-[#0F172A]">Attempt Details</h2>
            <button
              onClick={() => {
                setIsPanelOpen(false);
                setSelectedAttemptId(null);
              }}
              className="text-[#94A3B8] hover:text-[#0F172A] p-1 rounded-md transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Student Profile Row */}
          <div className="flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              {selectedAttempt.studentAvatar ? (
                <img
                  src={selectedAttempt.studentAvatar}
                  alt={selectedAttempt.studentName}
                  className="w-11 h-11 rounded-full object-cover border border-slate-200 shadow-2xs"
                />
              ) : (
                <div
                  className={cn(
                    'w-11 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center shadow-xs',
                    selectedAttempt.studentAvatarColor || 'bg-blue-600'
                  )}
                >
                  {selectedAttempt.studentInitials || 'SK'}
                </div>
              )}
              <div>
                <h3 className="text-xs font-bold text-[#0F172A] leading-tight">
                  {selectedAttempt.studentName}
                </h3>
                <p className="text-[11px] text-[#64748B] font-mono leading-tight mt-0.5">
                  {selectedAttempt.studentId}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/admin/students')}
              className="text-[11px] font-semibold text-[#2563EB] hover:underline flex items-center gap-0.5"
            >
              <span>View Student</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* 3 Tabs: Overview | Answers | Analysis */}
          <div className="flex items-center justify-around border-b border-[#E2E8F0] pt-1 text-xs">
            <button
              onClick={() => setActiveTab('Overview')}
              className={cn(
                'pb-2 px-3 font-semibold transition-colors relative',
                activeTab === 'Overview'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('Answers')}
              className={cn(
                'pb-2 px-3 font-semibold transition-colors relative',
                activeTab === 'Answers'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              )}
            >
              Answers
            </button>
            <button
              onClick={() => setActiveTab('Analysis')}
              className={cn(
                'pb-2 px-3 font-semibold transition-colors relative',
                activeTab === 'Analysis'
                  ? 'text-[#2563EB] font-bold border-b-2 border-[#2563EB]'
                  : 'text-[#64748B] hover:text-[#0F172A]'
              )}
            >
              Analysis
            </button>
          </div>

          {/* TAB CONTENT: OVERVIEW */}
          {activeTab === 'Overview' && (
            <div className="space-y-3.5">
              {/* Test Banner Card */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 flex items-center justify-center bg-white border border-slate-200 shadow-2xs">
                  <img
                    src="/images/exams/logo_wbp.png"
                    alt="Exam Official Logo"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-[#0F172A] truncate">
                    {selectedAttempt.testName}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] text-[10px] font-semibold px-2 py-0.5 rounded">
                      {selectedAttempt.type}
                    </span>
                    <span className="bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] text-[10px] font-semibold px-2 py-0.5 rounded">
                      {selectedAttempt.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards in Row */}
              <div className="grid grid-cols-3 gap-2">
                {/* Score */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                  <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                    <Target className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      {selectedAttempt.score}/
                      {selectedAttempt.totalMarks > 0 ? selectedAttempt.totalMarks : '—'}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Score</p>
                </div>

                {/* Accuracy */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                  <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedAttempt.accuracy}%</span>
                  </div>
                  <p className="text-[10px] text-[#16A34A] font-medium mt-0.5 flex items-center justify-center gap-0.5">
                    ▲ Accuracy
                  </p>
                </div>

                {/* Time Taken */}
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-2.5 text-center">
                  <div className="text-xs font-extrabold text-[#0F172A] flex items-center justify-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-rose-500" />
                    <span>{selectedAttempt.timeTaken}</span>
                  </div>
                  <p className="text-[10px] text-[#64748B] mt-0.5">Time Taken</p>
                </div>
              </div>

              {/* Question Breakdown Row (85 Total, 12 Wrong, 3 Skipped) */}
              <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 flex items-center justify-around divide-x divide-[#E2E8F0]">
                <div className="flex items-center gap-2 px-2">
                  <Users className="w-4 h-4 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-[#0F172A]">
                      {selectedAttempt.totalQuestions}
                    </p>
                    <p className="text-[10px] text-[#64748B]">Total Questions</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2">
                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-[#0F172A]">
                      {selectedAttempt.wrongAnswers}
                    </p>
                    <p className="text-[10px] text-[#64748B]">Wrong Answers</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-2">
                  <Bookmark className="w-4 h-4 text-blue-500 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold text-[#0F172A]">
                      {selectedAttempt.skippedAnswers}
                    </p>
                    <p className="text-[10px] text-[#64748B]">Skipped</p>
                  </div>
                </div>
              </div>

              {/* Attempt Information */}
              <div>
                <h4 className="text-xs font-bold text-[#0F172A] mb-2.5">Attempt Information</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Student</span>
                    <span className="font-semibold text-[#0F172A] text-[11px]">
                      {selectedAttempt.studentName} ({selectedAttempt.studentId})
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Exam</span>
                    <span className="font-semibold text-[#0F172A] text-[11px]">
                      {selectedAttempt.exam}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Test Type</span>
                    <span className="font-semibold text-[#0F172A] text-[11px]">
                      {selectedAttempt.type}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Attempted At</span>
                    <span className="font-semibold text-[#0F172A] text-[11px]">
                      {selectedAttempt.submittedAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Started At</span>
                    <span className="font-semibold text-[#0F172A] text-[11px]">
                      {selectedAttempt.startedAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Submitted At</span>
                    <span className="font-semibold text-[#0F172A] text-[11px]">
                      {selectedAttempt.submittedAt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[#64748B] text-[11px]">Status</span>
                    <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {selectedAttempt.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setActiveModalAttempt(selectedAttempt);
                    setIsTestModalOpen(true);
                  }}
                  className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>View Test</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => {
                    setActiveModalAttempt(selectedAttempt);
                    setIsAnswerSheetModalOpen(true);
                  }}
                  className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl py-2.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer text-center"
                >
                  View Answer Sheet
                </button>
              </div>
            </div>
          )}

          {/* TAB CONTENT: ANSWERS (Compact in-panel question preview) */}
          {activeTab === 'Answers' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold border-b border-slate-100 pb-2">
                <span>Questions ({questionsList.length})</span>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    onClick={() => setAnswersTabFilter('all')}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      answersTabFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500'
                    )}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setAnswersTabFilter('correct')}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      answersTabFilter === 'correct'
                        ? 'bg-emerald-600 text-white'
                        : 'text-emerald-700 bg-emerald-50'
                    )}
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setAnswersTabFilter('wrong')}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      answersTabFilter === 'wrong'
                        ? 'bg-rose-600 text-white'
                        : 'text-rose-700 bg-rose-50'
                    )}
                  >
                    ✕
                  </button>
                  <button
                    onClick={() => setAnswersTabFilter('skipped')}
                    className={cn(
                      'px-2 py-0.5 rounded',
                      answersTabFilter === 'skipped'
                        ? 'bg-blue-600 text-white'
                        : 'text-blue-700 bg-blue-50'
                    )}
                  >
                    -
                  </button>
                </div>
              </div>

              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 text-xs">
                {questionsList.length === 0 && (
                  <p className="py-6 text-center text-slate-400">
                    Answer details are unavailable for this attempt.
                  </p>
                )}
                {questionsList
                  .filter((q) =>
                    answersTabFilter === 'all' ? true : q.status === answersTabFilter
                  )
                  .map((q) => (
                    <div
                      key={q.id}
                      className="p-2.5 rounded-xl border border-slate-200/80 bg-slate-50/50 space-y-1.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-bold text-slate-800">Q{q.id}.</span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-1.5 py-0.2 rounded',
                            q.status === 'correct' && 'bg-emerald-100 text-emerald-800',
                            q.status === 'wrong' && 'bg-rose-100 text-rose-800',
                            q.status === 'skipped' && 'bg-slate-200 text-slate-700'
                          )}
                        >
                          {q.status === 'correct'
                            ? '+1.00'
                            : q.status === 'wrong'
                              ? '-0.25'
                              : '0.00'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 leading-snug">{q.questionText}</p>
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-slate-500">
                          Selected: {q.selectedOption || 'None'}
                        </span>
                        <span className="text-emerald-700 font-bold">
                          Correct: {q.correctOption}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => {
                  setActiveModalAttempt(selectedAttempt);
                  setIsAnswerSheetModalOpen(true);
                }}
                className="w-full bg-[#2563EB] text-white py-2 rounded-xl text-xs font-semibold shadow-xs hover:bg-blue-700 transition-colors"
              >
                Open Full Answer Sheet Modal
              </button>
            </div>
          )}

          {/* TAB CONTENT: ANALYSIS */}
          {activeTab === 'Analysis' && (
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-900 text-xs">Section Performance</h4>
              <div className="space-y-2.5">
                {(selectedAttempt.sectionAnalysis ?? []).length === 0 && (
                  <p className="py-6 text-center text-slate-400">
                    Section analysis is unavailable for this attempt.
                  </p>
                )}
                {(selectedAttempt.sectionAnalysis ?? []).map((sec) => (
                  <div
                    key={sec.sectionName}
                    className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-800 text-[11px]">
                      <span>{sec.sectionName}</span>
                      <span>
                        {sec.marksScored}/{sec.maxMarks}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{
                          width: `${sec.maxMarks > 0 ? Math.min(100, Math.max(0, (sec.marksScored / sec.maxMarks) * 100)) : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>Accuracy: {sec.accuracy.toFixed(1)}%</span>
                      <span>Time: {sec.timeSpentMin} min</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
