import { Check, X, Crown, Pencil, Sparkles, Clock, Zap, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { renderPlanIcon } from './planIcon';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface SubscriptionPlanCardsGridProps {
  plansState: AdminSubscriptionPlansState;
}

export function SubscriptionPlanCardsGrid({ plansState }: SubscriptionPlanCardsGridProps) {
  const {
    plans,
    handleOpenEditModal,
    showToast,
    setSelectedPlanForPurchase,
    planSubscriberCounts,
    freeStudentsCount,
  } = plansState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 4. THE SUBSCRIPTION PLAN CARDS (RESPONSIVE ADAPTIVE GRID)             */}
      {/* ==================================================================== */}
      <div
        className={cn(
          'grid gap-5 items-stretch',
          plans.length === 1
            ? 'max-w-md mx-auto grid-cols-1'
            : plans.length === 2
              ? 'max-w-4xl mx-auto grid-cols-1 md:grid-cols-2'
              : plans.length === 3
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        )}
      >
        {plans.map((plan) => {
          const isHeroPlan =
            Boolean(plan.badge?.toLowerCase().includes('best')) ||
            plan.id === 'pro_1_year' ||
            (plan.price > 0 && plan.durationDays >= 365);
          const isFreePlan = plan.price === 0 || plan.id === 'free' || plan.id === 'plan_free';
          const discountPct =
            plan.originalPrice > plan.price && plan.originalPrice > 0
              ? Math.round(((plan.originalPrice - plan.price) / plan.originalPrice) * 100)
              : 0;
          const monthlyEquivalent =
            plan.price > 0 && plan.durationDays > 0
              ? Math.max(1, Math.round(plan.price / Math.max(1, plan.durationDays / 30)))
              : 0;

          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl flex flex-col justify-between transition-all duration-200 overflow-hidden group',
                isHeroPlan
                  ? 'bg-gradient-to-b from-blue-50/50 via-white to-white dark:from-[#0E1B3E] dark:via-[#0A1024] dark:to-[#0A1024] border-2 border-[#026BFC] dark:border-blue-500 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20'
                  : 'bg-white dark:bg-[#0A1024] border border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md'
              )}
            >
              {/* Hero Ribbon or Colored Top Accent Bar */}
              {isHeroPlan ? (
                <div className="bg-gradient-to-r from-[#026BFC] via-blue-600 to-indigo-600 px-4 py-1.5 flex items-center justify-between text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                    {plan.badge || 'BEST VALUE • 1 YEAR ALL-ACCESS'}
                  </span>
                  <span className="text-[9.5px] font-bold bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded-full">
                    Flagship
                  </span>
                </div>
              ) : isFreePlan ? (
                <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-400 w-full" />
              ) : (
                <div className="h-1 bg-gradient-to-r from-amber-500 to-orange-400 w-full" />
              )}

              {/* Card Body */}
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                {/* Header Row: Icon, Status Badge & Quick Edit */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  {renderPlanIcon(plan.iconType, isHeroPlan)}

                  <div className="flex items-center gap-2">
                    {/* Badge Pill */}
                    {isFreePlan ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800">
                        Starter Tier
                      </span>
                    ) : isHeroPlan ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800">
                        All-Access Pass
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800">
                        {plan.badge || 'Popular'}
                      </span>
                    )}

                    {/* Quick Edit Icon Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditModal(plan);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 hover:text-[#026BFC] dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 transition-colors shadow-2xs cursor-pointer"
                      title={`Quick edit ${plan.name}`}
                      aria-label={`Edit ${plan.name}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Plan Title & Subtitle */}
                <div className="mb-4">
                  <h3 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                    {plan.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed line-clamp-2 min-h-[36px]">
                    {plan.subtitle}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-2">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      {isFreePlan
                        ? `${freeStudentsCount.toLocaleString('en-IN')} Enrolled Learners`
                        : `${(planSubscriberCounts[plan.id] ?? planSubscriberCounts[plan.name.toLowerCase()] ?? 0).toLocaleString('en-IN')} Active Subscribers`}
                    </span>
                  </div>
                </div>

                {/* High-Impact Price & Validity Container */}
                <div className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800/80 mb-5">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        ₹{plan.price}
                      </span>
                      {plan.originalPrice > plan.price && (
                        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 line-through">
                          ₹{plan.originalPrice}
                        </span>
                      )}
                    </div>

                    {discountPct > 0 && (
                      <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/25">
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  {/* Validity & Monthly Breakdown */}
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-800/60 font-medium">
                    <span className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{plan.durationDays} Days</span>
                    </span>

                    {monthlyEquivalent > 0 ? (
                      <span className="font-bold text-[#026BFC] dark:text-blue-400">
                        ≈ ₹{monthlyEquivalent}/month
                      </span>
                    ) : (
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        100% Free
                      </span>
                    )}
                  </div>

                  {/* Early Renewal Grace Window */}
                  {plan.renewalWindowDays && (
                    <div className="mt-2 pt-1.5 border-t border-slate-200/40 dark:border-slate-800/40 flex items-center gap-1 text-[10.5px] font-semibold text-blue-600 dark:text-blue-400">
                      <Zap className="w-3 h-3 text-blue-500 shrink-0" />
                      <span>Renewal window opens {plan.renewalWindowDays} days before expiry</span>
                    </div>
                  )}
                </div>

                {/* Features List */}
                <div className="space-y-2.5 mb-6 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Included Entitlements
                  </p>
                  <ul className="space-y-2 text-xs">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        {feat.included ? (
                          <div className="w-4 h-4 rounded-full bg-emerald-500/15 text-emerald-600 dark:bg-emerald-500/25 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500 flex items-center justify-center shrink-0 mt-0.5">
                            <X className="w-2.5 h-2.5 stroke-[2.5]" />
                          </div>
                        )}
                        <span
                          className={cn(
                            'leading-snug',
                            feat.included
                              ? 'text-slate-700 dark:text-slate-200 font-medium'
                              : 'text-slate-400 dark:text-slate-500 line-through'
                          )}
                        >
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Bottom Action Area: Single Clean Primary + Secondary */}
                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 mt-auto">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(plan)}
                    className={cn(
                      'w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-[0.99]',
                      isHeroPlan
                        ? 'bg-[#026BFC] hover:bg-blue-700 text-white shadow-md shadow-blue-500/25'
                        : 'bg-slate-900 hover:bg-[#026BFC] text-white dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-white'
                    )}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Edit Plan & Pricing</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (isFreePlan) {
                        showToast('Free plan is active by default for all registered students.');
                      } else {
                        setSelectedPlanForPurchase(plan);
                      }
                    }}
                    className={cn(
                      'w-full py-2 rounded-xl text-xs font-semibold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer',
                      isFreePlan
                        ? 'border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/40 cursor-default'
                        : 'border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-blue-50/70 dark:hover:bg-blue-950/30 hover:border-blue-300 dark:hover:border-blue-700 hover:text-[#026BFC] dark:hover:text-blue-400 bg-white dark:bg-slate-900/40'
                    )}
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-500" />
                    <span>{isFreePlan ? 'Default Active Tier' : 'Assign to Student'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
