import { Search, Calendar, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationFilterToolbarProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationFilterToolbar({ notificationsState }: NotificationFilterToolbarProps) {
  const {
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    dateRangePreset,
    setDateRangePreset,
    showDatePicker,
    setShowDatePicker,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    setCurrentPage,
    showToast,
    tabCounts,
  } = notificationsState;
  return (
    <>
      {/* Top Filter Row: 4 Tabs + Search + Date Range */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-transparent">
        {/* 4 Tabs with real-time active counts */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setActiveTab('All');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              activeTab === 'All'
                ? 'text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span>All</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                activeTab === 'All'
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-slate-100 text-slate-600 dark:text-slate-400'
              )}
            >
              {tabCounts.all}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Scheduled');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              activeTab === 'Scheduled'
                ? 'text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span>Scheduled</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                activeTab === 'Scheduled'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-600 dark:text-slate-400'
              )}
            >
              {tabCounts.scheduled}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Sent');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              activeTab === 'Sent'
                ? 'text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span>Sent</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                activeTab === 'Sent'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-600 dark:text-slate-400'
              )}
            >
              {tabCounts.sent}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('Drafts');
              setCurrentPage(1);
            }}
            className={cn(
              'px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer',
              activeTab === 'Drafts'
                ? 'text-slate-900 font-bold'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <span>Drafts</span>
            <span
              className={cn(
                'px-2 py-0.5 rounded-full text-[11px] font-semibold',
                activeTab === 'Drafts'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 dark:text-slate-400'
              )}
            >
              {tabCounts.drafts}
            </span>
          </button>
        </div>

        {/* Right: Search & Date Range Picker */}
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search notifications..."
              className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Date Range Box with Real Filtering Menu */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs hover:bg-slate-50 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-medium text-slate-600">{dateRangePreset}</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400 ml-1" />
            </button>

            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-slate-200 shadow-xl p-2.5 z-40 space-y-1 animate-in fade-in">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block mb-1">
                  Filter Date Range
                </span>
                {['This Month', 'Last 7 Days', 'Last 30 Days', 'All Time', 'Custom Range'].map(
                  (dr) => (
                    <button
                      key={dr}
                      type="button"
                      onClick={() => {
                        setDateRangePreset(dr);
                        if (dr !== 'Custom Range') {
                          setShowDatePicker(false);
                          setCurrentPage(1);
                          showToast(`Filter applied: ${dr}`);
                        }
                      }}
                      className={cn(
                        'w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-between',
                        dateRangePreset === dr
                          ? 'bg-blue-50 text-blue-600 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      )}
                    >
                      <span>{dr}</span>
                      {dateRangePreset === dr && <Check className="w-3 h-3 text-blue-600" />}
                    </button>
                  )
                )}

                {/* Custom range date pickers */}
                {dateRangePreset === 'Custom Range' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2 px-1">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-semibold">From</label>
                      <input
                        type="date"
                        aria-label="Notification date from"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-semibold">To</label>
                      <input
                        type="date"
                        aria-label="Notification date to"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-800"
                      />
                    </div>
                    {(!customStartDate || !customEndDate || customStartDate > customEndDate) && (
                      <p role="alert" className="text-xs text-red-600">
                        Choose a valid date range with From on or before To.
                      </p>
                    )}
                    <button
                      type="button"
                      disabled={
                        !customStartDate || !customEndDate || customStartDate > customEndDate
                      }
                      onClick={() => {
                        setShowDatePicker(false);
                        setCurrentPage(1);
                        showToast('Custom date filter active.');
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs cursor-pointer mt-1"
                    >
                      Apply Range
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
