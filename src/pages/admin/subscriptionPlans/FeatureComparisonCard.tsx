import { Check, X } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface FeatureComparisonCardProps {
  plansState: AdminSubscriptionPlansState;
}

export function FeatureComparisonCard({ plansState }: FeatureComparisonCardProps) {
  const { plans } = plansState;
  // Rows are the union of the features listed on the loaded plans, in first-seen order.
  const features: string[] = [];
  plans.forEach((plan) =>
    plan.features.forEach((f) => {
      if (f.text && !features.includes(f.text)) features.push(f.text);
    })
  );
  const includes = (planIndex: number, feature: string) =>
    plans[planIndex].features.some((f) => f.text === feature && f.included);

  return (
    <>
      {/* COL 1 (5 COLS): FEATURE COMPARISON TABLE */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Feature Comparison</h3>
          {plans.length === 0 || features.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-400">
              No plan features have been configured yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                    <th className="py-2.5 pr-2">Feature</th>
                    {plans.map((plan) => (
                      <th key={plan.id} className="py-2.5 px-2 text-center">
                        {plan.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/80">
                  {features.map((feature) => (
                    <tr key={feature} className="hover:bg-slate-50/60">
                      <td className="py-2.5 pr-2 font-medium text-slate-800">{feature}</td>
                      {plans.map((plan, idx) => (
                        <td key={plan.id} className="py-2.5 px-2 text-center">
                          {includes(idx, feature) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                          ) : (
                            <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
