import { Check, X } from 'lucide-react';
import { COMPARISON_ROWS } from './subscriptionPlanData';

export function FeatureComparisonCard() {
  return (
    <>
      {/* COL 1 (5 COLS): FEATURE COMPARISON TABLE */}
      <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 mb-3">Feature Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400">
                  <th className="py-2.5 pr-2">Feature</th>
                  <th className="py-2.5 px-2 text-center">Free</th>
                  <th className="py-2.5 px-2 text-center">Basic</th>
                  <th className="py-2.5 px-2 text-center">Pro</th>
                  <th className="py-2.5 pl-2 text-center">Ultimate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/80">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/60">
                    <td className="py-2.5 pr-2 font-medium text-slate-800">{row.feature}</td>

                    {/* Free */}
                    <td className="py-2.5 px-2 text-center text-slate-500">
                      {typeof row.free === 'boolean' ? (
                        row.free ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                        )
                      ) : (
                        row.free
                      )}
                    </td>

                    {/* Basic */}
                    <td className="py-2.5 px-2 text-center text-slate-600">
                      {typeof row.basic === 'boolean' ? (
                        row.basic ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                        )
                      ) : (
                        row.basic
                      )}
                    </td>

                    {/* Pro */}
                    <td className="py-2.5 px-2 text-center text-slate-600">
                      {typeof row.pro === 'boolean' ? (
                        row.pro ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                        )
                      ) : (
                        row.pro
                      )}
                    </td>

                    {/* Ultimate */}
                    <td className="py-2.5 pl-2 text-center font-medium text-slate-800">
                      {typeof row.ultimate === 'boolean' ? (
                        row.ultimate ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-rose-500 mx-auto" />
                        )
                      ) : (
                        row.ultimate
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
