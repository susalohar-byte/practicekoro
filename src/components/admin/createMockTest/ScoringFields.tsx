import React from 'react';
import type { CreateMockTestForm } from './useCreateMockTestModal';

export const ScoringFields: React.FC<{ form: CreateMockTestForm }> = ({ form }) => {
  const {
    durationMinutes,
    setDurationMinutes,
    totalMarks,
    setTotalMarks,
    passingMarks,
    setPassingMarks,
    negativeMarking,
    setNegativeMarking,
    status,
    setStatus,
    isPremium,
    setIsPremium,
  } = form;
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Duration (min) *
          </label>
          <input
            type="number"
            min={1}
            required
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Total Marks *
          </label>
          <input
            type="number"
            min={1}
            required
            value={totalMarks}
            onChange={(e) => setTotalMarks(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Passing Marks
          </label>
          <input
            type="number"
            min={0}
            value={passingMarks}
            onChange={(e) => setPassingMarks(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          />
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Negative Mark
          </label>
          <input
            type="number"
            step="0.05"
            min={0}
            value={negativeMarking}
            onChange={(e) => setNegativeMarking(Number(e.target.value))}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          />
        </div>
      </div>

      {/* Access & Publish Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Publication Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as 'draft' | 'published')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          >
            <option value="draft">Draft (Hidden from students)</option>
            <option value="published" disabled>
              Published (add questions first, then publish from Settings)
            </option>
          </select>
        </div>

        <div>
          <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
            Access Plan
          </label>
          <select
            value={isPremium ? 'pro' : 'free'}
            onChange={(e) => setIsPremium(e.target.value === 'pro')}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:ring-2 focus:ring-[#026BFC]/30 focus:border-[#026BFC]"
          >
            <option value="free">Free Practice for All</option>
            <option value="pro">PRO Members Only</option>
          </select>
        </div>
      </div>
    </>
  );
};
