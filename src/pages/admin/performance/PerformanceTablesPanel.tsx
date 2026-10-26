import {
  AlertTriangle,
  Award,
  BookOpen,
  ChevronDown,
  Download,
  Filter,
  Layers,
  LayoutList,
  Search,
  Target,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { WrongQuestionsTable } from './WrongQuestionsTable';
import { WeakTopicsTable } from './WeakTopicsTable';
import { TopTopicsTable } from './TopTopicsTable';
import { SubjectMetricsTable } from './SubjectMetricsTable';
import type { AdminPerformanceState } from './useAdminPerformance';

export interface PerformanceTablesPanelProps {
  perf: AdminPerformanceState;
}

export function PerformanceTablesPanel({ perf }: PerformanceTablesPanelProps) {
  const {
    activeTableTab,
    setActiveTableTab,
    viewMode,
    setViewMode,
    tableSearch,
    setTableSearch,
    tableSubjectFilter,
    setTableSubjectFilter,
    wrongQuestions,
    weakestTopics,
    topPerformingTopics,
    subjectMetrics,
    availableSubjects,
    filteredWrongQuestions,
    filteredWeakTopics,
    filteredTopTopics,
    filteredSubjects,
    handleExportCsv,
  } = perf;
  return (
    <>
      {/* ==================================================================== */}
      {/* 4. PERFORMANCE DIAGNOSTICS & ANALYTICS TABLES (TABLE VIEW) */}
      {/* ==================================================================== */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-xs overflow-hidden">
        {/* Table Master Header */}
        <div className="p-4 sm:p-5 border-b border-[#E2E8F0] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-extrabold text-[#0F172A] tracking-tight">
                Performance Diagnostics & Item Breakdown
              </h2>
              <span className="bg-[#EFF6FF] text-[#1D4ED8] text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200">
                Table View
              </span>
            </div>
            <p className="text-xs text-[#64748B] mt-0.5">
              Tabular view of most frequently failed questions, weak topics, top performing topics,
              and subject accuracy.
            </p>
          </div>

          {/* Master View Controls (View Mode Toggle & Export) */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            {/* View Mode Toggle: Tabbed vs All Tables */}
            <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('tabbed')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                  viewMode === 'tabbed'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
                title="Focused Tab View"
              >
                <LayoutList className="w-3.5 h-3.5" />
                <span>Tabbed</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('all')}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all',
                  viewMode === 'all'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
                title="All 4 Tables View"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>All Tables</span>
              </button>
            </div>

            {/* CSV Export Button */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="bg-white border border-[#E2E8F0] hover:bg-slate-50 text-[#1E293B] px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Tab Selection Bar (in Tabbed View Mode) */}
        {viewMode === 'tabbed' && (
          <div className="flex items-center gap-1.5 overflow-x-auto border-b border-[#E2E8F0] px-4 pt-3 pb-0 bg-slate-50/70">
            <button
              type="button"
              onClick={() => setActiveTableTab('wrong_questions')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'wrong_questions'
                  ? 'bg-white text-rose-700 border-rose-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Most Wrong Questions</span>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {wrongQuestions.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('weak_topics')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'weak_topics'
                  ? 'bg-white text-amber-700 border-amber-500 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-500" />
              <span>Weak Topics</span>
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {weakestTopics.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('top_topics')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'top_topics'
                  ? 'bg-white text-emerald-700 border-emerald-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <Award className="w-3.5 h-3.5 text-emerald-600" />
              <span>Top Performing Topics</span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {topPerformingTopics.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTableTab('subjects')}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2',
                activeTableTab === 'subjects'
                  ? 'bg-white text-blue-700 border-blue-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 border-transparent hover:bg-slate-100/60'
              )}
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>Subject Performance</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {subjectMetrics.length}
              </span>
            </button>
          </div>
        )}

        {/* Search & Subject Filter Bar */}
        <div className="p-3.5 bg-white border-b border-[#E2E8F0] flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Search questions, topics, or subjects..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 bg-slate-50/50"
            />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Subject:</span>
            </div>
            <div className="relative">
              <select
                value={tableSubjectFilter}
                onChange={(e) => setTableSubjectFilter(e.target.value)}
                className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 pr-8 appearance-none focus:outline-none focus:border-blue-500"
              >
                {availableSubjects.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Subjects' : s}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            {(tableSearch || tableSubjectFilter !== 'All') && (
              <button
                type="button"
                onClick={() => {
                  setTableSearch('');
                  setTableSubjectFilter('All');
                }}
                className="text-xs font-semibold text-blue-600 hover:underline px-1.5 py-1"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Table Render Content */}
        {viewMode === 'tabbed' ? (
          <div>
            {activeTableTab === 'wrong_questions' && (
              <WrongQuestionsTable data={filteredWrongQuestions} perf={perf} />
            )}
            {activeTableTab === 'weak_topics' && <WeakTopicsTable data={filteredWeakTopics} />}
            {activeTableTab === 'top_topics' && <TopTopicsTable data={filteredTopTopics} />}
            {activeTableTab === 'subjects' && <SubjectMetricsTable data={filteredSubjects} />}
          </div>
        ) : (
          /* Stacked View: All 4 Tables Rendered */
          <div className="divide-y divide-[#E2E8F0]">
            {/* Table 1: Most Wrong Questions */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Most Wrong Questions</h3>
                  <span className="bg-rose-100 text-rose-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredWrongQuestions.length} Questions
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                <WrongQuestionsTable data={filteredWrongQuestions} perf={perf} />
              </div>
            </div>

            {/* Table 2: Weak Topics */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">
                    Weak Topics (Needs Practice)
                  </h3>
                  <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredWeakTopics.length} Topics
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                <WeakTopicsTable data={filteredWeakTopics} />
              </div>
            </div>

            {/* Table 3: Top Performing Topics */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">Top Performing Topics</h3>
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredTopTopics.length} Topics
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                <TopTopicsTable data={filteredTopTopics} />
              </div>
            </div>

            {/* Table 4: Subject Performance */}
            <div className="p-4 sm:p-5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-sm font-black text-[#0F172A]">
                    Subject-wise Accuracy & Volume
                  </h3>
                  <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                    {filteredSubjects.length} Subjects
                  </span>
                </div>
              </div>
              <div className="rounded-xl border border-[#E2E8F0] overflow-hidden bg-white">
                <SubjectMetricsTable data={filteredSubjects} />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
