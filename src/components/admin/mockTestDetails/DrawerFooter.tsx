import React from 'react';
import { Trash2, Copy, Eye } from 'lucide-react';
import type { MockTest } from '@/types';

interface DrawerFooterProps {
  test: MockTest;
  onDelete: (testId: string) => void;
  onDuplicate: (testId: string) => void;
  onPreview: (test: MockTest) => void;
}

export const DrawerFooter: React.FC<DrawerFooterProps> = ({
  test,
  onDelete,
  onDuplicate,
  onPreview,
}) => (
  <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#070D1E] shrink-0 flex items-center justify-between gap-3">
    <button
      type="button"
      onClick={() => {
        if (confirm(`Are you sure you want to delete mock test "${test.title}"?`)) {
          onDelete(test.id);
        }
      }}
      className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
    >
      <Trash2 className="w-3.5 h-3.5" />
      Delete Test
    </button>

    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => onDuplicate(test.id)}
        className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
      >
        <Copy className="w-3.5 h-3.5" />
        Duplicate
      </button>

      <button
        type="button"
        onClick={() => onPreview(test)}
        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-blue-500/20"
      >
        <Eye className="w-3.5 h-3.5" />
        Preview Test
      </button>
    </div>
  </div>
);
