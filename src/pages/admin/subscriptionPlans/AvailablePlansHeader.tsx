import { Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface AvailablePlansHeaderProps {
  plansState: AdminSubscriptionPlansState;
}

export function AvailablePlansHeader({ plansState }: AvailablePlansHeaderProps) {
  const { plans, billingCycle, setBillingCycle, showToast, setIsAddPlanModalOpen } = plansState;
  // Largest real discount (original vs current price) across the loaded plans; 0 hides the pill.
  const maxSavingPct = plans.reduce((max, plan) => {
    if (!(plan.originalPrice > plan.price && plan.originalPrice > 0)) return max;
    return Math.max(
      max,
      Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
    );
  }, 0);
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. AVAILABLE PLANS SECTION HEADER & BILLING TOGGLE                   */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Available Plans
            </h2>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#026BFC] dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80">
              {plans.length} Active {plans.length === 1 ? 'Tier' : 'Tiers'}
            </span>
          </div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
            Public student subscription tiers, pricing intervals, renewal windows, and feature
            access.
          </p>
        </div>

        {/* Action Controls & Billing Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl flex items-center border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => {
                setBillingCycle('monthly');
                showToast('Displaying monthly equivalent breakdown.');
              }}
              className={cn(
                'px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                billingCycle === 'monthly'
                  ? 'bg-[#026BFC] text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => {
                setBillingCycle('yearly');
                showToast('Displaying yearly pricing.');
              }}
              className={cn(
                'px-3.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                billingCycle === 'yearly'
                  ? 'bg-[#026BFC] text-white shadow-2xs font-bold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              Yearly
            </button>
          </div>

          {maxSavingPct > 0 && (
            <span className="text-[11px] font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300/60 dark:border-emerald-800 px-2.5 py-1 rounded-xl shadow-2xs flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Save up to {maxSavingPct}%</span>
            </span>
          )}

          <button
            onClick={() => setIsAddPlanModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-[#026BFC] dark:hover:bg-blue-50 text-xs font-bold transition-all shadow-xs cursor-pointer ml-1"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>New Plan</span>
          </button>
        </div>
      </div>
    </>
  );
}
