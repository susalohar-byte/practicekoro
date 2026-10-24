import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import {
  getPaymentHealth,
  resolvePaymentAlert,
  type PaymentAlertKind,
  type PaymentHealthAlert,
} from '@/services/domains/paymentHealth';

const KIND_LABEL: Record<PaymentAlertKind, string> = {
  function_error: 'Payment server error',
  captured_not_activated: 'Paid, but no Pro Pass',
  refund_required: 'Refund needed',
};

const formatWhen = (iso: string) =>
  iso
    ? new Date(iso).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

/** Payment health for super admins: open alerts from the payment functions and hourly checks. */
export const PaymentHealthCard: React.FC = () => {
  const [alerts, setAlerts] = useState<PaymentHealthAlert[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setAlerts(await getPaymentHealth());
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (id: string) => {
    setResolvingId(id);
    try {
      await resolvePaymentAlert(id);
      setAlerts((current) => current?.filter((a) => a.id !== id) ?? null);
    } catch {
      setLoadError(true);
    } finally {
      setResolvingId(null);
    }
  };

  // Not a super admin, or still loading: show nothing.
  if (alerts === null && !loadError) return null;

  if (loadError) {
    return (
      <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
        Payment health could not be checked.{' '}
        <button type="button" onClick={() => void load()} className="font-semibold underline">
          Retry
        </button>
      </div>
    );
  }

  // When payments are healthy (no open alerts), hide this card to keep the dashboard clean.
  if (!alerts || alerts.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Payment health alerts"
      className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 p-4 sm:p-5"
    >
      <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
        <AlertTriangle className="h-5 w-5 shrink-0" aria-hidden="true" />
        <h2 className="text-base font-bold">
          Payment health: {alerts.length} open {alerts.length === 1 ? 'alert' : 'alerts'}
        </h2>
      </div>
      <ul className="mt-3 space-y-2">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 rounded-xl bg-white dark:bg-[#0A1024] border border-red-100 dark:border-red-900/60 px-3.5 py-3"
          >
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wide text-red-700 dark:text-red-300">
                {KIND_LABEL[alert.kind] ?? alert.kind}
                <span className="ml-2 font-medium normal-case tracking-normal text-slate-500 dark:text-slate-400">
                  {alert.source}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-800 dark:text-slate-100 break-words">
                {alert.message}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {alert.occurrences > 1 ? `${alert.occurrences} times · ` : ''}
                last seen {formatWhen(alert.lastSeenAt)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void resolve(alert.id)}
              disabled={resolvingId === alert.id}
              className="self-start shrink-0 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              {resolvingId === alert.id ? 'Resolving…' : 'Mark resolved'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
};
