import { BookOpen, Calendar, Users, TrendingUp } from 'lucide-react';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffStatCardsProps {
  co: AdminCutoffState;
}

export function CutoffStatCards({ co }: CutoffStatCardsProps) {
  const { cutoffsList } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRIC CARDS                                        */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Exams */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center text-[#7C3AED] shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">Total Exams</span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(cutoffsList.map((c) => c.exam)).size}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              with cutoff data
            </span>
          </div>
        </div>

        {/* Card 2: Total Years */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">Total Years</span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(cutoffsList.map((c) => c.year)).size}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {cutoffsList.length > 0
                ? `${Math.min(...cutoffsList.map((c) => c.year))} – ${Math.max(...cutoffsList.map((c) => c.year))}`
                : '—'}
            </span>
          </div>
        </div>

        {/* Card 3: Total Categories */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#0284C7] shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">Total Categories</span>
            <div className="text-2xl font-bold text-slate-900 leading-tight">
              {new Set(cutoffsList.map((c) => c.category)).size}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              General, OBC, SC, ST, EWS, Others
            </span>
          </div>
        </div>

        {/* Card 4: Latest Cutoff Added */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] flex items-center justify-center text-[#D97706] shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] font-medium text-slate-500 block">
              Latest Cutoff Added
            </span>
            <div className="text-base font-bold text-slate-900 leading-tight truncate">
              {cutoffsList.length > 0 ? `${cutoffsList[0].exam} ${cutoffsList[0].year}` : '—'}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {cutoffsList.length > 0 ? `Added ${cutoffsList[0].addedOn}` : 'No cutoff recorded'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
