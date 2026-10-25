import { ChevronDown } from 'lucide-react';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffFilterToolbarProps {
  co: AdminCutoffState;
}

export function CutoffFilterToolbar({ co }: CutoffFilterToolbarProps) {
  const {
    filterExam,
    setFilterExam,
    filterYear,
    setFilterYear,
    filterCategory,
    setFilterCategory,
    filterStage,
    setFilterStage,
    handleApplyFilter,
    handleResetFilter,
  } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. FILTERS TOOLBAR                                                  */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex flex-wrap items-end gap-3 lg:gap-4">
        {/* Select Exam */}
        <div className="flex-1 min-w-[170px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Select Exam</label>
          <div className="relative">
            <select
              value={filterExam}
              onChange={(e) => setFilterExam(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="WBP Constable">WBP Constable</option>
              <option value="WBSSC Group C">WBSSC Group C</option>
              <option value="WBSSC Group D">WBSSC Group D</option>
              <option value="ICDS">ICDS</option>
              <option value="Railway (NTPC)">Railway (NTPC)</option>
              <option value="WBPSC Clerkship">WBPSC Clerkship</option>
              <option value="All Exams">All Exams</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Year */}
        <div className="w-[110px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Year</label>
          <div className="relative">
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
              <option value="2020">2020</option>
              <option value="2019">2019</option>
              <option value="All Years">All Years</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Category */}
        <div className="flex-1 min-w-[140px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Category</label>
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="All Categories">All Categories</option>
              <option value="General">General</option>
              <option value="OBC-A">OBC-A</option>
              <option value="OBC-B">OBC-B</option>
              <option value="SC">SC</option>
              <option value="ST">ST</option>
              <option value="EWS">EWS</option>
              <option value="Female (General)">Female (General)</option>
              <option value="Female (SC)">Female (SC)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Stage */}
        <div className="flex-1 min-w-[130px]">
          <label className="text-[11px] font-medium text-slate-600 mb-1.5 block">Stage</label>
          <div className="relative">
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="w-full appearance-none border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 pr-8 cursor-pointer"
            >
              <option value="Final Merit">Final Merit</option>
              <option value="Preliminary">Preliminary</option>
              <option value="Mains / Written">Mains / Written</option>
              <option value="CBT-1">CBT-1</option>
              <option value="All Stages">All Stages</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleApplyFilter}
            className="bg-[#2563EB] hover:bg-blue-700 text-white font-semibold text-xs px-6 py-2 rounded-xl transition-colors shadow-2xs cursor-pointer"
          >
            Apply
          </button>
          <button
            onClick={handleResetFilter}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-3 py-2 cursor-pointer transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}
