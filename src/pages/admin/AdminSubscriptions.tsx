import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { XCircle, Check } from 'lucide-react';
import { useAdminSubscriptions } from './subscriptions/useAdminSubscriptions';
import { SubscriptionsPageHeader } from './subscriptions/SubscriptionsPageHeader';
import { SubscriptionKpiCards } from './subscriptions/SubscriptionKpiCards';
import { SubscriptionFilterToolbar } from './subscriptions/SubscriptionFilterToolbar';
import { SubscriptionsTableCard } from './subscriptions/SubscriptionsTableCard';
import { SubscriptionDetailsPanel } from './subscriptions/SubscriptionDetailsPanel';
import { CreateSubscriptionModal } from './subscriptions/CreateSubscriptionModal';
import { ExtendSubscriptionModal } from './subscriptions/ExtendSubscriptionModal';
import { ChangePlanModal } from './subscriptions/ChangePlanModal';
import { SendReminderModal } from './subscriptions/SendReminderModal';
export type { SubscriptionRecord } from './subscriptions/subscriptionTypes';
export { mapAdminSubscriptionRow } from './subscriptions/subscriptionMapping';
export { INITIAL_SUBSCRIPTIONS } from './subscriptions/subscriptionSampleData';

// ============================================================================
// MAIN COMPONENT: ADMIN SUBSCRIPTIONS
// ============================================================================

export const AdminSubscriptions: React.FC = () => {
  const subscriptionsState = useAdminSubscriptions();
  const { recordsLoading, recordsError, toastMessage, toastType } = subscriptionsState;

  return withAdminSkeleton(
    recordsLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {recordsError && (
        <div role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {recordsError}
        </div>
      )}
      {recordsLoading && (
        <div role="status" className="text-sm text-slate-500">
          Loading all records…
        </div>
      )}
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastType === 'error' ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastType === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      <SubscriptionsPageHeader subscriptionsState={subscriptionsState} />

      <SubscriptionKpiCards subscriptionsState={subscriptionsState} />

      <SubscriptionFilterToolbar subscriptionsState={subscriptionsState} />

      {/* ==================================================================== */}
      {/* 4. SPLIT GRID (TABLE 8 COLS, DETAILS PANEL 4 COLS)                  */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <SubscriptionsTableCard subscriptionsState={subscriptionsState} />

        <SubscriptionDetailsPanel subscriptionsState={subscriptionsState} />
      </div>

      <CreateSubscriptionModal subscriptionsState={subscriptionsState} />

      <ExtendSubscriptionModal subscriptionsState={subscriptionsState} />

      <ChangePlanModal subscriptionsState={subscriptionsState} />

      <SendReminderModal subscriptionsState={subscriptionsState} />
    </div>,
    { label: 'Loading subscriptions…', variant: 'table' }
  );
};
