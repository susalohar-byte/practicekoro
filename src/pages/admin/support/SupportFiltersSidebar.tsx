import { Search, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSupportState } from './useAdminSupport';

export interface SupportFiltersSidebarProps {
  supportState: AdminSupportState;
}

export function SupportFiltersSidebar({ supportState }: SupportFiltersSidebarProps) {
  const {
    ticketsList,
    filterSearch,
    setFilterSearch,
    filterStatus,
    filterCategory,
    filterPriority,
    toggleStatusCheckbox,
    toggleCategoryCheckbox,
    togglePriorityCheckbox,
    handleResetFilters,
  } = supportState;
  return (
    <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs space-y-5">
      <h2 className="text-sm font-bold text-slate-900">Filters</h2>

      {/* Search tickets */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search tickets..."
          className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />
      </div>

      {/* STATUS SECTION */}
      <div className="space-y-2">
        <span className="text-xs font-bold text-slate-800 block">Status</span>
        <div className="space-y-1.5 text-xs">
          {[
            { name: 'All', count: ticketsList.length },
            { name: 'Open', count: ticketsList.filter((t) => t.status === 'Open').length },
            {
              name: 'In Progress',
              count: ticketsList.filter((t) => t.status === 'In Progress').length,
            },
            {
              name: 'Resolved',
              count: ticketsList.filter((t) => t.status === 'Resolved').length,
            },
            {
              name: 'Closed',
              count: ticketsList.filter((t) => t.status === 'Closed').length,
            },
          ].map((item) => {
            const isChecked = filterStatus.includes(item.name);
            return (
              <label
                key={item.name}
                className="flex items-center justify-between py-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label={item.name}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleStatusCheckbox(item.name)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span className={cn(isChecked && item.name === 'All' && 'font-medium')}>
                    {item.name}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{item.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* CATEGORY SECTION */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-800 block">Category</span>
        <div className="space-y-1.5 text-xs">
          {[
            {
              name: 'Payment Issue',
              count: ticketsList.filter((t) => t.category === 'Payment Issue').length,
            },
            {
              name: 'Subscription',
              count: ticketsList.filter((t) => t.category === 'Subscription').length,
            },
            {
              name: 'Technical Issue',
              count: ticketsList.filter((t) => t.category === 'Technical Issue').length,
            },
            {
              name: 'Content Related',
              count: ticketsList.filter((t) => t.category === 'Content Related').length,
            },
            {
              name: 'Account Related',
              count: ticketsList.filter((t) => t.category === 'Account Related').length,
            },
            {
              name: 'Refund Request',
              count: ticketsList.filter((t) => t.category === 'Refund Request').length,
            },
            {
              name: 'Other',
              count: ticketsList.filter((t) => t.category === 'Other').length,
            },
          ].map((item) => {
            const isChecked = filterCategory.includes(item.name);
            return (
              <label
                key={item.name}
                className="flex items-center justify-between py-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label={item.name}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategoryCheckbox(item.name)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{item.name}</span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{item.count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* PRIORITY SECTION */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-800 block">Priority</span>
        <div className="space-y-1.5 text-xs">
          {[
            { name: 'All', count: null },
            { name: 'High', count: ticketsList.filter((t) => t.priority === 'High').length },
            {
              name: 'Medium',
              count: ticketsList.filter((t) => t.priority === 'Medium').length,
            },
            { name: 'Low', count: ticketsList.filter((t) => t.priority === 'Low').length },
          ].map((item) => {
            const isChecked = filterPriority.includes(item.name);
            return (
              <label
                key={item.name}
                className="flex items-center justify-between py-0.5 cursor-pointer text-slate-600 hover:text-slate-900"
              >
                <div className="flex items-center gap-2">
                  <input
                    aria-label={item.name}
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePriorityCheckbox(item.name)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                  <span>{item.name}</span>
                </div>
                {item.count !== null && (
                  <span className="text-[11px] text-slate-400 font-mono">{item.count}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>

      {/* DATE RANGE SECTION */}
      <div className="space-y-2 pt-2 border-t border-slate-100">
        <span className="text-xs font-bold text-slate-800 block">Date Range</span>
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 shadow-2xs">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="text-[11px] font-medium text-slate-600">01 Sep 2026 → 30 Sep 2026</span>
        </div>
      </div>

      {/* RESET FILTERS BUTTON */}
      <div className="pt-2">
        <button
          onClick={handleResetFilters}
          className="w-full border border-slate-200 text-[#2563EB] hover:bg-slate-50 rounded-xl py-2 text-xs font-semibold transition-colors cursor-pointer text-center"
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
