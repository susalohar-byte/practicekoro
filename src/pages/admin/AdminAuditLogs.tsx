import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Check } from 'lucide-react';
import { AuditLogsHeader } from './auditLogs/AuditLogsHeader';
import { AuditLogStatCards } from './auditLogs/AuditLogStatCards';
import { AuditLogFilterToolbar } from './auditLogs/AuditLogFilterToolbar';
import { AuditLogTablePanel } from './auditLogs/AuditLogTablePanel';
import { AuditLogDetailsPanel } from './auditLogs/AuditLogDetailsPanel';
import { useAdminAuditLogs } from './auditLogs/useAdminAuditLogs';
export { mapAuditAction, mapAuditResource } from './auditLogs/auditLogsUtils';
export type { AuditSeverity, AuditLogItem } from './auditLogs/auditLogsUtils';

// ============================================================================
// MAIN COMPONENT: ADMIN AUDIT LOGS
// ============================================================================

export const AdminAuditLogs: React.FC = () => {
  const al = useAdminAuditLogs();
  const { pageLoading, toastMessage } = al;

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <AuditLogsHeader al={al} />

      <AuditLogStatCards al={al} />

      <AuditLogFilterToolbar al={al} />

      {/* ==================================================================== */}
      {/* 4. SPLIT LAYOUT (TABLE 8 COLS, DETAILS DOCKED PANEL 4 COLS)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <AuditLogTablePanel al={al} />

        <AuditLogDetailsPanel al={al} />
      </div>
    </div>,
    { label: 'Loading audit logs…', variant: 'table' }
  );
};
