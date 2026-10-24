import { DonutChart } from './DonutChart';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface GenderDistributionCardProps {
  analyticsState: AdminAnalyticsState;
}

export function GenderDistributionCard({ analyticsState }: GenderDistributionCardProps) {
  const { card, displayGenderStats } = analyticsState;
  return (
    <div className={`lg:col-span-4 ${card} flex flex-col justify-between`}>
      <h2 className="text-sm font-bold text-slate-900 dark:text-white">
        Student Gender Distribution
      </h2>

      {displayGenderStats.total === 0 ? (
        <p className="my-auto py-8 text-center text-xs text-slate-400">
          No student profiles recorded yet.
        </p>
      ) : (
        <div className="flex items-center justify-between gap-4 sm:gap-6 my-auto py-3">
          {/* Left: Donut Chart */}
          <div className="shrink-0">
            <DonutChart
              slices={displayGenderStats.slices}
              centerValue={displayGenderStats.total.toLocaleString('en-IN')}
              centerLabel="Students"
              size={110}
              strokeWidth={14}
            />
          </div>

          {/* Right: Legend */}
          <div className="space-y-3.5 text-xs flex-1 min-w-0 pl-1 sm:pl-2">
            {displayGenderStats.items.map((item) => (
              <div key={item.label} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.dotColor}`} />
                  <span className="text-slate-600 dark:text-slate-300 font-medium text-xs truncate">
                    {item.label}
                  </span>
                </div>
                <span className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap text-right tabular-nums">
                  {item.count.toLocaleString('en-IN')}&nbsp;({item.pct}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
