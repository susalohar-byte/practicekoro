import { Search, Filter } from 'lucide-react';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicFilterBarProps {
  tp: AdminTopicsState;
}

export function TopicFilterBar({ tp }: TopicFilterBarProps) {
  const {
    topicsList,
    subjectsList,
    searchTerm,
    setSearchTerm,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    setCurrentPage,
    handleApplyFilter,
    handleResetFilter,
  } = tp;
  return (
    <>
      {/* 3. Search & Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search topics... */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* All Subjects Dropdown */}
          <select
            value={selectedSubjectFilter}
            onChange={(e) => {
              setSelectedSubjectFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Subjects ({topicsList.length} topics)</option>
            {subjectsList.map((sub) => {
              const count = topicsList.filter((t) => t.subjectId === sub.id).length;
              return (
                <option key={sub.id} value={sub.id}>
                  {sub.name} ({count})
                </option>
              );
            })}
          </select>

          {/* All Status Dropdown */}
          <select
            value={selectedStatusFilter}
            onChange={(e) =>
              setSelectedStatusFilter(e.target.value as 'all' | 'published' | 'draft')
            }
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>

          {/* Filter Button */}
          <button
            type="button"
            onClick={handleApplyFilter}
            className="px-4 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            Filter
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleResetFilter}
            className="text-[#026BFC] hover:underline font-semibold text-xs px-2.5 py-1.5 transition-colors cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
