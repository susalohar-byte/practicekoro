import { Sparkles, Volume2 } from 'lucide-react';
import { playNotificationChime } from './notificationUtils';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationMobilePreviewProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationMobilePreview({ notificationsState }: NotificationMobilePreviewProps) {
  const {
    activePreviewItem,
    showToast,
    formActionLink,
    displayPreviewTitle,
    displayPreviewMessage,
  } = notificationsState;
  return (
    <>
      {/* CARD 2: PREVIEW (MOBILE) (Matching screenshot phone mockup) */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xs p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">Preview (Mobile)</h2>
          <button
            type="button"
            onClick={playNotificationChime}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            title="Play test audio chime"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Test Sound</span>
          </button>
        </div>

        {/* Realistic iPhone mockup container */}
        <div className="w-full bg-[#0B0F17] p-3 rounded-[28px] shadow-lg border-2 border-slate-800 relative">
          {/* Dynamic Island / Notch */}
          <div className="w-20 h-3.5 bg-black rounded-full mx-auto mb-3" />

          {/* Notification Banner */}
          <div
            onClick={() => {
              const targetLink = formActionLink || activePreviewItem?.actionLink;
              if (targetLink) {
                window.open(targetLink, '_blank');
              } else {
                showToast('Notification tap registered');
              }
            }}
            className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100/60 flex items-start gap-2.5 animate-in fade-in duration-150 cursor-pointer hover:bg-slate-50 transition-colors"
          >
            {/* App Icon */}
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] text-white flex items-center justify-center shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-slate-900 leading-tight">
                  PracticeKoro
                </span>
                <span className="text-[10px] text-slate-400 font-normal">now</span>
              </div>

              <span className="text-xs font-bold text-slate-800 block leading-snug mt-0.5 truncate">
                {displayPreviewTitle}
              </span>

              <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                {displayPreviewMessage}
              </p>
            </div>
          </div>

          {/* Phone bottom bar indicator */}
          <div className="w-16 h-1 bg-white/20 rounded-full mx-auto mt-3" />
        </div>
      </div>
    </>
  );
}
