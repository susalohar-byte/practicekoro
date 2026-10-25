import { Plus, ArrowUpDown } from 'lucide-react';
import type { AdminBannersState } from './useAdminBanners';

export interface BannersHeaderProps {
  bn: AdminBannersState;
}

export function BannersHeader({ bn }: BannersHeaderProps) {
  const { setIsCreateModalOpen, handleOpenOrderModal } = bn;
  return (
    <>
      {/* ================================================================= */}
      {/* 1. PAGE HEADER                                                    */}
      {/* ================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Banners</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create and manage website and app banners. Use banners to promote test series, offers,
            announcements and more.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Banner Order Button */}
          <button
            onClick={handleOpenOrderModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-2xs transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-[#026BFC]" />
            <span>Banner Order</span>
          </button>

          {/* Create Banner Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>Create Banner</span>
          </button>
        </div>
      </div>
    </>
  );
}
