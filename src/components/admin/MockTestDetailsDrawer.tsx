import React from 'react';
import type { MockTest } from '@/types';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { useMockTestDetailsDrawer } from './mockTestDetails/useMockTestDetailsDrawer';
import { computeAttemptMetrics, getTypeBadge } from './mockTestDetails/mockTestDetailsUtils';
import { DrawerHeader } from './mockTestDetails/DrawerHeader';
import { OverviewTab } from './mockTestDetails/OverviewTab';
import { QuestionsTab } from './mockTestDetails/QuestionsTab';
import { SettingsTab } from './mockTestDetails/SettingsTab';
import { AnalyticsTab } from './mockTestDetails/AnalyticsTab';
import { DrawerFooter } from './mockTestDetails/DrawerFooter';

interface MockTestDetailsDrawerProps {
  test: MockTest | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (test: MockTest) => void;
  onDelete: (testId: string) => void;
  onDuplicate: (testId: string) => void;
  onPreview: (test: MockTest) => void;
  onOpenAddQuestions: (test: MockTest) => void;
  onRefreshTest: () => void;
}

export const MockTestDetailsDrawer: React.FC<MockTestDetailsDrawerProps> = ({
  test,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  onPreview,
  onOpenAddQuestions,
  onRefreshTest,
}) => {
  const {
    activeTab,
    setActiveTab,
    copiedKey,
    setCopiedKey,
    assignedQuestions,
    setAssignedQuestions,
    isLoadingQuestions,
    isSavingQuestions,
    setIsSavingQuestions,
    attempts,
    isLoadingAttempts,
    isExportingAttempts,
    setIsExportingAttempts,
    settingsForm,
    setSettingsForm,
    isSavingSettings,
    setIsSavingSettings,
    isUploadingIcon,
    dragActiveIcon,
    setDragActiveIcon,
    handleUploadIconFile,
    loadQuestions,
  } = useMockTestDetailsDrawer(test, isOpen);

  if (!isOpen || !test) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= assignedQuestions.length) return;

    const newQuestions = [...assignedQuestions];
    const [moved] = newQuestions.splice(index, 1);
    newQuestions.splice(targetIndex, 0, moved);

    setAssignedQuestions(newQuestions);

    setIsSavingQuestions(true);
    try {
      const payload = newQuestions.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      }));
      await api.saveTestQuestions(test.id, payload);
      onRefreshTest();
    } catch (err) {
      console.error('Failed to reorder questions:', err);
      alert('Failed to update question order.');
      loadQuestions();
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const handleRemoveQuestion = async (questionId: string) => {
    if (
      !confirm(
        'Remove this question from this mock test? (The question remains in the Question Bank).'
      )
    ) {
      return;
    }

    const filtered = assignedQuestions.filter((q) => q.questionId !== questionId);
    setAssignedQuestions(filtered);

    setIsSavingQuestions(true);
    try {
      const payload = filtered.map((q, idx) => ({
        questionId: q.questionId,
        orderIndex: idx + 1,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
      }));
      await api.saveTestQuestions(test.id, payload);
      onRefreshTest();
    } catch (err) {
      console.error('Failed to remove question:', err);
      alert('Failed to remove question.');
      loadQuestions();
    } finally {
      setIsSavingQuestions(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await api.updateTest(test.id, {
        title: settingsForm.title,
        description: settingsForm.description,
        durationMinutes: Number(settingsForm.durationMinutes),
        totalMarks: Number(settingsForm.totalMarks),
        passingMarks: Number(settingsForm.passingMarks),
        negativeMarking: Number(settingsForm.negativeMarking),
        isPremium: settingsForm.isPremium,
        status: settingsForm.status,
        iconUrl: settingsForm.iconUrl.trim() || undefined,
      });
      alert('Mock test settings updated successfully!');
      onRefreshTest();
    } catch (err) {
      console.error('Failed to update settings:', err);
      alert('Failed to update settings: ' + getErrorMessage(err, 'Update failed'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleExportAttempts = async () => {
    setIsExportingAttempts(true);
    try {
      const rows = await api.getTestResultsForExport(test.id);
      if (!rows || rows.length === 0) {
        alert('No candidate attempts recorded yet for this test.');
        return;
      }
      api.exportTestResultsToCsv(test.title, rows);
    } catch (err) {
      console.error('Failed to export attempts:', err);
      alert('Export failed: ' + getErrorMessage(err, 'Export failed'));
    } finally {
      setIsExportingAttempts(false);
    }
  };
  const { totalAttemptsCount, avgScore, highestScore, passRate } = computeAttemptMetrics(
    attempts,
    test.passingMarks
  );

  const typeBadge = getTypeBadge(test.testType);

  const isPublished = test.status === 'published';

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-8">
        <div className="w-screen max-w-lg bg-white dark:bg-[#0A1024] border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Top Header */}
          <DrawerHeader
            test={test}
            typeBadge={typeBadge}
            isPublished={isPublished}
            assignedQuestionsCount={assignedQuestions.length}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onEdit={onEdit}
            onClose={onClose}
          />

          {/* Drawer Body - Scrollable */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <OverviewTab
                test={test}
                assignedQuestionsCount={assignedQuestions.length}
                totalAttemptsCount={totalAttemptsCount}
                avgScore={avgScore}
                passRate={passRate}
                copiedKey={copiedKey}
                handleCopy={handleCopy}
              />
            )}

            {/* TAB 2: QUESTIONS */}
            {activeTab === 'questions' && (
              <QuestionsTab
                test={test}
                assignedQuestions={assignedQuestions}
                isLoadingQuestions={isLoadingQuestions}
                isSavingQuestions={isSavingQuestions}
                onOpenAddQuestions={onOpenAddQuestions}
                handleMoveQuestion={handleMoveQuestion}
                handleRemoveQuestion={handleRemoveQuestion}
              />
            )}

            {/* TAB 3: SETTINGS */}
            {activeTab === 'settings' && (
              <SettingsTab
                settingsForm={settingsForm}
                setSettingsForm={setSettingsForm}
                dragActiveIcon={dragActiveIcon}
                setDragActiveIcon={setDragActiveIcon}
                isUploadingIcon={isUploadingIcon}
                isSavingSettings={isSavingSettings}
                handleUploadIconFile={handleUploadIconFile}
                handleSaveSettings={handleSaveSettings}
              />
            )}

            {/* TAB 4: ANALYTICS */}
            {activeTab === 'analytics' && (
              <AnalyticsTab
                test={test}
                attempts={attempts}
                isLoadingAttempts={isLoadingAttempts}
                isExportingAttempts={isExportingAttempts}
                avgScore={avgScore}
                highestScore={highestScore}
                handleExportAttempts={handleExportAttempts}
              />
            )}
          </div>

          {/* Bottom Action Bar */}
          <DrawerFooter
            test={test}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onPreview={onPreview}
          />
        </div>
      </div>
    </div>
  );
};
