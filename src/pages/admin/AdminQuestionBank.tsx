import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useAdminQuestionBank } from './questionBank/useAdminQuestionBank';
import { QuestionImportModal } from './questionBank/QuestionImportModal';
import { LiveTestUploadModal } from './questionBank/LiveTestUploadModal';
import { AddQuestionModal } from './questionBank/AddQuestionModal';
import { QuestionDetailsDrawer } from './questionBank/QuestionDetailsDrawer';
import { QuestionTablePanel } from './questionBank/QuestionTablePanel';
import { QuestionBulkActionBar } from './questionBank/QuestionBulkActionBar';
import { QuestionQuickSelect } from './questionBank/QuestionQuickSelect';
import { QuestionFilterToolbar } from './questionBank/QuestionFilterToolbar';
import { QuestionStatCards } from './questionBank/QuestionStatCards';
import { UploadModeSelector } from './questionBank/UploadModeSelector';
import { QuestionBankHeader } from './questionBank/QuestionBankHeader';
export type { UploadMode, QuestionBankStatus } from './questionBank/questionBankUtils';
export { questionBankType, questionBankStatus } from './questionBank/questionBankUtils';

export const AdminQuestionBank: React.FC = () => {
  const qb = useAdminQuestionBank();
  const { isLoading, toastMessage } = qb;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200 border border-slate-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <QuestionBankHeader qb={qb} />

      <UploadModeSelector qb={qb} />

      <QuestionStatCards qb={qb} />

      <QuestionFilterToolbar qb={qb} />

      <QuestionQuickSelect qb={qb} />

      <QuestionBulkActionBar qb={qb} />

      {/* 5. MAIN CONTENT GRID (TABLE 8 COLS, DRAWER 4 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <QuestionTablePanel qb={qb} />

        <QuestionDetailsDrawer qb={qb} />
      </div>

      <AddQuestionModal qb={qb} />

      <QuestionImportModal qb={qb} />

      <LiveTestUploadModal qb={qb} />
    </div>,
    { label: 'Loading question bank…', variant: 'table' }
  );
};
