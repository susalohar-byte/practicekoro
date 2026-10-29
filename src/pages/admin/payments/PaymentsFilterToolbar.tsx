import { Calendar, ChevronDown, Filter, Search } from 'lucide-react';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsFilterToolbarProps {
  pay: AdminPaymentsState;
}

export function PaymentsFilterToolbar({ pay }: PaymentsFilterToolbarProps) {
  const {
    setSelectedCheckboxes,
    searchQuery,
    setSearchQuery,
    filterStatus,
    setFilterStatus,
    filterPlan,
    setFilterPlan,
    filterMethod,
    setFilterMethod,
    timeRange,
    setTimeRange,
    setCurrentPage,
    showToast,
  } = pay;
  return (
    <>
      {/* 4. FILTER TOOLBAR                                                   */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, transaction ID..."
            className="w-full border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {/* All Status */}
        <div className="relative min-w-[120px]">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Status">All Status</option>
            <option value="Success">Success</option>
            <option value="Pending">Pending</option>
            <option value="Failed">Failed</option>
            <option value="Refunded">Refunded</option>
            <option value="Unknown">Unknown</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* All Plans */}
        <div className="relative min-w-[120px]">
          <select
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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

        {/* All Payment Gateways */}
        <div className="relative min-w-[160px]">
          <select
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value)}
            className="w-full appearance-none border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 bg-white pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="All Payment Gateways">All Payment Gateways</option>
            <option value="UPI">UPI</option>
            <option value="Razorpay">Razorpay</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Credit Card">Credit Card</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Date Range Selector */}
        <div className="relative min-w-[170px]">
          <select
            aria-label="Filter payments by time range"
            value={timeRange}
            onChange={(e) => {
              setTimeRange(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full appearance-none border border-slate-200 rounded-xl pl-8 pr-7 py-2 text-xs text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Last 90 Days">Last 90 Days</option>
            <option value="This Year">This Year</option>
            <option value="All Time">All Time (All Payments)</option>
          </select>
          <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Filter and Reset Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPage(1);
              setSelectedCheckboxes([]);
            }}
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
              setFilterMethod('All Payment Gateways');
              setTimeRange('Last 30 Days');
              setCurrentPage(1);
              setSelectedCheckboxes([]);
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
