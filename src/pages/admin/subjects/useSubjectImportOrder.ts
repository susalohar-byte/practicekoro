import React, { useState, useRef } from 'react';
import { parseSubjectImport } from '@/utils/adminSubjectImport';
import { api } from '@/services/api';
import type { Subject } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import type { EnrichedSubjectRow } from './subjectsUtils';

export interface SubjectImportOrderDeps {
  mutationLock: React.MutableRefObject<boolean>;
  subjectsList: EnrichedSubjectRow[];
  nextOrder: () => number;
  addSavedRow: (saved: Subject) => EnrichedSubjectRow;
  setIsSaving: React.Dispatch<React.SetStateAction<boolean>>;
  setIsOrderModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setActionSuccessMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

/** Subject CSV/JSON import and display-order editing; called from useAdminSubjects. */
export function useSubjectImportOrder({
  mutationLock,
  subjectsList,
  nextOrder,
  addSavedRow,
  setIsSaving,
  setIsOrderModalOpen,
  setActionSuccessMessage,
}: SubjectImportOrderDeps) {
  const importReadId = useRef(0);
  const [isReadingImport, setIsReadingImport] = useState(false);
  const [importRows, setImportRows] = useState<Omit<Subject, 'id'>[]>([]);
  const [importError, setImportError] = useState('');
  const [importSummary, setImportSummary] = useState('');
  const [orderDraft, setOrderDraft] = useState<Record<string, string>>({});
  const [orderError, setOrderError] = useState('');
  const chooseImport = async (file?: File) => {
    if (!file || mutationLock.current) return;
    const readId = ++importReadId.current;
    setIsReadingImport(true);
    setImportRows([]);
    setImportSummary('');
    setImportError('');
    try {
      if (file.size > 5 * 1024 * 1024) throw new Error('Import file must be at most 5 MB.');
      const rows = parseSubjectImport(await file.text(), file.name, nextOrder());
      if (readId !== importReadId.current) return;
      if (
        rows.some((r) =>
          subjectsList.some(
            (s) => s.slug.toLowerCase().trim() === r.slug && (s.examId || '') === (r.examId || '')
          )
        )
      )
        throw new Error(
          'An imported slug already exists. Import creates new records; use Edit to change existing subjects.'
        );
      setImportRows(rows);
    } catch (err) {
      if (readId === importReadId.current)
        setImportError(getErrorMessage(err, 'Import validation failed.'));
    } finally {
      if (readId === importReadId.current) setIsReadingImport(false);
    }
  };
  const runImport = async () => {
    if (mutationLock.current || isReadingImport || !importRows.length) return;
    mutationLock.current = true;
    setIsSaving(true);
    setImportError('');
    const failed: Omit<Subject, 'id'>[] = [];
    const errors: string[] = [];
    let savedCount = 0;
    try {
      for (const row of importRows) {
        try {
          addSavedRow(await api.createSubject(row));
          savedCount++;
        } catch (err) {
          failed.push(row);
          errors.push(`${row.name}: ${getErrorMessage(err, 'Save failed')}`);
        }
      }
      setImportRows(failed);
      setImportSummary(
        `${savedCount} subject(s) saved; ${failed.length} failed. Successful rows will not be resubmitted.`
      );
      setImportError(errors.join(' · '));
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };
  const saveOrder = async () => {
    if (mutationLock.current) return;
    const changed = subjectsList.filter((s) => String(s.orderIndex) !== orderDraft[s.id]);
    if (!changed.length) {
      setOrderError('No order changes to save.');
      return;
    }
    if (
      changed.some(
        (s) =>
          !/^\d+$/.test(orderDraft[s.id] || '') ||
          !Number.isSafeInteger(Number(orderDraft[s.id])) ||
          Number(orderDraft[s.id]) > 2147483647
      )
    ) {
      setOrderError('Each order must be an integer from 0 to 2147483647.');
      return;
    }
    mutationLock.current = true;
    setIsSaving(true);
    setOrderError('');
    let savedCount = 0;
    const errors: string[] = [];
    try {
      for (const row of changed) {
        try {
          const saved = await api.updateSubject(row.id, { orderIndex: Number(orderDraft[row.id]) });
          if (saved.id !== row.id || saved.orderIndex !== Number(orderDraft[row.id]))
            throw new Error('Order was not confirmed.');
          addSavedRow(saved);
          savedCount++;
        } catch (err) {
          errors.push(`${row.name}: ${getErrorMessage(err, 'Save failed')}`);
        }
      }
      if (errors.length)
        setOrderError(
          `${savedCount} order(s) saved. Failed: ${errors.join(' · ')}. Only failed/changed records need retry.`
        );
      else {
        setIsOrderModalOpen(false);
        setActionSuccessMessage(`${savedCount} subject display order(s) saved.`);
      }
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };

  return {
    importReadId,
    isReadingImport,
    setIsReadingImport,
    importRows,
    setImportRows,
    importError,
    setImportError,
    importSummary,
    setImportSummary,
    orderDraft,
    setOrderDraft,
    orderError,
    setOrderError,
    chooseImport,
    runImport,
    saveOrder,
  };
}
