import { ChevronDown, Loader2, Radio, RotateCcw, Search } from 'lucide-react';
import type { AdminRankingsState } from './useAdminRankings';

export interface RankingsFilterToolbarProps {
  rk: AdminRankingsState;
}

export function RankingsFilterToolbar({ rk }: RankingsFilterToolbarProps) {
  const {
    scopeTab,
    selectedExam,
    setSelectedExam,
    selectedSubject,
    setSelectedSubject,
    selectedTestType,
    setSelectedTestType,
    selectedLiveTestId,
    setSelectedLiveTestId,
    timePeriod,
    setTimePeriod,
    searchQuery,
    setSearchQuery,
    dbExams,
    dbSubjects,
    isLoading,
    setCurrentPage,
    fetchRankings,
    filteredDbLiveTests,
    handleResetFilters,
  } = rk;
  return (
    <>
      {/* ==================================================================== */}
      {/* 4. FILTER TOOLBAR (Single clean card) */}
      {/* ==================================================================== */}
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-3.5 shadow-xs flex flex-wrap items-end gap-3">
        {/* Search Student Input */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Search Student
          </label>
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, district..."
              className="w-full bg-white border border-[#E2E8F0] rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-[#1E293B] placeholder:text-slate-400 focus:outline-none focus:border-[#2563EB]"
            />
          </div>
        </div>

        {/* Select Exam */}
        <div className="w-[150px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Select Exam</label>
          <div className="relative">
            <select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7 truncate"
            >
              <option value="All Exams">All Exams</option>
              {dbExams.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))}
              {dbExams.length === 0 && (
                <>
                  <option value="WBP Constable">WBP Constable</option>
                  <option value="KP SI">KP SI</option>
                  <option value="WBCS">WBCS</option>
                  <option value="Railways Group D">Railways Group D</option>
                  <option value="SSC CGL">SSC CGL</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Subject */}
        <div className="w-[150px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Select Subject
          </label>
          <div className="relative">
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              disabled={scopeTab === 'Live Tests'}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7 truncate disabled:opacity-50 disabled:bg-slate-50"
            >
              <option value="All Subjects">All Subjects</option>
              {dbSubjects.map((sub) => (
                <option key={sub.id} value={sub.name}>
                  {sub.name}
                </option>
              ))}
              {dbSubjects.length === 0 && (
                <>
                  <option value="General Science">General Science</option>
                  <option value="General Knowledge">General Knowledge</option>
                  <option value="Indian Polity">Indian Polity</option>
                  <option value="History">History</option>
                  <option value="Geography">Geography</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="Reasoning">Reasoning</option>
                </>
              )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Test Type */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
            Select Test Type
          </label>
          <div className="relative">
            <select
              value={selectedTestType}
              onChange={(e) => setSelectedTestType(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Types">All Types</option>
              <option value="Full Mock">Full Mock</option>
              <option value="Topic Test">Topic Test</option>
              <option value="Official PYQ">Official PYQ</option>
              <option value="Live Test">Live Test</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Select Live Test (shown when scopeTab is Live Tests or test type is Live Test) */}
        {(scopeTab === 'Live Tests' || selectedTestType === 'Live Test') && (
          <div className="w-[180px] animate-in fade-in duration-200">
            <label className="block text-[11px] font-semibold text-rose-600 mb-1 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 animate-pulse text-rose-500" />
              <span>Select Live Test</span>
            </label>
            <div className="relative">
              <select
                value={selectedLiveTestId}
                onChange={(e) => {
                  setSelectedLiveTestId(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none bg-rose-50/40 border border-rose-200 rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-rose-500 cursor-pointer pr-7 truncate"
              >
                <option value="All Live Tests">All Live Tests</option>
                {filteredDbLiveTests.map((lt) => (
                  <option key={lt.id} value={lt.id}>
                    {lt.title || 'Live Mock'} ({lt.status || 'live'})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-rose-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Time Period */}
        <div className="w-[130px]">
          <label className="block text-[11px] font-semibold text-[#64748B] mb-1">Time Period</label>
          <div className="relative">
            <select
              value={timePeriod}
              onChange={(e) => setTimePeriod(e.target.value)}
              className="w-full appearance-none bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#2563EB] cursor-pointer pr-7"
            >
              <option value="All Time">All Time</option>
              <option value="This Month">This Month</option>
              <option value="This Week">This Week</option>
              <option value="Today">Today</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchRankings();
            }}
            disabled={isLoading}
            className="bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-xs px-6 py-2 rounded-xl shadow-xs transition-colors cursor-pointer h-[34px] flex items-center gap-1.5"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Apply</span>
          </button>
          <button
            onClick={handleResetFilters}
            className="text-[#2563EB] hover:underline font-semibold text-xs px-2 py-2 cursor-pointer h-[34px] flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </>
  );
}
