import { Calendar } from 'lucide-react';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface PerformanceHeaderProps {
  perf: AdminPerformanceState;
}

export function PerformanceHeader({ perf }: PerformanceHeaderProps) {
  const { loadError, setReloadKey, setIsDateModalOpen, dateRangeLabel } = perf;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. HEADER & DATE PICKER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Performance</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            Analyze student performance, identify strengths and weaknesses, and track progress
            across exams, subjects and topics.
          </p>
        </div>

        {/* Date Range Picker Pill with calendar icon on the right */}
        <button
          onClick={() => setIsDateModalOpen(true)}
          className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1E293B] shadow-2xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <span>{dateRangeLabel}</span>
          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">Performance data unavailable:</span> {loadError}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}
