import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Check } from 'lucide-react';
import { CutoffHeader } from './cutoff/CutoffHeader';
import { CutoffStatCards } from './cutoff/CutoffStatCards';
import { CutoffFilterToolbar } from './cutoff/CutoffFilterToolbar';
import { CutoffTablePanel } from './cutoff/CutoffTablePanel';
import { CutoffAnalyticsPanel } from './cutoff/CutoffAnalyticsPanel';
import { CutoffFormModal } from './cutoff/CutoffFormModal';
import { CutoffDetailsModal } from './cutoff/CutoffDetailsModal';
import { CutoffDeleteModal } from './cutoff/CutoffDeleteModal';
import { CutoffViewAllModals } from './cutoff/CutoffViewAllModals';
import { useAdminCutoff } from './cutoff/useAdminCutoff';
export type { CutoffItem, RecentUpdateItem } from './cutoff/cutoffUtils';

export const AdminCutoff: React.FC = () => {
  const co = useAdminCutoff();
  const { pageLoading, toastMessage } = co;
  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <CutoffHeader co={co} />

      <CutoffStatCards co={co} />

      <CutoffFilterToolbar co={co} />

      {/* ==================================================================== */}
      {/* 4. SPLIT GRID LAYOUT (MAIN LEFT 8 COLS, RIGHT 4 COLS)                */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <CutoffTablePanel co={co} />

        <CutoffAnalyticsPanel co={co} />
      </div>

      <CutoffFormModal co={co} />

      <CutoffDetailsModal co={co} />

      <CutoffDeleteModal co={co} />

      <CutoffViewAllModals co={co} />
    </div>,
    { label: 'Loading cutoff…', variant: 'table' }
  );
};
