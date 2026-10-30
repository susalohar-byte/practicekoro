import type React from 'react';
import { useState, useEffect, useCallback } from 'react';
import type { Exam, Subject, Chapter, MockTest } from '@/types';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { useSmoothModal } from '@/hooks/useSmoothModal';

export type MockTestType = 'full_mock' | 'topic' | 'pyq';

interface UseCreateMockTestModalArgs {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  onTestCreated: (test: MockTest) => void;
  initialType: MockTestType;
}

export function useCreateMockTestModal({
  isOpen,
  onClose,
  exams,
  subjects,
  chapters,
  onTestCreated,
  initialType,
}: UseCreateMockTestModalArgs) {
  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(isOpen, onClose, 200);
  const [testType, setTestType] = useState<'full_mock' | 'topic' | 'pyq'>(initialType);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [iconUrl, setIconUrl] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [dragActiveIcon, setDragActiveIcon] = useState(false);

  const handleUploadIconFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    try {
      setIsUploadingIcon(true);
      setError(null);
      const url = await api.uploadTestIcon(file);
      setIconUrl(url);
    } catch (uploadErr) {
      setError(getErrorMessage(uploadErr, 'Failed to upload icon.'));
    } finally {
      setIsUploadingIcon(false);
    }
  };
  const [examId, setExamId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [paperName, setPaperName] = useState('Prelims');
  const [setName, setSetName] = useState('');
  // Topic Tests are exam-independent; these optional links only make them show under exams.
  const [associatedExamIds, setAssociatedExamIds] = useState<string[]>([]);
  const [generateFromBank, setGenerateFromBank] = useState(false);
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [totalMarks, setTotalMarks] = useState(100);
  const [passingMarks, setPassingMarks] = useState(40);
  const [negativeMarking, setNegativeMarking] = useState(0.25);
  const [isPremium, setIsPremium] = useState(false);
  // New tests have no questions yet, so they start as drafts; publish from Settings once
  // questions are assigned (publishing is validated there).
  const [status, setStatus] = useState<'draft' | 'published'>('draft');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedExam = exams.find((e) => e.id === examId);

  // Start every "create" from a clean form for the requested mode.
  useEffect(() => {
    if (!isOpen) return;
    setTestType(initialType);
    setTitle('');
    setDescription('');
    setIconUrl('');
    setExamId('');
    setSubjectId('');
    setChapterId('');
    setYear(new Date().getFullYear());
    setPaperName('Prelims');
    setSetName('');
    setAssociatedExamIds([]);
    setGenerateFromBank(false);
    setIsPremium(false);
    setStatus('draft');
    setError(null);
  }, [isOpen, initialType]);

  const applyTypeDefaults = useCallback(
    (type: 'full_mock' | 'topic' | 'pyq') => {
      if (type === 'full_mock') {
        setDurationMinutes(90);
        setTotalMarks(100);
        setPassingMarks(40);
        setNegativeMarking(0.25);
        setExamId((prev) => prev || exams[0]?.id || '');
      } else if (type === 'topic') {
        setDurationMinutes(30);
        setTotalMarks(25);
        setPassingMarks(10);
        setNegativeMarking(0.25);
        setSubjectId((prev) => prev || subjects[0]?.id || '');
      } else if (type === 'pyq') {
        setDurationMinutes(60);
        setTotalMarks(85);
        setPassingMarks(35);
        setNegativeMarking(0.25);
        setExamId((prev) => prev || exams[0]?.id || '');
      }
    },
    [exams, subjects]
  );

  // Sync mode defaults when testType changes (and when the modal is opened)
  useEffect(() => {
    if (!isOpen) return;
    applyTypeDefaults(testType);
  }, [isOpen, testType, applyTypeDefaults]);

  // Filter topics based on selected subject
  const availableChapters = chapters.filter((c) => !subjectId || c.subjectId === subjectId);

  // Auto-generate a title suggestion if title is empty
  const handleAutoSuggestTitle = () => {
    if (testType === 'full_mock') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(`${selectedExam.title} Full Mock Test 01`);
      }
    } else if (testType === 'topic') {
      const selectedSub = subjects.find((s) => s.id === subjectId);
      const selectedTop = chapters.find((c) => c.id === chapterId);
      if (selectedTop) {
        setTitle(`${selectedTop.name} Test 01`);
      } else if (selectedSub) {
        setTitle(`${selectedSub.name} Topic Test`);
      }
    } else if (testType === 'pyq') {
      const selectedExam = exams.find((e) => e.id === examId);
      if (selectedExam) {
        setTitle(
          `${selectedExam.title} ${year} ${paperName}${setName ? ` Set ${setName}` : ''} Official PYQ`
        );
      }
    }
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const generating = testType === 'topic' && generateFromBank;

    // Validation
    if (!generating && !title.trim()) {
      setError('Please provide a test title.');
      return;
    }

    if (testType === 'full_mock' && !examId) {
      setError('Full Mock tests must be linked to a specific competitive exam.');
      return;
    }

    if (testType === 'topic' && (!subjectId || !chapterId)) {
      setError('Topic tests must be linked to both a Subject and a Topic.');
      return;
    }

    if (testType === 'pyq' && (!examId || !year)) {
      setError('Official PYQ tests must be linked to an Exam and an Exam Year.');
      return;
    }

    setIsSubmitting(true);
    if (generating) {
      try {
        const topicName = chapters.find((c) => c.id === chapterId)?.name || 'Topic';
        const result = await api.generateTopicTests({
          subjectId,
          chapterId,
          topicName,
          associatedExamIds,
          description: description.trim() || undefined,
          iconUrl: iconUrl.trim() || undefined,
          durationMinutes: Number(durationMinutes),
          passingMarks: Number(passingMarks),
          negativeMarking: Number(negativeMarking),
          isPremium,
        });
        result.created.forEach((t) => onTestCreated(t));
        handleSmoothClose();
      } catch (err) {
        console.error('Failed to generate topic tests:', err);
        setError(getErrorMessage(err, 'Failed to generate topic tests.'));
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    try {
      const created = await api.createTest({
        title: title.trim(),
        description: description.trim() || undefined,
        iconUrl: iconUrl.trim() || undefined,
        testType,
        examId: testType === 'topic' ? undefined : examId || undefined,
        subjectId: testType === 'topic' ? subjectId : undefined,
        chapterId: testType === 'topic' ? chapterId : undefined,
        associatedExamIds: testType === 'topic' ? associatedExamIds : undefined,
        year: testType === 'pyq' ? year : undefined,
        paperName: testType === 'pyq' ? paperName : undefined,
        setName: testType === 'pyq' ? setName.trim() || undefined : undefined,
        durationMinutes: Number(durationMinutes),
        totalMarks: Number(totalMarks),
        passingMarks: Number(passingMarks),
        negativeMarking: Number(negativeMarking),
        isPremium,
        status,
        totalQuestions: 0,
        orderIndex: 0,
        slug: title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
        isActive: status === 'published',
      });

      onTestCreated(created);
      handleSmoothClose();
    } catch (err) {
      console.error('Failed to create mock test:', err);
      setError(getErrorMessage(err, 'Failed to create mock test. Please check inputs.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    shouldRender,
    isAnimating,
    handleSmoothClose,
    testType,
    setTestType,
    title,
    setTitle,
    description,
    setDescription,
    iconUrl,
    setIconUrl,
    isUploadingIcon,
    dragActiveIcon,
    setDragActiveIcon,
    handleUploadIconFile,
    examId,
    setExamId,
    subjectId,
    setSubjectId,
    chapterId,
    setChapterId,
    year,
    setYear,
    paperName,
    setPaperName,
    setName,
    setSetName,
    associatedExamIds,
    setAssociatedExamIds,
    generateFromBank,
    setGenerateFromBank,
    durationMinutes,
    setDurationMinutes,
    totalMarks,
    setTotalMarks,
    passingMarks,
    setPassingMarks,
    negativeMarking,
    setNegativeMarking,
    isPremium,
    setIsPremium,
    status,
    setStatus,
    isSubmitting,
    error,
    selectedExam,
    applyTypeDefaults,
    availableChapters,
    handleAutoSuggestTitle,
    handleSubmit,
  };
}

export type CreateMockTestForm = ReturnType<typeof useCreateMockTestModal>;
