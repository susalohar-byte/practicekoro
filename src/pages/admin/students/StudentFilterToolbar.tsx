import { Search, SlidersHorizontal } from 'lucide-react';
import type { AdminStudentsState } from './useAdminStudents';

export interface StudentFilterToolbarProps {
  studentsState: AdminStudentsState;
}

export function StudentFilterToolbar({ studentsState }: StudentFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    handleApplyFilters,
    statusFilter,
    setStatusFilter,
    planFilter,
    setPlanFilter,
    examFilter,
    setExamFilter,
    handleResetFilters,
  } = studentsState;
  return (
    <>
      {/* 3. FILTER TOOLBAR                                                 */}
      {/* ================================================================= */}
      <div className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-2xs flex flex-wrap items-center gap-3 mb-6">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleApplyFilters();
            }}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#026BFC] transition-colors"
          />
        </div>

        {/* All Status Dropdown */}
        <div className="w-[125px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
          >
            <option value="All Status">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* All Subscription Plans Dropdown */}
        <div className="w-[180px]">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
          >
            <option value="All Subscription Plans">All Subscription Plans</option>
            <option value="6 Months">6 Months</option>
            <option value="1 Month">1 Month</option>
            <option value="1 Year">1 Year</option>
            <option value="Free">Free</option>
          </select>
        </div>

        {/* All Exams Dropdown */}
        <div className="w-[140px]">
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 cursor-pointer focus:outline-none focus:border-[#026BFC]"
          >
            <option value="All Exams">All Exams</option>
            <option value="WBP Constable">WBP Constable</option>
            <option value="KP Constable">KP Constable</option>
            <option value="WBTET Primary">WBTET Primary</option>
            <option value="General Science">General Science</option>
            <option value="SSC CGL">SSC CGL</option>
          </select>
        </div>

        {/* Solid Blue Filter Button */}
        <button
          onClick={handleApplyFilters}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-white" />
          <span>Filter</span>
        </button>

        {/* Reset Link */}
        <button
          onClick={handleResetFilters}
          className="text-xs font-medium text-[#026BFC] hover:underline px-2 transition-colors"
        >
          Reset
        </button>
      </div>
    </>
  );
}
