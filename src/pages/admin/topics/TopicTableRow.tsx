import React from 'react';
import { FileText, MoreHorizontal, Edit2, Trash2, Copy, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TopicIconBadge } from './TopicIconBadge';
import type { EnrichedTopicRow } from './topicsUtils';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicTableRowProps {
  tp: AdminTopicsState;
  topic: EnrichedTopicRow;
  tIdx: number;
}

export function TopicTableRow({ tp, topic, tIdx }: TopicTableRowProps) {
  const {
    selectedTopic,
    showDetailsPanel,
    selectedTopicIds,
    openActionMenuId,
    setOpenActionMenuId,
    toggleSelectRow,
    handleSelectTopicRow,
    handleOpenEditModal,
    handleToggleTopicStatus,
    handleDeleteTopic,
    handleDuplicateTopic,
  } = tp;
  const isSelected = Boolean(showDetailsPanel && selectedTopic?.id === topic.id);
  const isChecked = selectedTopicIds.has(topic.id);
  const isPublished = topic.statusLabel === 'Published';
  const rowNumber = tIdx + 1;

  return (
    <tr
      onClick={() => handleSelectTopicRow(topic)}
      className={cn(
        'transition-colors cursor-pointer group',
        isSelected
          ? 'bg-blue-50/40 dark:bg-blue-950/20 outline outline-1 outline-[#026BFC] -outline-offset-1'
          : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
      )}
    >
      {/* Checkbox */}
      <td className="py-3.5 px-3 text-center" onClick={(evt) => evt.stopPropagation()}>
        <input
          aria-label="Select row"
          type="checkbox"
          checked={isChecked}
          onChange={(evt) => toggleSelectRow(topic.id, evt as unknown as React.MouseEvent)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
        />
      </td>

      {/* Row Index */}
      <td
        className={cn(
          'py-3.5 px-2 text-center font-medium',
          isSelected ? 'text-[#026BFC] font-bold' : 'text-slate-400'
        )}
      >
        {rowNumber}
      </td>

      {/* Topic Name: Icon + Name */}
      <td className="py-3.5 px-3 min-w-[200px]">
        <div className="flex items-center gap-3">
          <TopicIconBadge
            name={topic.name}
            iconName={topic.iconName}
            className="w-8 h-8 shrink-0"
          />
          <span className="font-bold text-slate-900 dark:text-white block leading-snug">
            {topic.name}
          </span>
        </div>
      </td>

      {/* Subject Name */}
      <td className="py-3.5 px-2.5 text-slate-500 dark:text-slate-400">{topic.subjectName}</td>

      {/* Total Tests */}
      <td className="py-3.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">
        {topic.totalTests}
      </td>

      {/* Total Questions */}
      <td className="py-3.5 px-2 text-center text-slate-700 dark:text-slate-300 font-medium">
        {topic.totalQuestions}
      </td>

      {/* Status Badge */}
      <td className="py-3.5 px-2.5 text-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleTopicStatus(topic);
          }}
          title={`Click to switch to ${isPublished ? 'Draft' : 'Published'}`}
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-medium inline-block cursor-pointer transition-all hover:scale-105 active:scale-95',
            isPublished
              ? 'bg-[#E8F8F0] text-[#10B981] dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-[#d5f5e3]'
              : 'bg-[#FEF8E7] text-[#D97706] dark:bg-amber-950/60 dark:text-amber-300 hover:bg-[#fef0cd]'
          )}
        >
          {topic.statusLabel}
        </button>
      </td>

      {/* Order Index */}
      <td className="py-3.5 px-2 text-center text-slate-500 font-medium">{topic.orderIndex}</td>

      {/* Actions Menu */}
      <td className="py-3.5 px-2.5 text-center relative" onClick={(evt) => evt.stopPropagation()}>
        <button
          aria-label="More actions"
          type="button"
          onClick={() => setOpenActionMenuId(openActionMenuId === topic.id ? null : topic.id)}
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </button>

        {openActionMenuId === topic.id && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpenActionMenuId(null)} />
            <div className="absolute right-0 mt-1 w-48 rounded-xl bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleSelectTopicRow(topic);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                View Details
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleToggleTopicStatus(topic);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                {isPublished ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                    Unpublish (Set to Draft)
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    Publish Topic
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleOpenEditModal(topic);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                Edit Topic
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleDuplicateTopic(topic);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                Duplicate Topic
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  if (confirm(`Permanently delete topic "${topic.name}"? This cannot be undone.`)) {
                    handleDeleteTopic(topic.id);
                  }
                }}
                className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Topic
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
