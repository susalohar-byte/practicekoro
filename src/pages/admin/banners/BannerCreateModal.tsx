import { Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BannerType, BannerStatus, isoToDateInput, dateInputToIso } from './bannersUtils';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerCreateModalProps {
  bn: AdminBannersState;
}

export function BannerCreateModal({ bn }: BannerCreateModalProps) {
  const {
    dragActiveNewBanner,
    setDragActiveNewBanner,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    newBannerData,
    setNewBannerData,
    handleProcessNewBannerFile,
    handleCreateBannerSubmit,
  } = bn;
  return (
    <>
      {/* =================================================================== */}
      {/* MODAL 2: CREATE BANNER MODAL                                        */}
      {/* =================================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-[#026BFC]" />
                  <span>Create New Banner</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Fill in the details to publish a new promotional banner.
                </p>
              </div>
              <button
                aria-label="Close"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form
              onSubmit={handleCreateBannerSubmit}
              className="p-6 overflow-y-auto space-y-3.5 text-xs flex-1"
            >
              <div>
                <label className="block text-slate-600 font-medium mb-1">Banner Title *</label>
                <input
                  aria-label="Banner Title"
                  type="text"
                  required
                  placeholder="e.g. WBP Constable Special Mock Series"
                  value={newBannerData.title}
                  onChange={(e) => setNewBannerData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">
                  Description / Subtitle
                </label>
                <input
                  aria-label="Description / Subtitle"
                  type="text"
                  placeholder="e.g. 50+ Full Mock Tests with Instant Rank"
                  value={newBannerData.subtitle}
                  onChange={(e) =>
                    setNewBannerData((prev) => ({
                      ...prev,
                      subtitle: e.target.value,
                      description: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Type</label>
                  <select
                    aria-label="Type"
                    value={newBannerData.bannerType}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        bannerType: e.target.value as BannerType,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Test Series">Test Series</option>
                    <option value="Offer">Offer</option>
                    <option value="Subject">Subject</option>
                    <option value="Brand">Brand</option>
                    <option value="PYQ">PYQ</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">Status</label>
                  <select
                    aria-label="Status"
                    value={newBannerData.status}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        status: e.target.value as BannerStatus,
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Active">Active</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Image Upload Row */}
              <div>
                <label className="block text-slate-600 font-medium mb-1">Banner Image</label>
                <div
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActiveNewBanner(true);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActiveNewBanner(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActiveNewBanner(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActiveNewBanner(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleProcessNewBannerFile(file);
                  }}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg transition-all border-2',
                    dragActiveNewBanner
                      ? 'border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
                      : 'border-slate-200 bg-slate-50'
                  )}
                >
                  <div className="w-12 h-8 rounded overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <img
                      src={newBannerData.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/exam_hero_banner.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProcessNewBannerFile(file);
                      }}
                      className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded file:border file:border-blue-200 file:text-xs file:font-medium file:bg-white file:text-[#026BFC] hover:file:bg-blue-50 cursor-pointer"
                    />
                    {dragActiveNewBanner && (
                      <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
                        Drop image to set banner
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional Text Overlay Switch */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-900 block">
                      Optional Text Overlay
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Disabled by default. Displays clean banner artwork without text overlays.
                    </p>
                  </div>
                  <input
                    aria-label="Optional Text Overlay"
                    type="checkbox"
                    checked={Boolean(newBannerData.showTextOverlay)}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        showTextOverlay: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#026BFC] focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-medium mb-1">Target Link URL</label>
                <input
                  aria-label="Target Link URL"
                  type="text"
                  placeholder="/test-series/wbp"
                  value={newBannerData.linkUrl}
                  onChange={(e) =>
                    setNewBannerData((prev) => ({ ...prev, linkUrl: e.target.value }))
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    aria-label="Start Date"
                    value={isoToDateInput(newBannerData.startsAt)}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        startsAt: dateInputToIso(e.target.value, 'start'),
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    aria-label="End Date"
                    value={isoToDateInput(newBannerData.expiresAt)}
                    onChange={(e) =>
                      setNewBannerData((prev) => ({
                        ...prev,
                        expiresAt: dateInputToIso(e.target.value, 'end'),
                      }))
                    }
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2 text-xs font-semibold text-white bg-[#026BFC] hover:bg-blue-600 rounded-lg shadow-sm disabled:opacity-60"
                >
                  {isCreating ? 'Creating...' : 'Create Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
