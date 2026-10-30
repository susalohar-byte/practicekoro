import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BannerVisual } from './BannerVisual';
import type { AdminBannerItem } from './bannersUtils';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerContentFieldsProps {
  bn: AdminBannersState;
  /** The open banner's form data (the panel only renders while it is set). */
  editFormData: AdminBannerItem;
}

export function BannerContentFields({ bn, editFormData }: BannerContentFieldsProps) {
  const {
    setEditFormData,
    fileUploadInputRef,
    dragActiveEditBanner,
    setDragActiveEditBanner,
    handleBannerImageUpload,
  } = bn;
  return (
    <>
      {/* Homepage Visibility Status Card */}
      <div className="p-3 bg-blue-50/50 border border-blue-200/70 rounded-xl flex items-center justify-between">
        <div>
          <span className="text-xs font-semibold text-slate-900 block">Homepage Banner Status</span>
          <span className="text-[11px] text-slate-500">
            {editFormData.status === 'Active'
              ? 'Published & visible on student home'
              : 'Disabled / Hidden from student home'}
          </span>
        </div>
        <button
          type="button"
          onClick={() =>
            setEditFormData((prev) =>
              prev
                ? {
                    ...prev,
                    status: prev.status === 'Active' ? 'Draft' : 'Active',
                  }
                : null
            )
          }
          className={cn(
            'px-3 py-1 text-xs font-semibold rounded-full transition-colors cursor-pointer',
            editFormData.status === 'Active'
              ? 'bg-[#15803D] text-white hover:bg-[#166534]'
              : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
          )}
        >
          {editFormData.status === 'Active' ? 'Enabled (ON)' : 'Disabled (OFF)'}
        </button>
      </div>

      {/* Title */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Title</label>
        <input
          aria-label="Title"
          type="text"
          value={editFormData.title}
          onChange={(e) =>
            setEditFormData((prev) => (prev ? { ...prev, title: e.target.value } : null))
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC] transition-colors"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Description</label>
        <input
          aria-label="Description"
          type="text"
          value={editFormData.description}
          onChange={(e) =>
            setEditFormData((prev) =>
              prev
                ? {
                    ...prev,
                    description: e.target.value,
                    subtitle: e.target.value,
                  }
                : null
            )
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC] transition-colors"
        />
      </div>

      {/* Banner Image Row */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Banner Image</label>
        <div
          onDragEnter={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActiveEditBanner(true);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActiveEditBanner(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActiveEditBanner(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActiveEditBanner(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleBannerImageUpload(file);
          }}
          className={cn(
            'flex items-center justify-between p-2 rounded-lg transition-all border-2',
            dragActiveEditBanner
              ? 'border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
              : 'border-slate-200 bg-slate-50/70'
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-10 h-7 rounded overflow-hidden border border-slate-200 bg-slate-900 shrink-0">
              <BannerVisual banner={editFormData} />
            </div>
            <span className="font-mono text-slate-700 text-[11px] truncate max-w-[170px]">
              {editFormData.fileName}
            </span>
          </div>

          <button
            type="button"
            onClick={() => fileUploadInputRef.current?.click()}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-[#026BFC] bg-white border border-blue-200 hover:bg-blue-50/60 rounded transition-colors shrink-0"
          >
            <Upload className="w-3 h-3 text-[#026BFC]" />
            <span>Replace</span>
          </button>
        </div>
      </div>

      {/* Optional Text Overlay Switch */}
      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
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
            checked={Boolean(editFormData.showTextOverlay)}
            onChange={(e) =>
              setEditFormData((prev) =>
                prev ? { ...prev, showTextOverlay: e.target.checked } : null
              )
            }
            className="w-4 h-4 rounded border-slate-300 text-[#026BFC] focus:ring-0 cursor-pointer"
          />
        </div>

        {editFormData.showTextOverlay && (
          <div className="pt-2.5 border-t border-slate-200 space-y-2">
            <div>
              <label className="block text-slate-600 font-medium text-[11px] mb-1">
                Badge Text (Optional)
              </label>
              <input
                aria-label="Badge Text (Optional)"
                type="text"
                value={editFormData.badgeText || ''}
                placeholder="e.g. SPECIAL OFFER"
                onChange={(e) =>
                  setEditFormData((prev) => (prev ? { ...prev, badgeText: e.target.value } : null))
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-medium text-[11px] mb-1">
                CTA Button Text (Optional)
              </label>
              <input
                aria-label="CTA Button Text (Optional)"
                type="text"
                value={editFormData.ctaText || ''}
                placeholder="e.g. Start Practicing"
                onChange={(e) =>
                  setEditFormData((prev) => (prev ? { ...prev, ctaText: e.target.value } : null))
                }
                className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-md text-xs text-slate-800"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );
}
