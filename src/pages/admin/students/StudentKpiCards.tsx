import { Users, Layers, ShoppingCart, Clock, BarChart2 } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface StudentKpiCardsProps {
  studentsState: AdminStudentsState;
}

export function StudentKpiCards({ studentsState }: StudentKpiCardsProps) {
  const {
    totalStudentsCount,
    activeStudentsCount,
    paidStudentsCount,
    newStudentsCount,
    avgTestScoreFormatted,
  } = studentsState;
  return (
    <>
      {/* 2. SUMMARY KPI METRIC CARDS (Exact 5-Card Row)                    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <Users className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Total Students</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {totalStudentsCount.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ↑ 26%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">vs last month</span>
          </div>
        </div>

        {/* Card 2: Active Students */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Layers className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Active Students</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {activeStudentsCount.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ↑ 18%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 opacity-0">vs last month</span>
          </div>
        </div>

        {/* Card 3: Paid Students */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <ShoppingCart className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Paid Students</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {paidStudentsCount.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ↑ 32%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 opacity-0">vs last month</span>
          </div>
        </div>

        {/* Card 4: New Students */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <Clock className="w-6 h-6 text-[#F43F5E]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">New Students</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {newStudentsCount.toLocaleString('en-IN')}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ↑ 12%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">this month</span>
          </div>
        </div>

        {/* Card 5: Avg. Test Score */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#026BFC] shrink-0">
            <BarChart2 className="w-6 h-6 text-[#026BFC]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Avg. Test Score</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {avgTestScoreFormatted}
              </span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full">
                ↑ 6%
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 opacity-0">vs last month</span>
          </div>
        </div>
      </div>
    </>
  );
}
