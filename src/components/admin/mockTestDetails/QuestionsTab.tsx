import React from 'react';
import { Trash2, FileText, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import type { MockTest, TestQuestionAssignment } from '@/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { AdminSectionSkeleton } from '../AdminSkeleton';

interface QuestionsTabProps {
  test: MockTest;
  assignedQuestions: TestQuestionAssignment[];
  isLoadingQuestions: boolean;
  isSavingQuestions: boolean;
  onOpenAddQuestions: (test: MockTest) => void;
  handleMoveQuestion: (index: number, direction: 'up' | 'down') => void;
  handleRemoveQuestion: (questionId: string) => void;
}

export const QuestionsTab: React.FC<QuestionsTabProps> = ({
  test,
  assignedQuestions,
  isLoadingQuestions,
  isSavingQuestions,
  onOpenAddQuestions,
  handleMoveQuestion,
  handleRemoveQuestion,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Assigned Questions ({assignedQuestions.length})
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Questions linked directly from the Central Question Bank.
        </p>
      </div>
      <Button
        size="sm"
        onClick={() => onOpenAddQuestions(test)}
        className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
      >
        <Plus className="w-3.5 h-3.5" />+ Add Questions
      </Button>
    </div>

    {isLoadingQuestions ? (
      <AdminSectionSkeleton label="Loading questions..." variant="table" className="p-4" />
    ) : assignedQuestions.length === 0 ? (
      <div className="py-12 px-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center space-y-3">
        <FileText className="w-8 h-8 mx-auto text-slate-400" />
        <div>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            No Questions Assigned Yet
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
            Select and assign questions from the Central Question Bank to make this test ready for
            students.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => onOpenAddQuestions(test)}
          className="h-8 text-xs font-semibold gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Questions from Bank
        </Button>
      </div>
    ) : (
      <div className="space-y-2.5">
        {assignedQuestions.map((q, idx) => (
          <div
            key={q.questionId}
            className="p-3 rounded-xl bg-slate-50/70 dark:bg-[#070D1E] border border-slate-200/80 dark:border-slate-800/80 flex items-start justify-between gap-3 group hover:border-blue-400/50 transition-all"
          >
            <div className="flex items-start gap-2.5 min-w-0">
              <span className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100 line-clamp-2">
                  {q.questionBengaliText || q.questionText}
                </p>
                {q.questionBengaliText && q.questionText && (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 italic">
                    {q.questionText}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    +{q.marks || 1} / -{q.negativeMarks ?? 0}
                  </span>
                  {q.difficulty && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded uppercase',
                        q.difficulty === 'easy'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : q.difficulty === 'medium'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                      )}
                    >
                      {q.difficulty}
                    </span>
                  )}
                  {q.subjectName && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                      {q.subjectName}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Reorder and Delete Controls */}
            <div className="flex items-center gap-1 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                disabled={idx === 0 || isSavingQuestions}
                onClick={() => handleMoveQuestion(idx, 'up')}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                title="Move Up"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={idx === assignedQuestions.length - 1 || isSavingQuestions}
                onClick={() => handleMoveQuestion(idx, 'down')}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30"
                title="Move Down"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={isSavingQuestions}
                onClick={() => handleRemoveQuestion(q.questionId)}
                className="p-1 rounded text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                title="Remove from Test"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
