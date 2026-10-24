import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import {
  useAdminTestQuestions,
  type UseAdminTestQuestionsOptions,
} from './testQuestions/useAdminTestQuestions';
import { SelectTestPrompt } from './testQuestions/SelectTestPrompt';
import { TestQuestionsHeader } from './testQuestions/TestQuestionsHeader';
import { TestQuestionsAlerts } from './testQuestions/TestQuestionsAlerts';
import { TestQuestionsTabs } from './testQuestions/TestQuestionsTabs';
import { SectionalMarkingPanel } from './testQuestions/SectionalMarkingPanel';
import { QuestionSelectorTab } from './testQuestions/QuestionSelectorTab';
import { AssignedQuestionsTab } from './testQuestions/AssignedQuestionsTab';
import { BulkTxtImportModal } from './testQuestions/BulkTxtImportModal';
import { CreateQuestionModal } from './testQuestions/CreateQuestionModal';

export interface AdminTestQuestionsProps extends UseAdminTestQuestionsOptions {
  /** Rendered above the workspace (e.g. the Live Test publish bar). */
  banner?: React.ReactNode;
}

export const AdminTestQuestions: React.FC<AdminTestQuestionsProps> = ({ banner, ...options }) => {
  const testQuestionsState = useAdminTestQuestions(options);
  const { isLoading, referencesLoading, test, assignedQuestions, countPreset, customCount } =
    testQuestionsState;

  if (isLoading || referencesLoading)
    return <AdminPageSkeleton label="Loading Test Workspace" variant="detail" />;

  if (!test) {
    if (options.liveMode) {
      return (
        <div className="max-w-xl mx-auto mt-16 p-6 rounded-2xl border border-rose-200 bg-rose-50 text-sm text-rose-700">
          This Live Test paper could not be loaded. Go back to Live Tests and try again.
        </div>
      );
    }
    return <SelectTestPrompt testQuestionsState={testQuestionsState} />;
  }

  const targetQuestionCount = test.totalQuestions || 0;
  const currentRandomTarget = countPreset === 'custom' ? customCount : countPreset;
  const completionPercentage =
    targetQuestionCount > 0
      ? Math.min(100, Math.round((assignedQuestions.length / targetQuestionCount) * 100))
      : 100;
  const isTargetAchieved =
    targetQuestionCount > 0 && assignedQuestions.length >= targetQuestionCount;

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-24">
      {banner}

      <TestQuestionsHeader
        testQuestionsState={testQuestionsState}
        test={test}
        targetQuestionCount={targetQuestionCount}
        completionPercentage={completionPercentage}
        isTargetAchieved={isTargetAchieved}
      />

      <TestQuestionsAlerts testQuestionsState={testQuestionsState} />

      <TestQuestionsTabs testQuestionsState={testQuestionsState} />

      <SectionalMarkingPanel testQuestionsState={testQuestionsState} />

      <QuestionSelectorTab
        testQuestionsState={testQuestionsState}
        test={test}
        currentRandomTarget={currentRandomTarget}
      />

      <AssignedQuestionsTab testQuestionsState={testQuestionsState} test={test} />

      <BulkTxtImportModal testQuestionsState={testQuestionsState} test={test} />

      <CreateQuestionModal testQuestionsState={testQuestionsState} test={test} />
    </div>
  );
};
