import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { CreateMockTestModal } from '@/components/admin/CreateMockTestModal';
import { MockTestPreviewModal } from '@/components/admin/MockTestPreviewModal';
import { AddQuestionsToTestModal } from '@/components/admin/AddQuestionsToTestModal';
import { ImportTestsModal } from '@/components/admin/ImportTestsModal';
import { useAdminTests } from './tests/useAdminTests';
import { TestsPageHeader } from './tests/TestsPageHeader';
import { TestKpiCards } from './tests/TestKpiCards';
import { TestsTableCard } from './tests/TestsTableCard';
import { TestDetailsPanel } from './tests/TestDetailsPanel';

export const AdminTests: React.FC = () => {
  const testsState = useAdminTests();
  const {
    isLoading,
    exams,
    subjects,
    chapters,
    selectedTest,
    isCreateModalOpen,
    setIsCreateModalOpen,
    createInitialType,
    handleTestCreated,
    previewTest,
    isPreviewModalOpen,
    setIsPreviewModalOpen,
    setPreviewTest,
    isAddQuestionsModalOpen,
    setIsAddQuestionsModalOpen,
    loadAllData,
    isImportModalOpen,
    setIsImportModalOpen,
  } = testsState;

  return withAdminSkeleton(
    isLoading,
    <div className="space-y-5">
      <TestsPageHeader testsState={testsState} />

      <TestKpiCards testsState={testsState} />

      {/* 3. Main Split-Screen Container: Table on Left + Test Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <TestsTableCard testsState={testsState} />

        {/* Right Column: Test Details Card (Side-by-side with Table) */}
        <TestDetailsPanel testsState={testsState} />
      </div>

      {/* Modals */}
      <CreateMockTestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        exams={exams}
        subjects={subjects}
        chapters={chapters}
        onTestCreated={handleTestCreated}
        initialType={createInitialType}
      />

      <MockTestPreviewModal
        test={previewTest}
        isOpen={isPreviewModalOpen}
        onClose={() => {
          setIsPreviewModalOpen(false);
          setPreviewTest(null);
        }}
      />

      <AddQuestionsToTestModal
        test={selectedTest}
        isOpen={isAddQuestionsModalOpen}
        onClose={() => setIsAddQuestionsModalOpen(false)}
        subjects={subjects}
        chapters={chapters}
        onQuestionsAssigned={loadAllData}
      />

      <ImportTestsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        exams={exams}
        subjects={subjects}
        chapters={chapters}
        onImportComplete={loadAllData}
      />
    </div>,
    { label: 'Loading tests…', variant: 'table' }
  );
};
