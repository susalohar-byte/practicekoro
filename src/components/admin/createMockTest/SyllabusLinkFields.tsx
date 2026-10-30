import React from 'react';
import { Check } from 'lucide-react';
import type { Exam, Subject } from '@/types';
import { cn } from '@/lib/utils';
import type { CreateMockTestForm } from './useCreateMockTestModal';

interface SyllabusLinkFieldsProps {
  form: CreateMockTestForm;
  exams: Exam[];
  subjects: Subject[];
}

export const SyllabusLinkFields: React.FC<SyllabusLinkFieldsProps> = ({
  form,
  exams,
  subjects,
}) => {
  const {
    testType,
    examId,
    setExamId,
    subjectId,
    setSubjectId,
    chapterId,
    setChapterId,
    availableChapters,
    associatedExamIds,
    setAssociatedExamIds,
    generateFromBank,
    setGenerateFromBank,
    year,
    setYear,
    paperName,
    setPaperName,
    setName,
    setSetName,
  } = form;
  return (
    <>
      {testType === 'full_mock' && (
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Target Exam *
          </label>
          <select
            required
            value={examId}
            onChange={(e) => setExamId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          >
            <option value="">Select Exam</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title} ({ex.category})
              </option>
            ))}
          </select>
        </div>
      )}

      {testType === 'topic' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Subject *
            </label>
            <select
              required
              value={subjectId}
              onChange={(e) => {
                setSubjectId(e.target.value);
                setChapterId('');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Topic *
            </label>
            <select
              required
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
            >
              <option value="">Select Topic</option>
              {availableChapters.map((ch) => (
                <option key={ch.id} value={ch.id}>
                  {ch.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {testType === 'topic' && (
        <div className="space-y-3">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Show under Exams (optional)
            </label>
            <p className="text-[11px] text-slate-400 mb-1.5">
              A Topic Test needs no exam. Linking it lets the same test appear under several exams
              without copies.
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
              {exams.map((ex) => {
                const on = associatedExamIds.includes(ex.id);
                return (
                  <button
                    key={ex.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setAssociatedExamIds((prev) =>
                        on ? prev.filter((id) => id !== ex.id) : [...prev, ex.id]
                      )
                    }
                    className={cn(
                      'px-2.5 py-1 rounded-lg border text-[11px] font-medium transition-colors cursor-pointer',
                      on
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-700 dark:text-emerald-300'
                        : 'bg-white border-slate-200 text-slate-600 dark:bg-[#070D1E] dark:border-slate-700 dark:text-slate-300'
                    )}
                  >
                    {on && <Check className="w-3 h-3 inline mr-1" />}
                    {ex.title}
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 cursor-pointer">
            <input
              type="checkbox"
              checked={generateFromBank}
              onChange={(e) => setGenerateFromBank(e.target.checked)}
              className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5"
            />
            <span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Generate tests from Question Bank (10 questions each)
              </span>
              <span className="text-[11px] text-slate-400">
                Uses this topic&apos;s questions not yet in any of its Topic Tests, e.g. 50
                questions → Test 01 to Test 05. Titles are numbered automatically; tests are created
                as drafts.
              </span>
            </span>
          </label>
        </div>
      )}

      {testType === 'pyq' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Target Exam *
            </label>
            <select
              required
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            >
              <option value="">Select Exam</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Year *
            </label>
            <input
              type="number"
              min={2000}
              max={2030}
              required
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Paper / Shift
            </label>
            <input
              type="text"
              placeholder="e.g. Prelims / Shift 1"
              value={paperName}
              onChange={(e) => setPaperName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              Set
            </label>
            <input
              type="text"
              placeholder="e.g. A"
              value={setName}
              onChange={(e) => setSetName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>
      )}
    </>
  );
};
