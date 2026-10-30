import { Search, Filter } from 'lucide-react';
import type { AdminTestsState } from './useAdminTests';

export interface TestFilterToolbarProps {
  testsState: AdminTestsState;
}

export function TestFilterToolbar({ testsState }: TestFilterToolbarProps) {
  const {
    exams,
    subjects,
    searchTerm,
    setSearchTerm,
    selectedExamId,
    setSelectedExamId,
    selectedSubjectId,
    setSelectedSubjectId,
    selectedChapterId,
    setSelectedChapterId,
    selectedStatus,
    setSelectedStatus,
    handleApplyFilter,
    handleResetFilters,
    filteredChapters,
  } = testsState;
  return (
    <>
      {/* Filter Toolbar */}
      <div className="p-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {/* Search */}
          <div className="relative w-44">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyFilter()}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* All Exams Dropdown */}
          <select
            aria-label="Filter by exam"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="">All Exams</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>

          {/* All Subjects Dropdown */}
          <select
            aria-label="Filter by subject"
            value={selectedSubjectId}
            onChange={(e) => {
              setSelectedSubjectId(e.target.value);
              setSelectedChapterId('');
            }}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="">All Subjects</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>

          {/* All Topics Dropdown */}
          <select
            aria-label="Filter by topic"
            value={selectedChapterId}
            onChange={(e) => setSelectedChapterId(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="">All Topics</option>
            {filteredChapters.map((ch) => (
              <option key={ch.id} value={ch.id}>
                {ch.name}
              </option>
            ))}
          </select>

          {/* All Status Dropdown */}
          <select
            aria-label="Filter by status"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
          </select>
        </div>

        {/* Action Buttons: Filter & Reset */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleApplyFilter}
            className="h-8 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs"
          >
            <Filter className="w-3 h-3" />
            Filter
          </button>

          <button
            type="button"
            onClick={handleResetFilters}
            className="h-8 px-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-slate-50"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
