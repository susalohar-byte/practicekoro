import { ExternalLink, Plus } from 'lucide-react';
import type { AdminSupportState } from './useAdminSupport';

export interface SupportPageHeaderProps {
  supportState: AdminSupportState;
}

export function SupportPageHeader({ supportState }: SupportPageHeaderProps) {
  const { setIsCreateModalOpen } = supportState;
  return (
    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Support</h1>
        <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
          Manage student support tickets, respond to queries and keep your students happy.
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0 self-start">
        <a
          href="https://practicekoro.in/help"
          target="_blank"
          rel="noreferrer"
          className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>View Help Center</span>
          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
        </a>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-5 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Ticket</span>
        </button>
      </div>
    </div>
  );
}
