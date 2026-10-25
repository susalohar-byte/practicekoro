import { Button } from '@/components/common/Button';
import { FileDropZone } from '@/components/common/FileDropZone';
import { subjectCsvTemplate } from '@/utils/adminSubjectImport';
import { download } from './subjectsUtils';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectImportModalProps {
  sb: AdminSubjectsState;
}

export function SubjectImportModal({ sb }: SubjectImportModalProps) {
  const {
    isSaving,
    isUploadingIcon,
    isImportModalOpen,
    setIsImportModalOpen,
    isReadingImport,
    importRows,
    importError,
    importSummary,
    chooseImport,
    runImport,
  } = sb;
  return (
    <>
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Import Subjects"
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-bold">Import Subjects</h2>
            <p className="text-xs text-slate-500">
              Creates new subjects only. CSV/JSON · up to 100 records and 5 MB. Rows save
              individually; partial failures are reported and retry excludes saved rows. Omitted
              publish status defaults to Draft.
            </p>
            <FileDropZone
              ariaLabel="Subject import file"
              accept=".csv,.json"
              disabled={isSaving || isUploadingIcon}
              onFile={(file) => void chooseImport(file)}
              label="Click to browse or drag & drop CSV/JSON"
              hint="Up to 100 records and 5 MB"
              buttonLabel="Select File"
            />
            <button
              onClick={() => download(subjectCsvTemplate, 'subjects-template.csv', 'text/csv')}
              className="text-blue-600 text-xs underline"
            >
              Download CSV Template
            </button>
            {importRows.length > 0 && <p>{importRows.length} validated subject(s) ready.</p>}
            {importError && (
              <p role="alert" className="text-red-700 text-xs">
                {importError}
              </p>
            )}
            {importSummary && (
              <p role="status" className="text-xs">
                {importSummary}
              </p>
            )}
            <div className="flex gap-3 justify-end">
              <Button
                disabled={isSaving || isReadingImport}
                onClick={() => setIsImportModalOpen(false)}
              >
                Close
              </Button>
              <Button
                disabled={isSaving || isReadingImport || !importRows.length}
                onClick={() => void runImport()}
              >
                {isSaving ? 'Importing…' : 'Import File'}
              </Button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
