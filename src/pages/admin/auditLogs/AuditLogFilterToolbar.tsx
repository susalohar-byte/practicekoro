import { Search, ChevronDown, Filter } from 'lucide-react';
import type { AdminAuditLogsState } from './useAdminAuditLogs';

export interface AuditLogFilterToolbarProps {
  al: AdminAuditLogsState;
}

export function AuditLogFilterToolbar({ al }: AuditLogFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    filterAdmin,
    setFilterAdmin,
    filterAction,
    setFilterAction,
    filterResource,
    setFilterResource,
    filterSeverity,
    setFilterSeverity,
    adminOptions,
    showToast,
    handleResetFilters,
  } = al;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by admin name, action, resource..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* Admin */}
        <div className="relative min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Admin</label>
          <div className="relative">
            <select
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Admins">All Admins</option>
              {adminOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action */}
        <div className="relative min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Action</label>
          <div className="relative">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Actions">All Actions</option>
              <option value="Created">Created</option>
              <option value="Updated">Updated</option>
              <option value="Deleted">Deleted</option>
              <option value="Login">Login</option>
              <option value="Viewed">Viewed</option>
              <option value="Refunded">Refunded</option>
              <option value="Changed">Changed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Resource */}
        <div className="relative min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Resource</label>
          <div className="relative">
            <select
              value={filterResource}
              onChange={(e) => setFilterResource(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Resources">All Resources</option>
              <option value="Question">Question</option>
              <option value="Test Series">Test Series</option>
              <option value="Mock Test">Mock Test</option>
              <option value="Coupon">Coupon</option>
              <option value="Subscription">Subscription</option>
              <option value="System">System</option>
              <option value="Student">Student</option>
              <option value="Payment">Payment</option>
              <option value="Settings">Settings</option>
              <option value="Subject">Subject</option>
              <option value="Banner">Banner</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Severity */}
        <div className="relative min-w-[120px]">
          <label className="text-[11px] font-medium text-slate-400 block mb-1">Severity</label>
          <div className="relative">
            <select
              value={filterSeverity}
              onChange={(e) => setFilterSeverity(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Levels">All Levels</option>
              <option value="Info">Info</option>
              <option value="Warning">Warning</option>
              <option value="High">High</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Filter and Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Applied audit log filters.')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2.5 py-2.5 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
