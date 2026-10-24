import { cn } from '@/lib/utils';
import { Shield, BookOpen, Radio } from 'lucide-react';
import type { AdminQuestionBankState } from './useAdminQuestionBank';

export interface UploadModeSelectorProps {
  qb: AdminQuestionBankState;
}

export function UploadModeSelector({ qb }: UploadModeSelectorProps) {
  const {
    activeUploadMode,
    setActiveUploadMode,
    setViewModeFilter,
    setCurrentPage,
    showToast,
    stats,
    liveTests,
    selectedLiveTestFilter,
    setSelectedLiveTestFilter,
  } = qb;
  return (
    <>
      {/* 2. UPLOAD MODE SELECTOR CARDS (BY EXAM / BY SUBJECT / LIVE TEST) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* BY EXAM CARD */}
        <div
          onClick={() => {
            const nextMode = activeUploadMode === 'exam' ? 'all' : 'exam';
            setActiveUploadMode(nextMode);
            setViewModeFilter(nextMode);
            setCurrentPage(1);
            showToast(
              nextMode === 'exam' ? 'Filtered by Exam questions.' : 'Showing all questions.'
            );
          }}
          className={cn(
            'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none',
            activeUploadMode === 'exam'
              ? 'bg-blue-50/70 border-[#026BFC] shadow-sm ring-1 ring-[#026BFC]/30'
              : 'bg-white border-slate-200/80 hover:border-blue-300'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-[#026BFC] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">By Exam</h3>
              {activeUploadMode === 'exam' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                  Active Filter
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Upload questions for a specific exam
            </p>
            <p className="text-[11px] font-normal text-slate-400">
              (Used for Full Mock Tests & Official PYQs)
            </p>
          </div>
        </div>

        {/* BY SUBJECT CARD */}
        <div
          onClick={() => {
            const nextMode = activeUploadMode === 'subject' ? 'all' : 'subject';
            setActiveUploadMode(nextMode);
            setViewModeFilter(nextMode);
            setCurrentPage(1);
            showToast(
              nextMode === 'subject' ? 'Filtered by Subject questions.' : 'Showing all questions.'
            );
          }}
          className={cn(
            'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none',
            activeUploadMode === 'subject'
              ? 'bg-purple-50/70 border-purple-500 shadow-sm ring-1 ring-purple-500/30'
              : 'bg-white border-slate-200/80 hover:border-purple-300'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">By Subject</h3>
              {activeUploadMode === 'subject' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700">
                  Active Filter
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Upload subject-wise questions
            </p>
            <p className="text-[11px] font-normal text-slate-400">(Used for Topic Tests)</p>
          </div>
        </div>

        {/* LIVE TEST CARD */}
        <div
          onClick={() => {
            const nextMode = activeUploadMode === 'live' ? 'all' : 'live';
            setActiveUploadMode(nextMode);
            setViewModeFilter('all');
            setSelectedLiveTestFilter('all');
            setCurrentPage(1);
            showToast(
              nextMode === 'live' ? 'Showing Live Test questions.' : 'Showing all questions.'
            );
          }}
          className={cn(
            'flex items-center gap-4 p-4 rounded-2xl border transition-all cursor-pointer select-none',
            activeUploadMode === 'live'
              ? 'bg-rose-50/70 border-rose-500 shadow-sm ring-1 ring-rose-500/30'
              : 'bg-white border-slate-200/80 hover:border-rose-300'
          )}
        >
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Radio className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Live Test</h3>
              {activeUploadMode === 'live' && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                  Active Filter
                </span>
              )}
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">
              Upload questions for a Live Test paper
            </p>
            <p className="text-[11px] font-normal text-slate-400">
              ({stats.liveQuestions} questions · hidden from students until released)
            </p>
          </div>
        </div>
      </div>

      {activeUploadMode === 'live' && (
        <div className="flex flex-wrap items-center gap-2 -mt-2">
          <label className="text-xs font-semibold text-slate-600">Live Test:</label>
          <select
            value={selectedLiveTestFilter}
            onChange={(e) => {
              setSelectedLiveTestFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500"
          >
            <option value="all">All Live Tests</option>
            {liveTests.map((lt) => (
              <option key={lt.id} value={lt.id}>
                {lt.title} ({lt.status === 'draft' ? 'Draft' : lt.status})
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
