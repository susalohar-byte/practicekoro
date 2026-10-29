import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Eye,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { MathText } from '@/components/common/MathText';
import { ShortNotesBox } from '@/components/common/ShortNotesBox';
import { cn } from '@/lib/utils';
import { isMathematicsQuestion } from '@/utils/shortNotes';
import { bengaliFontClass } from '../../questionBank/questionBankUtils';
import type { LiveTestWorkspaceState } from './useLiveTestWorkspace';

export interface PaperQuestionDrawerProps {
  ws: LiveTestWorkspaceState;
}

export function PaperQuestionDrawer({ ws }: PaperQuestionDrawerProps) {
  const {
    setActiveQuestionId,
    copiedId,
    setCopiedId,
    drawerTab,
    setDrawerTab,
    editBengaliText,
    setEditBengaliText,
    editEnglishText,
    setEditEnglishText,
    editOptionA,
    setEditOptionA,
    editOptionB,
    setEditOptionB,
    editOptionC,
    setEditOptionC,
    editOptionD,
    setEditOptionD,
    editCorrectOption,
    setEditCorrectOption,
    editExplanation,
    setEditExplanation,
    editExplanationBengali,
    setEditExplanationBengali,
    editMarks,
    setEditMarks,
    isSavingQuestion,
    drawerFeedback,
    activeQuestion,
    activeQuestionIndex,
    handlePrevQuestion,
    handleNextQuestion,
    handleMoveCurrentUp,
    handleMoveCurrentDown,
    handleRemoveCurrent,
    handleSaveQuestionEdits,
    assignedQuestions,
    isTestLocked,
  } = ws;
  return (
    <>
      {/* RIGHT: QUESTION DETAILS DRAWER (QUESTION BANK STYLE) */}
      {activeQuestion && (
        <div className="lg:col-span-4 bg-white border border-slate-200/80 rounded-2xl shadow-2xs overflow-hidden sticky top-4 animate-in slide-in-from-right-4 duration-200">
          {/* Drawer Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2 min-w-0">
              <h3 className="text-sm font-bold text-slate-900">Question Details</h3>
              <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-md font-mono">
                #{activeQuestionIndex + 1}
              </span>
              <span
                className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded cursor-pointer hover:bg-slate-100 transition-colors truncate max-w-[100px]"
                title={`Click to copy database ID: ${activeQuestion.questionId}`}
                onClick={() => {
                  navigator.clipboard.writeText(activeQuestion.questionId);
                  setCopiedId(activeQuestion.questionId);
                  setTimeout(() => setCopiedId(null), 2000);
                }}
              >
                {copiedId === activeQuestion.questionId
                  ? 'Copied!'
                  : `#${activeQuestion.questionId.slice(0, 8)}`}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActiveQuestionId(null)}
              title="Close Details Panel"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Question Navigator (Prev / Next Slider) */}
          <div className="flex items-center justify-between px-4 py-2 bg-slate-100/70 border-b border-slate-200/80 text-xs">
            <button
              type="button"
              disabled={activeQuestionIndex <= 0}
              onClick={handlePrevQuestion}
              className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>

            <div className="text-[11px] font-bold text-slate-500">
              Question <strong className="text-slate-900">{activeQuestionIndex + 1}</strong> of{' '}
              <strong className="text-slate-900">{assignedQuestions.length}</strong>
            </div>

            <button
              type="button"
              disabled={activeQuestionIndex >= assignedQuestions.length - 1}
              onClick={handleNextQuestion}
              className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-slate-900 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mode Switcher: Preview vs Quick Edit */}
          <div className="flex items-center border-b border-slate-100 px-4 text-xs font-bold text-slate-500 bg-white">
            <button
              type="button"
              onClick={() => setDrawerTab('preview')}
              className={cn(
                'py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer',
                drawerTab === 'preview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Preview</span>
            </button>
            <button
              type="button"
              onClick={() => setDrawerTab('edit')}
              disabled={isTestLocked}
              className={cn(
                'py-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40',
                drawerTab === 'edit'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              )}
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Quick Edit</span>
            </button>
          </div>

          {/* Drawer Feedback */}
          {drawerFeedback && (
            <div
              className={cn(
                'm-3 p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in',
                drawerFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              )}
            >
              {drawerFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{drawerFeedback.text}</span>
            </div>
          )}

          {/* DRAWER BODY: TAB 1 (PREVIEW) */}
          {drawerTab === 'preview' ? (
            <div className="p-4 space-y-4 max-h-[calc(100vh-280px)] overflow-y-auto">
              {/* Bengali Question Text */}
              {activeQuestion.questionBengaliText && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Question (Bengali)
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-sm font-semibold text-slate-900 leading-relaxed font-tiro">
                    <MathText>{activeQuestion.questionBengaliText}</MathText>
                  </div>
                </div>
              )}

              {/* English Question Text */}
              {activeQuestion.questionText && (
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Question (English)
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-medium text-slate-800 leading-relaxed">
                    <MathText>{activeQuestion.questionText}</MathText>
                  </div>
                </div>
              )}

              {/* Options List */}
              <div className="space-y-2">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                  Options & Correct Answer
                </span>
                <div className="space-y-1.5">
                  {[
                    { key: 'A', text: activeQuestion.optionA },
                    { key: 'B', text: activeQuestion.optionB },
                    { key: 'C', text: activeQuestion.optionC },
                    { key: 'D', text: activeQuestion.optionD },
                  ].map((opt) => {
                    const isCorrect = activeQuestion.correctOption?.toUpperCase() === opt.key;
                    return (
                      <div
                        key={opt.key}
                        className={cn(
                          'p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-colors',
                          isCorrect
                            ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold shadow-2xs'
                            : 'bg-white border-slate-200 text-slate-700'
                        )}
                      >
                        <span
                          className={cn(
                            'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center shrink-0',
                            isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                          )}
                        >
                          {opt.key}
                        </span>
                        <span className={cn('flex-1 min-w-0', bengaliFontClass(opt.text))}>
                          <MathText>{opt.text || '—'}</MathText>
                        </span>
                        {isCorrect && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-600 text-white shrink-0">
                            Correct ✓
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Explanation / Solution */}
              {(activeQuestion.explanationBengali || activeQuestion.explanation) && (
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                    Solution & Explanation
                  </span>
                  <ShortNotesBox
                    explanation={activeQuestion.explanationBengali || activeQuestion.explanation}
                    isMathematics={isMathematicsQuestion(activeQuestion)}
                    defaultExpanded={true}
                  />
                </div>
              )}

              {/* Question Metadata */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Subject
                  </span>
                  <span className="font-bold text-slate-800 truncate block">
                    {activeQuestion.subjectName || 'General'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Marks Weight
                  </span>
                  <span className="font-bold text-emerald-700 font-mono">
                    +{activeQuestion.marks || 1} Marks
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* DRAWER BODY: TAB 2 (QUICK EDIT) */
            <div className="p-4 space-y-3.5 max-h-[calc(100vh-280px)] overflow-y-auto">
              {/* Edit Bengali Text */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Question (Bengali)
                </label>
                <textarea
                  rows={3}
                  value={editBengaliText}
                  onChange={(e) => setEditBengaliText(e.target.value)}
                  placeholder="বাংলা প্রশ্ন লিখুন..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none font-tiro"
                />
              </div>

              {/* Edit English Text */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Question (English)
                </label>
                <textarea
                  rows={2}
                  value={editEnglishText}
                  onChange={(e) => setEditEnglishText(e.target.value)}
                  placeholder="Enter question in English..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Edit Options */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Options (A-D)
                </label>
                {[
                  { key: 'A' as const, val: editOptionA, set: setEditOptionA },
                  { key: 'B' as const, val: editOptionB, set: setEditOptionB },
                  { key: 'C' as const, val: editOptionC, set: setEditOptionC },
                  { key: 'D' as const, val: editOptionD, set: setEditOptionD },
                ].map((opt) => (
                  <div key={opt.key} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 text-xs font-black flex items-center justify-center shrink-0 border border-slate-200">
                      {opt.key}
                    </span>
                    <input
                      type="text"
                      value={opt.val}
                      onChange={(e) => opt.set(e.target.value)}
                      placeholder={`Option ${opt.key}`}
                      className={cn(
                        'flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none',
                        bengaliFontClass(opt.val)
                      )}
                    />
                  </div>
                ))}
              </div>

              {/* Correct Option Selector */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Correct Answer Key
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setEditCorrectOption(key)}
                      className={cn(
                        'py-2 rounded-xl text-xs font-black transition-all border cursor-pointer',
                        editCorrectOption === key
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      )}
                    >
                      Option {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Explanation */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Explanation (Bengali / English)
                </label>
                <textarea
                  rows={2}
                  value={editExplanationBengali || editExplanation}
                  onChange={(e) => {
                    setEditExplanationBengali(e.target.value);
                    setEditExplanation(e.target.value);
                  }}
                  placeholder="ব্যাখ্যা বা Short Notes লিখুন..."
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Edit Marks */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-600 uppercase">
                  Question Marks
                </label>
                <input
                  type="number"
                  step="0.25"
                  min="0"
                  value={editMarks}
                  onChange={(e) => setEditMarks(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-mono font-bold focus:ring-1 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Save Button */}
              <div className="pt-2 flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={isSavingQuestion}
                  onClick={handleSaveQuestionEdits}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                  leftIcon={<Save className="w-3.5 h-3.5" />}
                >
                  {isSavingQuestion ? 'Saving…' : 'Save Question Changes'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setDrawerTab('preview')}
                  className="text-xs font-bold border-slate-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Drawer Footer Actions */}
          <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={activeQuestionIndex <= 0 || isTestLocked}
                onClick={handleMoveCurrentUp}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                title="Move Question Up in Paper"
              >
                <ArrowUp className="w-3.5 h-3.5 inline" /> Up
              </button>

              <button
                type="button"
                disabled={activeQuestionIndex >= assignedQuestions.length - 1 || isTestLocked}
                onClick={handleMoveCurrentDown}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-bold text-slate-700 transition-colors cursor-pointer"
                title="Move Question Down in Paper"
              >
                <ArrowDown className="w-3.5 h-3.5 inline" /> Down
              </button>
            </div>

            <button
              type="button"
              disabled={isTestLocked}
              onClick={handleRemoveCurrent}
              className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-rose-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
              title="Remove from paper"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Remove</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
