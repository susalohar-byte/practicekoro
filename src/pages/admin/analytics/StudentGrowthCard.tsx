import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface StudentGrowthCardProps {
  analyticsState: AdminAnalyticsState;
}

export function StudentGrowthCard({ analyticsState }: StudentGrowthCardProps) {
  const { card, growthChartData } = analyticsState;
  return (
    <div className={`lg:col-span-4 ${card} flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">Student Growth</h2>
        <div className="flex items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-600" /> New Students
          </span>
          <span className="inline-flex items-center gap-1.5 font-semibold text-slate-600 dark:text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500" /> Tests Attempted
          </span>
        </div>
      </div>

      {/* SVG Curve Multi-line Chart */}
      {!growthChartData ? (
        <p className="h-[180px] flex items-center justify-center text-xs text-slate-400">
          Not enough activity in this range to draw a trend.
        </p>
      ) : (
        <>
          <div className="h-[180px] w-full mt-3 relative">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 160">
              {/* Background Grid Lines & Y-axis Labels */}
              {[
                { y: 15, label: `${growthChartData.maxVal.toLocaleString('en-IN')}` },
                {
                  y: 50,
                  label: `${Math.round(growthChartData.maxVal * 0.75).toLocaleString('en-IN')}`,
                },
                {
                  y: 85,
                  label: `${Math.round(growthChartData.maxVal * 0.5).toLocaleString('en-IN')}`,
                },
                {
                  y: 120,
                  label: `${Math.round(growthChartData.maxVal * 0.25).toLocaleString('en-IN')}`,
                },
                { y: 155, label: '0' },
              ].map((g) => (
                <g key={g.y}>
                  <text x="0" y={g.y + 4} className="text-[10px] fill-slate-400" textAnchor="start">
                    {g.label}
                  </text>
                  <line
                    x1="38"
                    y1={g.y}
                    x2="495"
                    y2={g.y}
                    stroke="#E2E8F0"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                    className="dark:stroke-slate-800"
                  />
                </g>
              ))}

              {/* Green Line (Active Students) Curve */}
              <path
                d={growthChartData.greenPath}
                fill="none"
                stroke="#10B981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Blue Line (New Students) Curve */}
              <path
                d={growthChartData.bluePath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Green Point markers */}
              {growthChartData.greenPoints.map((p, idx) => (
                <circle
                  key={`g-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#10B981"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform hover:scale-150 cursor-pointer"
                >
                  <title>{`Active Students: ${p.val.toLocaleString('en-IN')} (${p.label})`}</title>
                </circle>
              ))}

              {/* Blue Point markers */}
              {growthChartData.bluePoints.map((p, idx) => (
                <circle
                  key={`b-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#2563EB"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-transform hover:scale-150 cursor-pointer"
                >
                  <title>{`New Students: ${p.val.toLocaleString('en-IN')} (${p.label})`}</title>
                </circle>
              ))}
            </svg>
          </div>

          {/* X-axis date points */}
          <div className="flex justify-between text-[10px] text-slate-400 pl-8 pt-1 border-t border-slate-100 dark:border-slate-800">
            {growthChartData.labels.map((lbl, idx) => (
              <span key={idx}>{lbl}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
