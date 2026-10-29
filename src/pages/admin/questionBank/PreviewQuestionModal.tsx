import React from 'react';
import { Eye, X } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { MathText } from '@/components/common/MathText';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import { useSmoothModal } from '@/hooks/useSmoothModal';
import { cn } from '@/lib/utils';
import { bengaliFontClass } from './questionBankUtils';
import type { Question } from '@/types';

export interface PreviewQuestionModalProps {
  question: Question;
  onClose: () => void;
}

/** Read-only question preview (extracted verbatim from AdminQuestionBank). */
export const PreviewQuestionModal: React.FC<PreviewQuestionModalProps> = ({
  question,
  onClose,
}) => {
  const { shouldRender, isAnimating, handleSmoothClose } = useSmoothModal(true, onClose, 200);

  if (!shouldRender) return null;

  return (
    <div
      onClick={handleSmoothClose}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 bg-transparent transition-opacity duration-200 ease-out',
        isAnimating ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700/90 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-none transition-all duration-200 ease-out transform',
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

        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 pr-10">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-indigo-500" /> Question Details
          </h3>
        </div>

        <div className="space-y-3">
          <p
            className={cn(
              'text-sm font-black text-slate-900 dark:text-white leading-relaxed',
              bengaliFontClass(question.questionBengaliText || question.questionText)
            )}
          >
            <MathText>{question.questionBengaliText || question.questionText}</MathText>
          </p>

          <div className="space-y-1.5 pt-1">
            {[
              { key: 'A', text: question.optionA },
              { key: 'B', text: question.optionB },
              { key: 'C', text: question.optionC },
              { key: 'D', text: question.optionD },
            ].map((opt) => {
              const isCorrect = question.correctOption === opt.key;
              return (
                <div
                  key={opt.key}
                  className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
                    isCorrect
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-bold'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <span className={bengaliFontClass(opt.text)}>
                    ({opt.key.toLowerCase()}) <MathText>{opt.text}</MathText>
                  </span>
                  {isCorrect && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black">
                      Correct Answer
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {(question.explanationBengali || question.explanation) && (
            <div className="space-y-2">
              <ShortNotesBox
                explanation={question.explanationBengali || question.explanation}
                isMathematics={isMathematicsQuestion(question)}
                defaultExpanded={true}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button variant="outline" onClick={handleSmoothClose} className="text-xs">
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
