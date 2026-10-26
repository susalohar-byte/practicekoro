import {
  CheckCircle2,
  Users,
  Copy,
  Clock,
  Target,
  FileText,
  Hourglass,
  StopCircle,
  Play,
  Unlock,
} from 'lucide-react';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestOverviewTabProps {
  live: AdminLiveTestsState;
}

export function LiveTestOverviewTab({ live }: LiveTestOverviewTabProps) {
  const {
    drawerTab,
    setEndCandidate,
    selectedLiveTest,
    selectedStats,
    selectedPaperQuestions,
    selectedMarks,
    selectedNegative,
    submissionRate,
    windowProgress,
    formatDateTime,
    formatMinutes,
    STATUS_LABELS,
    drawerSchedStart,
    drawerSchedEnd,
    drawerCreatedAt,
    handleDuplicate,
    handleReleaseToPractice,
    handleStartLiveNow,
  } = live;
  // Rendered inside the details panel, which only opens with a selected Live Test.
  if (!selectedLiveTest) return null;
  return (
    <>
      {/* Tab 1: Overview */}
      {drawerTab === 'overview' && (
        <div className="space-y-5">
          {/* 6 Key Metric Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* 1. Participants */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-blue-600">
                <Users className="w-4 h-4" />
                <span className="text-sm font-bold text-slate-900">
                  {selectedStats.participants.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total Candidates</p>
            </div>

            {/* 2. Submission Rate */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-sm font-bold text-slate-900">
                  {submissionRate === null ? '—' : `${submissionRate}%`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Submission Rate</p>
            </div>

            {/* 3. Duration */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-purple-600">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-bold text-slate-900">
                  {selectedLiveTest.durationMinutes || 0} min
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Exam Duration</p>
            </div>

            {/* 4. Total Questions */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-indigo-600">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold text-slate-900">{selectedPaperQuestions}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Total Questions</p>
            </div>

            {/* 5. Avg. Score */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-rose-600">
                <Target className="w-4 h-4" />
                <span className="text-sm font-bold text-slate-900">
                  {selectedStats.avgScore === null
                    ? '—'
                    : `${Number(selectedStats.avgScore.toFixed(1))} / ${selectedMarks}`}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Avg. Score</p>
            </div>

            {/* 6. Avg. Time Taken */}
            <div className="bg-slate-50/90 p-3 rounded-xl border border-slate-200/80">
              <div className="flex items-center gap-1.5 text-amber-600">
                <Hourglass className="w-4 h-4" />
                <span className="text-sm font-bold text-slate-900">
                  {formatMinutes(selectedStats.avgTimeSeconds)}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Avg. Time Taken</p>
            </div>
          </div>

          {/* Live Test Window Progress */}
          <div className="space-y-1.5 p-3 bg-slate-50/80 rounded-xl border border-slate-200/80">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800">Exam Window Progress</span>
              <span className="font-bold text-blue-600">{windowProgress}%</span>
            </div>
            <div className="w-full bg-slate-200/70 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${windowProgress}%` }}
              />
            </div>
          </div>

          {/* Detailed Key-Value Breakdown */}
          <div className="text-xs space-y-2 text-slate-600 divide-y divide-slate-100 bg-white rounded-xl border border-slate-200/80 p-3.5">
            <div className="flex items-start justify-between pt-1">
              <span className="text-slate-400 w-32 shrink-0">Start Window</span>
              <span className="font-semibold text-slate-800 text-right">
                {drawerSchedStart ? `${drawerSchedStart.date}, ${drawerSchedStart.time}` : '—'}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">End Window</span>
              <span className="font-semibold text-slate-800 text-right">
                {drawerSchedEnd ? `${drawerSchedEnd.date}, ${drawerSchedEnd.time}` : '—'}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Duration</span>
              <span className="font-semibold text-slate-800 text-right">
                {selectedLiveTest.durationMinutes || 0} minutes
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Target Exam</span>
              <span className="font-semibold text-slate-800 text-right">
                {selectedLiveTest.examTitle || selectedLiveTest.test?.examTitle || '—'}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Exam Format</span>
              <span className="font-semibold text-slate-800 text-right">Full Mock Test</span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Questions Count</span>
              <span className="font-semibold text-slate-800 text-right">
                {selectedPaperQuestions}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Total Marks</span>
              <span className="font-semibold text-slate-800 text-right">{selectedMarks}</span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Negative Marking</span>
              <span className="font-semibold text-slate-800 text-right">
                {selectedNegative > 0 ? `${selectedNegative} / wrong` : 'None'}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Current Status</span>
              <span className="font-bold text-slate-800 text-right">
                {STATUS_LABELS[selectedLiveTest.status] || selectedLiveTest.status}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Created Date</span>
              <span className="font-medium text-slate-700 text-right">
                {drawerCreatedAt ? `${drawerCreatedAt.date}, ${drawerCreatedAt.time}` : '—'}
              </span>
            </div>
            <div className="flex items-start justify-between pt-2">
              <span className="text-slate-400 w-32 shrink-0">Last Updated</span>
              <span className="font-medium text-slate-700 text-right">
                {formatDateTime(selectedLiveTest.updatedAt)}
              </span>
            </div>
          </div>

          {/* Bottom Contextual Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {selectedLiveTest.status === 'live' && (
              <button
                type="button"
                onClick={() => setEndCandidate(selectedLiveTest)}
                className="flex-1 py-2 px-3 border border-rose-200 text-rose-600 bg-rose-50/50 rounded-lg text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5 shrink-0" />
                <span>End Live Test</span>
              </button>
            )}

            {selectedLiveTest.status !== 'live' &&
              selectedLiveTest.status !== 'ended' &&
              selectedLiveTest.status !== 'completed' && (
                <button
                  type="button"
                  onClick={() => handleStartLiveNow(selectedLiveTest)}
                  className="flex-1 py-2 px-3 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 shrink-0" />
                  <span>Start Live Now</span>
                </button>
              )}

            {(selectedLiveTest.status === 'ended' || selectedLiveTest.status === 'completed') &&
              selectedLiveTest.test?.isLiveOnly && (
                <button
                  type="button"
                  onClick={() => handleReleaseToPractice(selectedLiveTest)}
                  className="flex-1 py-2 px-3 border border-emerald-200 text-emerald-700 bg-emerald-50 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Unlock className="w-3.5 h-3.5 shrink-0" />
                  <span>Release to Practice</span>
                </button>
              )}

            <button
              type="button"
              onClick={() => handleDuplicate(selectedLiveTest)}
              className="flex-1 py-2 px-3 border border-slate-200 text-slate-700 bg-white rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Copy className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Duplicate</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
