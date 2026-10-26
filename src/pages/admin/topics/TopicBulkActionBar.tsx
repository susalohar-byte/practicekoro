import { Trash2, CheckSquare, Eye, EyeOff } from 'lucide-react';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicBulkActionBarProps {
  tp: AdminTopicsState;
}

export function TopicBulkActionBar({ tp }: TopicBulkActionBarProps) {
  const {
    selectedTopicIds,
    setSelectedTopicIds,
    handleBatchPublish,
    handleBatchDraft,
    handleBatchDelete,
  } = tp;
  return (
    <>
      {/* Floating Multi-Select Bulk Actions Bar */}
      {selectedTopicIds.size > 0 && (
        <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200 shadow-2xs">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 font-medium">
            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>
              {selectedTopicIds.size} topic{selectedTopicIds.size > 1 ? 's' : ''} selected
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleBatchPublish}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              Publish Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDraft}
              className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <EyeOff className="w-3.5 h-3.5" />
              Draft Selected
            </button>
            <button
              type="button"
              onClick={handleBatchDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Selected
            </button>
            <button
              type="button"
              onClick={() => setSelectedTopicIds(new Set())}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
