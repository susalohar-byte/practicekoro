import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getCategoryBadgeClass, getPriorityBadgeClass, getStatusBadgeClass } from './supportBadges';
import type { AdminSupportState } from './useAdminSupport';

export interface SupportTicketListProps {
  supportState: AdminSupportState;
}

export function SupportTicketList({ supportState }: SupportTicketListProps) {
  const {
    filteredTickets,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    selectedTicketId,
    setSelectedTicketId,
  } = supportState;
  return (
    <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden flex flex-col">
      {/* Header Bar */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <h2 className="text-sm font-bold text-slate-900">Tickets ({filteredTickets.length})</h2>

        {/* Sort by dropdown */}
        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="appearance-none bg-white text-xs text-slate-600 font-medium pr-6 pl-2 py-1 rounded-lg cursor-pointer focus:outline-none"
          >
            <option value="Latest">Sort by: Latest</option>
            <option value="Oldest">Sort by: Oldest</option>
            <option value="High Priority">Sort by: High Priority</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {/* Tickets Cards List */}
      <div className="divide-y divide-slate-100/80">
        {filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No tickets found matching current filters
          </div>
        ) : (
          filteredTickets
            .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
            .map((tkt) => {
              const isSelected = Boolean(selectedTicketId && selectedTicketId === tkt.id);

              return (
                <div
                  key={tkt.id}
                  onClick={() => setSelectedTicketId(tkt.id)}
                  className={cn(
                    'p-3.5 flex items-start gap-3 transition-colors cursor-pointer group',
                    isSelected ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-slate-50/60'
                  )}
                >
                  {/* Checkbox */}
                  <div className="pt-1">
                    <input
                      type="checkbox"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>

                  {/* Avatar */}
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                      tkt.avatarBgColor
                    )}
                  >
                    {tkt.avatarText}
                  </div>

                  {/* Middle content */}
                  <div className="min-w-0 flex-1">
                    {/* Line 1: Name + Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-xs truncate">
                        {tkt.studentName}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-semibold',
                          getCategoryBadgeClass(tkt.category)
                        )}
                      >
                        {tkt.category}
                      </span>
                      {tkt.priority === 'High' ? (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-semibold',
                            getPriorityBadgeClass(tkt.priority)
                          )}
                        >
                          {tkt.priority}
                        </span>
                      ) : (
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded text-[10px] font-semibold',
                            getStatusBadgeClass(tkt.status)
                          )}
                        >
                          {tkt.status}
                        </span>
                      )}
                    </div>

                    {/* Line 2: Subject */}
                    <span className="font-bold text-slate-800 text-xs block truncate mt-1">
                      {tkt.subject}
                    </span>

                    {/* Line 3: Excerpt */}
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">{tkt.excerpt}</p>
                  </div>

                  {/* Right side: Date & Ticket Number */}
                  <div className="text-right shrink-0 pt-0.5">
                    <span className="text-[10px] text-slate-400 block whitespace-nowrap">
                      {tkt.dateStr}
                    </span>
                    <span className="text-[11px] text-blue-600 font-mono font-medium block mt-1">
                      {tkt.ticketNumber}
                    </span>
                  </div>
                </div>
              );
            })
        )}
      </div>

      {/* Table / List Footer Pagination */}
      <div className="border-t border-slate-100 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500 mt-auto">
        <div>
          Showing {filteredTickets.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
          {Math.min(filteredTickets.length, currentPage * rowsPerPage)} of {filteredTickets.length}{' '}
          tickets
        </div>

        <div className="flex items-center gap-1.5">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setCurrentPage(1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#2563EB] text-white font-medium shadow-2xs"
          >
            1
          </button>
          <button
            onClick={() => setCurrentPage(2)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            2
          </button>
          <button
            onClick={() => setCurrentPage(3)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            3
          </button>
          <button
            onClick={() => setCurrentPage(4)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            4
          </button>
          <button
            onClick={() => setCurrentPage(5)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
          >
            5
          </button>
          <span className="px-1 text-slate-400">...</span>

          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <div className="relative ml-2">
            <select
              value={rowsPerPage}
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
              className="appearance-none border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
