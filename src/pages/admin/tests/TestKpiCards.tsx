import { FileText, Lightbulb, Users } from 'lucide-react';
import type { AdminTestsState } from './useAdminTests';

export interface TestKpiCardsProps {
  testsState: AdminTestsState;
}

export function TestKpiCards({ testsState }: TestKpiCardsProps) {
  const { counts } = testsState;
  return (
    <>
      {/* 2. Top 5 KPI Cards in Single Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Mock Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Mock Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.total}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 18%
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">vs last month</p>
          </div>
        </div>

        {/* Card 2: Full Mock Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Full Mock Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.fullMock}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 12%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Topic Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#E8F8F0] dark:bg-emerald-950/50 text-[#10B981] flex items-center justify-center shrink-0">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Topic Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.topic}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 26%
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Official PYQs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Official PYQs
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.pyq}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 15%
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Total Attempts */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-11 h-11 rounded-2xl bg-[#F5EEFD] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Attempts
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {counts.attempts}
              </span>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                ↑ 32%
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
