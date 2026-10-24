import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { api } from '@/services/api';
import type { AdminAuditLog } from '@/types';

const RECENT_LIMIT = 10;

function describeAction(log: AdminAuditLog): string {
  const action = log.action.replace(/_/g, ' ').toLowerCase();
  const target = log.entityName || log.entityType.replace(/_/g, ' ');
  return `${action} · ${target}`;
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (isNaN(date.getTime())) return '—';
  return date.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Most recent entries from admin_audit_logs; never placeholder activity. */
export function StaffActivityLog() {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAdminAuditLogs({ limit: RECENT_LIMIT })
      .then(({ logs: rows }) => {
        if (!cancelled) setLogs(rows);
      })
      .catch((err) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : 'Activity could not be loaded.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-4 h-4 text-slate-500" />
        <h2 className="text-sm font-bold text-slate-900">Recent Admin Audit Activity</h2>
      </div>

      {loading ? (
        <p className="text-xs text-slate-400 py-3">Loading activity…</p>
      ) : error ? (
        <p className="text-xs text-rose-600 py-3">{error}</p>
      ) : logs.length === 0 ? (
        <p className="text-xs text-slate-400 py-3">No admin activity has been recorded yet.</p>
      ) : (
        <div className="divide-y divide-slate-100 text-xs">
          {logs.map((log) => (
            <div key={log.id} className="py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="font-bold text-slate-900">{log.adminName || log.adminEmail}</span>
                <span className="text-slate-500 ml-2 capitalize">{describeAction(log)}</span>
              </div>
              <span className="text-[11px] text-slate-400 shrink-0">
                {formatWhen(log.createdAt)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
