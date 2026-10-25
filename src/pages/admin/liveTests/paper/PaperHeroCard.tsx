import { Lock, Plus, Send, Unlock, Upload } from 'lucide-react';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperHeroCardProps {
  ws: LiveTestWorkspaceState;
}

export function PaperHeroCard({ ws }: PaperHeroCardProps) {
  const {
    liveTest,
    onPublish,
    onRelease,
    busy,
    isDraft,
    isEnded,
    isLiveOnly,
    openCreateQuestionModal,
    assignedQuestions,
    isTestLocked,
    setIsBulkModalOpen,
    test,
  } = ws;
  // Rendered only once the paper has loaded (the workspace shows a skeleton until then).
  if (!test) return null;
  return (
    <>
      {/* 3. HERO OVERVIEW COMMAND CARD */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4.5 sm:p-5 shadow-xs transition-all">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            {/* Exam Emblem Logo */}
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl border border-slate-200 bg-slate-50/70 p-1.5 shrink-0 flex items-center justify-center shadow-xs">
              <img
                src={liveTest.logo || liveTest.examLogo || '/images/exams/logo_wbp.png'}
                alt={liveTest.title}
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                }}
              />
            </div>

            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                  {liveTest.examTitle || test.examTitle || 'Full Mock Exam'} • Full Mock
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                  {liveTest.subscriptionRequired ? 'Pro Pass only' : 'Free for all students'}
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-purple-600" />
                  Exclusive Live Paper
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight line-clamp-1">
                {liveTest.title}
              </h1>

              <p className="text-xs text-slate-500 max-w-3xl leading-relaxed">
                {isDraft &&
                  'Draft Paper — Upload all questions for this live exam below. Live test questions are completely confidential and hidden from students and the public Question Bank until released.'}
                {!isDraft &&
                  !isEnded &&
                  'Published Exam — All questions are locked to guarantee integrity. Move the Live Test back to Draft to modify questions.'}
                {isEnded &&
                  (isLiveOnly
                    ? 'Exam Ended — Paper is still hidden. Click "Release to Practice" to make it an open practice mock test.'
                    : 'Exam Ended — This paper has been released to practice for all students.')}
              </p>
            </div>
          </div>

          {/* Top Header Actions */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap lg:self-center">
            {isDraft && (
              <>
                <button
                  type="button"
                  disabled={isTestLocked}
                  onClick={() => setIsBulkModalOpen(true)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  title="Bulk import questions from TXT file"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>+ Bulk Add (TXT)</span>
                </button>

                <button
                  type="button"
                  disabled={isTestLocked}
                  onClick={openCreateQuestionModal}
                  className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Create single question manually"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+ Create Question</span>
                </button>

                <button
                  type="button"
                  onClick={onPublish}
                  disabled={busy || assignedQuestions.length === 0}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-xs cursor-pointer"
                  title={
                    assignedQuestions.length === 0
                      ? 'Add at least one question before publishing'
                      : 'Publish Live Test'
                  }
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{busy ? 'Publishing…' : 'Publish Live Test'}</span>
                </button>
              </>
            )}

            {!isDraft && !isEnded && (
              <span className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>Questions Locked</span>
              </span>
            )}

            {isEnded && isLiveOnly && (
              <button
                type="button"
                onClick={onRelease}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-xl hover:bg-emerald-100 transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>{busy ? 'Releasing…' : 'Release to Practice'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
