import { useMemo } from 'react';
import { Search, X, Filter } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionFilterToolbarProps {
  qb: AdminQuestionBankState;
}

export function QuestionFilterToolbar({ qb }: QuestionFilterToolbarProps) {
  const {
    searchQuery,
    setSearchQuery,
    setCurrentPage,
    viewModeFilter,
    setViewModeFilter,
    setActiveUploadMode,
    selectedExamFilter,
    setSelectedExamFilter,
    exams,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    subjects,
    selectedTopicFilter,
    setSelectedTopicFilter,
    filterTopicOptions,
    questions,
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedYearFilter,
    setSelectedYearFilter,
    selectedSourceFilter,
    setSelectedSourceFilter,
    showToast,
    filteredQuestions,
  } = qb;

  // Deduplicated list of available subjects
  const availableSubjectOptions = useMemo(() => {
    const list: string[] = [];
    const seen = new Set<string>();

    subjects.forEach((s) => {
      const name = s.name?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    });

    questions?.forEach((q) => {
      const name = q.subjectName?.trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        list.push(name);
      }
    });

    const defaults = [
      'History',
      'General Science',
      'Indian Polity',
      'Mathematics',
      'Geography',
      'Economy',
      'General Knowledge',
      'Static GK',
    ];
    defaults.forEach((d) => {
      if (!seen.has(d.toLowerCase())) {
        seen.add(d.toLowerCase());
        list.push(d);
      }
    });

    return list;
  }, [subjects, questions]);
  return (
    <>
      {/* 4. SEARCH AND FILTERS TOOLBAR */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs space-y-3">
        {/* Row 1: Search, View Mode, Exam, Subject, Topic */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search questions..."
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl pl-10 pr-7 py-2 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#026BFC]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* View Mode */}
          <div>
            <select
              value={viewModeFilter}
              onChange={(e) => {
                const val = e.target.value as 'all' | 'exam' | 'subject' | 'live';
                setViewModeFilter(val);
                setActiveUploadMode(val);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">View Mode: All Questions</option>
              <option value="exam">View Mode: By Exam</option>
              <option value="subject">View Mode: By Subject</option>
              <option value="live">View Mode: Live Test</option>
            </select>
          </div>

          {/* Exam Filter */}
          <div>
            <select
              value={selectedExamFilter}
              onChange={(e) => {
                setSelectedExamFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={viewModeFilter === 'subject'}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] disabled:opacity-40 cursor-pointer"
            >
              <option value="all">Exam: All Exams</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.title}>
                  {ex.title}
                </option>
              ))}
              <option value="WBP Constable">WBP Constable</option>
              <option value="WBSSC Group C">WBSSC Group C</option>
              <option value="WBSSC Group D">WBSSC Group D</option>
              <option value="Railway NTPC">Railway NTPC</option>
              <option value="ICDS">ICDS</option>
            </select>
          </div>

          {/* Subject Filter */}
          <div>
            <select
              value={selectedSubjectFilter}
              onChange={(e) => {
                setSelectedSubjectFilter(e.target.value);
                setSelectedTopicFilter('all');
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Subject: All Subjects</option>
              {availableSubjectOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div>
            <select
              value={selectedTopicFilter}
              onChange={(e) => {
                setSelectedTopicFilter(e.target.value);
                setCurrentPage(1);
              }}
              disabled={selectedSubjectFilter !== 'all' && filterTopicOptions.length === 0}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer disabled:opacity-50"
            >
              <option value="all">
                {selectedSubjectFilter === 'all'
                  ? 'Topic: All Topics'
                  : filterTopicOptions.length === 0
                    ? `No topics for ${selectedSubjectFilter}`
                    : `Topic: All (${selectedSubjectFilter})`}
              </option>
              {filterTopicOptions.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Type, Status, Year, Source, Filter, Reset */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 items-center">
          {/* Type Filter */}
          <div>
            <select
              value={selectedTypeFilter}
              onChange={(e) => {
                setSelectedTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Type: All Types</option>
              <option value="pyq">PYQ</option>
              <option value="topic">Topic</option>
              <option value="full mock">Full Mock</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatusFilter}
              onChange={(e) => {
                setSelectedStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Status: All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="under_review" disabled={isSupabaseConfigured}>
                Under Review (not supported by backend)
              </option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYearFilter}
              onChange={(e) => {
                setSelectedYearFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Year: All Years</option>
              <option value="2026">2026</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
              <option value="2021">2021</option>
            </select>
          </div>

          {/* Source Filter */}
          <div>
            <select
              value={selectedSourceFilter}
              onChange={(e) => {
                setSelectedSourceFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#F8FAFC] border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:border-[#026BFC] cursor-pointer"
            >
              <option value="all">Source: All Sources</option>
              <option value="official pyq">Official PYQ</option>
              <option value="original">Original</option>
              <option value="reference">Reference</option>
              <option value="ai-assisted">AI-assisted</option>
            </select>
          </div>

          {/* Action Buttons: Filter & Reset */}
          <div className="col-span-2 flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => {
                showToast(`Filters active: ${filteredQuestions.length} questions matching.`);
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setViewModeFilter('all');
                setActiveUploadMode('all');
                setSelectedExamFilter('all');
                setSelectedSubjectFilter('all');
                setSelectedTopicFilter('all');
                setSelectedTypeFilter('all');
                setSelectedStatusFilter('all');
                setSelectedYearFilter('all');
                setSelectedSourceFilter('all');
                setCurrentPage(1);
                showToast('Filters reset to default.');
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
