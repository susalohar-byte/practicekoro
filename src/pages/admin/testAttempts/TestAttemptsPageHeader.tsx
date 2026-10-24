import { Calendar, Download } from 'lucide-react';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestAttemptsPageHeaderProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestAttemptsPageHeader({ testAttemptsState }: TestAttemptsPageHeaderProps) {
  const {
    loadError,
    setReloadKey,
    filterDateRange,
    customStartDate,
    customEndDate,
    setIsDateModalOpen,
    setDraftDateRange,
    setDraftStartDate,
    setDraftEndDate,
    setDateRangeError,
    activeDateRangeLabel,
    handleExportCSV,
  } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & DATE RANGE / EXPORT ACTIONS */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Test Attempts</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            View and analyze all student test attempts across mock tests, topic tests and official
            PYQs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* Date Range Selector Pill */}
          <button
            onClick={() => {
              setDraftDateRange(filterDateRange);
              setDraftStartDate(customStartDate);
              setDraftEndDate(customEndDate);
              setDateRangeError(null);
              setIsDateModalOpen(true);
            }}
            className="bg-white border border-[#E2E8F0] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#1E293B] shadow-2xs flex items-center gap-2 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
            <span>{activeDateRangeLabel}</span>
          </button>

          {/* Export Attempts Button */}
          <button
            onClick={() => handleExportCSV(false)}
            className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Export Attempts</span>
          </button>
        </div>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">Test attempts unavailable:</span> {loadError}
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
