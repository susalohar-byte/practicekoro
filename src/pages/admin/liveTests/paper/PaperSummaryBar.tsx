import { Save, Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperSummaryBarProps {
  ws: LiveTestWorkspaceState;
}

export function PaperSummaryBar({ ws }: PaperSummaryBarProps) {
  const {
    isDraft,
    targetMarks,
    assignedQuestions,
    handleSaveAssigned,
    isSaving,
    isTestLocked,
    setIsBulkModalOpen,
    totalAssignedMarks,
  } = ws;
  return (
    <>
      {/* 9. STICKY BOTTOM SUMMARY BAR (WHEN QUESTIONS EXIST) */}
      {assignedQuestions.length > 0 && (
        <div className="sticky bottom-6 z-20 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-slate-900">Live Test Paper Summary</h4>
            <p className="text-xs text-slate-500">
              {assignedQuestions.length} Questions Assigned • Total Sum:{' '}
              <strong className="text-emerald-600 font-mono font-bold">
                {totalAssignedMarks} Marks
              </strong>{' '}
              {targetMarks > 0 && <span>(Target: {targetMarks} Marks)</span>}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isDraft && (
              <Button
                size="sm"
                variant="outline"
                className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50 text-xs font-bold shadow-2xs"
                leftIcon={<Upload className="w-3.5 h-3.5" />}
                onClick={() => setIsBulkModalOpen(true)}
              >
                + Add More TXT
              </Button>
            )}

            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              onClick={handleSaveAssigned}
              disabled={isSaving || isTestLocked}
            >
              {isSaving ? 'Saving Changes…' : 'Save Order & Marks'}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
