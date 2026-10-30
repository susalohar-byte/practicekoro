import { Calendar } from 'lucide-react';
import {
  AdminBannerItem,
  BannerType,
  BannerStatus,
  OpenInTarget,
  isoToDateInput,
  dateInputToIso,
} from './bannersUtils';
import type { AdminBannersState } from './useAdminBanners';

export interface BannerPublishingFieldsProps {
  bn: AdminBannersState;
  /** The open banner's form data (the panel only renders while it is set). */
  editFormData: AdminBannerItem;
}

export function BannerPublishingFields({ bn, editFormData }: BannerPublishingFieldsProps) {
  const { setEditFormData } = bn;
  return (
    <>
      {/* Type */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Type</label>
        <select
          aria-label="Type"
          value={editFormData.bannerType}
          onChange={(e) =>
            setEditFormData((prev) =>
              prev
                ? {
                    ...prev,
                    bannerType: e.target.value as BannerType,
                  }
                : null
            )
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-[#026BFC]"
        >
          <option value="Test Series">Test Series</option>
          <option value="Offer">Offer</option>
          <option value="Subject">Subject</option>
          <option value="Brand">Brand</option>
          <option value="PYQ">PYQ</option>
        </select>
      </div>

      {/* Link URL */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Link URL</label>
        <input
          aria-label="Link URL"
          type="text"
          value={editFormData.linkUrl}
          onChange={(e) =>
            setEditFormData((prev) => (prev ? { ...prev, linkUrl: e.target.value } : null))
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 font-mono focus:outline-none focus:border-[#026BFC] transition-colors"
        />
      </div>

      {/* Open In */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Open In</label>
        <select
          aria-label="Open In"
          value={editFormData.openIn}
          onChange={(e) =>
            setEditFormData((prev) =>
              prev
                ? {
                    ...prev,
                    openIn: e.target.value as OpenInTarget,
                  }
                : null
            )
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-[#026BFC]"
        >
          <option value="Same Tab">Same Tab</option>
          <option value="New Tab">New Tab</option>
        </select>
      </div>

      {/* Devices Checkboxes */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Devices</label>
        <div className="flex items-center gap-5 py-1">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={editFormData.devices.desktop}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev
                    ? {
                        ...prev,
                        devices: { ...prev.devices, desktop: e.target.checked },
                      }
                    : null
                )
              }
              className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
            />
            <span>Desktop</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
            <input
              type="checkbox"
              checked={editFormData.devices.mobile}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev
                    ? {
                        ...prev,
                        devices: { ...prev.devices, mobile: e.target.checked },
                      }
                    : null
                )
              }
              className="rounded border-slate-300 text-[#026BFC] focus:ring-0"
            />
            <span>Mobile</span>
          </label>
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Status</label>
        <select
          aria-label="Status"
          value={editFormData.status}
          onChange={(e) =>
            setEditFormData((prev) =>
              prev
                ? {
                    ...prev,
                    status: e.target.value as BannerStatus,
                  }
                : null
            )
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 cursor-pointer focus:outline-none focus:border-[#026BFC]"
        >
          <option value="Active">Active</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Archived">Archived</option>
          <option value="Draft">Draft</option>
        </select>
      </div>

      {/* Display Order */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Display Order</label>
        <input
          aria-label="Display Order"
          type="number"
          value={editFormData.order}
          onChange={(e) =>
            setEditFormData((prev) =>
              prev
                ? {
                    ...prev,
                    order: Number(e.target.value) || 1,
                  }
                : null
            )
          }
          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-[#026BFC] transition-colors"
        />
      </div>

      {/* Schedule (Optional) */}
      <div>
        <label className="block text-slate-600 font-medium mb-1">Schedule (Optional)</label>
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
              type="date"
              aria-label="Schedule start date"
              value={isoToDateInput(editFormData.startsAt)}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev
                    ? {
                        ...prev,
                        startsAt: dateInputToIso(e.target.value, 'start'),
                      }
                    : null
                )
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-[#026BFC]"
            />
          </div>
          <span className="text-slate-400 font-medium">➔</span>
          <div className="flex-1 relative">
            <input
              type="date"
              aria-label="Schedule end date"
              value={isoToDateInput(editFormData.expiresAt)}
              onChange={(e) =>
                setEditFormData((prev) =>
                  prev
                    ? {
                        ...prev,
                        expiresAt: dateInputToIso(e.target.value, 'end'),
                      }
                    : null
                )
              }
              className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:border-[#026BFC]"
            />
          </div>
          <div className="p-1.5 text-slate-400">
            <Calendar className="w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
    </>
  );
}
