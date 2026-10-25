import { Layers, FileText } from 'lucide-react';
import type { AdminExamsState } from './useAdminExams';

export interface ExamStatCardsProps {
  qb: AdminExamsState;
}

export function ExamStatCards({ qb }: ExamStatCardsProps) {
  const { exams, dbTests, kpiLoadFailed } = qb;
  return (
    <>
      {/* 2. Top 5 KPI Cards in Single Row matching reference screenshot */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {/* Card 1: Total Exams */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#EBF3FF] dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Exams
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {exams.length}
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Active Exams */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#F6EEFD] dark:bg-purple-950/50 text-[#8B5CF6] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Active Exams
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {exams.filter((e) => e.isActive).length}
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Official PYQs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEF8E7] dark:bg-amber-950/50 text-[#F59E0B] flex items-center justify-center shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Official PYQs
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {kpiLoadFailed.tests ? '—' : dbTests.filter((t) => t.testType === 'pyq').length}
              </span>
            </div>
          </div>
        </div>

        {/* Card 4: Total Mock Tests */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#FEECEC] dark:bg-rose-950/50 text-[#EF4444] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-slate-400 dark:text-slate-400 leading-tight">
              Total Mock Tests
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {kpiLoadFailed.tests ? '—' : dbTests.length}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
