import { Search, ChevronDown, Filter } from 'lucide-react';
import type { AdminCouponsState } from './useAdminCoupons';

export interface CouponFilterToolbarProps {
  cp: AdminCouponsState;
}

export function CouponFilterToolbar({ cp }: CouponFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPlan,
    setFilterPlan,
    filterType,
    setFilterType,
    filterAdmin,
    setFilterAdmin,
    showToast,
  } = cp;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3">
        {/* Search */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by code, name or description..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Status Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Status</label>
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Status">All Status</option>
              <option value="Active">Active</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Expired">Expired</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Plan Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Plan</label>
          <div className="relative">
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Plans">All Plans</option>
              <option value="Basic Plan">Basic Plan</option>
              <option value="Pro Plan">Pro Plan</option>
              <option value="Ultimate Plan">Ultimate Plan</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Discount Type Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">
            Discount Type
          </label>
          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Types">All Types</option>
              <option value="Percentage">Percentage</option>
              <option value="Fixed Amount">Fixed Amount</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Created By Dropdown */}
        <div className="w-[130px]">
          <label className="text-[10px] font-semibold text-slate-400 mb-1 block">Created By</label>
          <div className="relative">
            <select
              disabled
              title="Coupon creator filtering is not supported by the current record schema."
              value={filterAdmin}
              onChange={(e) => setFilterAdmin(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
            >
              <option value="All Admins">All Admins</option>
              <option value="Super Admin">Super Admin</option>
              <option value="Academic Admin">Academic Admin</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => showToast('Coupon filters applied.')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterStatus('All Status');
              setFilterPlan('All Plans');
              setFilterType('All Types');
              setFilterAdmin('All Admins');
              showToast('Filters reset to default view.');
            }}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2.5 py-2 cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
