import { Plus, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { SubjectIconBadge } from '../AdminSubjects';
import { TopicTableRow } from './TopicTableRow';
import type { SubjectGroup } from './topicsUtils';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicGroupRowsProps {
  tp: AdminTopicsState;
  group: SubjectGroup;
}

export function TopicGroupRows({ tp, group }: TopicGroupRowsProps) {
  const {
    collapsedGroups,
    selectedTopicIds,
    setSelectedTopicIds,
    toggleGroupCollapse,
    handleOpenCreateModal,
  } = tp;
  const isCollapsed = Boolean(collapsedGroups[group.id] || collapsedGroups[group.name]);

  return (
    <>
      {/* Collapsible Subject Header Row */}
      <tr
        onClick={() => toggleGroupCollapse(group.id)}
        className="bg-slate-50/80 dark:bg-slate-900/60 hover:bg-slate-100/80 dark:hover:bg-slate-900/90 transition-colors cursor-pointer select-none border-t border-b border-slate-200/70 dark:border-slate-800"
      >
        <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            checked={
              group.topics.length > 0 && group.topics.every((t) => selectedTopicIds.has(t.id))
            }
            onChange={(e) => {
              const ids = group.topics.map((t) => t.id);
              setSelectedTopicIds((prev) => {
                const next = new Set(prev);
                if (e.target.checked) {
                  ids.forEach((id) => next.add(id));
                } else {
                  ids.forEach((id) => next.delete(id));
                }
                return next;
              });
            }}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
          />
        </td>
        <td colSpan={7} className="py-3 px-2">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <SubjectIconBadge
                name={group.name}
                iconName={group.iconName}
                className="w-6 h-6 shrink-0"
              />
              <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                {group.name}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                {group.topicsCount} {group.topicsCount === 1 ? 'Topic' : 'Topics'}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0 pr-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenCreateModal(group.id === '__unassigned__' ? undefined : group.id);
                }}
                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-[#026BFC] text-[11px] font-semibold flex items-center gap-1 transition-colors border border-blue-200/60 dark:border-blue-800 cursor-pointer shadow-2xs"
                title={`Add new topic to ${group.name}`}
              >
                <Plus className="w-3 h-3" />
                Add Topic
              </button>
            </div>
          </div>
        </td>
        <td className="py-3 px-2.5 text-center text-slate-400">
          {isCollapsed ? (
            <ChevronDown className="w-4 h-4 mx-auto text-slate-400" />
          ) : (
            <ChevronUp className="w-4 h-4 mx-auto text-slate-400" />
          )}
        </td>
      </tr>

      {/* Empty state when this subject has 0 topics */}
      {!isCollapsed && group.topics.length === 0 && (
        <tr>
          <td colSpan={9} className="py-6 px-4 text-center bg-slate-50/30 dark:bg-slate-900/20">
            <div className="flex flex-col items-center justify-center gap-1.5 py-2">
              <Layers className="w-6 h-6 text-slate-300 dark:text-slate-600" />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                No topics created under{' '}
                <span className="font-semibold text-slate-700 dark:text-slate-300">
                  "{group.name}"
                </span>{' '}
                yet.
              </p>
              <button
                type="button"
                onClick={() =>
                  handleOpenCreateModal(group.id === '__unassigned__' ? undefined : group.id)
                }
                className="mt-1 px-3 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Create First Topic
              </button>
            </div>
          </td>
        </tr>
      )}

      {/* Topics under this subject */}
      {!isCollapsed &&
        group.topics.map((topic, tIdx) => (
          <TopicTableRow key={topic.id} tp={tp} topic={topic} tIdx={tIdx} />
        ))}
    </>
  );
}
