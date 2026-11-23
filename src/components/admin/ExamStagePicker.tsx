import { cn } from '@/lib/utils';
import { EXAM_STAGES, type ExamStage } from '@/lib/examStage';

interface ExamStagePickerProps {
  value: ExamStage | null;
  /** Called with the clicked paper, or null when the chosen paper is clicked again. */
  onChange: (stage: ExamStage | null) => void;
  /** Text shown while a paper is chosen. */
  chosenHint?: (stage: ExamStage) => string;
  className?: string;
  labelClassName?: string;
  buttonClassName?: string;
}

/**
 * Optional Prelims / Mains choice for Full Mock and PYQ work. Exams held as a single paper leave
 * it empty; clicking the chosen paper again clears it.
 */
export function ExamStagePicker({
  value,
  onChange,
  chosenHint = (s) => `Saved as ${s}. Click again to clear.`,
  className,
  labelClassName = 'block font-semibold text-slate-700 dark:text-slate-300 mb-1',
  buttonClassName = 'px-3 py-2 rounded-xl text-xs',
}: ExamStagePickerProps) {
  return (
    <div className={className}>
      <span className={labelClassName}>Paper (optional)</span>
      <div role="group" aria-label="Paper (optional)" className="grid grid-cols-2 gap-2">
        {EXAM_STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            aria-pressed={value === stage}
            onClick={() => onChange(value === stage ? null : stage)}
            className={cn(
              'border font-bold transition-colors cursor-pointer',
              buttonClassName,
              value === stage
                ? 'bg-blue-50 dark:bg-blue-950/40 border-[#026BFC] text-[#026BFC]'
                : 'bg-white dark:bg-[#070D1E] border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80'
            )}
          >
            {stage}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
        {value ? chosenHint(value) : 'Leave empty if this exam has a single paper.'}
      </p>
    </div>
  );
}
