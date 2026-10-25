import React, { useState, useEffect, useMemo } from 'react';
import { Question, Subject, Chapter } from '@/types';
import { UploadMode, QuestionBankStatus, questionBankType } from './questionBankUtils';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';

interface QuestionDrawerInput {
  subjects: Subject[];
  topics: Chapter[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  showToast: (msg: string) => void;
}

/** Question details drawer: the opened question, its edit form, save / delete, tags and shuffle. */
export function useQuestionDrawer({
  subjects,
  topics,
  setQuestions,
  showToast,
}: QuestionDrawerInput) {
  // Active / Opened Question in Right Drawer (Defaults to null - neutral initial state)
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [drawerTab, setDrawerTab] = useState<'details' | 'explanation' | 'history'>('details');

  // Drawer Edit Form States
  const [drawerBengaliText, setDrawerBengaliText] = useState('');
  const [drawerEnglishText, setDrawerEnglishText] = useState('');
  const [drawerOptions, setDrawerOptions] = useState<{ [key: string]: string }>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [drawerCorrectOption, setDrawerCorrectOption] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [drawerUploadMode, setDrawerUploadMode] = useState<UploadMode>('exam');
  const [drawerExam, setDrawerExam] = useState('');
  const [drawerSubject, setDrawerSubject] = useState('');
  const [drawerTopic, setDrawerTopic] = useState('');
  const [drawerType, setDrawerType] = useState<'PYQ' | 'Topic' | 'Full Mock'>('Topic');
  const [drawerYear, setDrawerYear] = useState<number | string>('');
  const [drawerSource, setDrawerSource] = useState('Official PYQ');
  const [drawerStatus, setDrawerStatus] = useState<QuestionBankStatus>('published');
  const [drawerTags, setDrawerTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [isUpdatingDrawer, setIsUpdatingDrawer] = useState(false);

  // Drawer Explanation Edit State (English and Bengali are stored separately)
  const [editExplanation, setEditExplanation] = useState('');
  const [editExplanationBengali, setEditExplanationBengali] = useState('');

  // Synchronize drawer fields whenever activeQuestion changes
  useEffect(() => {
    if (activeQuestion) {
      setDrawerBengaliText(activeQuestion.questionBengaliText || '');
      setDrawerEnglishText(activeQuestion.questionText || '');
      setDrawerOptions({
        A: activeQuestion.optionA || '',
        B: activeQuestion.optionB || '',
        C: activeQuestion.optionC || '',
        D: activeQuestion.optionD || '',
      });
      setDrawerCorrectOption((activeQuestion.correctOption as 'A' | 'B' | 'C' | 'D') || 'A');
      setDrawerUploadMode(
        (activeQuestion.uploadMode as UploadMode) ||
          (activeQuestion.sourceExam ? 'exam' : 'subject')
      );
      setDrawerExam(activeQuestion.sourceExam || '');
      setDrawerSubject(
        activeQuestion.subjectName ||
          subjects.find((s) => s.id === activeQuestion.subjectId)?.name ||
          ''
      );
      setDrawerTopic(
        activeQuestion.topicName ||
          activeQuestion.chapterName ||
          topics.find((t) => t.id === (activeQuestion.chapterId || activeQuestion.topicId))?.name ||
          ''
      );
      setDrawerType(questionBankType(activeQuestion));
      setDrawerYear(activeQuestion.sourceYear || '');
      setDrawerTags(activeQuestion.tags || []);
      setDrawerSource(
        activeQuestion.sourceType === 'pyq'
          ? 'Official PYQ'
          : activeQuestion.sourceType === 'topic'
            ? 'Original'
            : 'Reference'
      );
      setDrawerStatus(
        activeQuestion.status === 'active'
          ? 'published'
          : (activeQuestion.status as QuestionBankStatus) || 'draft'
      );
      setEditExplanation(activeQuestion.explanation || '');
      setEditExplanationBengali(activeQuestion.explanationBengali || '');
    }
    // Re-sync only when a different question is opened/saved; taxonomy lists are
    // read as a fallback for name lookup.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeQuestion]);

  // Topic options for the drawer: topics of the selected subject when it is known.
  const drawerTopicNames = useMemo(() => {
    const subjectId = subjects.find((s) => s.name === drawerSubject)?.id;
    return topics.filter((t) => !subjectId || t.subjectId === subjectId).map((t) => t.name);
  }, [subjects, topics, drawerSubject]);

  // Drawer Update Handler
  const handleUpdateDrawer = async () => {
    if (!activeQuestion || isUpdatingDrawer) return;
    try {
      setIsUpdatingDrawer(true);
      const englishText = drawerEnglishText.trim();
      const bengaliText = drawerBengaliText.trim();
      if (!englishText && !bengaliText) {
        showToast('Question text is required.');
        return;
      }
      const originalType = questionBankType(activeQuestion);
      const subjectId = drawerSubject
        ? subjects.find((s) => s.name === drawerSubject)?.id
        : undefined;
      const chapterId = drawerTopic
        ? topics.find((t) => t.name === drawerTopic && (!subjectId || t.subjectId === subjectId))
            ?.id
        : undefined;
      // Only send the fields this drawer edits; untouched columns keep their stored values.
      const updatedQuestion: Partial<Question> = {
        questionText: englishText || bengaliText,
        questionBengaliText: bengaliText,
        optionA: drawerOptions.A.trim(),
        optionB: drawerOptions.B.trim(),
        optionC: drawerOptions.C.trim(),
        optionD: drawerOptions.D.trim(),
        correctOption: drawerCorrectOption,
        // A Live Test question stays in its Live Test paper (its exam is not edited here).
        sourceExam: activeQuestion.isLiveOnly
          ? activeQuestion.sourceExam
          : drawerUploadMode === 'exam'
            ? drawerExam || undefined
            : '',
        isActive: drawerStatus === 'published',
        status: drawerStatus,
        tags: drawerTags,
        explanation: editExplanation.trim(),
        explanationBengali: editExplanationBengali.trim(),
      };
      // Subject / Topic belong to subject-wise questions only (not Exam or Live Test ones).
      const usesSubjectTopic = !activeQuestion.isLiveOnly && drawerUploadMode === 'subject';
      if (usesSubjectTopic && subjectId && subjectId !== activeQuestion.subjectId)
        updatedQuestion.subjectId = subjectId;
      if (
        usesSubjectTopic &&
        chapterId &&
        chapterId !== (activeQuestion.chapterId || activeQuestion.topicId)
      )
        updatedQuestion.chapterId = chapterId;
      if (drawerType !== originalType) {
        updatedQuestion.sourceType =
          drawerType === 'PYQ' ? 'pyq' : drawerType === 'Full Mock' ? 'other' : 'topic';
      }
      const nextYear = drawerYear ? Number(drawerYear) : undefined;
      // updateQuestion stores a falsy year as NULL, so 0 clears a previously saved year.
      if (nextYear !== activeQuestion.sourceYear) updatedQuestion.sourceYear = nextYear ?? 0;

      const savedQuestion = await api.updateQuestion(activeQuestion.id, updatedQuestion);

      setQuestions((prev) => prev.map((q) => (q.id === activeQuestion.id ? savedQuestion : q)));
      setActiveQuestion(savedQuestion);
      showToast(`Question #${activeQuestion.id} updated successfully!`);
    } catch (err) {
      showToast(`Error updating question: ${getErrorMessage(err, 'Failed to update')}`);
    } finally {
      setIsUpdatingDrawer(false);
    }
  };

  // Drawer Delete Handler
  const handleDeleteActiveQuestion = async () => {
    if (
      !activeQuestion ||
      !window.confirm('Permanently delete this question? Linked records are protected.')
    )
      return;
    try {
      const id = activeQuestion.id;
      await api.deleteQuestion(id);
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      setActiveQuestion(null);
      showToast('Question deleted in the backend.');
    } catch (err) {
      showToast(getErrorMessage(err, 'Delete failed'));
    }
  };

  // Add Tag in Drawer
  const handleAddDrawerTag = () => {
    if (newTagInput.trim() && !drawerTags.includes(newTagInput.trim())) {
      setDrawerTags([...drawerTags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveDrawerTag = (tagToRemove: string) => {
    setDrawerTags(drawerTags.filter((t) => t !== tagToRemove));
  };

  // Shuffle Options in Drawer
  const handleShuffleDrawerOptions = () => {
    const keys: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
    const currentCorrectText = drawerOptions[drawerCorrectOption];
    const values = [drawerOptions.A, drawerOptions.B, drawerOptions.C, drawerOptions.D].sort(
      () => Math.random() - 0.5
    );
    const newOpts: { [key: string]: string } = {
      A: values[0],
      B: values[1],
      C: values[2],
      D: values[3],
    };
    const newCorrect = keys.find((k) => newOpts[k] === currentCorrectText) || 'A';
    setDrawerOptions(newOpts);
    setDrawerCorrectOption(newCorrect);
    showToast('Options shuffled randomly.');
  };

  return {
    activeQuestion,
    setActiveQuestion,
    drawerTab,
    setDrawerTab,
    drawerBengaliText,
    setDrawerBengaliText,
    drawerEnglishText,
    setDrawerEnglishText,
    drawerOptions,
    setDrawerOptions,
    drawerCorrectOption,
    setDrawerCorrectOption,
    drawerUploadMode,
    setDrawerUploadMode,
    drawerExam,
    setDrawerExam,
    drawerSubject,
    setDrawerSubject,
    drawerTopic,
    setDrawerTopic,
    drawerType,
    setDrawerType,
    drawerYear,
    setDrawerYear,
    drawerSource,
    setDrawerSource,
    drawerStatus,
    setDrawerStatus,
    drawerTags,
    newTagInput,
    setNewTagInput,
    isUpdatingDrawer,
    editExplanation,
    setEditExplanation,
    editExplanationBengali,
    setEditExplanationBengali,
    drawerTopicNames,
    handleUpdateDrawer,
    handleDeleteActiveQuestion,
    handleAddDrawerTag,
    handleRemoveDrawerTag,
    handleShuffleDrawerOptions,
  };
}
