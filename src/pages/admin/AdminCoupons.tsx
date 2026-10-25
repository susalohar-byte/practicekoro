import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Check } from 'lucide-react';
import { CouponsHeader } from './coupons/CouponsHeader';
import { CouponStatCards } from './coupons/CouponStatCards';
import { CouponFilterToolbar } from './coupons/CouponFilterToolbar';
import { CouponTablePanel } from './coupons/CouponTablePanel';
import { CouponFormPanel } from './coupons/CouponFormPanel';
import { useAdminCoupons } from './coupons/useAdminCoupons';
export type { CouponRowItem } from './coupons/couponsUtils';

export const AdminCoupons: React.FC = () => {
  const cp = useAdminCoupons();
  const { pageLoading, recordsError, loadCoupons, toastMessage } = cp;
  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {recordsError && (
        <div role="alert" className="p-3 text-sm text-red-700">
          Coupons unavailable: {recordsError}{' '}
          <button onClick={() => void loadCoupons()} className="underline">
            Retry
          </button>
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <CouponsHeader cp={cp} />

      <CouponStatCards cp={cp} />

      <CouponFilterToolbar cp={cp} />

      {/* ==================================================================== */}
      {/* 4. SPLIT GRID (TABLE 8 COLS, CREATE FORM 4 COLS)                    */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <CouponTablePanel cp={cp} />

        <CouponFormPanel cp={cp} />
      </div>
    </div>,
    { label: 'Loading coupons…', variant: 'table' }
  );
};
