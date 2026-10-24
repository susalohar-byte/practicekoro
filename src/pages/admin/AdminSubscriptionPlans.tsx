import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Check } from 'lucide-react';
import { useAdminSubscriptionPlans } from './subscriptionPlans/useAdminSubscriptionPlans';
import { SubscriptionPlansPageHeader } from './subscriptionPlans/SubscriptionPlansPageHeader';
import { SubscriptionKpiCards } from './subscriptionPlans/SubscriptionKpiCards';
import { AvailablePlansHeader } from './subscriptionPlans/AvailablePlansHeader';
import { SubscriptionPlanCardsGrid } from './subscriptionPlans/SubscriptionPlanCardsGrid';
import { FeatureComparisonCard } from './subscriptionPlans/FeatureComparisonCard';
import { PlanHighlightsCard } from './subscriptionPlans/PlanHighlightsCard';
import { RecentSubscriptionsCard } from './subscriptionPlans/RecentSubscriptionsCard';
import { AddPlanModal } from './subscriptionPlans/AddPlanModal';
import { EditPlanModal } from './subscriptionPlans/EditPlanModal';
import { ActiveSubscriptionsModal } from './subscriptionPlans/ActiveSubscriptionsModal';
import { RecentSubscriptionsModal } from './subscriptionPlans/RecentSubscriptionsModal';
import { PlanPurchaseModal } from './subscriptionPlans/PlanPurchaseModal';
export type {
  PlanFeature,
  SubscriptionPlanItem,
  RecentSubscriptionItem,
} from './subscriptionPlans/subscriptionPlanTypes';

// ============================================================================
// MAIN COMPONENT: ADMIN SUBSCRIPTION PLANS
// ============================================================================

export const AdminSubscriptionPlans: React.FC = () => {
  const plansState = useAdminSubscriptionPlans();
  const { pageLoading, toastMessage } = plansState;

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

      <SubscriptionPlansPageHeader plansState={plansState} />

      <SubscriptionKpiCards />

      <AvailablePlansHeader plansState={plansState} />

      <SubscriptionPlanCardsGrid plansState={plansState} />

      {/* ==================================================================== */}
      {/* 5. BOTTOM SECTION: 3 COLUMNS LAYOUT                                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <FeatureComparisonCard />

        <PlanHighlightsCard />

        <RecentSubscriptionsCard plansState={plansState} />
      </div>

      <AddPlanModal plansState={plansState} />

      <EditPlanModal plansState={plansState} />

      <ActiveSubscriptionsModal plansState={plansState} />

      <RecentSubscriptionsModal plansState={plansState} />

      <PlanPurchaseModal plansState={plansState} />
    </div>,
    { label: 'Loading subscription plans…', variant: 'cards' }
  );
};
