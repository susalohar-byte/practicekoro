import { Download, Plus } from 'lucide-react';
import type { AdminSubscriptionsState } from './useAdminSubscriptions';

export interface SubscriptionsPageHeaderProps {
  subscriptionsState: AdminSubscriptionsState;
}

export function SubscriptionsPageHeader({ subscriptionsState }: SubscriptionsPageHeaderProps) {
  const {
    recordsLoading,
    recordsError,
    setIsCreateModalOpen,
    availablePlans,
    setFormStudentName,
    setFormStudentEmail,
    setFormSelectedPlanId,
    handleExport,
  } = subscriptionsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage student subscriptions, view plans, payments and access details.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            disabled={recordsLoading || !!recordsError}
            onClick={handleExport}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setFormStudentName('');
              setFormStudentEmail('');
              setFormSelectedPlanId(availablePlans[0]?.id || '');
              setIsCreateModalOpen(true);
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        </div>
      </div>
    </>
  );
}
