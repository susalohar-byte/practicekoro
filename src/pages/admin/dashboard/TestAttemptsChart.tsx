import { ChevronDown } from 'lucide-react';
import type { AdminDashboardState } from './useAdminDashboard';

export interface TestAttemptsChartProps {
  db: AdminDashboardState;
}

export function TestAttemptsChart({ db }: TestAttemptsChartProps) {
  const {
    testAttemptsRange,
    setTestAttemptsRange,
    maxAttempts,
    attemptsSvgPoints,
    setHoveredAttemptIndex,
    hoveredAttemptIndex,
    testAttemptsData,
  } = db;
  return (
    <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-tight">
            Test Attempts
          </h3>
          <div className="relative">
            <button
              onClick={() =>
                setTestAttemptsRange(
                  testAttemptsRange === 'Last 30 Days'
                    ? 'Last 14 Days'
                    : testAttemptsRange === 'Last 14 Days'
                      ? 'Last 7 Days'
                      : 'Last 30 Days'
                )
              }
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/50 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 transition-colors"
            >
              <span>{testAttemptsRange}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#026BFC]" />
            <span>Total Attempts</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-[#10B981]" />
            <span>Unique Students</span>
          </div>
        </div>
      </div>

      {/* Dynamic SVG Dual Line Chart */}
      <div className="mt-4 pt-2">
        <div className="relative h-44 w-full">
          {/* Y-Axis Labels & Grid */}
          <div className="absolute inset-0 flex flex-col justify-between text-[10px] text-slate-400 pointer-events-none pr-2">
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              {maxAttempts.toLocaleString('en-IN')}
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              {Math.round(maxAttempts * 0.66).toLocaleString('en-IN')}
            </div>
            <div className="border-b border-dashed border-slate-100 dark:border-slate-800 pb-1">
              {Math.round(maxAttempts * 0.33).toLocaleString('en-IN')}
            </div>
            <div className="border-b border-slate-200 dark:border-slate-800 pb-0.5">0</div>
          </div>

          {/* Line Paths SVG */}
          <div className="absolute inset-0 pl-6 pb-5">
            <svg
              className="w-full h-full overflow-visible"
              viewBox="0 0 300 120"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#026BFC" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#026BFC" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10B981" stopOpacity="0.20" />
                  <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gradient Area: Total Attempts */}
              {attemptsSvgPoints.attemptsArea && (
                <path d={attemptsSvgPoints.attemptsArea} fill="url(#blueGradient)" />
              )}
              {/* Total Attempts Line */}
              {attemptsSvgPoints.attemptsLine && (
                <path
                  d={attemptsSvgPoints.attemptsLine}
                  fill="none"
                  stroke="#026BFC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              )}

              {/* Gradient Area: Unique Students */}
              {attemptsSvgPoints.uniqueArea && (
                <path d={attemptsSvgPoints.uniqueArea} fill="url(#emeraldGradient)" />
              )}
              {/* Unique Students Line */}
              {attemptsSvgPoints.uniqueLine && (
                <path
                  d={attemptsSvgPoints.uniqueLine}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}

              {/* Dynamic Data Points */}
              {attemptsSvgPoints.attemptsCoords.map((p, idx) => (
                <circle
                  key={`blue-${idx}`}
                  cx={p.cx}
                  cy={p.cy}
                  r="3.5"
                  fill="#026BFC"
                  stroke="#FFFFFF"
                  strokeWidth="2"
                  className="cursor-pointer hover:r-5 transition-all"
                  onMouseEnter={() => setHoveredAttemptIndex(idx)}
                  onMouseLeave={() => setHoveredAttemptIndex(null)}
                />
              ))}

              {attemptsSvgPoints.uniqueCoords.map((p, idx) => (
                <circle
                  key={`green-${idx}`}
                  cx={p.cx}
                  cy={p.cy}
                  r="3"
                  fill="#10B981"
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                />
              ))}
            </svg>

            {/* Tooltip on hovered point */}
            {hoveredAttemptIndex !== null && testAttemptsData[hoveredAttemptIndex] && (
              <div
                style={{
                  left: `${attemptsSvgPoints.attemptsCoords[hoveredAttemptIndex]?.cx || 0}px`,
                  top: `${(attemptsSvgPoints.attemptsCoords[hoveredAttemptIndex]?.cy || 20) - 30}px`,
                }}
                className="absolute bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] py-1 px-2 rounded shadow-md z-30 whitespace-nowrap -translate-x-1/2 pointer-events-none"
              >
                {testAttemptsData[hoveredAttemptIndex].label}:{' '}
                {testAttemptsData[hoveredAttemptIndex].totalAttempts} attempts /{' '}
                {testAttemptsData[hoveredAttemptIndex].uniqueStudents} students
              </div>
            )}
          </div>

          {/* X-Axis Labels */}
          <div className="absolute bottom-0 inset-x-0 pl-6 flex justify-between text-[9px] text-slate-400 font-medium">
            {testAttemptsData.map((item, idx) => (
              <span key={item.label + idx}>{item.label}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
