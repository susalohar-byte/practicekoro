import { Search, SlidersHorizontal } from 'lucide-react';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerFilterToolbarProps {
  bn: AdminBannersState;
}

export function BannerFilterToolbar({ bn }: BannerFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedDeviceFilter,
    setSelectedDeviceFilter,
    handleApplyFilters,
    handleResetFilters,
  } = bn;
  return (
    <>
      {/* ================================================================= */}
      {/* 3. FILTER TOOLBAR                                                 */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search banners..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyFilters();
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026BFC] transition-colors"
          />
        </div>

        {/* All Types Dropdown */}
        <div className="w-[130px]">
          <select
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
          >
            <option value="All Types">All Types</option>
            <option value="Test Series">Test Series</option>
            <option value="Offer">Offer</option>
            <option value="Subject">Subject</option>
            <option value="Brand">Brand</option>
            <option value="PYQ">PYQ</option>
          </select>
        </div>

        {/* All Status Dropdown */}
        <div className="w-[125px]">
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Scheduled">Scheduled</option>
            <option value="Archived">Archived</option>
            <option value="Draft">Draft</option>
          </select>
        </div>

        {/* All Devices Dropdown */}
        <div className="w-[130px]">
          <select
            value={selectedDeviceFilter}
            onChange={(e) => setSelectedDeviceFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
          >
            <option value="All Devices">All Devices</option>
            <option value="Desktop & Mobile">Desktop & Mobile</option>
            <option value="Desktop Only">Desktop Only</option>
            <option value="Mobile Only">Mobile Only</option>
          </select>
        </div>

        {/* Solid Blue Filter Button */}
        <button
          onClick={handleApplyFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          <span>Filter</span>
        </button>

        {/* Reset Link */}
        <button
          onClick={handleResetFilters}
          className="text-xs font-medium text-[#026BFC] hover:underline px-2 transition-colors"
        >
          Reset
        </button>
      </div>
    </>
  );
}
