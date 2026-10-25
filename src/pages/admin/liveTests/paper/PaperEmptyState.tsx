import { Check, Copy, Layers, Plus, Sparkles, Upload } from 'lucide-react';
import { SAMPLE_TXT_LIVE } from './liveTestPaperUtils';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperEmptyStateProps {
  ws: LiveTestWorkspaceState;
}

export function PaperEmptyState({ ws }: PaperEmptyStateProps) {
  const {
    copiedSample,
    setCopiedSample,
    openCreateQuestionModal,
    isTestLocked,
    setIsBulkModalOpen,
  } = ws;
  return (
    <>
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        {/* Studio Header */}
        <div className="text-center max-w-xl mx-auto space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200/70 mb-1">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>Paper Questions Setup</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            Add Questions to this Live Test Paper
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Live mock tests use exclusive, unreleased questions. They will remain completely
            confidential and hidden from students until the live exam starts.
          </p>
        </div>

        {/* 2 Big Action Cards Side-by-Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto text-left">
          {/* Card 1: Bulk Add via TXT */}
          <div
            onClick={() => {
              if (isTestLocked) return;
              setIsBulkModalOpen(true);
            }}
            className="group p-6 rounded-2xl border-2 border-blue-200/90 hover:border-blue-600 bg-gradient-to-br from-blue-50/40 via-white to-blue-50/20 hover:bg-blue-50/60 transition-all cursor-pointer space-y-4 shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-700">
                  Recommended • Fastest
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                  Bulk Add via TXT
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste or upload entire question papers at once. Automatic detection of questions,
                  4 options (A-D), Bengali text, correct answer keys, and explanations.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-blue-600 group-hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>Open Bulk TXT Uploader →</span>
              </button>
            </div>
          </div>

          {/* Card 2: Create Single Question */}
          <div
            onClick={() => {
              if (isTestLocked) return;
              openCreateQuestionModal();
            }}
            className="group p-6 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-gradient-to-br from-slate-50/40 via-white to-emerald-50/20 hover:bg-emerald-50/40 transition-all cursor-pointer space-y-4 shadow-xs hover:shadow-md flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <Plus className="w-6 h-6" />
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                  Interactive Editor
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                  Create Question Manually
                </h4>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Step-by-step editor modal with bilingual English/Bengali input, LaTeX mathematics
                  formulas, custom option keys, and diagram support.
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="w-full py-2.5 px-4 bg-white border border-slate-300 group-hover:border-emerald-500 text-slate-700 group-hover:text-emerald-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Create Single Question →</span>
              </button>
            </div>
          </div>
        </div>

        {/* Cheatsheet Format Box with 1-Click Copy Sample */}
        <div className="max-w-3xl mx-auto text-left bg-slate-50/80 rounded-2xl border border-slate-200/80 p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span className="text-xs font-bold text-slate-800">Accepted TXT Format Example</span>
              <span className="text-[10px] font-semibold text-slate-500 bg-slate-200/60 px-2 py-0.5 rounded-md hidden sm:inline-block">
                Bengali & English
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(SAMPLE_TXT_LIVE);
                setCopiedSample(true);
                setTimeout(() => setCopiedSample(false), 2000);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
            >
              {copiedSample ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Sample</span>
                </>
              )}
            </button>
          </div>

          <pre className="text-[11px] font-mono text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200/80 overflow-x-auto leading-relaxed shadow-2xs">
            {SAMPLE_TXT_LIVE}
          </pre>
        </div>
      </div>
    </>
  );
}
