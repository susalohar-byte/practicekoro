import { MessageSquare, CheckCircle2, Clock, Hourglass, Star } from 'lucide-react';
import type { AdminSupportState } from './useAdminSupport';

export interface SupportKpiCardsProps {
  supportState: AdminSupportState;
}

export function SupportKpiCards({ supportState }: SupportKpiCardsProps) {
  const { ticketsList } = supportState;
  return (
    <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {/* Card 1: Total Tickets */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
          <MessageSquare className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 block">Total Tickets</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {ticketsList.length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Live
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">in system</span>
        </div>
      </div>

      {/* Card 2: Resolved */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 block">Resolved</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {ticketsList.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {ticketsList.length > 0
                ? `${Math.round((ticketsList.filter((t) => t.status === 'Resolved' || t.status === 'Closed').length / ticketsList.length) * 100)}%`
                : '0%'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">resolution rate</span>
        </div>
      </div>

      {/* Card 3: Pending */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 block">Pending</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {ticketsList.filter((t) => t.status === 'Open').length}
            </span>
            <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
              Action req.
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">unassigned/open</span>
        </div>
      </div>

      {/* Card 4: In Progress */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
          <Hourglass className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 block">In Progress</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {ticketsList.filter((t) => t.status === 'In Progress').length}
            </span>
            <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              Active
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">under review</span>
        </div>
      </div>

      {/* Card 5: Avg. Response Time */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
        <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0">
          <Star className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-medium text-slate-500 block">Avg. Response Time</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-xl font-bold text-slate-900 leading-tight">
              {ticketsList.length > 0 ? '12m' : '—'}
            </span>
            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Optimal
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block mt-0.5 truncate">sla response</span>
        </div>
      </div>
    </div>
  );
}
