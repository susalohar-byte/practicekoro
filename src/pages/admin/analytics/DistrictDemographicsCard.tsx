import { ChevronRight } from 'lucide-react';
import type { AdminAnalyticsState } from './useAdminAnalytics';

export interface DistrictDemographicsCardProps {
  analyticsState: AdminAnalyticsState;
}

export function DistrictDemographicsCard({ analyticsState }: DistrictDemographicsCardProps) {
  const { card, demographicsData, data } = analyticsState;
  return (
    <div className={`lg:col-span-4 ${card} flex flex-col justify-between`}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Student Demographics (Location)
        </h2>
        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
          By District
        </span>
      </div>

      {/* Map Silhouette & Horizontal Progress Bars */}
      <div className="grid grid-cols-12 gap-3 items-center py-2">
        {/* Left: Map Graphic */}
        <div className="col-span-4 h-36 flex items-center justify-center p-1 relative">
          <img
            src="/images/west_bengal_silhouette.svg"
            alt="Bengal Region Map"
            className="w-full h-full object-contain filter drop-shadow-sm opacity-90"
          />
        </div>

        {/* Right: Progress bars */}
        <div className="col-span-8 space-y-1.5 text-xs">
          {demographicsData.length === 0 && (
            <p className="text-center text-slate-400">No district data recorded.</p>
          )}
          {demographicsData.map((loc) => (
            <div key={loc.name} className="flex items-center gap-2">
              <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 w-20 truncate">
                {loc.name}
              </span>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 w-7 text-right">
                {loc.pct}%
              </span>
              <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${loc.color} rounded-full`}
                  style={{ width: `${loc.pct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 flex justify-between items-center">
        <span>
          Top hub:{' '}
          {data?.demographics?.districts && data.demographics.districts.length > 0
            ? `${data.demographics.districts[0].district}${
                data.demographics.districts[1]
                  ? ` & ${data.demographics.districts[1].district}`
                  : ''
              } districts`
            : '—'}
        </span>
        <a
          href="/admin/district-rankings"
          className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
        >
          District Rankings <ChevronRight className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
