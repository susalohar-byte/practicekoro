import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import { BulkTxtImportModal } from '../../testQuestions/BulkTxtImportModal';
import { CreateQuestionModal } from '../../testQuestions/CreateQuestionModal';
import { SectionalMarkingPanel } from '../../testQuestions/SectionalMarkingPanel';
import { useLiveTestWorkspace, type LiveTestWorkspaceInnerProps } from './useLiveTestWorkspace';
import { PaperHeaderBar } from './PaperHeaderBar';
import { PaperHeroCard } from './PaperHeroCard';
import { PaperMetricsGrid } from './PaperMetricsGrid';
import { PaperToolbar } from './PaperToolbar';
import { PaperEmptyState } from './PaperEmptyState';
import { PaperQuestionList } from './PaperQuestionList';
import { PaperQuestionDrawer } from './PaperQuestionDrawer';
import { PaperSummaryBar } from './PaperSummaryBar';

/**
 * Modern Question Paper Workspace matching the Question Bank layout:
 * - Clean Data Table on the left with search, subject filter, and inline marks & reorder controls
 * - Side-by-side Inspector Drawer on the right to review bilingual text, math, options, and explanations
 * - Quick-edit mode in drawer to instantly fix typos or answers
 * - View mode toggle (Table View vs Detailed Card View)
 */
export function LiveTestWorkspaceInner(props: LiveTestWorkspaceInnerProps) {
  const ws = useLiveTestWorkspace(props);
  const { isLoading, referencesLoading, test, testQuestionsState, assignedQuestions } = ws;

  if (isLoading || referencesLoading || !test) {
    return <AdminPageSkeleton label="Loading Live Test Questions..." variant="detail" />;
  }

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-24 animate-in fade-in duration-200">
      <PaperHeaderBar ws={ws} />

      <PaperHeroCard ws={ws} />

      <PaperMetricsGrid ws={ws} />

      <PaperToolbar ws={ws} />

      {/* 6. SECTIONAL MARKING DRAWER PANEL */}
      <SectionalMarkingPanel testQuestionsState={testQuestionsState} />

      {/* 7. QUESTIONS CONTENT AREA */}
      {assignedQuestions.length === 0 ? (
        /* HERO EMPTY STATE STUDIO */
        <PaperEmptyState ws={ws} />
      ) : (
        /* 8. MAIN QUESTIONS SPLIT GRID (QUESTION BANK STYLE) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <PaperQuestionList ws={ws} />

          <PaperQuestionDrawer ws={ws} />
        </div>
      )}

      <PaperSummaryBar ws={ws} />

      {/* 10. MODALS */}
      <BulkTxtImportModal testQuestionsState={testQuestionsState} test={test} />
      <CreateQuestionModal testQuestionsState={testQuestionsState} test={test} />
    </div>
  );
}
