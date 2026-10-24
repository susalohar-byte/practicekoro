import { Plus } from 'lucide-react';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationsPageHeaderProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationsPageHeader({ notificationsState }: NotificationsPageHeaderProps) {
  const {
    titleInputRef,
    showToast,
    setFormTab,
    setEditingId,
    setEditingStatus,
    setFormTitle,
    setFormMessage,
    setFormType,
    setFormActionLink,
  } = notificationsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS (Pixel-matched to reference screenshot)     */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Create and manage notifications to keep your students informed and engaged.
          </p>
        </div>

        <div className="shrink-0 self-start flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              setEditingId(null);
              setEditingStatus(null);
              setFormTitle('');
              setFormMessage('');
              setFormType('General');
              setFormActionLink('');
              setFormTab('General');
              const el = document.getElementById('create-notification-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
              setTimeout(() => titleInputRef.current?.focus(), 250);
              showToast('Compose a new notification in the right panel.');
            }}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Notification</span>
          </button>
        </div>
      </div>
    </>
  );
}
