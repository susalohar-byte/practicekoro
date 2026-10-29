import { FileText, Target, TrendingUp, Users } from 'lucide-react';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface PerformanceStatCardsProps {
  perf: AdminPerformanceState;
}

export function PerformanceStatCards({ perf }: PerformanceStatCardsProps) {
  const { totalStudents, testsAttempted, questionsAnswered, overallAccuracy } = perf;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. SUMMARY METRIC CARDS (4 CARDS IN A ROW) */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Students */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Total Students</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {totalStudents.toLocaleString()}
              </span>
              {totalStudents > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Registered Aspirants</p>
          </div>
        </div>

        {/* Card 2: Tests Attempted */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Tests Attempted</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {testsAttempted.toLocaleString()}
              </span>
              {testsAttempted > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Attempts started in range</p>
          </div>
        </div>

        {/* Card 3: Questions Answered */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#F3E8FF] text-[#9333EA] flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Questions Answered</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {questionsAnswered.toLocaleString()}
              </span>
              {questionsAnswered > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Total Questions</p>
          </div>
        </div>

        {/* Card 4: Overall Accuracy */}
        <div className="bg-white rounded-2xl p-4 border border-[#E2E8F0] shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold text-[#64748B]">Overall Accuracy</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-black text-[#0F172A] tracking-tight">
                {overallAccuracy}%
              </span>
              {overallAccuracy > 0 && (
                <span className="bg-[#DCFCE7] text-[#15803D] text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  Live
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5 truncate">Platform Average</p>
          </div>
        </div>
      </div>
    </>
  );
}
