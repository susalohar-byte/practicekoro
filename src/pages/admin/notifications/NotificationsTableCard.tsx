import {
  Send,
  Eye,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Copy,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getTypeBadge, getStatusBadge } from './notificationBadges';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationsTableCardProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationsTableCard({ notificationsState }: NotificationsTableCardProps) {
  const {
    selectedIds,
    activeMenuId,
    setActiveMenuId,
    setInspectingItem,
    activePreviewItem,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    showToast,
    filteredNotifications,
    handleSelectAll,
    handleToggleRow,
    handleSelectToPreview,
    handleStartEdit,
    handleDelete,
    handleSendNow,
    handleDuplicate,
  } = notificationsState;
  return (
    <>
      {/* NOTIFICATIONS TABLE */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      selectedIds.length > 0 && selectedIds.length === filteredNotifications.length
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-8 text-center">#</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3">Type</th>
                <th className="py-3 px-3">Audience</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Sent At / Scheduled At</th>
                <th className="py-3 px-3">Stats</th>
                <th className="py-3 px-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/70 text-xs">
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-1" />
                    <p className="font-medium text-slate-600">No notifications found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Try adjusting your search query or date filter.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredNotifications
                  .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                  .map((row) => {
                    const isChecked = selectedIds.includes(row.id);
                    const isCurrentActivePreview = Boolean(
                      activePreviewItem && activePreviewItem.id === row.id
                    );
                    const typeBadge = getTypeBadge(row.type);

                    return (
                      <tr
                        key={row.id}
                        onClick={() => handleSelectToPreview(row)}
                        className={cn(
                          'transition-colors cursor-pointer group',
                          isCurrentActivePreview
                            ? 'bg-blue-50/50'
                            : isChecked
                              ? 'bg-blue-50/30 hover:bg-blue-50/50'
                              : 'hover:bg-slate-50/60'
                        )}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3 px-3 text-center"
                          onClick={(e) => handleToggleRow(row.id, e)}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>

                        {/* # */}
                        <td className="py-3 px-2 text-center text-slate-500 font-normal">
                          {row.num}
                        </td>

                        {/* Title & Message */}
                        <td className="py-3 px-3">
                          <div className="max-w-[200px]">
                            <span className="font-bold text-slate-900 block truncate">
                              {row.title}
                            </span>
                            <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                              {row.message}
                            </span>
                          </div>
                        </td>

                        {/* Type Badge */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold',
                              typeBadge.className
                            )}
                          >
                            {typeBadge.icon}
                            <span>{typeBadge.label}</span>
                          </span>
                        </td>

                        {/* Audience */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div>
                            <span className="text-slate-800 font-medium block">{row.audience}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {row.audienceCount}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-medium',
                              getStatusBadge(row.status)
                            )}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Sent At / Scheduled At */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {row.sentAtDate ? (
                            <div>
                              <span className="text-slate-800 font-normal block">
                                {row.sentAtDate}
                              </span>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                {row.sentAtTime}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 font-medium">—</span>
                          )}
                        </td>

                        {/* Stats Breakdown */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {row.stats ? (
                            <div className="flex items-center gap-4 text-center">
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {row.stats.delivered}%
                                </span>
                                <span className="text-[10px] text-slate-400 block">Delivered</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {row.stats.opened}%
                                </span>
                                <span className="text-[10px] text-slate-400 block">Opened</span>
                              </div>
                              <div>
                                <span className="font-bold text-slate-900 block leading-tight">
                                  {row.stats.clicked}%
                                </span>
                                <span className="text-[10px] text-slate-400 block">Clicked</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 text-slate-400">
                              <span>—</span>
                              <span>—</span>
                              <span>—</span>
                            </div>
                          )}
                        </td>

                        {/* Actions */}
                        <td
                          className="py-3 px-3 text-center relative"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="relative inline-block text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveMenuId(activeMenuId === row.id ? null : row.id);
                              }}
                              className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                            </button>

                            {/* Dropdown Menu */}
                            {activeMenuId === row.id && (
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleSelectToPreview(row);
                                    setActiveMenuId(null);
                                    showToast(`Viewing "${row.title}" in mobile frame.`);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Preview in Mobile</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleStartEdit(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                                  <span>Edit Notice</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setInspectingItem(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                                  <span>View Telemetry</span>
                                </button>

                                {row.status !== 'Sent' && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleSendNow(row.id);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer font-semibold"
                                  >
                                    <Send className="w-3.5 h-3.5 text-emerald-500" />
                                    <span>Send Now</span>
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDuplicate(row);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Duplicate Notice</span>
                                </button>

                                <div className="border-t border-slate-100 my-1" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    handleDelete(row.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                  <span>Delete Notice</span>
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

        {/* Table Footer / Real Interactive Pagination */}
        <div className="border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing {filteredNotifications.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
            {Math.min(currentPage * rowsPerPage, filteredNotifications.length)} of{' '}
            {filteredNotifications.length} notifications
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Previous Page"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {Array.from(
              { length: Math.ceil(filteredNotifications.length / rowsPerPage) || 1 },
              (_, i) => i + 1
            ).map((page) => (
              <button
                key={page}
                type="button"
                onClick={() => setCurrentPage(page)}
                className={cn(
                  'w-7 h-7 flex items-center justify-center rounded-lg font-medium cursor-pointer transition-colors',
                  currentPage === page
                    ? 'bg-[#2563EB] text-white shadow-2xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                )}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              disabled={currentPage >= Math.ceil(filteredNotifications.length / rowsPerPage)}
              onClick={() => setCurrentPage((p) => p + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              title="Next Page"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            <div className="relative ml-2">
              <select
                value={rowsPerPage}
                onChange={(e) => {
                  setRowsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
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
    </>
  );
}
