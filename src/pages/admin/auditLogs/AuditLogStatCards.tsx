import { FileText, UserPlus, Database, ShieldAlert } from 'lucide-react';
import type { AdminAuditLogsState } from './useAdminAuditLogs';

export interface AuditLogStatCardsProps {
  al: AdminAuditLogsState;
}

export function AuditLogStatCards({ al }: AuditLogStatCardsProps) {
  const { logsList, mostActiveArea } = al;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Logs */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Logs</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {logsList.length.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Live
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              recorded actions
            </span>
          </div>
        </div>

        {/* Card 2: Active Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Active Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {new Set(logsList.map((l) => l.adminEmail || l.adminName).filter(Boolean)).size}
              </span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Active
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              performed actions
            </span>
          </div>
        </div>

        {/* Card 3: Most Active Area */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Most Active Area</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {mostActiveArea.area}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {mostActiveArea.count > 0 ? `${mostActiveArea.count} actions` : 'No logs recorded'}
            </span>
          </div>
        </div>

        {/* Card 4: Critical Actions */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Critical Actions</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {
                  logsList.filter(
                    (l) =>
                      l.severity === 'High' || l.action === 'Deleted' || l.action === 'Refunded'
                  ).length
                }
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              require attention
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
