import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminDashboardState } from './useAdminDashboard';

export interface DashboardKpiCardsProps {
  db: AdminDashboardState;
}

export function DashboardKpiCards({ db }: DashboardKpiCardsProps) {
  const { metricCards, stats } = db;
  return (
    <div className="pk-stagger grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
      {metricCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.id}
            className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800/90 border-t-[3px] rounded-2xl p-4 shadow-xs hover:shadow-md hover:border-pk-primary-accent/30 dark:hover:border-pk-primary-accent/20 transition-all flex flex-col justify-between"
            style={{ borderTopColor: card.accentHex }}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
                  card.iconBg,
                  card.iconColor
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {card.label}
                </p>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  {stats ? card.value : 'Unavailable'}
                </span>
                {card.trend && (
                  <span
                    className={cn(
                      'text-xs font-bold inline-flex items-center gap-0.5',
                      card.isPositive === true
                        ? 'text-[#10B981]'
                        : card.isPositive === false
                          ? 'text-rose-500'
                          : 'text-slate-400'
                    )}
                  >
                    {card.isPositive === true && <ArrowUpRight className="w-3 h-3 stroke-[2.5]" />}
                    {card.isPositive === false && (
                      <ArrowDownRight className="w-3 h-3 stroke-[2.5]" />
                    )}
                    {card.trend}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 truncate">
                {card.vsText}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
