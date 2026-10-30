import { Search, Filter } from 'lucide-react';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectFilterToolbarProps {
  sb: AdminSubjectsState;
}

export function SubjectFilterToolbar({ sb }: SubjectFilterToolbarProps) {
  const {
    subjectsList,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    handleApplyFilter,
    handleResetFilter,
  } = sb;
  return (
    <>
      {/* 3. Filter Toolbar Card */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#0A1024] border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search subjects... */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search subjects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* All Categories Dropdown */}
          <select
            aria-label="Filter by category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            <option value="Social Science">Social Science</option>
            <option value="Aptitude">Aptitude</option>
            {[...new Set(subjectsList.map((s) => s.category))]
              .filter((c) => !['General', 'Social Science', 'Aptitude'].includes(c))
              .sort()
              .map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
          </select>

          {/* All Status Dropdown */}
          <select
            aria-label="Filter by status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as 'all' | 'published' | 'draft')}
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
            className="px-4 py-1.5 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
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
