import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getStatusBadge } from './notificationBadges';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationDetailsModalProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationDetailsModal({ notificationsState }: NotificationDetailsModalProps) {
  const { inspectingItem, setInspectingItem, handleSelectToPreview, handleSendNow } =
    notificationsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* NOTIFICATION DETAILS / TELEMETRY MODAL                               */}
      {/* ==================================================================== */}
      {inspectingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-2.5 py-0.5 rounded text-xs font-bold',
                    getStatusBadge(inspectingItem.status)
                  )}
                >
                  {inspectingItem.status}
                </span>
                <span className="text-xs font-semibold text-slate-400">#{inspectingItem.num}</span>
              </div>
              <button
                type="button"
                onClick={() => setInspectingItem(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">{inspectingItem.title}</h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                {inspectingItem.message}
              </p>
            </div>

            {/* Performance telemetry stats */}
            {inspectingItem.stats && (
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 text-center">
                <div>
                  <span className="text-xs text-slate-500">Delivered</span>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {inspectingItem.stats.delivered}%
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Opened</span>
                  <p className="text-base font-bold text-blue-600 mt-0.5">
                    {inspectingItem.stats.opened}%
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Clicked</span>
                  <p className="text-base font-bold text-emerald-600 mt-0.5">
                    {inspectingItem.stats.clicked}%
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Target Audience:</span>
                <span className="font-semibold text-slate-800">
                  {inspectingItem.audience} ({inspectingItem.audienceCount})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400">Sent / Scheduled:</span>
                <span className="font-semibold text-slate-800">
                  {inspectingItem.sentAtDate || inspectingItem.scheduledAt || 'N/A'}{' '}
                  {inspectingItem.sentAtTime || ''}
                </span>
              </div>
              {inspectingItem.actionLink && (
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-400">Action Link:</span>
                  <a
                    href={inspectingItem.actionLink}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-blue-600 hover:underline truncate max-w-xs"
                  >
                    {inspectingItem.actionLink}
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  handleSelectToPreview(inspectingItem);
                  setInspectingItem(null);
                }}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Load to Mobile Preview
              </button>
              {inspectingItem.status !== 'Sent' && (
                <button
                  type="button"
                  onClick={() => {
                    handleSendNow(inspectingItem.id);
                    setInspectingItem(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                >
                  Broadcast Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
