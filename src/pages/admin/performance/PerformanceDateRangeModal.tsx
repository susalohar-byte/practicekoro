import { Calendar, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RANGE_OPTIONS } from './performanceUtils';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface PerformanceDateRangeModalProps {
  perf: AdminPerformanceState;
}

export function PerformanceDateRangeModal({ perf }: PerformanceDateRangeModalProps) {
  const { rangePreset, setRangePreset, isDateModalOpen, setIsDateModalOpen } = perf;
  return (
    <>
      {/* ==================================================================== */}
      {/* 5. MODAL: DATE RANGE PICKER */}
      {/* ==================================================================== */}
      {isDateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">Select Date Range</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {RANGE_OPTIONS.map((range) => (
                <button
                  key={range.preset}
                  type="button"
                  onClick={() => {
                    setRangePreset(range.preset);
                    setIsDateModalOpen(false);
                  }}
                  className={cn(
                    'w-full text-left px-3.5 py-2.5 rounded-xl border font-semibold transition-colors flex items-center justify-between cursor-pointer',
                    rangePreset === range.preset
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span>{range.label}</span>
                  {rangePreset === range.preset && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsDateModalOpen(false)}
                className="bg-blue-600 text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition-colors cursor-pointer"
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
