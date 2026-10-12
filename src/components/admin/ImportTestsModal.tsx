import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { csvCell } from '@/utils/csvExport';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { validateTestImportCsv, type TestImportRowResult } from '@/services/domains/admin.tests';
import type { Exam, Subject, Chapter } from '@/types';

interface ImportTestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  onImportComplete: () => void;
}

export const ImportTestsModal: React.FC<ImportTestsModalProps> = ({
  isOpen,
  onClose,
  exams,
  subjects,
  chapters,
  onImportComplete,
}) => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<TestImportRowResult[]>([]);

  if (!isOpen) return null;

  const handleDownloadSample = () => {
    const headers = [
      'title',
      'testType', // full_mock, topic, pyq
      'examName',
      'subjectName',
      'topicName',
      'durationMinutes',
      'totalMarks',
      'passingMarks',
      'negativeMarking',
      'status', // draft (default) or published
      'isPremium', // true = Paid, false = Free
      'year', // required for pyq
      'paperName', // optional, pyq only
      'setName', // optional, pyq only
      'iconUrl',
    ];

    const sampleRow1 = [
      'WBP Constable Full Mock 01',
      'full_mock',
      'WBP Constable',
      '',
      '',
      '90',
      '100',
      '40',
      '0.25',
      'draft',
      'false',
      '',
      '',
      '',
      '',
    ];

    const sampleRow2 = [
      'General Science - Heat & Temperature',
      'topic',
      '',
      'General Science',
      'Heat & Temperature',
      '30',
      '25',
      '10',
      '0.25',
      'draft',
      'false',
      '',
      '',
      '',
      '',
    ];

    const sampleRow3 = [
      'WBP Constable 2023 Prelims Official PYQ',
      'pyq',
      'WBP Constable',
      '',
      '',
      '60',
      '85',
      '35',
      '0.25',
      'draft',
      'true',
      '2023',
      'Prelims',
      '',
      '',
    ];

    const csvContent = [headers, sampleRow1, sampleRow2, sampleRow3]
      .map((r) => r.map(csvCell).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mock_tests_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setSuccessCount(null);
    setRowErrors([]);
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setRowErrors([]);
    setSuccessCount(null);

    let createdCount = 0;
    try {
      const rows = validateTestImportCsv(await csvFile.text(), { exams, subjects, chapters });
      if (rows.length === 0) throw new Error('CSV file contains no data rows.');

      // Validate everything first: nothing is imported while any row has a problem.
      const invalid = rows.filter((r) => r.errors.length > 0);
      if (invalid.length > 0) {
        setRowErrors(invalid);
        setError(
          `${invalid.length} of ${rows.length} rows have problems. Fix them and upload again; nothing was imported.`
        );
        return;
      }

      for (const row of rows) {
        try {
          await api.createTest(row.input!);
          createdCount++;
        } catch (err) {
          throw new Error(
            `Row ${row.line} ("${row.title}") could not be created: ${getErrorMessage(err, 'save failed')}. ` +
              `${createdCount} earlier row(s) were imported; remove them from the file before retrying.`
          );
        }
      }

      setSuccessCount(createdCount);
      onImportComplete();
    } catch (err) {
      console.error('Import failed:', err);
      setError(getErrorMessage(err, 'Failed to import tests. Please check CSV format.'));
      if (createdCount > 0) onImportComplete();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#070D1E]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" />
            Import Mock Tests (CSV)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {rowErrors.length > 0 && (
            <ul
              aria-label="Row errors"
              className="max-h-48 overflow-y-auto space-y-1.5 p-3 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-[#070D1E]"
            >
              {rowErrors.map((r) => (
                <li key={r.line} className="text-rose-600 dark:text-rose-300">
                  <span className="font-semibold">
                    Row {r.line}
                    {r.title ? ` (${r.title})` : ''}:
                  </span>{' '}
                  {r.errors.join(' ')}
                </li>
              ))}
            </ul>
          )}

          {successCount !== null && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Successfully imported {successCount} mock tests!</span>
            </div>
          )}

          <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-900/50 flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Need the standard template?
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Download the verified CSV template with sample test records.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDownloadSample}
              className="gap-1.5 text-xs bg-white dark:bg-slate-800 font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              Template
            </Button>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-950/50 dark:file:text-blue-300 hover:file:bg-blue-100"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleUpload}
              disabled={isProcessing || !csvFile}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4"
            >
              {isProcessing ? 'Importing...' : 'Upload & Import'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
