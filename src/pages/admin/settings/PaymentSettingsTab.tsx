import { CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSettingsState } from './useAdminSettings';

export interface PaymentSettingsTabProps {
  settings: AdminSettingsState;
}

export function PaymentSettingsTab({ settings }: PaymentSettingsTabProps) {
  const {
    activeTab,
    canManageSettings,
    isSaving,
    rzpKeyId,
    setRzpKeyId,
    rzpIsActive,
    setRzpIsActive,
    currency,
    taxPercent,
    invoicePrefix,
    handleSavePayment,
  } = settings;
  return (
    <>
      {activeTab === 'payments' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Payment Gateway & Invoicing
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Saved gateway configuration is not a live payment health check. The public Key ID
                must match the server credentials; rotate both together. Tax/invoice controls are
                unavailable.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Razorpay Key ID
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="Razorpay Key ID"
                type="text"
                value={rzpKeyId}
                onChange={(e) => setRzpKeyId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Gateway Status
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button
                  disabled={!canManageSettings || isSaving}
                  type="button"
                  role="switch"
                  aria-label="Gateway enabled"
                  aria-checked={rzpIsActive}
                  onClick={() => setRzpIsActive(!rzpIsActive)}
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                    rzpIsActive ? 'bg-emerald-600' : 'bg-slate-300'
                  )}
                >
                  <div
                    className={cn(
                      'w-4 h-4 rounded-full bg-white transition-transform absolute top-1',
                      rzpIsActive ? 'translate-x-6' : 'translate-x-1'
                    )}
                  />
                </button>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {rzpIsActive
                    ? `Enabled configuration (${rzpKeyId.startsWith('rzp_test_') ? 'test' : 'live'} mode)`
                    : 'Disabled configuration'}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Default Currency
              </label>
              <select
                aria-label="Default Currency"
                value={currency}
                disabled
                title="Checkout supports INR only"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              >
                <option value="INR">INR (₹ Indian Rupee)</option>
                <option value="USD">USD ($ United States Dollar)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                GST / Tax Rate (%)
              </label>
              <input
                aria-label="GST / Tax Rate (%)"
                type="text"
                value={taxPercent}
                disabled
                placeholder="Not managed here"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Invoice Number Prefix
              </label>
              <input
                aria-label="Invoice Number Prefix"
                type="text"
                value={invoicePrefix}
                disabled
                placeholder="Not managed here"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => void handleSavePayment()}
              disabled={!canManageSettings || isSaving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Save Payment Settings
            </button>
          </div>
        </div>
      )}
    </>
  );
}
