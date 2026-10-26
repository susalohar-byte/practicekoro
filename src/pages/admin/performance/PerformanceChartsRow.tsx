import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface PerformanceChartsRowProps {
  perf: AdminPerformanceState;
}

export function PerformanceChartsRow({ perf }: PerformanceChartsRowProps) {
  const { subjectBars, trend, maxTrendAttempts, trendPoint, trendPath } = perf;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. ROW 2: CHARTS ROW (Trend on Left + Subject-wise on Right) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        {/* LEFT CHART: Performance Trend (~60% / 7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-[#0F172A]">Performance Trend</h3>
              <Info className="w-3 h-3 text-[#94A3B8]" />
            </div>

            <div className="flex items-center gap-3 text-[10px] font-semibold text-[#475569]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                <span>Tests Attempted</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#10B981]" />
                <span>Answer Accuracy (%)</span>
              </div>
            </div>
          </div>

          {trend.length === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-slate-400">
              No attempts recorded in this range.
            </div>
          ) : (
            <div className="relative h-[220px] w-full pt-4">
              <svg viewBox="0 0 540 180" className="w-full h-full overflow-visible">
                {[20, 55, 90, 125].map((y) => (
                  <line
                    key={y}
                    x1="30"
                    y1={y}
                    x2="510"
                    y2={y}
                    stroke="#F1F5F9"
                    strokeDasharray="3 3"
                  />
                ))}
                <line x1="30" y1="160" x2="510" y2="160" stroke="#E2E8F0" />
                <text x="5" y="24" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  {maxTrendAttempts.toLocaleString()}
                </text>
                <text x="20" y="163" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  0
                </text>
                <text x="515" y="24" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  100%
                </text>
                <text x="515" y="163" fill="#94A3B8" fontSize="9" fontFamily="sans-serif">
                  0%
                </text>
                <path
                  d={trendPath('averageAccuracy', 100)}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d={trendPath('attemptsCount', maxTrendAttempts)}
                  fill="none"
                  stroke="#2563EB"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {trend.map((t, i) => {
                  const acc = trendPoint(i, t.averageAccuracy, 100);
                  const att = trendPoint(i, t.attemptsCount, maxTrendAttempts);
                  return (
                    <g key={t.date}>
                      <circle cx={acc.x} cy={acc.y} r="3" fill="#10B981">
                        <title>{`${t.label}: ${t.averageAccuracy}% accuracy`}</title>
                      </circle>
                      <circle cx={att.x} cy={att.y} r="3" fill="#2563EB">
                        <title>{`${t.label}: ${t.attemptsCount} attempts`}</title>
                      </circle>
                    </g>
                  );
                })}
              </svg>

              <div className="flex justify-between pl-8 pr-8 text-[9px] font-semibold text-[#94A3B8] -mt-1">
                {trend.map((t) => (
                  <span key={t.date}>{t.label}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT CHART: Subject-wise Accuracy (~40% / 5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2">
            <h3 className="text-xs font-bold text-[#0F172A]">Subject-wise Accuracy</h3>
          </div>

          <div className="relative h-[220px] w-full flex items-end pt-4 pb-2">
            <div className="absolute inset-x-0 top-6 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              100%
            </div>
            <div className="absolute inset-x-0 top-16 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              80%
            </div>
            <div className="absolute inset-x-0 top-26 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              60%
            </div>
            <div className="absolute inset-x-0 top-36 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              40%
            </div>
            <div className="absolute inset-x-0 top-46 border-b border-dashed border-slate-100 flex items-center justify-start text-[8px] text-slate-400">
              20%
            </div>
            <div className="absolute inset-x-0 bottom-6 border-b border-slate-200 flex items-center justify-start text-[8px] text-slate-400">
              0%
            </div>

            <div className="w-full h-full flex items-end justify-around pl-5 pr-1 z-10 pb-6">
              {subjectBars.length === 0 && (
                <p className="self-center text-xs text-slate-400">
                  No answered questions in this range.
                </p>
              )}
              {subjectBars.map((bar) => (
                <div key={bar.name} className="flex flex-col items-center h-full justify-end group">
                  <span className="text-[10px] font-bold text-slate-800 mb-1 group-hover:scale-110 transition-transform">
                    {bar.score}%
                  </span>
                  <div
                    className={cn(
                      'w-7 sm:w-8 rounded-t-lg transition-all hover:brightness-105',
                      bar.color
                    )}
                    style={{ height: `${(bar.score / 100) * 140}px` }}
                  />
                  <span className="text-[9px] font-semibold text-slate-600 mt-2 text-center w-12 truncate leading-tight">
                    {bar.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
