import React, { useState } from 'react';
import { Question, Subject, Chapter } from '@/types';
import { UploadMode } from './questionBankUtils';
import { api } from '@/services/api';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import { parseCsvRaw } from '@/utils/csvParser';
import { parseQuestionsTxt } from '@/utils/txtQuestionParser';
import { downloadQuestionTemplate, modeIdx } from './questionImportTemplates';

interface QuestionImportInput {
  subjects: Subject[];
  topics: Chapter[];
  selectedExamFilter: string;
  selectedSubjectFilter: string;
  selectedTopicFilter: string;
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  showToast: (msg: string) => void;
}

/** Bulk import modal: template download, CSV / TXT parsing and validation, and the import run. */
export function useQuestionImport({
  subjects,
  topics,
  selectedExamFilter,
  selectedSubjectFilter,
  selectedTopicFilter,
  setQuestions,
  showToast,
}: QuestionImportInput) {
  // Bulk Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importMode, setImportMode] = useState<UploadMode>('exam');
  const [importFile, setImportFile] = useState<File | null>(null);
  // By Exam import: the exam for rows that do not name one (TXT files / pasted questions)
  const [importExam, setImportExam] = useState('');
  const [importPasteText, setImportPasteText] = useState('');
  const [parsedImportQuestions, setParsedImportQuestions] = useState<Question[]>([]);
  const [importPreviewStats, setImportPreviewStats] = useState<{
    total: number;
    valid: number;
    errors: number;
    duplicates: number;
    errorList: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Download Templates (.CSV) with UTF-8 BOM for Bengali support
  const downloadTemplate = (mode: UploadMode, format: 'csv' | 'txt' = 'csv') =>
    downloadQuestionTemplate(mode, format, showToast);

  // Real File Upload Parser & Validator (Supports both .txt and .csv)
  const processImportFile = (file: File) => {
    setImportFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const findSubject = (name: string) =>
        name
          ? subjects.find((sub) => sub.name.trim().toLowerCase() === name.toLowerCase())
          : undefined;
      const findTopic = (name: string, subjectId?: string) =>
        name
          ? topics.find(
              (t) =>
                t.name.trim().toLowerCase() === name.toLowerCase() &&
                (!subjectId || t.subjectId === subjectId)
            )
          : undefined;

      const isTxt =
        file.name.toLowerCase().endsWith('.txt') ||
        (!text.trim().toLowerCase().startsWith('exam,') &&
          !text.trim().toLowerCase().startsWith('subject,') &&
          /^(?:(?:Q(?:uestion)?\s*)?[0-9০-৯]+[-.:)]\s*)/m.test(text));

      // -----------------------------------------------------------------------
      // TXT Format Question Parser Handler
      // -----------------------------------------------------------------------
      if (isTxt) {
        const parsedTxt = parseQuestionsTxt(text);
        if (parsedTxt.totalDetected === 0) {
          setImportPreviewStats({
            total: 0,
            valid: 0,
            errors: 1,
            duplicates: 0,
            errorList: ['The uploaded TXT file contains no identifiable question blocks.'],
          });
          setParsedImportQuestions([]);
          return;
        }

        const parsed: Question[] = [];
        const errors: string[] = [];

        parsedTxt.errors.forEach((err) => {
          errors.push(`Question #${err.questionNumber}: ${err.reason}`);
        });

        const activeSubject =
          selectedSubjectFilter !== 'all' ? findSubject(selectedSubjectFilter) : undefined;
        const activeTopic =
          selectedTopicFilter !== 'all'
            ? findTopic(selectedTopicFilter, activeSubject?.id)
            : undefined;

        parsedTxt.valid.forEach((q) => {
          const base: Question = {
            id: crypto.randomUUID(),
            questionText: q.questionText,
            questionBengaliText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            uploadMode: importMode,
            status: 'published',
            isActive: true,
            defaultMarks: 1.0,
            defaultNegativeMarks: 0.25,
            explanationBengali: q.explanation,
            shortNotes: q.explanation || '',
            imageUrl: q.imageUrl,
            tags: [],
          };

          if (importMode === 'exam') {
            parsed.push({
              ...base,
              sourceExam: selectedExamFilter !== 'all' ? selectedExamFilter : undefined,
              sourceType: 'other',
            });
          } else {
            parsed.push({
              ...base,
              sourceType: 'topic',
              subjectName:
                activeSubject?.name ||
                (selectedSubjectFilter !== 'all' ? selectedSubjectFilter : undefined),
              subjectId: activeSubject?.id,
              topicName:
                activeTopic?.name ||
                (selectedTopicFilter !== 'all' ? selectedTopicFilter : undefined),
              topicId: activeTopic?.id,
            });
          }
        });

        setImportPreviewStats({
          total: parsedTxt.totalDetected,
          valid: parsed.length,
          errors: errors.length,
          duplicates: 0,
          errorList: errors.slice(0, 5),
        });
        setParsedImportQuestions(parsed);
        return;
      }

      // RFC 4180 parsing: quoted commas, multi-line fields and "" escapes.
      const csvRows = parseCsvRaw(text.replace(/^\uFEFF/, ''));

      if (csvRows.length <= 1) {
        setImportPreviewStats({
          total: 0,
          valid: 0,
          errors: 1,
          duplicates: 0,
          errorList: ['The uploaded file is empty or missing headers.'],
        });
        setParsedImportQuestions([]);
        return;
      }

      const rows = csvRows.slice(1);
      const parsed: Question[] = [];
      const errors: string[] = [];
      // Columns up to and including correct_answer are required in each template.
      const requiredColumns = modeIdx(importMode, 'correct') + 1;
      const toNumber = (value: string | undefined, fallback: number) => {
        if (!value?.trim()) return fallback;
        const n = Number(value);
        return Number.isFinite(n) && n >= 0 ? n : NaN;
      };

      rows.forEach((parts, idx) => {
        const rowLabel = `Row ${idx + 2}`;
        if (parts.length < requiredColumns) {
          errors.push(
            `${rowLabel}: expected at least ${requiredColumns} columns, found ${parts.length}`
          );
          return;
        }
        const qText = parts[modeIdx(importMode, 'question')];
        const optA = parts[modeIdx(importMode, 'optA')];
        const optB = parts[modeIdx(importMode, 'optB')];
        const optC = parts[modeIdx(importMode, 'optC')];
        const optD = parts[modeIdx(importMode, 'optD')];
        const correct = (parts[modeIdx(importMode, 'correct')] || '').trim().toUpperCase();

        if (!qText) {
          errors.push(`${rowLabel}: Question text is empty`);
          return;
        }
        if (!optA || !optB || !optC || !optD) {
          errors.push(`${rowLabel}: Options A, B, C and D are mandatory`);
          return;
        }
        if (!['A', 'B', 'C', 'D'].includes(correct)) {
          errors.push(
            `${rowLabel}: correct_answer must be A, B, C or D (got "${parts[modeIdx(importMode, 'correct')] || ''}")`
          );
          return;
        }
        const marks = toNumber(parts[modeIdx(importMode, 'marks')], 1);
        const negativeMarks = toNumber(parts[modeIdx(importMode, 'negativeMarks')], 0.25);
        if (Number.isNaN(marks) || Number.isNaN(negativeMarks)) {
          errors.push(`${rowLabel}: marks and negative_marks must be non-negative numbers`);
          return;
        }
        const tags = (parts[modeIdx(importMode, 'tags')] || '')
          .split(';')
          .map((t) => t.trim())
          .filter(Boolean);
        const explanation = parts[modeIdx(importMode, 'explanation')] || '';
        const shortNotes = parts[modeIdx(importMode, 'shortNotes')] || '';

        const base: Question = {
          id: crypto.randomUUID(),
          questionText: qText,
          optionA: optA,
          optionB: optB,
          optionC: optC,
          optionD: optD,
          correctOption: correct as 'A' | 'B' | 'C' | 'D',
          uploadMode: importMode,
          status: 'published',
          isActive: true,
          defaultMarks: marks,
          defaultNegativeMarks: negativeMarks,
          explanationBengali: explanation || undefined,
          shortNotes,
          tags,
        };

        if (importMode === 'exam') {
          const rawType = (parts[1] || '').trim().toLowerCase();
          const sourceType: Question['sourceType'] = !rawType
            ? undefined
            : rawType.includes('pyq')
              ? 'pyq'
              : rawType === 'topic'
                ? 'topic'
                : 'other';
          const rawYear = (parts[2] || '').trim();
          if (rawYear && !/^\d{4}$/.test(rawYear)) {
            errors.push(`${rowLabel}: year must be a 4-digit year (got "${rawYear}")`);
            return;
          }
          parsed.push({
            ...base,
            sourceExam: parts[0] || undefined,
            sourceType,
            sourceYear: rawYear ? Number(rawYear) : undefined,
            sourcePaper: parts[3] || undefined,
          });
        } else {
          const subjectName = parts[0] || '';
          const topicName = parts[1] || '';
          const subject = findSubject(subjectName);
          const topic = findTopic(topicName, subject?.id);
          parsed.push({
            ...base,
            sourceType: 'topic',
            subjectName: subjectName || undefined,
            subjectId: subject?.id,
            topicName: topicName || undefined,
            chapterName: topicName || undefined,
            chapterId: topic?.id,
            subtopic: parts[2] || undefined,
          });
        }
      });

      setParsedImportQuestions(parsed);
      setImportPreviewStats({
        total: rows.length,
        valid: parsed.length,
        errors: errors.length,
        duplicates: 0,
        errorList: errors.slice(0, 5),
      });
    };
    reader.readAsText(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processImportFile(file);
  };

  const handleClearImportFile = () => {
    setImportFile(null);
    setParsedImportQuestions([]);
    setImportPreviewStats(null);
  };

  // Bulk paste box: validate pasted TXT-format questions exactly like an uploaded .txt file
  const handlePreviewPastedQuestions = () => {
    const text = importPasteText.trim();
    if (!text) return;
    processImportFile(new File([text], 'pasted-questions.txt', { type: 'text/plain' }));
  };

  // By Exam rows without their own exam take the exam chosen in the import box
  const importNeedsExam =
    importMode === 'exam' && !importExam && parsedImportQuestions.some((q) => !q.sourceExam);

  // Execute Real Bulk Import with controlled concurrency, real IDs and error retention
  const handleExecuteImport = async () => {
    if (!parsedImportQuestions.length || isImporting || importNeedsExam) return;
    setIsImporting(true);
    try {
      const toImport =
        importMode === 'exam'
          ? parsedImportQuestions.map((q) =>
              q.sourceExam ? q : { ...q, sourceExam: importExam || undefined }
            )
          : parsedImportQuestions;
      const batch = await runConfirmedBatch(toImport, (q) => api.createQuestion(q));
      setQuestions((prev) => [...batch.results.map((r) => r.value), ...prev]);
      setParsedImportQuestions(batch.failures.map((f) => f.input));
      if (!batch.failures.length) {
        setIsImportModalOpen(false);
        setImportFile(null);
        setImportPreviewStats(null);
        setImportPasteText('');
      }
      showToast(
        batch.results.length +
          ' saved; ' +
          batch.failures.length +
          ' failed.' +
          (batch.failures[0] ? ' ' + batch.failures[0].error : '')
      );
    } finally {
      setIsImporting(false);
    }
  };

  return {
    isImportModalOpen,
    setIsImportModalOpen,
    importMode,
    setImportMode,
    importExam,
    setImportExam,
    importPasteText,
    setImportPasteText,
    importFile,
    setImportFile,
    setParsedImportQuestions,
    importPreviewStats,
    setImportPreviewStats,
    isImporting,
    importNeedsExam,
    downloadTemplate,
    processImportFile,
    handleFileChange,
    handleClearImportFile,
    handlePreviewPastedQuestions,
    handleExecuteImport,
  };
}
