import { BookOpen, Shield, Layers, CheckCircle2, FileText, Clock, Radio } from 'lucide-react';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface QuestionStatCardsProps {
  qb: AdminQuestionBankState;
}

export function QuestionStatCards({ qb }: QuestionStatCardsProps) {
  const {
    setActiveUploadMode,
    setViewModeFilter,
    setSelectedStatusFilter,
    setSelectedLiveTestFilter,
    setCurrentPage,
    stats,
  } = qb;
  return (
    <>
      {/* 3. SIX STAT METRIC CARDS (Exact values & styling from media_1791132993733.jpg) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {/* Card 1: Total Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('all');
            setViewModeFilter('all');
            setSelectedStatusFilter('all');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#026BFC] flex items-center justify-center shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Total Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.total.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">All question sources</p>
        </div>

        {/* Card 2: Exam Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('exam');
            setViewModeFilter('exam');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Exam Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.examQuestions.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Full Mocks & PYQs</p>
        </div>

        {/* Card 3: Subject Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('subject');
            setViewModeFilter('subject');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Layers className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Subject Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.subjectQuestions.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">For Topic Tests</p>
        </div>

        {/* Card: Live Test Questions */}
        <div
          onClick={() => {
            setActiveUploadMode('live');
            setViewModeFilter('live');
            setSelectedLiveTestFilter('all');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <Radio className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Live Test Questions</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.liveQuestions.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">For Live Tests</p>
        </div>

        {/* Card 4: Published */}
        <div
          onClick={() => {
            setSelectedStatusFilter('published');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Published</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.published.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Ready to use</p>
        </div>

        {/* Card 5: Draft */}
        <div
          onClick={() => {
            setSelectedStatusFilter('draft');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Draft</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.draft.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Not published</p>
        </div>

        {/* Card 6: Under Review */}
        <div
          onClick={() => {
            setSelectedStatusFilter('under_review');
            setCurrentPage(1);
          }}
          className="bg-white border border-slate-200/80 rounded-2xl p-3.5 shadow-2xs cursor-pointer hover:shadow-xs transition-shadow"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold text-slate-500">Under Review</span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">
              {stats.underReview.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-[10px] font-normal text-slate-400 mt-0.5">Needs check</p>
        </div>
      </div>
    </>
  );
}
