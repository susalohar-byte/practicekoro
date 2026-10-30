import React, { useState } from 'react';
import { X, Upload, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { api } from '@/services/api';
import { parseCsvRaw } from '@/utils/csvParser';
import { getErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
import { useSmoothModal } from '@/hooks/useSmoothModal';
import { FileDropZone } from '@/components/common/FileDropZone';
import type { Exam, Subject, Chapter, MockTest } from '@/types';

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
  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(isOpen, onClose, 200);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState<number | null>(null);
  const [rowErrors, setRowErrors] = useState<string[]>([]);

  if (!shouldRender) return null;

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
      'status', // published or draft
      'isPremium', // true or false
      'year',
      'paperName',
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
      'published',
      'false',
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
      'published',
      'false',
      '',
      '',
    ];

    const csvContent = [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'mock_tests_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccessCount(null);
    setRowErrors([]);
    setCsvFile(file);
  };

  const handleUpload = async () => {
    if (!csvFile) {
      setError('Please select a CSV file to upload.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccessCount(null);
    setRowErrors([]);
    let createdCount = 0;
    const failures: string[] = [];

    try {
      const text = await csvFile.text();
      // Quote-aware parse (commas inside quoted titles) that also strips an Excel BOM.
      const lines = parseCsvRaw(text);
      if (lines.length < 2) {
        throw new Error('CSV file contains no data rows.');
      }

      const headers = lines[0].map((h) => h.trim().toLowerCase());

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].map((v) => v.trim());
        const row: Record<string, string> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });

        if (!row.title) continue;

        const testType = (row.testtype as MockTest['testType']) || 'full_mock';
        let foundExamId: string | undefined;
        let foundSubId: string | undefined;
        let foundChapId: string | undefined;

        if (row.examname) {
          const matchExam = exams.find((e) => e.title.toLowerCase() === row.examname.toLowerCase());
          if (matchExam) foundExamId = matchExam.id;
        }

        if (row.subjectname) {
          const matchSub = subjects.find(
            (s) => s.name.toLowerCase() === row.subjectname.toLowerCase()
          );
          if (matchSub) foundSubId = matchSub.id;
        }

        if (row.topicname) {
          // Topic names repeat across subjects: match within the row's subject when given.
          const matchChap = chapters.find(
            (c) =>
              c.name.toLowerCase() === row.topicname.toLowerCase() &&
              (!foundSubId || c.subjectId === foundSubId)
          );
          if (matchChap) {
            foundChapId = matchChap.id;
            foundSubId = foundSubId || matchChap.subjectId;
          }
        }

        try {
          await api.createTest({
            title: row.title,
            testType,
            examId: foundExamId,
            subjectId: foundSubId,
            chapterId: foundChapId,
            durationMinutes: Number(row.durationminutes || 90),
            totalMarks: Number(row.totalmarks || 100),
            passingMarks: Number(row.passingmarks || 40),
            negativeMarking: Number(row.negativemarking || 0.25),
            // Imported tests have no questions yet, so they are created as drafts and published
            // from Settings once questions are assigned (publishing is validated there).
            status: 'draft',
            isPremium: row.ispremium === 'true',
            year: row.year ? Number(row.year) : undefined,
            paperName: row.papername || undefined,
            iconUrl: row.iconurl || row.icon_url || row.icon || undefined,
            totalQuestions: 0,
            orderIndex: 0,
            slug: row.title
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
            isActive: false,
          });
          createdCount++;
        } catch (rowErr) {
          // Keep going: report every failed row instead of aborting the whole import.
          failures.push(
            `Row ${i + 1} ("${row.title}"): ${
              rowErr instanceof Error ? rowErr.message : 'Failed to create test'
            }`
          );
        }
      }

      setSuccessCount(createdCount);
      setRowErrors(failures);
      if (failures.length > 0) {
        setError(`${failures.length} row(s) could not be imported.`);
      }
    } catch (err) {
      console.error('Import failed:', err);
      setError(getErrorMessage(err, 'Failed to import tests. Please check CSV format.'));
    } finally {
      setIsProcessing(false);
      if (createdCount > 0) onImportComplete();
    }
  };

  return (
    <div
      onClick={handleSmoothClose}
      className={cn(
        'fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-transparent transition-opacity duration-200 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative bg-white dark:bg-[#0A1024] border border-slate-300 dark:border-slate-700/90 rounded-2xl w-full max-w-lg overflow-hidden my-auto shadow-none transition-all duration-200 ease-out transform',
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        )}
      >
        {/* Corner Cross Button */}
        <button
          type="button"
          onClick={handleSmoothClose}
          className="absolute top-3.5 right-3.5 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer group"
          aria-label="Close modal"
          title="Close"
        >
          <X className="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>

        {/* Header */}
        <div className="px-6 py-4.5 pr-14 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-[#070D1E]">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-500" />
            Import Mock Tests (CSV)
          </h3>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>
                <span>{error}</span>
                {rowErrors.length > 0 && (
                  <ul className="mt-1.5 list-disc pl-4 space-y-0.5">
                    {rowErrors.map((msg) => (
                      <li key={msg}>{msg}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {successCount !== null && successCount > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                Successfully imported {successCount} mock tests as drafts. Assign questions, then
                publish them from Settings.
              </span>
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
            <FileDropZone
              accept=".csv"
              disabled={isProcessing}
              isProcessing={isProcessing}
              onFile={handleFileSelect}
              selectedFile={csvFile}
              onClear={() => setCsvFile(null)}
              label="Click to browse or drag & drop CSV file"
              hint="Supports standard CSV format (Max 5MB)"
              buttonLabel="Browse CSV"
            />
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
            <Button variant="outline" size="sm" onClick={handleSmoothClose} disabled={isProcessing}>
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
