import { cn } from '@/lib/utils';
import { CATEGORY_BARS_DATA } from './demoCutoffs';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffAnalyticsPanelProps {
  co: AdminCutoffState;
}

export function CutoffAnalyticsPanel({ co }: CutoffAnalyticsPanelProps) {
  const {
    comparisonCategory,
    setComparisonCategory,
    setViewAllTrendOpen,
    setViewAllComparisonOpen,
    activeComparisonData,
  } = co;
  return (
    <>
      {/* RIGHT COLUMN: 3 ANALYTICS & VISUALIZATION WIDGETS */}
      <div className="lg:col-span-4 space-y-6">
        {/* WIDGET 1: CUTOFF TREND (WBP Constable – General) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">
              Cutoff Trend (WBP Constable - General)
            </h2>
            <button
              onClick={() => setViewAllTrendOpen(true)}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* SVG Area Chart */}
          <div className="relative pt-2 pb-1">
            <svg viewBox="0 0 360 170" className="w-full h-44 overflow-visible">
              <defs>
                <linearGradient id="cutoffAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563EB" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#2563EB" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-axis grid lines and labels: 100, 80, 60, 40, 20, 0 */}
              {[
                { val: 100, y: 15 },
                { val: 80, y: 45 },
                { val: 60, y: 75 },
                { val: 40, y: 105 },
                { val: 20, y: 135 },
                { val: 0, y: 155 },
              ].map((tick) => (
                <g key={tick.val}>
                  <line x1="30" y1={tick.y} x2="350" y2={tick.y} stroke="#F1F5F9" strokeWidth="1" />
                  <text
                    x="18"
                    y={tick.y + 3.5}
                    fontSize="9"
                    fill="#94A3B8"
                    textAnchor="end"
                    fontWeight="400"
                  >
                    {tick.val}
                  </text>
                </g>
              ))}

              {/* Trend line and Area fill */}
              {/* 
                  Points mapping:
                  2019: 67.50 -> x=55, y = 155 - (67.5/100)*140 = 60.5
                  2020: 72.25 -> x=112, y = 155 - (72.25/100)*140 = 53.85
                  2021: 76.00 -> x=169, y = 155 - (76/100)*140 = 48.6
                  2022: 80.50 -> x=226, y = 155 - (80.5/100)*140 = 42.3
                  2023: 83.75 -> x=283, y = 155 - (83.75/100)*140 = 37.75
                  2024: 85.25 -> x=340, y = 155 - (85.25/100)*140 = 35.65
                */}
              <path
                d="M 55 60.5 L 112 53.85 L 169 48.6 L 226 42.3 L 283 37.75 L 340 35.65 L 340 155 L 55 155 Z"
                fill="url(#cutoffAreaGrad)"
              />
              <path
                d="M 55 60.5 L 112 53.85 L 169 48.6 L 226 42.3 L 283 37.75 L 340 35.65"
                fill="none"
                stroke="#2563EB"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points with floating score labels */}
              {[
                { year: '2019', val: '67.50', x: 55, y: 60.5 },
                { year: '2020', val: '72.25', x: 112, y: 53.85 },
                { year: '2021', val: '76.00', x: 169, y: 48.6 },
                { year: '2022', val: '80.50', x: 226, y: 42.3 },
                { year: '2023', val: '83.75', x: 283, y: 37.75 },
                { year: '2024', val: '85.25', x: 340, y: 35.65 },
              ].map((pt) => (
                <g key={pt.year}>
                  {/* Floating score text */}
                  <text
                    x={pt.x}
                    y={pt.y - 8}
                    fontSize="9"
                    fontWeight="600"
                    fill="#1E293B"
                    textAnchor="middle"
                  >
                    {pt.val}
                  </text>
                  {/* Circle marker */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="#2563EB"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                  />
                  {/* X-axis year label */}
                  <text
                    x={pt.x}
                    y={166}
                    fontSize="9"
                    fill="#64748B"
                    textAnchor="middle"
                    fontWeight="400"
                  >
                    {pt.year}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* WIDGET 2: CATEGORY-WISE CUTOFF (WBP Constable 2024) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
          <h2 className="text-sm font-bold text-slate-900 mb-4">
            Category-wise Cutoff (WBP Constable 2024)
          </h2>

          <div className="space-y-3">
            {CATEGORY_BARS_DATA.map((item) => (
              <div key={item.category} className="flex items-center justify-between text-xs">
                {/* Category Name */}
                <span className="w-28 text-slate-600 font-normal truncate">{item.category}</span>

                {/* Horizontal Bar */}
                <div className="flex-1 mx-3 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.value}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>

                {/* Score */}
                <span className="w-12 text-right font-semibold text-slate-800">
                  {item.value.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* WIDGET 3: CUTOFF COMPARISON (Year-wise) */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-900">Cutoff Comparison (Year-wise)</h2>
            <button
              onClick={() => setViewAllComparisonOpen(true)}
              className="text-xs font-semibold text-[#2563EB] hover:underline cursor-pointer"
            >
              View All
            </button>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap mb-4">
            {['General', 'OBC-A', 'OBC-B', 'SC', 'ST', 'EWS'].map((cat) => (
              <button
                key={cat}
                onClick={() => setComparisonCategory(cat)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer',
                  comparisonCategory === cat
                    ? 'bg-[#2563EB] text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Vertical Bar Chart with Y-axis */}
          <div className="relative pt-2">
            <div className="flex items-end gap-2 h-44 border-b border-slate-100 pb-1 pl-7 pr-2">
              {/* Y-axis numbers positioned on left */}
              <div className="absolute left-0 top-2 bottom-5 flex flex-col justify-between text-[9px] text-slate-400 font-normal">
                <span>100</span>
                <span>80</span>
                <span>60</span>
                <span>40</span>
                <span>20</span>
                <span>0</span>
              </div>

              {/* Bars */}
              {activeComparisonData.map((bar) => {
                const heightPercent = (bar.value / 100) * 100;
                return (
                  <div
                    key={bar.year}
                    className="flex-1 flex flex-col items-center justify-end h-full group"
                  >
                    {/* Floating value on top */}
                    <span className="text-[10px] font-semibold text-slate-700 mb-1">
                      {bar.value.toFixed(2)}
                    </span>

                    {/* Bar Pillar */}
                    <div
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: `${heightPercent}%`,
                        backgroundColor: bar.color,
                      }}
                    />

                    {/* Year label below */}
                    <span className="text-[10px] text-slate-500 font-normal mt-2">{bar.year}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
