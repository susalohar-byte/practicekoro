import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import { Monitor, Smartphone, MoreHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import { BannerVisual } from './BannerVisual';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerTablePanelProps {
  bn: AdminBannersState;
}

export function BannerTablePanel({ bn }: BannerTablePanelProps) {
  const {
    selectedBannerId,
    setSelectedBannerId,
    loading,
    isPanelOpen,
    setIsPanelOpen,
    setEditFormData,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalItems,
    totalPages,
    startIndex,
    visibleBanners,
    handleQuickToggleStatus,
  } = bn;
  return (
    <>
      {/* =============================================================== */}
      {/* LEFT: BANNERS TABLE CARD                                        */}
      {/* =============================================================== */}
      <div
        className={cn(
          'bg-white rounded-xl border border-slate-200/80 shadow-2xs overflow-hidden transition-all duration-300',
          isPanelOpen ? 'flex-1 min-w-0' : 'w-full'
        )}
      >
        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    aria-label="Select all rows"
                    type="checkbox"
                    className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
                  />
                </th>
                <th className="py-3 px-2 w-8 text-slate-500 font-semibold">#</th>
                <th className="py-3 px-3 w-36">Banner</th>
                <th className="py-3 px-3 min-w-[170px]">Title</th>
                <th className="py-3 px-2 w-24">Type</th>
                <th className="py-3 px-3 min-w-[130px]">Link</th>
                <th className="py-3 px-2 w-20">Devices</th>
                <th className="py-3 px-3 min-w-[125px]">Date Range</th>
                <th className="py-3 px-2 w-20">Status</th>
                <th className="py-3 px-2 w-12 text-center">Order</th>
                <th className="py-3 px-3 w-10 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-4">
                    <AdminSectionSkeleton label="Loading banners..." variant="table" />
                  </td>
                </tr>
              ) : visibleBanners.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    No banners match the selected criteria.
                  </td>
                </tr>
              ) : (
                visibleBanners.map((banner) => {
                  const isSelected = Boolean(isPanelOpen && selectedBannerId === banner.id);

                  // Badge Color mapping
                  let badgeClasses = 'bg-[#EBF3FE] text-[#026BFC]';
                  if (banner.bannerType === 'Offer') {
                    badgeClasses = 'bg-[#FFF1EE] text-[#EA580C]';
                  } else if (banner.bannerType === 'Subject') {
                    badgeClasses = 'bg-[#ECFDF5] text-[#059669]';
                  } else if (banner.bannerType === 'Brand') {
                    badgeClasses = 'bg-[#F5F3FF] text-[#7C3AED]';
                  } else if (banner.bannerType === 'PYQ') {
                    badgeClasses = 'bg-[#FFF1EE] text-[#E11D48]';
                  }

                  return (
                    <tr
                      key={banner.id}
                      onClick={() => {
                        setSelectedBannerId(banner.id);
                        setEditFormData({ ...banner });
                        if (!isPanelOpen) setIsPanelOpen(true);
                      }}
                      className={cn(
                        'group cursor-pointer transition-colors duration-150',
                        isSelected
                          ? 'bg-[#F4F8FF] border-l-4 border-l-[#026BFC]'
                          : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                      )}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          aria-label="Select row"
                          type="checkbox"
                          className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
                        />
                      </td>

                      {/* Order Number */}
                      <td className="py-3 px-2 text-slate-600 font-medium">{banner.order}</td>

                      {/* Banner Thumbnail */}
                      <td className="py-3 px-3">
                        <div className="w-[110px] h-[44px] rounded-lg overflow-hidden border border-slate-200/90 shadow-2xs relative shrink-0">
                          <BannerVisual banner={banner} />
                        </div>
                      </td>

                      {/* Title & Subtitle */}
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-[#026BFC] transition-colors leading-snug">
                          {banner.title}
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug mt-0.5 truncate max-w-[200px]">
                          {banner.subtitle}
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-3 px-2">
                        <span
                          className={cn(
                            'inline-block px-2 py-0.5 rounded text-[11px] font-medium leading-tight whitespace-nowrap',
                            badgeClasses
                          )}
                        >
                          {banner.bannerType}
                        </span>
                      </td>

                      {/* Link */}
                      <td className="py-3 px-3">
                        <span className="font-mono text-[11px] text-slate-600 hover:text-[#026BFC] transition-colors truncate block max-w-[140px]">
                          {banner.linkUrl}
                        </span>
                      </td>

                      {/* Devices */}
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-1.5 text-[#026BFC]">
                          {banner.devices.desktop && (
                            <span title="Desktop">
                              <Monitor className="w-3.5 h-3.5" />
                            </span>
                          )}
                          {banner.devices.mobile && (
                            <span title="Mobile">
                              <Smartphone className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Date Range (Stacked) */}
                      <td className="py-3 px-3">
                        {banner.hasDateRange ? (
                          <div className="text-[11px] text-slate-600 leading-tight">
                            <div>{banner.startDate}</div>
                            <div className="text-slate-500">{banner.endDate}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Status Badge (1-Click Toggle) */}
                      <td className="py-3 px-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => handleQuickToggleStatus(banner)}
                          title={`Click to ${banner.status === 'Active' ? 'disable' : 'enable'} banner`}
                          className="focus:outline-none transition-transform hover:scale-105 cursor-pointer"
                        >
                          {banner.status === 'Active' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#E6F8EE] text-[#15803D] hover:bg-[#d5f3e1] transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#15803D]" />
                              Active (ON)
                            </span>
                          ) : banner.status === 'Scheduled' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FEF3C7] text-[#D97706] hover:bg-[#fde68a] transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                              Scheduled
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                              Disabled (OFF)
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Order Index */}
                      <td className="py-3 px-2 text-center font-medium text-slate-600">
                        {banner.order}
                      </td>

                      {/* Actions (•••) */}
                      <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => {
                            setSelectedBannerId(banner.id);
                            setEditFormData({ ...banner });
                            setIsPanelOpen(true);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Edit Banner"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Pagination Footer */}
        <div className="py-3 px-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {totalItems === 0 ? 0 : startIndex + 1}–
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{totalItems}</span> banners
          </div>

          <div className="flex items-center gap-2">
            {/* Previous Button */}
            <button
              aria-label="Previous page"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            {getPageNumbers(currentPage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={cn(
                    'w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                    currentPage === item
                      ? 'bg-[#026BFC] text-white'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-50'
                  )}
                >
                  {item}
                </button>
              )
            )}

            {/* Next Button */}
            <button
              aria-label="Next page"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* Page Size Select */}
            <select
              aria-label="Rows per page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="ml-2 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
            >
              <option value={6}>6 / page</option>
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
