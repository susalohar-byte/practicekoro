import { getDateRangeBounds } from '@/services/domains/admin.dashboard';
import { Calendar, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DATE_RANGE_OPTIONS } from './testAttemptTypes';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface DateRangeModalProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function DateRangeModal({ testAttemptsState }: DateRangeModalProps) {
  const {
    setFilterDateRange,
    setCustomStartDate,
    setCustomEndDate,
    isDateModalOpen,
    setIsDateModalOpen,
    draftDateRange,
    setDraftDateRange,
    draftStartDate,
    setDraftStartDate,
    draftEndDate,
    setDraftEndDate,
    dateRangeError,
    setDateRangeError,
    setCurrentPage,
  } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 7. DATE RANGE MODAL */}
      {/* ==================================================================== */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 dark:bg-black/45 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Date Range</h3>
              </div>
              <button
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {DATE_RANGE_OPTIONS.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setDraftDateRange(range);
                    setDateRangeError(null);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between',
                    draftDateRange === range
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{range}</span>
                  {draftDateRange === range && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
              {draftDateRange === 'Custom Range' && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <label className="space-y-1">
                    <span className="block text-[11px] font-semibold text-slate-500">From</span>
                    <input
                      type="date"
                      aria-label="From date"
                      value={draftStartDate}
                      onChange={(e) => setDraftStartDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="block text-[11px] font-semibold text-slate-500">To</span>
                    <input
                      type="date"
                      aria-label="To date"
                      value={draftEndDate}
                      onChange={(e) => setDraftEndDate(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs"
                    />
                  </label>
                </div>
              )}
              {dateRangeError && (
                <p role="alert" className="text-rose-600 font-semibold">
                  {dateRangeError}
                </p>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  if (draftDateRange === 'Custom Range') {
                    try {
                      getDateRangeBounds('Custom Range', draftStartDate, draftEndDate);
                    } catch (err) {
                      setDateRangeError(
                        err instanceof Error ? err.message : 'Choose a valid date range.'
                      );
                      return;
                    }
                    setCustomStartDate(draftStartDate);
                    setCustomEndDate(draftEndDate);
                  }
                  setFilterDateRange(draftDateRange);
                  setCurrentPage(1);
                  setIsDateModalOpen(false);
                }}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Apply Range
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
