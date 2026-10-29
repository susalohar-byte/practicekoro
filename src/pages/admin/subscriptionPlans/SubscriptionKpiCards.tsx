import { Users, CreditCard, Gift, IndianRupee } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface SubscriptionKpiCardsProps {
  plansState?: AdminSubscriptionPlansState;
}

export function SubscriptionKpiCards({ plansState }: SubscriptionKpiCardsProps) {
  const totalSubscribers = plansState?.totalSubscribersCount ?? 0;
  const monthlyRev = plansState?.monthlyRevenue ?? 0;
  const activeSubs = plansState?.activeSubscriptionsCount ?? 0;
  const convertedSubs = plansState?.convertedThisMonthCount ?? 0;
  const freeStudents = plansState?.freeStudentsCount ?? 0;

  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS (LIVE BACKEND DATA)                   */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Subscribers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#DCFCE7] dark:bg-emerald-950/60 text-[#16A34A] dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Total Subscribers
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {totalSubscribers.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded">
                Live DB
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              {totalSubscribers > 0 ? 'Registered paid learners' : 'Awaiting subscribers'}
            </span>
          </div>
        </div>

        {/* Card 2: Monthly Revenue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] dark:bg-purple-950/60 text-[#7C3AED] dark:text-purple-400 flex items-center justify-center font-bold text-xl shrink-0">
            <IndianRupee className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Monthly Revenue
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                ₹{monthlyRev.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/70 px-1.5 py-0.5 rounded">
                This Month
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              Recorded subscription volume
            </span>
          </div>
        </div>

        {/* Card 3: Active Subscriptions */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#E0F2FE] dark:bg-sky-950/60 text-[#0284C7] dark:text-sky-400 flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Active Subscriptions
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {activeSubs.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.5 rounded">
                Active Now
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              {activeSubs > 0 ? 'Currently valid passes' : 'No active passes'}
            </span>
          </div>
        </div>

        {/* Card 4: Converted from Free */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
          <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] dark:bg-amber-950/60 text-[#D97706] dark:text-amber-400 flex items-center justify-center shrink-0">
            <Gift className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Converted to Paid
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">
                {convertedSubs.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/70 px-1.5 py-0.5 rounded">
                Paid
              </span>
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5 truncate">
              {freeStudents.toLocaleString('en-IN')} on Free tier
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
