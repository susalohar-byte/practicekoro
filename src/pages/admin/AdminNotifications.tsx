import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAdminNotifications } from './notifications/useAdminNotifications';
import { NotificationsPageHeader } from './notifications/NotificationsPageHeader';
import { NotificationKpiCards } from './notifications/NotificationKpiCards';
import { NotificationFilterToolbar } from './notifications/NotificationFilterToolbar';
import { NotificationBulkActionBar } from './notifications/NotificationBulkActionBar';
import { NotificationsTableCard } from './notifications/NotificationsTableCard';
import { NotificationComposeCard } from './notifications/NotificationComposeCard';
import { NotificationMobilePreview } from './notifications/NotificationMobilePreview';
import { NotificationDetailsModal } from './notifications/NotificationDetailsModal';
export type {
  NotificationCategory,
  NotificationStatus,
  NotificationRecord,
} from './notifications/notificationTypes';

export const AdminNotifications: React.FC = () => {
  const notificationsState = useAdminNotifications();
  const { isLoading, toastMessage } = notificationsState;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <NotificationsPageHeader notificationsState={notificationsState} />

      <NotificationKpiCards notificationsState={notificationsState} />

      {/* ==================================================================== */}
      {/* 3. SPLIT MAIN SECTION (TABLE 8 COLS, FORM & PREVIEW 4 COLS)          */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: FILTER TOOLBAR, TABLE & PAGINATION (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          <NotificationFilterToolbar notificationsState={notificationsState} />

          <NotificationBulkActionBar notificationsState={notificationsState} />

          <NotificationsTableCard notificationsState={notificationsState} />
        </div>

        {/* RIGHT COLUMN: CREATE FORM + MOBILE PREVIEW (4 COLS) */}
        <div id="create-notification-panel" className="lg:col-span-4 space-y-6">
          <NotificationComposeCard notificationsState={notificationsState} />

          <NotificationMobilePreview notificationsState={notificationsState} />
        </div>
      </div>

      <NotificationDetailsModal notificationsState={notificationsState} />
    </div>,
    { label: 'Loading notifications…', variant: 'table' }
  );
};
