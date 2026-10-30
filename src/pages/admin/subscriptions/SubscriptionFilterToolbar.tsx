import { Search, ChevronDown, Filter } from 'lucide-react';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface SubscriptionFilterToolbarProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function SubscriptionFilterToolbar({ subscriptionsState }: SubscriptionFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    filterPlan,
    setFilterPlan,
    filterStatus,
    setFilterStatus,
    filterMethod,
    setFilterMethod,
    showToast,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, transaction ID..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* All Plans */}
        <div className="relative min-w-[130px]">
          <select
            aria-label="Filter by plan"
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
          >
            <option value="All Plans">All Plans</option>
            <option value="1 Month">1 Month</option>
            <option value="3 Months">3 Months</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Year">1 Year</option>
            <option value="Free Plan">Free Plan</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Status */}
        <div className="relative min-w-[120px]">
          <select
            aria-label="Filter by status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Expired">Expired</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Payment Methods */}
        <div className="relative min-w-[160px]">
          <select
            aria-label="Filter by payment method"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none"
          >
            <option value="All Payment Methods">All Payment Methods</option>
            <option value="Razorpay">Razorpay</option>
            <option value="UPI">UPI</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Credit Card">Credit Card</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => showToast('Subscription filters applied.')}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2 rounded-xl transition-colors shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={() => {
              setSearchQuery('');
              setFilterPlan('All Plans');
              setFilterStatus('All Status');
              setFilterMethod('All Payment Methods');
              showToast('Filters reset.');
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
