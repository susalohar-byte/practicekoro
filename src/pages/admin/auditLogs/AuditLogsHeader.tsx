import { Download, Calendar, ChevronDown } from 'lucide-react';
import type { AdminAuditLogsState } from './useAdminAuditLogs';

export interface AuditLogsHeaderProps {
  al: AdminAuditLogsState;
}

export function AuditLogsHeader({ al }: AuditLogsHeaderProps) {
  const { loadError, handleExportLogs } = al;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      {loadError && (
        <p role="alert" className="text-red-700">
          Audit logs unavailable: {loadError}
        </p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Audit Logs</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Database-trigger logs verify mutations. Legacy client logs are unverified; backend
            service actors are labeled separately.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 self-start">
          <button
            onClick={handleExportLogs}
            className="border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 rounded-xl px-4 py-2.5 text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export Logs</span>
          </button>

          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 shadow-2xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-medium text-slate-600">01 Sep 2026 → 30 Sep 2026</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </div>
        </div>
      </div>
    </>
  );
}
