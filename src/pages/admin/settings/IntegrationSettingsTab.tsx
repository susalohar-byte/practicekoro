import { Link as LinkIcon, Save, MessageSquare, RefreshCw, Send, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSettingsState } from './useAdminSettings';

export interface IntegrationSettingsTabProps {
  settings: AdminSettingsState;
}

export function IntegrationSettingsTab({ settings }: IntegrationSettingsTabProps) {
  const {
    activeTab,
    handleSaveIntegrations,
    canManageSettings,
    isSaving,
    fast2smsEnabled,
    setFast2smsEnabled,
    fast2smsRoute,
    setFast2smsRoute,
    fast2smsSenderId,
    setFast2smsSenderId,
    fcmEnabled,
    setFcmEnabled,
    fcmProjectId,
    setFcmProjectId,
    fcmVapidKey,
    setFcmVapidKey,
  } = settings;
  return (
    <>
      {activeTab === 'integrations' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <LinkIcon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  SMS & Push Notification Gateways
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure Fast2SMS for carrier text alerts and Firebase Cloud Messaging (FCM) for
                  mobile & web push notifications.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void handleSaveIntegrations()}
              disabled={!canManageSettings || isSaving}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save Gateways'}
            </button>
          </div>

          {/* Section 1: Fast2SMS Gateway */}
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Fast2SMS Gateway (Direct SMS)
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        fast2smsEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}
                    >
                      {fast2smsEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Send instant test reminders, result alerts, and login OTPs directly to Indian
                    mobile numbers via Fast2SMS.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={fast2smsEnabled}
                  onChange={(e) => setFast2smsEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                    fast2smsEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5',
                      fast2smsEnabled ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {fast2smsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* Fast2SMS Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* API Key: server-side secret only */}
              <div className="md:col-span-2 space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Fast2SMS Authorization API Key
                </p>
                <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  The Fast2SMS API key must be configured as a server (Edge Function) secret. It is
                  not stored in or readable from the browser.
                </p>
              </div>

              {/* Delivery Route */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  SMS Route
                </label>
                <select
                  value={fast2smsRoute}
                  onChange={(e) => setFast2smsRoute(e.target.value as typeof fast2smsRoute)}
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="q">Quick (Standard Transactional / Promotional)</option>
                  <option value="dlt">DLT (TRAI Registered Headers & Templates)</option>
                  <option value="otp">OTP (Priority Service for Login Verification)</option>
                </select>
                <p className="text-[11px] text-slate-400">
                  Select &quot;Quick&quot; for instant sending without DLT template approval, or
                  &quot;DLT&quot; for official header delivery.
                </p>
              </div>

              {/* Sender ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Sender ID / Header
                </label>
                <input
                  type="text"
                  value={fast2smsSenderId}
                  onChange={(e) => setFast2smsSenderId(e.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="FSTSMS (6 chars)"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Default: FSTSMS. Use your DLT approved header (e.g. PRCKRO) when using DLT route.
                </p>
              </div>
            </div>

            {/* Live Tools: Balance Check & Test SMS */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Fast2SMS Live Testing & Balance
              </h4>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <button
                  type="button"
                  disabled
                  title="Requires a server-side SMS function; the API key is not available in the browser"
                  className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Check Balance
                </button>
                <button
                  type="button"
                  disabled
                  title="Requires a server-side SMS function; the API key is not available in the browser"
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send Test SMS
                </button>
              </div>
              <p className="text-[11px] text-slate-400">
                Balance checks and test SMS must run from a server-side function that holds the API
                key; no such function is connected yet.
              </p>
            </div>
          </div>

          {/* Section 2: Firebase Cloud Messaging (FCM) */}
          <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Firebase Cloud Messaging (FCM Push)
                    </h3>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded-full text-[10px] font-bold border',
                        fcmEnabled
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                          : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                      )}
                    >
                      {fcmEnabled ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Broadcast real-time push alerts to students on Android APK and Web browsers.
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="flex items-center gap-2 cursor-pointer select-none self-start sm:self-auto">
                <input
                  type="checkbox"
                  checked={fcmEnabled}
                  onChange={(e) => setFcmEnabled(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={cn(
                    'w-11 h-6 rounded-full transition-colors relative cursor-pointer',
                    fcmEnabled ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full bg-white shadow-xs transition-transform absolute top-0.5',
                      fcmEnabled ? 'left-5.5' : 'left-0.5'
                    )}
                  />
                </div>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {fcmEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </label>
            </div>

            {/* FCM Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project ID */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Firebase Project ID
                </label>
                <input
                  type="text"
                  value={fcmProjectId}
                  onChange={(e) => setFcmProjectId(e.target.value)}
                  placeholder="e.g. practicekoro-app"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Your Google Firebase project identifier from Firebase Console Settings.
                </p>
              </div>

              {/* VAPID Public Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Web Push VAPID Key (Public)
                </label>
                <input
                  type="text"
                  value={fcmVapidKey}
                  onChange={(e) => setFcmVapidKey(e.target.value)}
                  placeholder="e.g. BBa... (Web Push Certificate Key)"
                  className="w-full h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-xs text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400">
                  Used by service worker to subscribe student web browsers to notifications.
                </p>
              </div>

              {/* Server Key: server-side secret only */}
              <div className="md:col-span-2 space-y-1.5">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  FCM Server Key / Cloud Messaging Token
                </p>
                <p className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] font-medium text-amber-800 dark:text-amber-300">
                  The FCM server key must be configured as a server (Edge Function) secret. It is
                  not stored in or readable from the browser.
                </p>
              </div>
            </div>

            {/* FCM Live Test Tool */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  FCM Push Notification Test
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Test pushes must run from a server-side function that holds the FCM server key; no
                  such function is connected yet.
                </p>
              </div>
              <button
                type="button"
                disabled
                title="Requires a server-side push function; the server key is not available in the browser"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-50 shrink-0"
              >
                <Bell className="w-3.5 h-3.5" />
                Send Test Push Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
