import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Copy, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminCouponsState } from './useAdminCoupons';

export interface CouponTablePanelProps {
  cp: AdminCouponsState;
}

export function CouponTablePanel({ cp }: CouponTablePanelProps) {
  const {
    selectedCheckboxes,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    showToast,
    beginEditing,
    filteredRows,
    pageCount,
    handleSelectAll,
    handleToggleRow,
    handleDeleteCoupon,
    handleCopy,
  } = cp;
  return (
    <>
      {/* LEFT COLUMN: COUPONS TABLE (8 COLS) */}
      <div className="lg:col-span-8 space-y-4">
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
                  <th className="py-3 px-2 w-7 text-center">#</th>
                  <th className="py-3 px-3">Coupon Code</th>
                  <th className="py-3 px-3">Title</th>
                  <th className="py-3 px-3">Discount</th>
                  <th className="py-3 px-3">Applicable Plans</th>
                  <th className="py-3 px-3">Usage</th>
                  <th className="py-3 px-3">Validity</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-xs">
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-xs text-slate-400">
                      No coupons found
                    </td>
                  </tr>
                ) : (
                  filteredRows
                    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    .map((row, idx) => {
                      const isChecked = selectedCheckboxes.includes(row.id);
                      return (
                        <tr
                          key={row.id}
                          className="hover:bg-slate-50/60 transition-colors group cursor-pointer"
                          onClick={() => {
                            beginEditing(row);
                          }}
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

                          {/* Coupon Code */}
                          <td className="py-3 px-3">
                            <span className="font-mono font-bold text-xs bg-[#DBEAFE] text-[#1E40AF] px-2.5 py-1 rounded-md tracking-wider">
                              {row.code}
                            </span>
                          </td>

                          {/* Title */}
                          <td className="py-3 px-3">
                            <span className="font-semibold text-slate-800 block truncate">
                              {row.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate">
                              {row.subtitle}
                            </span>
                          </td>

                          {/* Discount */}
                          <td className="py-3 px-3">
                            <span className="font-bold text-emerald-600 block">
                              {row.discountType === 'percentage'
                                ? `${row.discountValue}%`
                                : `₹${row.discountValue}`}
                            </span>
                            <span className="text-[10px] text-emerald-700 block">
                              {row.maxDiscount ? `Max ₹${row.maxDiscount}` : 'Flat Off'}
                            </span>
                          </td>

                          {/* Applicable Plans */}
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium whitespace-nowrap',
                                row.planBadgeClass
                              )}
                            >
                              {row.applicablePlans}
                            </span>
                          </td>

                          {/* Usage */}
                          <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                            {row.usedCount}{' '}
                            <span className="text-slate-400 font-normal">
                              / {row.totalLimit || 'Unlimited'}
                            </span>
                          </td>

                          {/* Validity */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="text-slate-700 block font-normal">
                              {row.validFrom}
                            </span>
                            <span className="text-[11px] text-slate-400 block">
                              – {row.validUntil}
                            </span>
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
                                <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    onClick={() => handleCopy(row.code)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy Code</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      beginEditing(row);
                                      showToast(`Editing coupon ${row.code} in side panel.`);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                  >
                                    <span>Edit Coupon</span>
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    onClick={() => handleDeleteCoupon(row.id)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete</span>
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
              Showing {filteredRows.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
              {Math.min(filteredRows.length, currentPage * rowsPerPage)} of {filteredRows.length}{' '}
              coupons
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

              {Array.from(
                { length: Math.min(5, pageCount) },
                (_, i) => Math.max(1, Math.min(currentPage - 2, pageCount - 4)) + i
              ).map((page) => (
                <button
                  key={page}
                  aria-label={`Page ${page}`}
                  aria-current={currentPage === page ? 'page' : undefined}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-7 h-7 rounded-lg',
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {page}
                </button>
              ))}

              <button
                aria-label="Next page"
                disabled={currentPage >= pageCount}
                onClick={() => setCurrentPage((p) => Math.min(pageCount, p + 1))}
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
