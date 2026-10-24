import React, { useState } from 'react';
import { api } from '@/services/api';
import type { MockTest } from '@/types';
import { getErrorMessage } from '@/lib/errors';

export interface UseCreateTestQuestionArgs {
  currentTestId: string;
  test: MockTest | null;
  isBilingualEnabled: boolean;
  loadData: () => Promise<void>;
  setSaveSuccess: React.Dispatch<React.SetStateAction<boolean>>;
  setSaveMessage: React.Dispatch<React.SetStateAction<string>>;
}

export function useCreateTestQuestion({
  currentTestId,
  test,
  isBilingualEnabled,
  loadData,
  setSaveSuccess,
  setSaveMessage,
}: UseCreateTestQuestionArgs) {
  // ---------------------------------------------------------------------------
  // Direct Single Question Create Modal State
  // ---------------------------------------------------------------------------
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionBengali, setNewQuestionBengali] = useState('');
  const [newOptionA, setNewOptionA] = useState('');
  const [newOptionB, setNewOptionB] = useState('');
  const [newOptionC, setNewOptionC] = useState('');
  const [newOptionD, setNewOptionD] = useState('');
  const [newCorrectOption, setNewCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [newExplanation, setNewExplanation] = useState('');
  const [newMarks, setNewMarks] = useState(1.0);
  // NOTE: questions never carry negative marks (test-level policy), so there
  // is intentionally no per-question negative-marks field anywhere here.

  // ---------------------------------------------------------------------------
  // Direct Question Creation
  // ---------------------------------------------------------------------------
  const handleCreateQuestion = async () => {
    if (!currentTestId || !test) return;
    if (!newQuestionText.trim()) {
      setCreateError('Question text is required.');
      return;
    }
    if (!newOptionA.trim() || !newOptionB.trim() || !newOptionC.trim() || !newOptionD.trim()) {
      setCreateError('All four options (A, B, C, D) are required.');
      return;
    }

    try {
      setIsCreating(true);
      setCreateError('');
      const effectiveQuestionBengali = !isBilingualEnabled
        ? newQuestionText.trim()
        : newQuestionBengali.trim() || newQuestionText.trim();

      const res = await api.createQuestionForTest(currentTestId, {
        subjectId: test.subjectId,
        chapterId: test.chapterId || test.topicId,
        topicId: test.chapterId || test.topicId,
        questionText: newQuestionText.trim(),
        questionBengaliText: effectiveQuestionBengali,
        optionA: newOptionA.trim(),
        optionB: newOptionB.trim(),
        optionC: newOptionC.trim(),
        optionD: newOptionD.trim(),
        correctOption: newCorrectOption,
        explanation: newExplanation.trim() || undefined,
        explanationBengali: newExplanation.trim() || undefined,
        difficulty: 'medium',
        defaultMarks: newMarks,
        // Questions never carry negative marks — scoring uses the test-level scheme.
        defaultNegativeMarks: 0,
        isActive: true,
        status: 'active',
      });

      if (!res.success) {
        setCreateError(res.error || 'Failed to create question.');
        return;
      }

      setIsCreateModalOpen(false);
      await loadData();
      setSaveSuccess(true);
      setSaveMessage('Question created and attached to test!');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setCreateError(getErrorMessage(err, 'Error while creating question'));
    } finally {
      setIsCreating(false);
    }
  };

  return {
    isCreateModalOpen,
    setIsCreateModalOpen,
    isCreating,
    setIsCreating,
    createError,
    setCreateError,
    newQuestionText,
    setNewQuestionText,
    newQuestionBengali,
    setNewQuestionBengali,
    newOptionA,
    setNewOptionA,
    newOptionB,
    setNewOptionB,
    newOptionC,
    setNewOptionC,
    newOptionD,
    setNewOptionD,
    newCorrectOption,
    setNewCorrectOption,
    newExplanation,
    setNewExplanation,
    newMarks,
    setNewMarks,
    handleCreateQuestion,
  };
}
