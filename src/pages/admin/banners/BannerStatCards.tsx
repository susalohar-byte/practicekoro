import { Eye, Clock, Archive, Image as ImageIcon } from 'lucide-react';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerStatCardsProps {
  bn: AdminBannersState;
}

export function BannerStatCards({ bn }: BannerStatCardsProps) {
  const { stats } = bn;
  return (
    <>
      {/* ================================================================= */}
      {/* 2. SUMMARY KPI METRIC CARDS (Exact 4-Card Row)                    */}
      {/* ================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Banners */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 shrink-0">
            <ImageIcon className="w-6 h-6 text-[#8B5CF6]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Total Banners</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">{stats.total}</span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">all banners</span>
          </div>
        </div>

        {/* Card 2: Active Banners */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
            <Eye className="w-6 h-6 text-[#10B981]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Active Banners</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {stats.active}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">live right now</span>
          </div>
        </div>

        {/* Card 3: Scheduled Banners */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-6 h-6 text-[#F59E0B]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Scheduled Banners</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {stats.scheduled}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">waiting to go live</span>
          </div>
        </div>

        {/* Card 4: Archived Banners */}
        <div className="bg-white rounded-xl p-4 border border-slate-200/80 shadow-2xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
            <Archive className="w-6 h-6 text-[#EF4444]" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-xs text-slate-500 font-medium block">Archived Banners</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 leading-tight">
                {stats.archived}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5">no longer shown</span>
          </div>
        </div>
      </div>
    </>
  );
}
