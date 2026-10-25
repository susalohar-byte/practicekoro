import { Download } from 'lucide-react';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsHeaderProps {
  rk: AdminRankingsState;
}

export function RankingsHeader({ rk }: RankingsHeaderProps) {
  const { loadError, fetchRankings, handleExportCSV } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. PAGE HEADER */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Rankings</h1>
          <p className="text-xs font-normal text-[#64748B] mt-0.5">
            View student rankings based on test performance. Filter by exam, subject, topic or test
            series.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="bg-white border border-[#BFDBFE] text-[#2563EB] hover:bg-blue-50/60 rounded-xl px-4 py-2 text-xs font-semibold shadow-2xs flex items-center gap-2 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Export Rankings</span>
        </button>
      </div>

      {loadError && (
        <div
          role="alert"
          className="rounded-2xl p-4 border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center justify-between"
        >
          <div>
            <span className="font-bold mr-1">Rankings unavailable:</span> {loadError}
          </div>
          <button
            type="button"
            onClick={() => void fetchRankings()}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-xs"
          >
            Retry
          </button>
        </div>
      )}
    </>
  );
}
