import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Radio } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperHeaderBarProps {
  ws: LiveTestWorkspaceState;
}

export function PaperHeaderBar({ ws }: PaperHeaderBarProps) {
  const { liveTest, message, isDraft, isEnded, saveError, saveMessage, saveSuccess, test } = ws;
  // Rendered only once the paper has loaded (the workspace shows a skeleton until then).
  if (!test) return null;
  return (
    <>
      {/* 1. TOP NAVIGATION & BREADCRUMBS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            to="/admin/live-tests"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Live Tests</span>
          </Link>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-semibold text-slate-600 truncate max-w-[200px]">
            {liveTest.examTitle || test.examTitle || 'Exams'}
          </span>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-bold text-slate-900">Question Paper Workspace</span>
        </div>

        {/* Live Status Indicator Pill */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/80 shadow-2xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
              </span>
              Draft Paper • Editing Mode
            </span>
          )}
          {!isDraft && !isEnded && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 shadow-2xs">
              <Radio className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              Published • Questions Locked
            </span>
          )}
          {isEnded && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Ended • Concluded
            </span>
          )}
        </div>
      </div>

      {/* 2. ALERTS & NOTIFICATIONS */}
      {message && (
        <div
          className={cn(
            'flex items-start gap-2.5 p-3.5 rounded-xl text-xs font-bold border shadow-xs animate-in fade-in',
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          )}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600" />
          )}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{saveMessage || 'Paper questions and marks saved successfully.'}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 shadow-xs animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}
    </>
  );
}
