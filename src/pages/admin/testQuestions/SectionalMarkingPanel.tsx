import { X, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/common/Button';
import type { AdminTestQuestionsState } from './useAdminTestQuestions';

export interface SectionalMarkingPanelProps {
  testQuestionsState: AdminTestQuestionsState;
}

export function SectionalMarkingPanel({ testQuestionsState }: SectionalMarkingPanelProps) {
  const {
    activeTab,
    assignedQuestions,
    assignedSections,
    handleApplySectionalMarks,
    isSectionalOpen,
    sectionalMarks,
    sectionalSubjectId,
    setIsSectionalOpen,
    setSectionalMarks,
    setSectionalSubjectId,
  } = testQuestionsState;
  return (
    <>
      {/* Sectional Marking Toolbar Panel */}
      {isSectionalOpen && activeTab === 'assigned' && (
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 shadow-sm animate-fade-in space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Bulk Sectional Marking
              </h4>
            </div>
            <button
              onClick={() => setIsSectionalOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400">
            Select a subject/section to assign customized marks to all its questions at once.
            Negative marking (if any) always follows the test-level scheme.
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Target Section
              </label>
              <select
                value={sectionalSubjectId}
                onChange={(e) => setSectionalSubjectId(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white"
              >
                <option value="all">All Sections ({assignedQuestions.length} Qs)</option>
                {assignedSections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name} ({sec.count} Qs)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Marks per Q
              </label>
              <input
                type="number"
                step="0.25"
                min="0"
                value={sectionalMarks}
                onChange={(e) => setSectionalMarks(parseFloat(e.target.value) || 0)}
                className="w-20 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white text-center"
              />
            </div>

            <div className="self-end">
              <Button
                size="sm"
                onClick={handleApplySectionalMarks}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-xs"
              >
                Apply to Section
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
