import { Mail, ChevronDown } from 'lucide-react';
import type { AdminSettingsState } from '../useAdminSettings';

export interface SmtpSettingsCardProps {
  settings: AdminSettingsState;
}

export function SmtpSettingsCard({ settings }: SmtpSettingsCardProps) {
  const {
    canManageSettings,
    isSaving,
    smtpProvider,
    setSmtpProvider,
    smtpHost,
    setSmtpHost,
    smtpPort,
    setSmtpPort,
    smtpEncryption,
    setSmtpEncryption,
    handleSendTestEmail,
    isSendingTestEmail,
    handleSaveSMTP,
  } = settings;
  return (
    <>
      {/* Card 4: Email Configuration (SMTP) */}
      <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        {/* Card Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
              Email Configuration (SMTP)
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Save non-secret SMTP reference metadata. Server-side setup is required for delivery.
            </p>
          </div>
        </div>

        {/* SMTP Inputs */}
        <div className="space-y-3.5 pt-5">
          {/* Row 1: 4 columns */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Provider
              </label>
              <div className="relative">
                <select
                  disabled={!canManageSettings || isSaving}
                  value={smtpProvider}
                  onChange={(e) => setSmtpProvider(e.target.value)}
                  className="w-full appearance-none px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-7"
                >
                  <option value="Custom SMTP">Custom SMTP</option>
                  <option value="SendGrid">SendGrid</option>
                  <option value="AWS SES">AWS SES</option>
                  <option value="Mailgun">Mailgun</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Host
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="SMTP Host"
                type="text"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                SMTP Port
              </label>
              <input
                disabled={!canManageSettings || isSaving}
                aria-label="SMTP Port"
                type="text"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Encryption
              </label>
              <div className="relative">
                <select
                  disabled={!canManageSettings || isSaving}
                  value={smtpEncryption}
                  onChange={(e) => setSmtpEncryption(e.target.value)}
                  className="w-full appearance-none px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-7"
                >
                  <option value="TLS">TLS</option>
                  <option value="SSL">SSL</option>
                  <option value="None">None</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Row 2: 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <p className="text-xs text-amber-700">
              SMTP credentials (username and password) must be configured as server (Edge Function)
              secrets and are not stored here. Saved values are reference metadata only; this page
              does not enable mail delivery.
            </p>
          </div>

          {/* Actions: Send Test Email & Save SMTP Settings */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              disabled
              title="No server-side email delivery action is connected"
              onClick={handleSendTestEmail}
              aria-disabled={isSendingTestEmail}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </button>

            <button
              type="button"
              onClick={handleSaveSMTP}
              disabled={!canManageSettings || isSaving}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              Save SMTP Settings
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
