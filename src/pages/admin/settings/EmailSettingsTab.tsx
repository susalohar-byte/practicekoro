import { Mail } from 'lucide-react';
import type { AdminSettingsState } from './useAdminSettings';

export interface EmailSettingsTabProps {
  settings: AdminSettingsState;
}

export function EmailSettingsTab({ settings }: EmailSettingsTabProps) {
  const { activeTab, handleSendTestEmail } = settings;
  return (
    <>
      {activeTab === 'email' && (
        <div className="bg-white dark:bg-[#0B132B] border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-xs space-y-5">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-9 h-9 rounded-xl bg-sky-50 dark:bg-sky-950/60 flex items-center justify-center text-sky-600">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Email Templates & Notifications
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                These templates are not connected to a delivery backend. No messages are sent by
                this page.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { title: 'Welcome Email', desc: 'Sent when a new student signs up', active: true },
              {
                title: 'Exam Result Summary',
                desc: 'Sent after completing mock tests',
                active: true,
              },
              {
                title: 'Subscription Receipt',
                desc: 'Sent upon successful payment',
                active: true,
              },
              {
                title: 'Plan Expiry Reminder',
                desc: 'Sent 7 days before subscription ends',
                active: true,
              },
            ].map((tmpl) => (
              <div
                key={tmpl.title}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">{tmpl.title}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{tmpl.desc}</p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  Not managed here
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled
              title="No server-side email delivery action is connected"
              onClick={handleSendTestEmail}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs"
            >
              Send Sample Notification
            </button>
          </div>
        </div>
      )}
    </>
  );
}
