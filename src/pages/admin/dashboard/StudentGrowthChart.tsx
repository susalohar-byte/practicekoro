import { ChevronDown } from 'lucide-react';
import type { AdminDashboardState } from './useAdminDashboard';

export interface StudentGrowthChartProps {
  db: AdminDashboardState;
}

export function StudentGrowthChart({ db }: StudentGrowthChartProps) {
  const {
    studentGrowthRange,
    setStudentGrowthRange,
    maxGrowthStudents,
    studentGrowthData,
    hoveredGrowthIndex,
    setHoveredGrowthIndex,
  } = db;
  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Student Growth
          </h3>
          <div className="relative">
            <button
              onClick={() =>
                setStudentGrowthRange(
                  studentGrowthRange === 'Last 30 Days'
                    ? 'Last 14 Days'
                    : studentGrowthRange === 'Last 14 Days'
                      ? 'Last 7 Days'
                      : 'Last 30 Days'
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <span>{studentGrowthRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#026BFC]" />
            <span>New Students</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#93C5FD]" />
            <span>Active Students</span>
          </div>
        </div>
      </div>

      {/* SVG Bar Chart */}
      <div className="mt-4 pt-2">
        <div className="relative h-44 w-full">
          {/* Y-Axis Grid Lines */}
          <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
            <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>{maxGrowthStudents.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>{Math.round(maxGrowthStudents * 0.66).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              <span>{Math.round(maxGrowthStudents * 0.33).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-0.5">
              <span>0</span>
            </div>
          </div>

          {/* Bars Columns */}
          <div className="absolute inset-0 pl-7 flex items-end justify-between gap-1.5 pb-5">
            {studentGrowthData.map((item, idx) => {
              const newHeightPercent = Math.min(100, (item.newStudents / maxGrowthStudents) * 100);
              const activeHeightPercent = Math.min(
                100,
                (item.activeStudents / maxGrowthStudents) * 100
              );
              const isHovered = hoveredGrowthIndex === idx;

              return (
                <div
                  key={item.label + idx}
                  onMouseEnter={() => setHoveredGrowthIndex(idx)}
                  onMouseLeave={() => setHoveredGrowthIndex(null)}
                  className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                >
                  {/* Tooltip */}
                  {isHovered && (
                    <div className="absolute -top-10 bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] py-1 px-2 rounded shadow-md z-30 whitespace-nowrap">
                      {item.label}: {item.newStudents} new / {item.activeStudents} active
                    </div>
                  )}

                  {/* Dual Bars Container */}
                  <div className="w-full max-w-[14px] flex items-end justify-center gap-0.5 h-full">
                    <div
                      style={{ height: `${newHeightPercent}%` }}
                      className="w-1.5 bg-[#026BFC] rounded-t-xs transition-all duration-300 group-hover:brightness-110 min-h-0"
                    />
                    <div
                      style={{ height: `${activeHeightPercent}%` }}
                      className="w-1.5 bg-[#93C5FD] rounded-t-xs transition-all duration-300 group-hover:brightness-110 min-h-0"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 inset-x-0 pl-7 flex justify-between text-[9px] text-slate-400 font-medium">
            {studentGrowthData.map((item, idx) => (
              <span key={item.label + idx}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
