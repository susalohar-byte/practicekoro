import { SlidersHorizontal, Trash2, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BannerVisual } from './BannerVisual';
import { BannerContentFields } from './BannerContentFields';
import { BannerPublishingFields } from './BannerPublishingFields';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerDetailsPanelProps {
  bn: AdminBannersState;
}

export function BannerDetailsPanel({ bn }: BannerDetailsPanelProps) {
  const {
    setSelectedBannerId,
    activeTab,
    setActiveTab,
    isPanelOpen,
    setIsPanelOpen,
    editFormData,
    setEditFormData,
    isUpdating,
    setIsDeleteDialogOpen,
    handleUpdateBanner,
  } = bn;
  return (
    <>
      {/* =============================================================== */}
      {/* RIGHT: BANNER DETAILS PANEL                                     */}
      {/* =============================================================== */}
      {isPanelOpen && editFormData && (
        <div className="w-full lg:w-[410px] shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-2xs p-5 transition-all">
          {/* Panel Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">Banner Details</h3>
            <button
              onClick={() => {
                setIsPanelOpen(false);
                setSelectedBannerId(null);
                setEditFormData(null);
              }}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 transition-colors"
              title="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Hero Banner Graphic Preview with PROPER BACKGROUND PLACEMENT */}
          <div className="w-full h-[145px] rounded-xl overflow-hidden border border-slate-200 shadow-2xs mb-4 relative">
            <BannerVisual banner={editFormData} isHero={true} />
          </div>

          {/* 3 Tabs: Details | Settings | Preview */}
          <div className="flex items-center gap-6 border-b border-slate-100 mb-4 text-xs font-semibold">
            <button
              onClick={() => setActiveTab('Details')}
              className={cn(
                'pb-2 transition-colors relative',
                activeTab === 'Details'
                  ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Details
            </button>
            <button
              onClick={() => setActiveTab('Settings')}
              className={cn(
                'pb-2 transition-colors relative',
                activeTab === 'Settings'
                  ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Settings
            </button>
            <button
              onClick={() => setActiveTab('Preview')}
              className={cn(
                'pb-2 transition-colors relative',
                activeTab === 'Preview'
                  ? 'text-[#026BFC] border-b-2 border-[#026BFC]'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              Preview
            </button>
          </div>

          {/* TAB 1: DETAILS */}
          {activeTab === 'Details' && (
            <div className="space-y-3.5 text-xs">
              <BannerContentFields bn={bn} editFormData={editFormData} />

              <BannerPublishingFields bn={bn} editFormData={editFormData} />
            </div>
          )}

          {/* TAB 2: SETTINGS */}
          {activeTab === 'Settings' && (
            <div className="space-y-4 text-xs py-2">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-slate-500 font-medium block">Lifetime Clicks</span>
                <span className="text-xl font-bold text-slate-900 mt-0.5 block">
                  {editFormData.clickCount.toLocaleString()} clicks
                </span>
                <span className="text-[11px] text-emerald-600 mt-1 block">
                  High engagement banner (Top 10%)
                </span>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Audience</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                  <option>All Students (Free & Pro)</option>
                  <option>Free Users Only</option>
                  <option>Pro Pass Subscribers Only</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Banner Placement</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800">
                  <option>Home Page Hero Carousel</option>
                  <option>Test Series Catalog Top</option>
                  <option>Subject Practice Top</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-slate-300 text-[#026BFC]"
                  />
                  <span>Auto-archive after end date</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PREVIEW */}
          {activeTab === 'Preview' && (
            <div className="space-y-4 text-xs py-2">
              <div>
                <span className="text-slate-500 font-medium block mb-2">
                  Live Student Home Preview:
                </span>
                <div className="rounded-xl overflow-hidden border border-slate-300 shadow-md h-[160px]">
                  <BannerVisual banner={editFormData} isHero={true} />
                </div>
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-lg">
                <p className="text-blue-800 text-[11px] leading-relaxed">
                  💡 Banners are displayed in the hero carousel at 16:9 on mobile and 24:9 on
                  desktop. The background image adapts with cover positioning for maximum visual
                  clarity.
                </p>
              </div>
            </div>
          )}

          {/* Bottom Action Buttons: Delete + Update */}
          <div className="flex items-center gap-2.5 pt-4 mt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50/60 hover:bg-rose-100 text-rose-600 border border-rose-200 text-xs font-semibold rounded-lg transition-colors shrink-0"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Delete Banner</span>
            </button>

            <button
              type="button"
              onClick={handleUpdateBanner}
              disabled={isUpdating}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors disabled:opacity-60"
            >
              {isUpdating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
              ) : (
                <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
              )}
              <span>Update Banner</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
