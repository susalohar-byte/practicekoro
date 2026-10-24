import { Plus } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface SubscriptionPlansPageHeaderProps {
  plansState: AdminSubscriptionPlansState;
}

export function SubscriptionPlansPageHeader({ plansState }: SubscriptionPlansPageHeaderProps) {
  const {
    setIsViewActiveModalOpen,
    setFormPlanName,
    setFormPlanSubtitle,
    setFormPlanPrice,
    setFormPlanOriginalPrice,
    setFormPlanDurationDays,
    setFormPlanRenewalWindow,
    setFormPlanBadge,
    setFormPlanFeatures,
    setIsAddPlanModalOpen,
  } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. HEADER & TOP ACTIONS                                              */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage subscription plans for PracticeKoro. Create, edit and control features for each
            plan.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            onClick={() => setIsViewActiveModalOpen(true)}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            View Active Subscriptions
          </button>
          <button
            onClick={() => {
              setFormPlanName('');
              setFormPlanSubtitle('');
              setFormPlanPrice('149');
              setFormPlanOriginalPrice('299');
              setFormPlanDurationDays('180');
              setFormPlanRenewalWindow('');
              setFormPlanBadge('');
              setFormPlanFeatures('');
              setIsAddPlanModalOpen(true);
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plan</span>
          </button>
        </div>
      </div>
    </>
  );
}
