import { useState, useMemo } from 'react';
import { api } from '@/services/api';
import type { MockTest } from '@/types';
import { parseQuestionsTxt } from '@/utils/txtQuestionParser';
import { getErrorMessage } from '@/lib/errors';

export interface UseBulkTxtImportArgs {
  test: MockTest | null;
  loadData: () => Promise<void>;
}

export function useBulkTxtImport({ test, loadData }: UseBulkTxtImportArgs) {
  // ---------------------------------------------------------------------------
  // Bulk TXT Modal State
  // ---------------------------------------------------------------------------
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkRawText, setBulkRawText] = useState('');
  const [isImportingBulk, setIsImportingBulk] = useState(false);
  const [bulkError, setBulkError] = useState('');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState('');

  // ---------------------------------------------------------------------------
  // Bulk TXT Upload Workflow
  // ---------------------------------------------------------------------------
  const parsedBulkResult = useMemo(() => {
    if (!bulkRawText.trim()) return null;
    // Subject context enforces Short Notes rules for non-Mathematics tests.
    return parseQuestionsTxt(bulkRawText, { subjectId: test?.subjectId });
  }, [bulkRawText, test?.subjectId]);

  const handleImportBulk = async () => {
    if (!test || !parsedBulkResult || parsedBulkResult.valid.length === 0) return;

    try {
      setIsImportingBulk(true);
      setBulkError('');
      setBulkSuccessMsg('');

      let successCount = 0;
      const failures: string[] = [];
      for (const q of parsedBulkResult.valid) {
        // The mutation wrapper throws on { success: false }; record the row and keep going.
        const res = await api
          .createQuestionForTest(test.id, {
            subjectId: test.subjectId,
            chapterId: test.chapterId || test.topicId,
            topicId: test.chapterId || test.topicId,
            questionText: q.questionText,
            questionBengaliText: q.questionText,
            optionA: q.optionA,
            optionB: q.optionB,
            optionC: q.optionC,
            optionD: q.optionD,
            correctOption: q.correctOption,
            explanation: q.explanation,
            // Mirror notes into both columns so Short Notes display keeps working.
            explanationBengali: q.explanation,
            difficulty: 'medium',
            defaultMarks: 1.0,
            // Questions never carry negative marks — scoring uses the test-level scheme.
            defaultNegativeMarks: 0,
            isActive: true,
            status: 'active',
          })
          .catch((err: unknown) => ({
            success: false as const,
            error: err instanceof Error ? err.message : String(err),
          }));
        if (res.success) successCount++;
        else failures.push(`Question #${q.questionNumber}: ${res.error || 'not saved'}`);
      }

      if (failures.length > 0) {
        // Keep the modal open and report exactly which rows were not imported.
        setBulkError(
          `Imported ${successCount} of ${parsedBulkResult.valid.length} questions. ${failures.length} failed — ${failures.slice(0, 3).join('; ')}${failures.length > 3 ? '; …' : ''}`
        );
        await loadData();
        return;
      }

      setBulkSuccessMsg(
        `Successfully imported and attached ${successCount} questions to ${test.title}!`
      );
      setTimeout(() => {
        setIsBulkModalOpen(false);
        setBulkRawText('');
        setBulkSuccessMsg('');
      }, 1500);

      await loadData();
    } catch (err) {
      setBulkError(getErrorMessage(err, 'Bulk import failed'));
    } finally {
      setIsImportingBulk(false);
    }
  };

  return {
    isBulkModalOpen,
    setIsBulkModalOpen,
    bulkRawText,
    setBulkRawText,
    isImportingBulk,
    setIsImportingBulk,
    bulkError,
    setBulkError,
    bulkSuccessMsg,
    setBulkSuccessMsg,
    parsedBulkResult,
    handleImportBulk,
  };
}
