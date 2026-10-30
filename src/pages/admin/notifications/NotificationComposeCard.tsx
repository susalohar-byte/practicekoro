import { Send, Link as LinkIcon, ExternalLink, ChevronDown, Clock, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SMS_BROADCAST_DISABLED_MESSAGE, type NotificationCategory } from './notificationTypes';
import { toLocalDateTimeInput } from './notificationUtils';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationComposeCardProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationComposeCard({ notificationsState }: NotificationComposeCardProps) {
  const {
    titleInputRef,
    formTab,
    setFormTab,
    editingId,
    formTitle,
    setFormTitle,
    formMessage,
    setFormMessage,
    formType,
    setFormType,
    formActionLink,
    setFormActionLink,
    formSendPush,
    setFormSendPush,
    formSendEmail,
    setFormSendEmail,
    formSendSms,
    setFormSendSms,
    formAudience,
    setFormAudience,
    setFormAudienceCount,
    formScheduledDate,
    setFormScheduledDate,
    formIsSubmitting,
    handleCancelEdit,
    handleSaveNotification,
  } = notificationsState;
  return (
    <>
      {/* CARD 1: CREATE NEW NOTIFICATION FORM */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            {editingId ? 'Edit Notification' : 'Create New Notification'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Cancel Edit</span>
            </button>
          )}
        </div>

        {/* 3 Tabs: General, Audience, Schedule */}
        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setFormTab('General')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center',
              formTab === 'General'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            General
          </button>

          <button
            type="button"
            onClick={() => setFormTab('Audience')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center',
              formTab === 'Audience'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Audience
          </button>

          <button
            type="button"
            onClick={() => setFormTab('Schedule')}
            className={cn(
              'flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer text-center',
              formTab === 'Schedule'
                ? 'bg-[#2563EB] text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            Schedule
          </button>
        </div>

        {/* TAB: GENERAL FORM */}
        {formTab === 'General' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            {/* Title */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Title <span className="text-rose-500">*</span>
              </label>
              <input
                aria-label="Title"
                ref={titleInputRef}
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Enter notification title"
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Message */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Message <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  placeholder="Enter your message..."
                  maxLength={500}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none pb-6"
                />
                <span className="absolute right-2.5 bottom-2 text-[10px] text-slate-400 font-mono">
                  {formMessage.length}/500
                </span>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Type <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Send className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <select
                  aria-label="Type"
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as NotificationCategory)}
                  className="w-full appearance-none border border-slate-200 rounded-xl pl-9 pr-7 py-2 text-xs text-slate-800 bg-white cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                >
                  <option value="General">General</option>
                  <option value="Test">Test</option>
                  <option value="Promotion">Promotion</option>
                  <option value="Result">Result</option>
                  <option value="Update">Update</option>
                  <option value="Subscription">Subscription</option>
                  <option value="Content">Content</option>
                  <option value="System">System</option>
                  <option value="Welcome">Welcome</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Action Link (Optional) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Action Link (Optional)
              </label>
              <div className="relative">
                <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  aria-label="Action Link (Optional)"
                  type="text"
                  value={formActionLink}
                  onChange={(e) => setFormActionLink(e.target.value)}
                  placeholder="https://"
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {formActionLink ? (
                  <a
                    href={formActionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                    title="Test link"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                )}
              </div>
            </div>

            {/* Delivery Channels: In-App, FCM Push, and Fast2SMS */}
            <div className="space-y-3 pt-1">
              {/* Toggle 1: In-app notification */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-5.5 rounded-full bg-blue-600 relative shrink-0">
                  <span className="w-4 h-4 rounded-full bg-white shadow-xs block absolute top-0.5 left-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                      In-App Notification
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                      Active
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                    Delivered inside the student platform &amp; notification inbox
                  </span>
                </div>
              </div>

              {/* Toggle 2: Firebase Cloud Messaging (FCM Push) */}
              <div className="flex items-center gap-3">
                <button
                  role="switch"
                  aria-checked={formSendPush}
                  aria-label="Push Notification (FCM)"
                  type="button"
                  onClick={() => setFormSendPush(!formSendPush)}
                  className={cn(
                    'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                    formSendPush ? 'bg-amber-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white shadow-xs block transition-transform absolute top-0.5',
                      formSendPush ? 'left-5' : 'left-1'
                    )}
                  />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                      Push Notification (FCM)
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                      Firebase
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                    Real-time push alerts to Android APK &amp; web browsers
                  </span>
                </div>
              </div>

              {/* Toggle 3: Direct SMS Alert (Fast2SMS) */}
              <div className="flex items-center gap-3">
                <button
                  role="switch"
                  aria-checked={formSendSms}
                  type="button"
                  disabled
                  aria-label="Direct Carrier SMS (unavailable)"
                  title={SMS_BROADCAST_DISABLED_MESSAGE}
                  onClick={() => setFormSendSms(!formSendSms)}
                  className={cn(
                    'w-10 h-5.5 rounded-full transition-colors relative shrink-0 cursor-not-allowed opacity-50',
                    formSendSms ? 'bg-emerald-600' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white shadow-xs block transition-transform absolute top-0.5',
                      formSendSms ? 'left-5' : 'left-1'
                    )}
                  />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                      Direct Carrier SMS
                    </span>
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300">
                      Fast2SMS
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                    Unavailable: SMS broadcast requires a server-side gateway function
                  </span>
                </div>
              </div>

              {/* Fast2SMS Active Counter Indicator */}
              {formSendSms && (
                <div className="p-2.5 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
                  <div className="flex items-center justify-between font-bold">
                    <span>SMS Length: {formMessage.length}/160 characters</span>
                    <span>{Math.ceil(formMessage.length / 160) || 1} Credit/recipient</span>
                  </div>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400">
                    Carrier SMS will be dispatched via Fast2SMS API on broadcast.
                  </p>
                </div>
              )}

              {/* Toggle 4: Email */}
              <div className="flex items-center gap-3">
                <button
                  role="switch"
                  aria-checked={formSendEmail}
                  aria-label="Email"
                  type="button"
                  onClick={() => setFormSendEmail(!formSendEmail)}
                  className={cn(
                    'w-10 h-5.5 rounded-full transition-colors relative cursor-pointer shrink-0',
                    formSendEmail ? 'bg-[#2563EB]' : 'bg-slate-200 dark:bg-slate-700'
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded-full bg-white shadow-xs block transition-transform absolute top-0.5',
                      formSendEmail ? 'left-5' : 'left-1'
                    )}
                  />
                </button>
                <div>
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 block leading-tight">
                    Email Notification
                  </span>
                  <span className="text-[11px] text-slate-400 block leading-tight mt-0.5">
                    Send email to selected audience (SMTP in Settings)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: AUDIENCE */}
        {formTab === 'Audience' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-slate-800 block">
              Select Target Audience
            </span>
            <div className="space-y-2">
              {[
                { label: 'All Students', count: 'Unavailable' },
                { label: 'Pro Members', count: 'Unavailable' },
                { label: 'Free Members', count: 'Unavailable' },
              ].map((aud) => (
                <label
                  key={aud.label}
                  onClick={() => {
                    setFormAudience(aud.label);
                    setFormAudienceCount(aud.count);
                  }}
                  className={cn(
                    'flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-all',
                    formAudience === aud.label
                      ? 'border-blue-500 bg-blue-50/40 text-blue-900 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="targetAudience"
                      checked={formAudience === aud.label}
                      onChange={() => {
                        setFormAudience(aud.label);
                        setFormAudienceCount(aud.count);
                      }}
                      className="text-blue-600 focus:ring-0"
                    />
                    <span className="text-xs">{aud.label}</span>
                  </div>
                  <span className="text-[11px] text-slate-400">{aud.count} students</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SCHEDULE */}
        {formTab === 'Schedule' && (
          <div className="space-y-3.5 animate-in fade-in duration-150">
            <span className="text-xs font-semibold text-slate-800 block">Schedule Date & Time</span>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-500 block">Select Date and Time</label>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  aria-label="Select Date and Time"
                  type="datetime-local"
                  value={formScheduledDate}
                  onChange={(e) => setFormScheduledDate(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setHours(d.getHours() + 2);
                  setFormScheduledDate(toLocalDateTimeInput(d));
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                In 2 Hours
              </button>
              <button
                type="button"
                onClick={() => {
                  const d = new Date();
                  d.setDate(d.getDate() + 1);
                  d.setHours(9, 0, 0, 0);
                  setFormScheduledDate(toLocalDateTimeInput(d));
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-medium cursor-pointer"
              >
                Tomorrow 9 AM
              </button>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
              The notification will be delivered automatically at the specified date and time in
              student local timezone (IST).
            </p>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="pt-2 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => handleSaveNotification(true)}
            disabled={formIsSubmitting}
            className="flex-1 border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs py-2.5 rounded-xl transition-colors cursor-pointer text-center"
          >
            Save as Draft
          </button>

          <button
            type="button"
            onClick={() => handleSaveNotification(false)}
            disabled={formIsSubmitting}
            className="flex-1 bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs py-2.5 rounded-xl transition-colors shadow-2xs cursor-pointer text-center flex items-center justify-center gap-1.5"
          >
            <span>
              {editingId
                ? 'Update Notification'
                : formTab === 'Schedule'
                  ? 'Schedule Notification'
                  : 'Send Notification'}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
