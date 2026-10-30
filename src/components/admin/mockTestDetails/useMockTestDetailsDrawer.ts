import { useState, useEffect, useCallback } from 'react';
import type { MockTest, TestQuestionAssignment } from '@/types';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import type { DrawerTab, SettingsFormState } from './mockTestDetailsUtils';

export type TestAttemptRows = Awaited<ReturnType<typeof api.getTestAttempts>>;

export function useMockTestDetailsDrawer(test: MockTest | null, isOpen: boolean) {
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Questions state
  const [assignedQuestions, setAssignedQuestions] = useState<TestQuestionAssignment[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [isSavingQuestions, setIsSavingQuestions] = useState(false);

  // Analytics state
  const [attempts, setAttempts] = useState<TestAttemptRows>([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(false);
  const [isExportingAttempts, setIsExportingAttempts] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState<SettingsFormState>({
    title: '',
    description: '',
    iconUrl: '',
    durationMinutes: 90,
    totalMarks: 100,
    passingMarks: 40,
    negativeMarking: 0.25,
    isPremium: false,
    status: 'draft',
  });
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [dragActiveIcon, setDragActiveIcon] = useState(false);

  const handleUploadIconFile = async (file: File) => {
    if (!test?.id) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }
    try {
      setIsUploadingIcon(true);
      const uploadedUrl = await api.uploadTestIcon(file, test.id);
      setSettingsForm((prev) => ({ ...prev, iconUrl: uploadedUrl }));
    } catch (err) {
      alert('Failed to upload icon: ' + getErrorMessage(err, 'Error'));
    } finally {
      setIsUploadingIcon(false);
    }
  };

  const testId = test?.id;

  const loadQuestions = useCallback(async () => {
    if (!testId) return;
    setIsLoadingQuestions(true);
    try {
      const data = await api.getTestAssignedQuestions(testId);
      setAssignedQuestions(data);
    } catch (err) {
      console.error('Failed to load test questions:', err);
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [testId]);

  const loadAttempts = useCallback(async () => {
    if (!testId) return;
    setIsLoadingAttempts(true);
    try {
      const data = await api.getTestAttempts(testId);
      setAttempts(data || []);
    } catch (err) {
      console.error('Failed to load test attempts:', err);
    } finally {
      setIsLoadingAttempts(false);
    }
  }, [testId]);

  // Re-sync the settings form whenever the test data changes
  useEffect(() => {
    if (!test || !isOpen) return;

    setSettingsForm({
      title: test.title || '',
      description: test.description || '',
      iconUrl: test.iconUrl || '',
      durationMinutes: test.durationMinutes || 90,
      totalMarks: test.totalMarks || 100,
      passingMarks: test.passingMarks || 40,
      negativeMarking: test.negativeMarking ?? 0.25,
      isPremium: Boolean(test.isPremium),
      status: test.status || 'draft',
    });
  }, [test, isOpen]);

  // Load questions and attempts when the test changes or the drawer opens
  useEffect(() => {
    if (!testId || !isOpen) return;
    loadQuestions();
    loadAttempts();
  }, [testId, isOpen, loadQuestions, loadAttempts]);

  return {
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
  };
}
