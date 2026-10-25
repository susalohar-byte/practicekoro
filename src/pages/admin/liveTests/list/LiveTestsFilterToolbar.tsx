import { Calendar, Search, Filter } from 'lucide-react';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestsFilterToolbarProps {
  live: AdminLiveTestsState;
}

export function LiveTestsFilterToolbar({ live }: LiveTestsFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    examFilter,
    setExamFilter,
    statusFilter,
    setStatusFilter,
    dateRangeFilter,
    setDateRangeFilter,
    setCurrentPage,
    distinctExams,
    handleResetFilters,
  } = live;
  return (
    <>
      {/* Filter Toolbar Matching Reference */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Field */}
            <div className="relative min-w-[220px] flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search live tests..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
              />
            </div>

            {/* Exam Dropdown */}
            <select
              value={examFilter}
              onChange={(e) => {
                setExamFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">All Exams</option>
              {distinctExams.map((exam) => (
                <option key={exam} value={exam}>
                  {exam}
                </option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
            >
              <option value="all">All Status</option>
              <option value="live">Live Now</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
            </select>

            {/* Date Range Selector */}
            <div className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={dateRangeFilter}
                onChange={(e) => setDateRangeFilter(e.target.value)}
                className="bg-transparent border-none focus:outline-none text-xs text-slate-700 w-44"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
