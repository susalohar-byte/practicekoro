import {
  FileText,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getResourceBadge, getSeverityBadge } from './auditLogsUtils';
import type { AdminAuditLogsState } from './useAdminAuditLogs';

export interface AuditLogTablePanelProps {
  al: AdminAuditLogsState;
}

export function AuditLogTablePanel({ al }: AuditLogTablePanelProps) {
  const {
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    selectedLogId,
    setSelectedLogId,
    selectedIds,
    filteredLogs,
    handleSelectAll,
    handleToggleRow,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    showToast,
    serverTotal,
    logsList,
    hasMoreLogs,
    handleLoadOlderLogs,
    isLoadingMore,
    totalPages,
  } = al;
  return (
    <>
      {/* LEFT COLUMN: AUDIT LOGS TABLE */}
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
                      type="checkbox"
                      checked={selectedIds.length > 0 && selectedIds.length === filteredLogs.length}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Admin</th>
                  <th className="py-3 px-3">Action</th>
                  <th className="py-3 px-3">Resource</th>
                  <th className="py-3 px-3">Details</th>
                  <th className="py-3 px-3">IP Address</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-xs">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No audit logs recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs
                    .slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)
                    .map((row) => {
                      const isSelected = Boolean(isDetailsPanelOpen && selectedLogId === row.id);
                      const isChecked = selectedIds.includes(row.id);

                      return (
                        <tr
                          key={row.id}
                          onClick={() => {
                            setSelectedLogId(row.id);
                            setIsDetailsPanelOpen(true);
                          }}
                          className={cn(
                            'transition-colors cursor-pointer group',
                            isSelected
                              ? 'bg-blue-50/50 hover:bg-blue-50/70'
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

                          {/* Date & Time */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span className="font-normal text-slate-800 block">{row.date}</span>
                            <span className="text-[11px] text-slate-400 block mt-0.5">
                              {row.time}
                            </span>
                          </td>

                          {/* Admin */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              {row.avatarType === 'photo' && row.avatarSrc ? (
                                <img
                                  src={row.avatarSrc}
                                  alt={row.adminName}
                                  className="w-6 h-6 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                                />
                              ) : (
                                <div
                                  className={cn(
                                    'w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0',
                                    row.avatarBgColor || 'bg-blue-100',
                                    row.avatarTextColor || 'text-blue-600'
                                  )}
                                >
                                  {row.avatarInitials}
                                </div>
                              )}
                              <span className="font-medium text-slate-900">{row.adminName}</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="py-3 px-3 text-slate-700 font-medium whitespace-nowrap">
                            {row.action}
                          </td>

                          {/* Resource */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-block px-2 py-0.5 rounded text-[11px] font-medium',
                                getResourceBadge(row.resource)
                              )}
                            >
                              {row.resource}
                            </span>
                          </td>

                          {/* Details */}
                          <td className="py-3 px-3 text-slate-600 truncate max-w-[150px]">
                            {row.details}
                          </td>

                          {/* IP Address */}
                          <td className="py-3 px-3 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {row.ipAddress}
                          </td>

                          {/* Severity */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={cn(
                                'inline-block px-2.5 py-0.5 rounded text-[11px] font-medium',
                                getSeverityBadge(row.severity)
                              )}
                            >
                              {row.severity}
                            </span>
                          </td>

                          {/* Actions */}
                          <td
                            className="py-3 px-3 text-center relative"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-block text-left">
                              <button
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
                                      setSelectedLogId(row.id);
                                      setIsDetailsPanelOpen(true);
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                                    <span>View Details</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(row.id);
                                      showToast('Copied Log ID.');
                                      setActiveMenuId(null);
                                    }}
                                    className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy Log ID</span>
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
              Showing {filteredLogs.length === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}–
              {Math.min(filteredLogs.length, currentPage * rowsPerPage)} of {filteredLogs.length}{' '}
              logs
              {serverTotal !== null && (
                <span className="text-slate-400">
                  {' '}
                  ({logsList.length} of {serverTotal} loaded)
                </span>
              )}
              {hasMoreLogs && (
                <button
                  type="button"
                  onClick={() => void handleLoadOlderLogs()}
                  disabled={isLoadingMore}
                  className="ml-2 font-semibold text-[#2563EB] hover:underline disabled:opacity-50"
                >
                  {isLoadingMore ? 'Loading…' : 'Load older logs'}
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-slate-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
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
                  <option value={12}>12 / page</option>
                  <option value={24}>24 / page</option>
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
