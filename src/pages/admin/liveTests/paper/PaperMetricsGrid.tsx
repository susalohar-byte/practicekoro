import { Award, Clock, FileText, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperMetricsGridProps {
  ws: LiveTestWorkspaceState;
}

export function PaperMetricsGrid({ ws }: PaperMetricsGridProps) {
  const {
    targetQuestionCount,
    targetMarks,
    durationMinutes,
    negativeMarking,
    completionPercentage,
    isTargetAchieved,
    assignedQuestions,
    totalAssignedMarks,
  } = ws;
  return (
    <>
      {/* 4. KEY METRICS BENTO GRID */}
      <div className="pk-stagger grid grid-cols-2 lg:grid-cols-4 gap-3.5">
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
    </>
  );
}
