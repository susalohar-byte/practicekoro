import { FileText, X, Copy, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSeverityBadge } from './auditLogsUtils';
import type { AdminAuditLogsState } from './useAdminAuditLogs';

export interface AuditLogDetailsPanelProps {
  al: AdminAuditLogsState;
}

export function AuditLogDetailsPanel({ al }: AuditLogDetailsPanelProps) {
  const {
    isDetailsPanelOpen,
    selectedLog,
    setIsDetailsPanelOpen,
    setSelectedLogId,
    handleCopyJson,
    isCopiedJson,
  } = al;
  return (
    <>
      {/* RIGHT COLUMN: LOG DETAILS DOCKED PANEL */}
      {isDetailsPanelOpen && selectedLog && (
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Log Details</h2>
            <button
              onClick={() => {
                setIsDetailsPanelOpen(false);
                setSelectedLogId('');
              }}
              className="w-6 h-6 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Action Banner Card */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-xl p-3 flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">
                  {selectedLog.resource} {selectedLog.action}
                </span>
                <span
                  className={cn(
                    'px-2 py-0.2 rounded text-[10px] font-semibold',
                    getSeverityBadge(selectedLog.severity)
                  )}
                >
                  {selectedLog.severity}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block mt-0.5">
                {selectedLog.date}, {selectedLog.time}
              </span>
            </div>
          </div>

          {/* Key-Value Breakdown */}
          <div className="space-y-2 text-xs">
            {/* Admin */}
            <div className="flex items-start justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Admin</span>
              <div className="flex items-center gap-2 text-right">
                {selectedLog.avatarType === 'photo' && selectedLog.avatarSrc ? (
                  <img
                    src={selectedLog.avatarSrc}
                    alt={selectedLog.adminName}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] shrink-0',
                      selectedLog.avatarBgColor || 'bg-blue-100',
                      selectedLog.avatarTextColor || 'text-blue-600'
                    )}
                  >
                    {selectedLog.avatarInitials}
                  </div>
                )}
                <div>
                  <span className="font-semibold text-slate-900 block leading-tight">
                    {selectedLog.adminName}
                  </span>
                  <span className="text-[10px] text-slate-400 block">{selectedLog.adminEmail}</span>
                </div>
              </div>
            </div>

            {/* Action */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Action</span>
              <span className="font-medium text-slate-800">{selectedLog.action}</span>
            </div>

            {/* Resource */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Resource</span>
              <span className="font-medium text-slate-800">{selectedLog.resource}</span>
            </div>

            {/* Resource ID */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Resource ID</span>
              <span className="font-mono text-slate-700">
                {selectedLog.resourceId || 'QST-10485'}
              </span>
            </div>

            {/* Details */}
            <div className="py-1 border-b border-slate-50 space-y-1">
              <span className="text-slate-400 font-normal block">Details</span>
              <p className="font-normal text-slate-700 text-xs leading-relaxed">
                {selectedLog.fullDetails || selectedLog.details}
              </p>
            </div>

            {/* IP Address */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">IP Address</span>
              <span className="font-mono text-slate-700">{selectedLog.ipAddress}</span>
            </div>

            {/* Browser */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Browser</span>
              <span className="font-medium text-slate-800">
                {selectedLog.browser || 'Chrome 128.0.6613.120'}
              </span>
            </div>

            {/* Device */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Device</span>
              <span className="font-medium text-slate-800">
                {selectedLog.device || 'Mac (macOS 14.6)'}
              </span>
            </div>

            {/* Location */}
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-400 font-normal">Location</span>
              <span className="font-medium text-slate-800">
                {selectedLog.location || 'Kolkata, West Bengal, India'}
              </span>
            </div>

            {/* Severity */}
            <div className="flex justify-between py-1">
              <span className="text-slate-400 font-normal">Severity</span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-semibold',
                  getSeverityBadge(selectedLog.severity)
                )}
              >
                {selectedLog.severity}
              </span>
            </div>
          </div>

          {/* Additional Data (JSON) */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs">Additional Data (JSON)</span>
              <button
                onClick={handleCopyJson}
                className="text-slate-400 hover:text-slate-700 p-1 rounded transition-colors cursor-pointer"
                title="Copy JSON"
              >
                {isCopiedJson ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-100/80 text-[11px] font-mono text-slate-700 overflow-x-auto">
              <pre className="text-slate-800 leading-relaxed">
                {JSON.stringify(selectedLog.jsonData || { action: 'view' }, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
