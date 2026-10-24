import { Send, Users, Eye, MousePointerClick, Bell } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationKpiCardsProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationKpiCards({ notificationsState }: NotificationKpiCardsProps) {
  const { metrics } = notificationsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FIVE SUMMARY METRICS CARDS (Exact match to reference screenshot) */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Sent */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">
              {isSupabaseConfigured ? 'Sent Notices' : 'Total Sent'}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {metrics.totalSentFormatted}
              </span>
              {!isSupabaseConfigured && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ↑ 28%
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {isSupabaseConfigured ? 'loaded records' : 'all time'}
            </span>
          </div>
        </div>

        {/* Card 2: Delivered */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Delivered</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {metrics.deliveredFormatted}
              </span>
            </div>
            <div className="h-4" />
          </div>
        </div>

        {/* Card 3: Opened */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Opened</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {metrics.openedFormatted}
              </span>
              {!isSupabaseConfigured && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  79%
                </span>
              )}
            </div>
            <div className="h-4" />
          </div>
        </div>

        {/* Card 4: Clicked */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <MousePointerClick className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Clicked</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {metrics.clickedFormatted}
              </span>
              {!isSupabaseConfigured && (
                <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  ↑ 20%
                </span>
              )}
            </div>
            <div className="h-4" />
          </div>
        </div>

        {/* Card 5: Failed */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-rose-500" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Failed</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {metrics.failedFormatted}
              </span>
              {!isSupabaseConfigured && (
                <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                  ↓ 3%
                </span>
              )}
            </div>
            <div className="h-4" />
          </div>
        </div>
      </div>

      {isSupabaseConfigured && (
        <p className="text-xs text-slate-500">
          Sent counts are saved notifications, not recipient deliveries. Delivery, open, click and
          failure tracking is unavailable.
        </p>
      )}
    </>
  );
}
