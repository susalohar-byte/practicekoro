import { CreditCard } from 'lucide-react';
import type { AdminPaymentsState } from './useAdminPayments';

export interface PaymentsGatewaysCardProps {
  pay: AdminPaymentsState;
}

export function PaymentsGatewaysCard({ pay }: PaymentsGatewaysCardProps) {
  const { totalRevenue, successfulPayments, methodsList, topMethod } = pay;
  return (
    <>
      {/* Right: Payment Gateways Card */}
      <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-3.5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-100 dark:border-cyan-900/50 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shadow-2xs">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Payment Gateways
              </h2>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                Channel share & volume breakdown
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Quick Summary Banner */}
        <div className="grid grid-cols-2 gap-2.5 p-2.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/80">
          <div className="space-y-0.5 min-w-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Primary Channel
            </span>
            <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate flex items-center gap-1.5">
              {topMethod && topMethod.sum > 0 ? (
                <>
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: topMethod.color }}
                  />
                  <span className="truncate">{topMethod.name}</span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                    ({topMethod.pct}%)
                  </span>
                </>
              ) : (
                <span className="text-slate-400 font-normal">No volume</span>
              )}
            </div>
          </div>
          <div className="space-y-0.5 text-right">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Total Retained
            </span>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
              ₹{totalRevenue.toLocaleString('en-IN')}
            </div>
          </div>
        </div>

        {/* Center: Donut Chart with Track Ring & Typography */}
        <div className="relative flex items-center justify-center py-1">
          <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              {/* Background Track Circle */}
              <circle
                cx="50"
                cy="50"
                r="38"
                fill="none"
                stroke="currentColor"
                strokeWidth="14"
                className="text-slate-100 dark:text-slate-800/80"
              />
              {(() => {
                let offset = 0;
                const circumference = 2 * Math.PI * 38;
                return methodsList.map((method) => {
                  const length = totalRevenue > 0 ? (method.sum / totalRevenue) * circumference : 0;
                  const previousOffset = offset;
                  offset += length;
                  if (length <= 0) return null;
                  return (
                    <circle
                      key={method.id}
                      cx="50"
                      cy="50"
                      r="38"
                      fill="none"
                      stroke={method.color}
                      strokeWidth="14"
                      strokeDasharray={`${length} ${circumference - length}`}
                      strokeDashoffset={-previousOffset}
                      className="transition-all duration-500"
                    />
                  );
                });
              })()}
            </svg>
            {/* Donut Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-2">
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Volume
              </span>
              <span className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none mt-0.5">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                {successfulPayments} {successfulPayments === 1 ? 'paid txn' : 'paid txns'}
              </span>
            </div>
          </div>
        </div>

        {/* Methods Breakdown Progress Cards */}
        <div className="space-y-1.5 pt-1">
          {methodsList.map((method) => {
            const isPrimary = topMethod?.id === method.id && method.sum > 0;
            return (
              <div
                key={method.id}
                className="group p-2 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100/80 dark:border-slate-800/80 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 transition-colors"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-2xs"
                      style={{ backgroundColor: method.color }}
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {method.name}
                    </span>
                    {isPrimary && (
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-100 dark:bg-cyan-950/70 text-cyan-700 dark:text-cyan-300">
                        Primary
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                      ₹{method.sum.toLocaleString('en-IN')}
                      {method.count > 0 && ` (${method.count})`}
                    </span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 w-8 text-right">
                      {method.pct}%
                    </span>
                  </div>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full h-1.5 rounded-full bg-slate-200/70 dark:bg-slate-700/60 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(method.pct, method.sum > 0 ? 3 : 0)}%`,
                      backgroundColor: method.color,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
