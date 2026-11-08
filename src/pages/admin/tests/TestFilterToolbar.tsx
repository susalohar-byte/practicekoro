import { Search, Filter } from 'lucide-react';
import type { AdminTestsState } from './useAdminTests';

export interface TestFilterToolbarProps {
  testsState: AdminTestsState;
}

export function TestFilterToolbar({ testsState }: TestFilterToolbarProps) {
  const {
    activeTab,
    examFilterOptions,
    changeExamFilter,
    subjectFilterOptions,
    chapterFilterOptions,
    changeSubjectFilter,
    changeChapterFilter,
    searchTerm,
    setSearchTerm,
    selectedExamId,
    selectedSubjectId,
    selectedChapterId,
    selectedStatus,
    setSelectedStatus,
    handleApplyFilter,
    handleResetFilters,
  } = testsState;
  // Full Mock and PYQ tests belong to an exam, not to a subject / topic
  const isExamTab = activeTab === 'full_mock' || activeTab === 'pyq';
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

          {/* All Exams Dropdown: applies immediately; lists exams that have tests on this tab */}
          <select
            aria-label="Exam"
            value={selectedExamId}
            onChange={(e) => changeExamFilter(e.target.value)}
            className={
              'px-2.5 py-1.5 rounded-lg border bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200 ' +
              (selectedExamId
                ? 'border-blue-500 font-semibold'
                : 'border-slate-200 dark:border-slate-700')
            }
          >
            <option value="">All Exams</option>
            {examFilterOptions.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.count})
              </option>
            ))}
          </select>

          {!isExamTab && (
            <>
              {/* Subject + Topic dropdowns (topic tests): apply immediately, show test counts */}
              <select
                aria-label="Subject"
                value={selectedSubjectId}
                onChange={(e) => changeSubjectFilter(e.target.value)}
                className={
                  'px-2.5 py-1.5 rounded-lg border bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200 ' +
                  (selectedSubjectId
                    ? 'border-blue-500 font-semibold'
                    : 'border-slate-200 dark:border-slate-700')
                }
              >
                <option value="">All Subjects</option>
                {subjectFilterOptions.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.count})
                  </option>
                ))}
              </select>

              <select
                aria-label="Topic"
                value={selectedChapterId}
                onChange={(e) => changeChapterFilter(e.target.value)}
                disabled={!selectedSubjectId}
                className={
                  'px-2.5 py-1.5 rounded-lg border bg-white dark:bg-[#070D1E] text-xs text-slate-700 dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed ' +
                  (selectedChapterId
                    ? 'border-blue-500 font-semibold'
                    : 'border-slate-200 dark:border-slate-700')
                }
              >
                <option value="">
                  {selectedSubjectId ? 'All Topics' : 'Select a subject first'}
                </option>
                {chapterFilterOptions.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    {ch.name} ({ch.count})
                  </option>
                ))}
              </select>
            </>
          )}

          {/* All Status Dropdown */}
          <select
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
