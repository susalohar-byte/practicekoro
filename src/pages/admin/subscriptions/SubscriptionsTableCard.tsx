import {
  Clock,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  User,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRecordedAmount } from '@/utils/adminFinancialDisplay';
import { MethodIcon } from './MethodIcon';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface SubscriptionsTableCardProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function SubscriptionsTableCard({ subscriptionsState }: SubscriptionsTableCardProps) {
  const {
    selectedRowId,
    setSelectedRowId,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    selectedCheckboxes,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    isCancellingSubscription,
    setIsExtendModalOpen,
    filteredRows,
    handleSelectAll,
    handleToggleRow,
    handleCancelSubscription,
  } = subscriptionsState;
  return (
    <>
      {/* LEFT COLUMN: SUBSCRIPTIONS TABLE */}
      <div
        className={cn(
          'transition-all duration-300 space-y-4',
          isDetailsPanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'
        )}
      >
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      aria-label="Select all rows"
                      type="checkbox"
                      checked={
                        selectedCheckboxes.length > 0 &&
                        selectedCheckboxes.length === filteredRows.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3 px-3">Plan</th>
                  <th className="py-3 px-3">Amount</th>
                  <th className="py-3 px-3">Payment Method</th>
                  <th className="py-3 px-3">Start Date</th>
                  <th className="py-3 px-3">End Date</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-xs">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                      No subscription records found.
                    </td>
                  </tr>
                ) : (
                  filteredRows.slice(0, 10).map((row, idx) => {
                    const isSelected = Boolean(isDetailsPanelOpen && selectedRowId === row.id);
                    const isChecked = selectedCheckboxes.includes(row.id);
                    return (
                      <tr
                        key={row.id}
                        onClick={() => {
                          setSelectedRowId(row.id);
                          setIsDetailsPanelOpen(true);
                        }}
                        className={cn(
                          'transition-colors cursor-pointer group',
                          isSelected ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-slate-50/60'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => handleToggleRow(row.id, e)}
                        >
                          <input
                            aria-label="Select row"
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* # */}
                        <td className="py-3 px-2 text-center text-slate-500 font-normal">
                          {idx + 1}
                        </td>

                        {/* Student */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {row.avatarType === 'photo' && row.avatarSrc ? (
                              <img
                                src={row.avatarSrc}
                                alt={row.studentName}
                                className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-200"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  target.style.display = 'none';
                                  const fallback = target.nextElementSibling as HTMLElement;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <div
                              className={cn(
                                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0',
                                row.avatarBgColor || 'bg-blue-100',
                                row.avatarTextColor || 'text-blue-600'
                              )}
                              style={{
                                display:
                                  row.avatarType === 'photo' && row.avatarSrc ? 'none' : 'flex',
                              }}
                            >
                              {row.avatarInitials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800 block truncate">
                                {row.studentName}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {row.studentEmail}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Plan */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
                              row.planBadgeClass
                            )}
                          >
                            {row.plan}
                          </span>
                        </td>

                        {/* Amount */}
                        <td className="py-3 px-3 font-semibold text-slate-800">
                          {formatRecordedAmount(row.amount, row.paymentCurrency)}
                        </td>

                        {/* Payment Method */}
                        <td className="py-3 px-3">
                          <MethodIcon method={row.paymentMethod} />
                        </td>

                        {/* Start Date */}
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {row.startDate}
                        </td>

                        {/* End Date */}
                        <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                          {row.endDate}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium',
                              row.statusBadgeClass
                            )}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              aria-label="More actions"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === row.id ? null : row.id);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === row.id && (
                              <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    setSelectedRowId(row.id);
                                    setIsDetailsPanelOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span>View Details</span>
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedRowId(row.id);
                                    setIsExtendModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                >
                                  <Clock className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Extend Validity</span>
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  disabled={isCancellingSubscription || row.status !== 'Active'}
                                  onClick={() => {
                                    handleCancelSubscription(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Cancel Plan</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer / Pagination */}
          <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
            <div>
              Showing {filteredRows.length === 0 ? 0 : 1}–{Math.min(filteredRows.length, 10)} of{' '}
              {filteredRows.length.toLocaleString('en-IN')} subscriptions
            </div>

            <div className="flex items-center gap-1.5">
              <button
                aria-label="Previous page"
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
                aria-label="Next page"
                onClick={() => setCurrentPage((p) => p + 1)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <div className="relative ml-2">
                <select
                  aria-label="Rows per page"
                  value={rowsPerPage}
                  onChange={(e) => setRowsPerPage(Number(e.target.value))}
                  className="appearance-none border border-slate-200 rounded-lg px-2.5 py-1 text-xs text-slate-700 bg-white pr-6 cursor-pointer focus:outline-none"
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
      </div>
    </>
  );
}
