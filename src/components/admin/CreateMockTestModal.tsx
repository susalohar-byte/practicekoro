import React from 'react';
import { X, Sparkles, AlertCircle, Plus } from 'lucide-react';
import type { Exam, Subject, Chapter, MockTest } from '@/types';
import { cn } from '@/lib/utils';
import { useCreateMockTestModal } from './createMockTest/useCreateMockTestModal';
import { TestModeSelector } from './createMockTest/TestModeSelector';
import { SyllabusLinkFields } from './createMockTest/SyllabusLinkFields';
import { TestIconField } from './createMockTest/TestIconField';
import { ScoringFields } from './createMockTest/ScoringFields';

interface CreateMockTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  exams: Exam[];
  subjects: Subject[];
  chapters: Chapter[];
  onTestCreated: (test: MockTest) => void;
  initialType?: 'full_mock' | 'topic' | 'pyq';
}

export const CreateMockTestModal: React.FC<CreateMockTestModalProps> = ({
  isOpen,
  onClose,
  exams,
  subjects,
  chapters,
  onTestCreated,
  initialType = 'full_mock',
}) => {
  const form = useCreateMockTestModal({
    isOpen,
    onClose,
    exams,
    subjects,
    chapters,
    onTestCreated,
    initialType,
  });
  const {
    shouldRender,
    isAnimating,
    handleSmoothClose,
    testType,
    title,
    setTitle,
    description,
    setDescription,
    generateFromBank,
    isSubmitting,
    error,
    handleAutoSuggestTitle,
    handleSubmit,
  } = form;

  if (!shouldRender) return null;
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
          'relative bg-white dark:bg-[#0A1024] border border-slate-300 dark:border-slate-700/90 rounded-2xl w-full max-w-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto shadow-none transition-all duration-200 ease-out transform',
          isAnimating
            ? 'opacity-100 scale-100 translate-y-0'
            : 'opacity-0 scale-95 translate-y-2 pointer-events-none'
        )}
      >
        {/* Corner Cross Button */}
        <button
          type="button"
          onClick={handleSmoothClose}
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-all cursor-pointer group"
          aria-label="Close modal"
          title="Close"
        >
          <X className="w-4 h-4 transition-transform group-hover:scale-110" />
        </button>

        {/* Header */}
        <div className="px-6 py-4.5 pr-14 border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-[#070D1E] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#026BFC] flex items-center justify-center shrink-0 ring-1 ring-blue-500/20">
              <Sparkles className="w-5 h-5 text-[#026BFC]" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white tracking-tight">
                Create New Mock Test
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure test mode, syllabus targeting, duration, and scoring rules.
              </p>
            </div>
          </div>
        </div>

        {/* Form Body - Scrollable Container */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin text-xs">
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-300 flex items-center gap-2.5 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{error}</span>
              </div>
            )}

            {/* Mode Selector - 3 Premium Modern Interactive Cards */}
            <TestModeSelector form={form} />

            {/* Conditional Linking Section based on Mode */}
            <SyllabusLinkFields form={form} exams={exams} subjects={subjects} />

            {/* Test Title & Auto Suggest */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Test Title *
                </label>
                <button
                  type="button"
                  onClick={handleAutoSuggestTitle}
                  className="text-[11px] font-semibold text-[#026BFC] dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3 h-3 text-[#026BFC]" />
                  <span>Auto-generate name</span>
                </button>
              </div>
              <input
                type="text"
                required={!(testType === 'topic' && generateFromBank)}
                disabled={testType === 'topic' && generateFromBank}
                placeholder={
                  testType === 'topic' && generateFromBank
                    ? 'Auto-numbered: <Topic> Test 01, Test 02…'
                    : 'e.g. WBP Constable Full Mock 01'
                }
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Description (Bengali / English)
              </label>
              <textarea
                rows={2}
                placeholder="Optional overview or guidelines for this mock test..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
              />
            </div>

            {/* Test Icon / Logo Upload */}
            <TestIconField form={form} />

            {/* Duration, Marks, Negative Marking */}
            <ScoringFields form={form} />
          </div>

          {/* Sticky Actions Footer */}
          <div className="px-6 py-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-[#070D1E] flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={handleSmoothClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 border border-slate-300/80 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-[#026BFC] hover:bg-blue-700 text-white shadow-md shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>
                {testType === 'topic' && generateFromBank
                  ? isSubmitting
                    ? 'Generating...'
                    : 'Generate Topic Tests'
                  : isSubmitting
                    ? 'Creating...'
                    : 'Create Mock Test'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
