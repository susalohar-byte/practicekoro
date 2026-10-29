import { Users, CheckCircle2, Clock, Star, AlertOctagon } from 'lucide-react';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestAttemptKpiCardsProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestAttemptKpiCards({ testAttemptsState }: TestAttemptKpiCardsProps) {
  const { totalAttemptsCount, completedCount, notCompletedCount, averageScore, averageTimeMin } =
    testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (5 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Attempts */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Attempts</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalAttemptsCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total tests logged</p>
          </div>
        </div>

        {/* Card 2: Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Completed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {completedCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              {totalAttemptsCount > 0 ? Math.round((completedCount / totalAttemptsCount) * 100) : 0}
              % of total
            </p>
          </div>
        </div>

        {/* Card 3: Not Completed */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <AlertOctagon className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Not Completed</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {notCompletedCount.toLocaleString('en-IN')}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              {totalAttemptsCount > 0
                ? Math.round((notCompletedCount / totalAttemptsCount) * 100)
                : 0}
              % of total
            </p>
          </div>
        </div>

        {/* Card 4: Average Score */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Average Score</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageScore === null ? '—' : `${averageScore}%`}
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">
              Completed attempts · score / total marks
            </p>
          </div>
        </div>

        {/* Card 5: Average Time */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Star className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Average Time</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {averageTimeMin} min
              </span>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Average test duration</p>
          </div>
        </div>
      </div>
    </>
  );
}
