import React, { useState } from 'react';
import { Question } from '@/types';
import { QuestionBankStatus, questionBankStatus } from './questionBankUtils';
import { api } from '@/services/api';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import { csvCell } from '@/utils/csvExport';

interface QuestionBulkActionsInput {
  questions: Question[];
  setQuestions: React.Dispatch<React.SetStateAction<Question[]>>;
  paginatedQuestions: Question[];
  setActiveQuestion: React.Dispatch<React.SetStateAction<Question | null>>;
  showToast: (msg: string) => void;
}

/** Row selection and the bulk actions on it: status change, delete and CSV export. */
export function useQuestionBulkActions({
  questions,
  setQuestions,
  paginatedQuestions,
  setActiveQuestion,
  showToast,
}: QuestionBulkActionsInput) {
  // Selected Rows for Bulk Actions
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(new Set());

  // Checkbox Selection Handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedRowIds(new Set(paginatedQuestions.map((q) => q.id)));
    } else {
      setSelectedRowIds(new Set());
    }
  };

  const handleToggleSelectRow = (id: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk Status Change
  const handleBulkStatusChange = async (newStatus: QuestionBankStatus) => {
    const ids = Array.from(selectedRowIds);
    const batch = await runConfirmedBatch(ids, (id) =>
      api.updateQuestion(id, { status: newStatus, isActive: newStatus === 'published' })
    );
    const saved = new Map(batch.results.map((r) => [r.input, r.value]));
    setQuestions((prev) => prev.map((q) => saved.get(q.id) || q));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    showToast(
      batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (
      !selectedRowIds.size ||
      !window.confirm('Delete selected questions? Linked questions may be protected.')
    )
      return;
    const batch = await runConfirmedBatch(Array.from(selectedRowIds), (id) =>
      api.deleteQuestion(id)
    );
    const deleted = new Set(batch.results.map((r) => r.input));
    setQuestions((prev) => prev.filter((q) => !deleted.has(q.id)));
    setActiveQuestion((prev) => (prev && deleted.has(prev.id) ? null : prev));
    setSelectedRowIds(new Set(batch.failures.map((f) => f.input)));
    showToast(
      deleted.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : '')
    );
  };

  // Export Selected to CSV
  const handleExportSelectedCSV = () => {
    if (selectedRowIds.size === 0) return;
    const toExport = questions.filter((q) => selectedRowIds.has(q.id));
    const headers = [
      'id',
      'question',
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'correct',
      'exam',
      'subject',
      'topic',
      'status',
    ];
    const rows = toExport.map((q) => [
      q.id,
      q.questionBengaliText || q.questionText,
      q.optionA,
      q.optionB,
      q.optionC,
      q.optionD,
      q.correctOption,
      q.sourceExam || '',
      q.subjectName || '',
      q.topicName || '',
      questionBankStatus(q),
    ]);
    const csvContent =
      '\uFEFF' + headers.join(',') + '\n' + rows.map((r) => r.map(csvCell).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `practicekoro_selected_questions_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`Exported ${toExport.length} questions to CSV.`);
  };

  return {
    selectedRowIds,
    setSelectedRowIds,
    handleSelectAll,
    handleToggleSelectRow,
    handleBulkStatusChange,
    handleBulkDelete,
    handleExportSelectedCSV,
  };
}
