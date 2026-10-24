import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminTestAttempts } from './testAttempts/useAdminTestAttempts';
import { TestAttemptsPageHeader } from './testAttempts/TestAttemptsPageHeader';
import { TestAttemptKpiCards } from './testAttempts/TestAttemptKpiCards';
import { TestAttemptFilterToolbar } from './testAttempts/TestAttemptFilterToolbar';
import { TestAttemptsTableCard } from './testAttempts/TestAttemptsTableCard';
import { TestAttemptDetailsPanel } from './testAttempts/TestAttemptDetailsPanel';
import { TestAttemptBulkActionBar } from './testAttempts/TestAttemptBulkActionBar';
import { DateRangeModal } from './testAttempts/DateRangeModal';
import { AnswerSheetModal } from './testAttempts/AnswerSheetModal';
import { TestDetailsModal } from './testAttempts/TestDetailsModal';
import { DeleteAttemptModal } from './testAttempts/DeleteAttemptModal';
export type {
  TestAttemptType,
  TestAttemptStatus,
  QuestionBreakdownItem,
  SectionAnalysisItem,
  AdminTestAttempt,
} from './testAttempts/testAttemptTypes';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const AdminTestAttempts: React.FC = () => {
  const testAttemptsState = useAdminTestAttempts();
  const { pageLoading } = testAttemptsState;

  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300 font-sans">
      <TestAttemptsPageHeader testAttemptsState={testAttemptsState} />

      <TestAttemptKpiCards testAttemptsState={testAttemptsState} />

      <TestAttemptFilterToolbar testAttemptsState={testAttemptsState} />

      {/* ==================================================================== */}
      {/* 4. MAIN SPLIT CONTENT: TABLE (LEFT) + ATTEMPT DETAILS (RIGHT) */}
      {/* ==================================================================== */}
      <div className="flex flex-col xl:flex-row items-start gap-4">
        <TestAttemptsTableCard testAttemptsState={testAttemptsState} />

        <TestAttemptDetailsPanel testAttemptsState={testAttemptsState} />
      </div>

      <TestAttemptBulkActionBar testAttemptsState={testAttemptsState} />

      <DateRangeModal testAttemptsState={testAttemptsState} />

      <AnswerSheetModal testAttemptsState={testAttemptsState} />

      <TestDetailsModal testAttemptsState={testAttemptsState} />

      <DeleteAttemptModal testAttemptsState={testAttemptsState} />
    </div>,
    { label: 'Loading test attempts…', variant: 'table' }
  );
};
