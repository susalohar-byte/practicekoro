import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BannersHeader } from './banners/BannersHeader';
import { BannerStatCards } from './banners/BannerStatCards';
import { BannerFilterToolbar } from './banners/BannerFilterToolbar';
import { BannerTablePanel } from './banners/BannerTablePanel';
import { BannerDetailsPanel } from './banners/BannerDetailsPanel';
import { BannerOrderModal } from './banners/BannerOrderModal';
import { BannerCreateModal } from './banners/BannerCreateModal';
import { BannerDeleteModal } from './banners/BannerDeleteModal';
import { useAdminBanners } from './banners/useAdminBanners';
export type {
  BannerType,
  BannerStatus,
  OpenInTarget,
  AdminBannerItem,
} from './banners/bannersUtils';
export {
  isoToDateInput,
  dateInputToIso,
  deriveBannerStatus,
  bannerStatusToRecord,
} from './banners/bannersUtils';
export { BannerVisual } from './banners/BannerVisual';

export const AdminBanners: React.FC = () => {
  const bn = useAdminBanners();
  const { loading, toastMessage, setToastMessage, fileUploadInputRef, handleImageFileChange } = bn;
  return withAdminSkeleton(
    loading,
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 pb-16 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in slide-in-from-bottom-5',
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          )}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="ml-2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden File Input for Image Replacement */}
      <input
        ref={fileUploadInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />

      {/* PAGE CONTAINER */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6">
        <BannersHeader bn={bn} />

        <BannerStatCards bn={bn} />

        <BannerFilterToolbar bn={bn} />

        {/* ================================================================= */}
        {/* 4. MAIN CONTENT AREA: TABLE (LEFT) + BANNER DETAILS (RIGHT)       */}
        {/* ================================================================= */}
        <div className="flex flex-col lg:flex-row gap-5 items-start">
          <BannerTablePanel bn={bn} />

          <BannerDetailsPanel bn={bn} />
        </div>
      </div>

      <BannerOrderModal bn={bn} />

      <BannerCreateModal bn={bn} />

      <BannerDeleteModal bn={bn} />
    </div>,
    { label: 'Loading banners…', variant: 'table' }
  );
};
export default AdminBanners;
