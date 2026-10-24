import { CheckCircle2, AlertCircle, Radio } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface TestQuestionsAlertsProps {
  testQuestionsState: AdminTestQuestionsState;
}

export function TestQuestionsAlerts({ testQuestionsState }: TestQuestionsAlertsProps) {
  const { isTestLocked, lockCheckError, saveError, saveMessage, saveSuccess } = testQuestionsState;
  return (
    <>
      {/* Save / Error Alert Banners */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{saveMessage || 'Test questions saved successfully!'}</span>
        </div>
      )}
      {saveError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-500 font-bold flex items-center gap-2.5 shadow-sm animate-fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Live Test Active Lock Banner */}
      {isTestLocked && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 text-rose-900 dark:text-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="font-black text-sm">🔒 Locked: Active Live Test Event</div>
              <div className="text-xs text-rose-700 dark:text-rose-300">
                {lockCheckError
                  ? `Live Test status could not be verified (${lockCheckError}). Adding, deleting, or reordering questions is locked until it can be confirmed.`
                  : 'This test is currently scheduled as an active or upcoming Live Test event. Adding, deleting, or reordering questions is locked to preserve exam integrity for live participants.'}
              </div>
            </div>
          </div>
          <Link
            to="/admin/live-tests"
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0 transition-colors w-fit"
          >
            View in Live Tests
          </Link>
        </div>
      )}
    </>
  );
}
