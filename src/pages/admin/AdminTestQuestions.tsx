import { AdminPageSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminTestQuestions } from './testQuestions/useAdminTestQuestions';
import { SelectTestPrompt } from './testQuestions/SelectTestPrompt';
import { TestQuestionsHeader } from './testQuestions/TestQuestionsHeader';
import { TestQuestionsAlerts } from './testQuestions/TestQuestionsAlerts';
import { TestQuestionsTabs } from './testQuestions/TestQuestionsTabs';
import { SectionalMarkingPanel } from './testQuestions/SectionalMarkingPanel';
import { QuestionSelectorTab } from './testQuestions/QuestionSelectorTab';
import { AssignedQuestionsTab } from './testQuestions/AssignedQuestionsTab';
import { BulkTxtImportModal } from './testQuestions/BulkTxtImportModal';
import { CreateQuestionModal } from './testQuestions/CreateQuestionModal';

export const AdminTestQuestions: React.FC = () => {
  const testQuestionsState = useAdminTestQuestions();
  const { isLoading, referencesLoading, test, assignedQuestions, countPreset, customCount } =
    testQuestionsState;

  if (isLoading || referencesLoading)
    return <AdminPageSkeleton label="Loading Test Workspace" variant="detail" />;

  if (!test) {
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
