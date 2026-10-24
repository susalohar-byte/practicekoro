import type { ReactNode } from 'react';
import { Users, CreditCard, UserRound } from 'lucide-react';
import type { AdminSubscriptionPlansState } from './useAdminSubscriptionPlans';

export interface SubscriptionKpiCardsProps {
  plansState: AdminSubscriptionPlansState;
}

const formatCount = (n: number | undefined) => (n == null ? '—' : n.toLocaleString('en-IN'));
const formatRupees = (n: number | undefined) =>
  n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

function KpiCard({
  icon,
  iconClass,
  label,
  value,
  caption,
}: {
  icon: ReactNode;
  iconClass: string;
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition-shadow">
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconClass}`}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <span className="text-[11px] font-medium text-slate-500 block">{label}</span>
        <span className="text-2xl font-bold text-slate-900 leading-tight block mt-0.5">
          {value}
        </span>
        <span className="text-[11px] text-slate-400 block mt-0.5 truncate">{caption}</span>
      </div>
    </div>
  );
}

export function SubscriptionKpiCards({ plansState }: SubscriptionKpiCardsProps) {
  const metrics = plansState.planMetrics;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard
        icon={<Users className="w-6 h-6" />}
        iconClass="bg-[#DCFCE7] text-[#16A34A]"
        label="Paying Subscribers"
        value={formatCount(metrics?.subscribers)}
        caption="students with an active plan"
      />
      <KpiCard
        icon={<span className="font-bold text-xl">₹</span>}
        iconClass="bg-[#EDE9FE] text-[#7C3AED]"
        label="Monthly Revenue"
        value={formatRupees(metrics?.monthRevenue)}
        caption="net recorded, this month"
      />
      <KpiCard
        icon={<CreditCard className="w-6 h-6" />}
        iconClass="bg-[#E0F2FE] text-[#0284C7]"
        label="Active Subscriptions"
        value={formatCount(metrics?.activeSubscriptions)}
        caption="currently active"
      />
      <KpiCard
        icon={<UserRound className="w-6 h-6" />}
        iconClass="bg-[#FEF3C7] text-[#D97706]"
        label="Free Students"
        value={formatCount(metrics?.freeStudents)}
        caption="registered, no active plan"
      />
    </div>
  );
}
