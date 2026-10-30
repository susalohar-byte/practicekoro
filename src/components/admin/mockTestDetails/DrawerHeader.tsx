import React from 'react';
import { X, Edit2 } from 'lucide-react';
import type { MockTest } from '@/types';
import { cn } from '@/lib/utils';
import type { DrawerTab, getTypeBadge } from './mockTestDetailsUtils';

interface DrawerHeaderProps {
  test: MockTest;
  typeBadge: ReturnType<typeof getTypeBadge>;
  isPublished: boolean;
  assignedQuestionsCount: number;
  activeTab: DrawerTab;
  setActiveTab: (tab: DrawerTab) => void;
  onEdit: (test: MockTest) => void;
  onClose: () => void;
}

export const DrawerHeader: React.FC<DrawerHeaderProps> = ({
  test,
  typeBadge,
  isPublished,
  assignedQuestionsCount,
  activeTab,
  setActiveTab,
  onEdit,
  onClose,
}) => {
  const TypeIcon = typeBadge.icon;
  return (
    <div className="p-5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/70 dark:bg-[#070D1E] shrink-0">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/50 shadow-xs">
            <TypeIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              {test.title}
            </h3>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide',
                  typeBadge.color
                )}
              >
                {typeBadge.label}
              </span>
              <span
                className={cn(
                  'px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1.5',
                  isPublished
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800'
                )}
              >
                <span
                  className={cn(
                    'w-1.5 h-1.5 rounded-full',
                    isPublished ? 'bg-emerald-500' : 'bg-amber-500'
                  )}
                />
                {isPublished ? 'Published' : 'Draft'}
              </span>
              {test.isPremium && (
                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800">
                  PRO
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons: Edit & Close */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onEdit(test)}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Edit Mock Test"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-6 mt-5 border-b border-slate-200 dark:border-slate-800/80 text-xs font-semibold">
        {(
          [
            { key: 'overview', label: 'Overview' },
            {
              key: 'questions',
              label: `Questions (${assignedQuestionsCount || test.totalQuestions})`,
            },
            { key: 'settings', label: 'Settings' },
            { key: 'analytics', label: 'Analytics' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'pb-2.5 transition-colors relative tracking-tight',
              activeTab === tab.key
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
            )}
          >
            {tab.label}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-500 rounded-t-full" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
