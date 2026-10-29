import React, { useState, useEffect } from 'react';
import { Question, Subject, Chapter } from '@/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { UploadMode, QuestionBankStatus } from './questionBankUtils';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';

type QuestionText = Pick<Question, 'questionText' | 'questionBengaliText'>;

interface AddQuestionFormInput {
  /** Rows on screen (the whole store in demo mode, only the current page with Supabase). */
  questions: Question[];
  subjects: Subject[];
  topics: Chapter[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  setActiveQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
  showToast: (msg: string) => void;
}

/** Add Question modal: form state, duplicate detection and submission. */
export function useAddQuestionForm({
  questions,
  subjects,
  topics,
  setQuestions,
  setActiveQuestion,
  showToast,
}: AddQuestionFormInput) {
  // Add Question Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalUploadMode, setModalUploadMode] = useState<UploadMode>('exam');

  // Add Modal Form State
  const [addExam, setAddExam] = useState('WBP Constable');
  const [addExamQuestionType, setAddExamQuestionType] = useState<'Full Mock' | 'Official PYQ'>(
    'Official PYQ'
  );
  const [addYear, setAddYear] = useState('2025');
  const [addPaper, setAddPaper] = useState('Set A');
  const [addSection, setAddSection] = useState('General Awareness');
  const [addSubject, setAddSubject] = useState('General Science');
  const [addTopic, setAddTopic] = useState('Heat & Temperature');
  const [addSubtopic, setAddSubtopic] = useState('');
  const [addQuestionBengali, setAddQuestionBengali] = useState('');
  const [addQuestionEnglish, setAddQuestionEnglish] = useState('');
  const [addOptA, setAddOptA] = useState('');
  const [addOptB, setAddOptB] = useState('');
  const [addOptC, setAddOptC] = useState('');
  const [addOptD, setAddOptD] = useState('');
  const [addCorrect, setAddCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [addMarks, setAddMarks] = useState(1);
  const [addNegativeMarks, setAddNegativeMarks] = useState(0.25);
  const [addExplanation, setAddExplanation] = useState('');
  const [addSource, setAddSource] = useState('Official PYQ');
  const [addTags, setAddTags] = useState<string[]>([]);
  const [addTagInput, setAddTagInput] = useState('');
  const [addStatus, setAddStatus] = useState<QuestionBankStatus>('published');
  const [duplicateWarning, setDuplicateWarning] = useState<{
    similarity: number;
    existingText: string;
  } | null>(null);
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Duplicate detection compares against every question. With Supabase the list on screen is
  // only one page, so the question texts alone are fetched once each time the modal opens.
  const [bankTexts, setBankTexts] = useState<QuestionText[] | null>(null);
  useEffect(() => {
    if (!isSupabaseConfigured || !isAddModalOpen) return;
    let cancelled = false;
    api
      .getAdminQuestionTexts()
      .then((texts) => {
        if (!cancelled) setBankTexts(texts);
      })
      .catch(() => {
        // Duplicate hints are advisory; fall back to the rows on screen.
      });
    return () => {
      cancelled = true;
    };
  }, [isAddModalOpen]);
  const duplicateCandidates: QuestionText[] =
    isSupabaseConfigured && bankTexts ? bankTexts : questions;

  // Duplicate Detection Logic
  const checkDuplicate = (text: string) => {
    if (!text || text.length < 8) {
      setDuplicateWarning(null);
      return;
    }
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\u0980-\u09FF]/g, '');
    for (const q of duplicateCandidates) {
      const existing = (q.questionBengaliText || q.questionText || '')
        .toLowerCase()
        .replace(/[^a-z0-9\u0980-\u09FF]/g, '');
      if (existing.length < 5) continue;
      if (cleanText.includes(existing) || existing.includes(cleanText)) {
        setDuplicateWarning({
          similarity: 94,
          existingText: q.questionBengaliText || q.questionText,
        });
        return;
      }
    }
    setDuplicateWarning(null);
  };

  // Handle Add Question Submission
  const handleCreateQuestionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;
    if (!addQuestionBengali.trim() && !addQuestionEnglish.trim()) {
      showToast('Question text is required.');
      return;
    }
    if (!addOptA.trim() || !addOptB.trim()) {
      showToast('Options A and B are required.');
      return;
    }

    try {
      setIsSubmittingAdd(true);
      const newId = crypto.randomUUID();
      const newQuestionItem: Question = {
        id: newId,
        questionBengaliText: addQuestionBengali.trim(),
        questionText: addQuestionEnglish.trim() || addQuestionBengali.trim(),
        optionA: addOptA.trim(),
        optionB: addOptB.trim(),
        optionC: addOptC.trim() || 'None of the above',
        optionD: addOptD.trim() || 'All of the above',
        correctOption: addCorrect,
        uploadMode: modalUploadMode,
        sourceExam: modalUploadMode === 'exam' ? addExam : undefined,
        // Exam questions are not linked to a Subject / Topic.
        subjectName: modalUploadMode === 'subject' ? addSubject : undefined,
        topicName: modalUploadMode === 'subject' ? addTopic : undefined,
        chapterName: modalUploadMode === 'subject' ? addTopic : undefined,
        subtopic: addSubtopic || undefined,
        questionType:
          modalUploadMode === 'exam'
            ? addExamQuestionType === 'Official PYQ'
              ? 'PYQ'
              : 'Full Mock'
            : 'Topic',
        sourceType:
          modalUploadMode === 'exam'
            ? addExamQuestionType === 'Official PYQ'
              ? 'pyq'
              : 'other'
            : 'topic',
        sourceYear: modalUploadMode === 'exam' ? Number(addYear) : undefined,
        sourcePaper: modalUploadMode === 'exam' ? addPaper : undefined,
        section: modalUploadMode === 'exam' ? addSection : undefined,
        explanation: addExplanation.trim(),
        explanationBengali: addExplanation.trim(),
        shortNotes: addExplanation.trim(),
        tags: addTags.length > 0 ? addTags : [modalUploadMode === 'exam' ? addExam : addSubject],
        status: addStatus,
        isActive: addStatus === 'published',
        defaultMarks: addMarks,
        defaultNegativeMarks: addNegativeMarks,
        versionHistory: [
          {
            version: 1,
            editedBy: 'Super Admin',
            editedAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
            changes: 'Initial question creation',
          },
        ],
      };

      const savedQuestion = await api.createQuestion({
        ...newQuestionItem,
        subjectId:
          modalUploadMode === 'subject'
            ? subjects.find((s) => s.name === addSubject)?.id
            : undefined,
        chapterId:
          modalUploadMode === 'subject' ? topics.find((t) => t.name === addTopic)?.id : undefined,
      });
      setQuestions((prev) => [savedQuestion, ...prev]);
      setActiveQuestion(savedQuestion);
      setIsAddModalOpen(false);

      // Reset form
      setAddQuestionBengali('');
      setAddQuestionEnglish('');
      setAddOptA('');
      setAddOptB('');
      setAddOptC('');
      setAddOptD('');
      setAddExplanation('');
      setAddTags([]);
      setDuplicateWarning(null);
      showToast(`Question #${savedQuestion.id} created successfully!`);
    } catch (err) {
      showToast(`Error creating question: ${getErrorMessage(err, 'Failed to create')}`);
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  return {
    isAddModalOpen,
    setIsAddModalOpen,
    modalUploadMode,
    setModalUploadMode,
    addExam,
    setAddExam,
    addExamQuestionType,
    setAddExamQuestionType,
    addYear,
    setAddYear,
    addPaper,
    setAddPaper,
    addSection,
    setAddSection,
    addSubject,
    setAddSubject,
    addTopic,
    setAddTopic,
    addSubtopic,
    setAddSubtopic,
    addQuestionBengali,
    setAddQuestionBengali,
    addQuestionEnglish,
    setAddQuestionEnglish,
    addOptA,
    setAddOptA,
    addOptB,
    setAddOptB,
    addOptC,
    setAddOptC,
    addOptD,
    setAddOptD,
    addCorrect,
    setAddCorrect,
    addMarks,
    setAddMarks,
    addNegativeMarks,
    setAddNegativeMarks,
    addExplanation,
    setAddExplanation,
    addSource,
    setAddSource,
    addTags,
    setAddTags,
    addTagInput,
    setAddTagInput,
    addStatus,
    setAddStatus,
    duplicateWarning,
    setDuplicateWarning,
    isSubmittingAdd,
    checkDuplicate,
    handleCreateQuestionSubmit,
  };
}
