import {
  Shield,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Trash2,
  Key,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SYSTEM_ROLE_CONFIGS, getRoleBadgeClass } from './staffUtils';
import type { AdminStaffState } from './useAdminStaff';

export interface StaffUsersTablePanelProps {
  st: AdminStaffState;
}

export function StaffUsersTablePanel({ st }: StaffUsersTablePanelProps) {
  const {
    isSidePanelOpen,
    filteredAdmins,
    stats,
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    handleResetFilters,
    selectedIds,
    handleSelectAll,
    paginatedAdmins,
    handleToggleRow,
    currentPageClamped,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    handleToggleStatus,
    handleResetPassword,
    handleDeleteAdmin,
    startIndex,
    endIndex,
    totalPages,
  } = st;
  return (
    <>
      {/* LEFT COLUMN: ADMIN USERS TABLE */}
      <div
        className={cn(
          'transition-all duration-300 space-y-4',
          isSidePanelOpen ? 'lg:col-span-8' : 'lg:col-span-12'
        )}
      >
        <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs overflow-hidden">
          {/* Header & Filter Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">
              Admin Users ({filteredAdmins.length}
              {filteredAdmins.length !== stats.total && (
                <span className="text-slate-400 font-normal text-xs ml-1">of {stats.total}</span>
              )}
              )
            </h2>

            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[210px]">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Search by name, email or role..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              {/* All Roles */}
              <div className="relative min-w-[130px]">
                <select
                  value={filterRole}
                  onChange={(e) => {
                    setFilterRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
                >
                  <option value="All Roles">All Roles ({stats.total})</option>
                  {SYSTEM_ROLE_CONFIGS.map((r) => (
                    <option key={r.title} value={r.title}>
                      {r.title} ({stats.roleCounts[r.title]})
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* All Status */}
              <div className="relative min-w-[120px]">
                <select
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
                >
                  <option value="All Status">All Status ({stats.total})</option>
                  <option value="Active">Active ({stats.active})</option>
                  <option value="Inactive">Inactive ({stats.inactive})</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Reset button */}
              <button
                onClick={handleResetFilters}
                className="text-[#2563EB] hover:underline font-semibold text-xs px-1 py-1 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 tracking-wider">
                  <th className="py-3 px-3 w-8 text-center">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length > 0 && selectedIds.length === filteredAdmins.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-2 w-8 text-center">#</th>
                  <th className="py-3 px-3">Name</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Last Active</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/70 text-xs">
                {filteredAdmins.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No admin staff members found.
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map((row, idx) => {
                    const isChecked = selectedIds.includes(row.id);

                    return (
                      <tr
                        key={row.id}
                        className={cn(
                          'transition-colors cursor-pointer group',
                          isChecked ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-slate-50/60'
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
                          {(currentPageClamped - 1) * rowsPerPage + idx + 1}
                        </td>

                        {/* Name + Avatar + You Badge */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {row.avatarType === 'photo' && row.avatarSrc ? (
                              <img
                                src={row.avatarSrc}
                                alt={row.name}
                                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-slate-100"
                              />
                            ) : (
                              <div
                                className={cn(
                                  'w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0',
                                  row.avatarBgColor || 'bg-blue-100',
                                  row.avatarTextColor || 'text-blue-600'
                                )}
                              >
                                {row.avatarInitials}
                              </div>
                            )}

                            <span className="font-semibold text-slate-900 truncate">
                              {row.name}
                            </span>

                            {row.isCurrentUser && (
                              <span className="bg-blue-50 text-blue-600 font-semibold text-[10px] px-1.5 py-0.5 rounded">
                                You
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Email */}
                        <td className="py-3 px-3 text-slate-500 font-normal">{row.email}</td>

                        {/* Role Pill */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold',
                              getRoleBadgeClass(row.role)
                            )}
                          >
                            {row.role}
                          </span>
                        </td>

                        {/* Status Pill */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span
                            className={cn(
                              'inline-block px-2.5 py-0.5 rounded-md text-[11px] font-semibold',
                              row.status === 'Active'
                                ? 'bg-[#DCFCE7] text-[#15803D]'
                                : 'bg-[#FEE2E2] text-[#DC2626]'
                            )}
                          >
                            {row.status}
                          </span>
                        </td>

                        {/* Last Active */}
                        <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                          {row.lastActive}
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
                              <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
                                <button
                                  onClick={() => {
                                    handleToggleStatus(row.id);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Shield className="w-3.5 h-3.5 text-slate-400" />
                                  <span>
                                    {row.status === 'Active'
                                      ? 'Deactivate Admin'
                                      : 'Activate Admin'}
                                  </span>
                                </button>

                                <button
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    void handleResetPassword(row.email);
                                  }}
                                  className="w-full text-left px-3.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                >
                                  <Key className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Reset Password</span>
                                </button>

                                {!row.isCurrentUser && (
                                  <>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      onClick={() => {
                                        handleDeleteAdmin(row.id);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full text-left px-3.5 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                      <span>Remove Admin</span>
                                    </button>
                                  </>
                                )}
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
              Showing {startIndex}–{endIndex} of {filteredAdmins.length} admins
              {filteredAdmins.length !== stats.total && (
                <span className="text-slate-400 ml-1">({stats.total} total)</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPageClamped <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg font-medium shadow-2xs transition-colors cursor-pointer',
                    currentPageClamped === pageNum
                      ? 'bg-[#2563EB] text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  )}
                >
                  {pageNum}
                </button>
              ))}

              <button
                disabled={currentPageClamped >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
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
      </div>
    </>
  );
}
