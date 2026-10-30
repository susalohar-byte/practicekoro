import { Search, Filter, ChevronDown } from 'lucide-react';
import { DATE_RANGE_OPTIONS, DateRangeFilter } from './testAttemptTypes';
import type { AdminTestAttemptsState } from './useAdminTestAttempts';

export interface TestAttemptFilterToolbarProps {
  testAttemptsState: AdminTestAttemptsState;
}

export function TestAttemptFilterToolbar({ testAttemptsState }: TestAttemptFilterToolbarProps) {
  const {
    searchTerm,
    setSearchTerm,
    filterExam,
    setFilterExam,
    filterType,
    setFilterType,
    filterResult,
    setFilterResult,
    filterDateRange,
    setFilterDateRange,
    setCurrentPage,
    handleResetFilters,
  } = testAttemptsState;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. FILTER TOOLBAR (Single clean card) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        {/* Search Input */}
        <div className="flex-1 min-w-[220px]">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by student name, test name, exam..."
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#2563EB] transition-colors"
            />
          </div>
        </div>

        {/* Exam Select */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Exam</label>
          <div className="relative">
            <select
              aria-label="Exam"
              value={filterExam}
              onChange={(e) => {
                setFilterExam(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Exams">All Exams</option>
              <option value="WBP Constable">WBP Constable</option>
              <option value="KP SI">KP SI</option>
              <option value="WBCS">WBCS</option>
              <option value="Railways Group D">Railways Group D</option>
              <option value="SSC CGL">SSC CGL</option>
              <option value="WB Primary TET">WB Primary TET</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Test Type Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Test Type</label>
          <div className="relative">
            <select
              aria-label="Test Type"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Types">All Types</option>
              <option value="Full Mock">Full Mock</option>
              <option value="Topic Test">Topic Test</option>
              <option value="Official PYQ">Official PYQ</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Result Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Result</label>
          <div className="relative">
            <select
              aria-label="Result"
              value={filterResult}
              onChange={(e) => {
                setFilterResult(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Results">All Results</option>
              <option value="Completed">Completed</option>
              <option value="Not Completed">Not Completed</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Date Range Select */}
        <div className="w-[120px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Date Range</label>
          <div className="relative">
            <select
              aria-label="Date Range"
              value={filterDateRange}
              onChange={(e) => {
                setFilterDateRange(e.target.value as DateRangeFilter);
                setCurrentPage(1);
              }}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              {DATE_RANGE_OPTIONS.filter(
                (o) => o !== 'Custom Range' || filterDateRange === 'Custom Range'
              ).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(1)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-5 py-2 rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer h-[34px]"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#475569] font-semibold text-xs px-4 py-2 rounded-xl shadow-2xs transition-colors cursor-pointer h-[34px]"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
