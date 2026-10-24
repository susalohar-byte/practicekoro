import { Send, Trash2, Download } from 'lucide-react';
import type { AdminNotificationsState } from './useAdminNotifications';

export interface NotificationBulkActionBarProps {
  notificationsState: AdminNotificationsState;
}

export function NotificationBulkActionBar({ notificationsState }: NotificationBulkActionBarProps) {
  const {
    notificationsList,
    selectedIds,
    setSelectedIds,
    handleBulkDelete,
    handleBulkSend,
    handleExportCSV,
  } = notificationsState;
  return (
    <>
      {/* BULK ACTIONS TOOLBAR (Appears when checkboxes are selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs animate-in fade-in">
          <span className="font-semibold text-blue-900">
            {selectedIds.length} notification{selectedIds.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                handleExportCSV(notificationsList.filter((n) => selectedIds.includes(n.id)))
              }
              className="px-3 py-1 rounded-lg bg-white border border-blue-300 text-blue-700 hover:bg-blue-100/50 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>
            <button
              type="button"
              onClick={handleBulkSend}
              className="px-3 py-1 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Selected</span>
            </button>
            <button
              type="button"
              onClick={handleBulkDelete}
              className="px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 font-semibold cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="text-slate-500 hover:text-slate-800 px-2 cursor-pointer font-medium"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </>
  );
}
