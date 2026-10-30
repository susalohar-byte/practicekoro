import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminDashboardState } from './useAdminDashboard';

export interface RevenueChartProps {
  db: AdminDashboardState;
}

export function RevenueChart({ db }: RevenueChartProps) {
  const {
    revenueRange,
    setRevenueRange,
    maxRevenue,
    revenueData,
    hoveredRevenueIndex,
    setHoveredRevenueIndex,
  } = db;
  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Revenue
          </h3>
          <div className="relative">
            <button
              onClick={() =>
                setRevenueRange(
                  revenueRange === 'Last 30 Days'
                    ? 'Last 14 Days'
                    : revenueRange === 'Last 14 Days'
                      ? 'Last 7 Days'
                      : 'Last 30 Days'
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <span>{revenueRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Purple Vertical Bar Chart */}
      <div className="mt-4 pt-2">
        <div className="relative h-44 w-full">
          {/* Y-Axis Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              ₹{maxRevenue >= 1000 ? `${Math.round(maxRevenue / 1000)}K` : maxRevenue}
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              ₹
              {Math.round(maxRevenue * 0.66) >= 1000
                ? `${Math.round((maxRevenue * 0.66) / 1000)}K`
                : Math.round(maxRevenue * 0.66)}
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              ₹
              {Math.round(maxRevenue * 0.33) >= 1000
                ? `${Math.round((maxRevenue * 0.33) / 1000)}K`
                : Math.round(maxRevenue * 0.33)}
            </div>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">₹0</div>
          </div>

          {/* Bars Columns with Dynamic Tooltip */}
          <div className="absolute inset-0 pl-7 flex items-end justify-between gap-1 pb-5">
            {revenueData.map((item, idx) => {
              const heightPercent = Math.min(100, (item.amount / maxRevenue) * 100);
              const isHighlighted = hoveredRevenueIndex === idx;

              return (
                <div
                  key={item.label + idx}
                  onMouseEnter={() => setHoveredRevenueIndex(idx)}
                  onMouseLeave={() => setHoveredRevenueIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Active tooltip badge on hovered column */}
                  {isHighlighted && (
                    <div className="absolute -top-11 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 shadow-md z-30 text-center whitespace-nowrap">
                      <p className="text-[9px] text-slate-400 leading-tight">{item.label}</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                        ₹{item.amount.toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={cn(
                      'w-2 sm:w-2.5 rounded-t-xs transition-all duration-200 min-h-0',
                      isHighlighted
                        ? 'bg-[#8B5CF6] ring-2 ring-purple-300 dark:ring-purple-700'
                        : 'bg-[#C4B5FD] dark:bg-[#6D28D9]/60 hover:bg-[#A78BFA]'
                    )}
                  />
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 inset-x-0 pl-7 flex justify-between text-[9px] text-slate-400 font-medium">
            {revenueData.map((item, idx) => (
              <span key={item.label + idx}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
