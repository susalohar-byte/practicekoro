import React from 'react';
import {
  Copy,
  Clock,
  Award,
  Users,
  CheckCircle2,
  TrendingUp,
  Check,
  HelpCircle,
} from 'lucide-react';
import type { MockTest } from '@/types';

interface OverviewTabProps {
  test: MockTest;
  assignedQuestionsCount: number;
  totalAttemptsCount: number;
  avgScore: string;
  passRate: number;
  copiedKey: string | null;
  handleCopy: (text: string, key: string) => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  test,
  assignedQuestionsCount,
  totalAttemptsCount,
  avgScore,
  passRate,
  copiedKey,
  handleCopy,
}) => (
  <div className="space-y-6">
    {/* 6 Mini KPI Cards (3x2 Grid) */}
    <div className="grid grid-cols-3 gap-2.5">
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <HelpCircle className="w-3 h-3 text-blue-500" />
          Questions
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {assignedQuestionsCount || test.totalQuestions || 0}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3 text-cyan-500" />
          Duration
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {test.durationMinutes} min
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Award className="w-3 h-3 text-amber-500" />
          Total Marks
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{test.totalMarks}</p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <Users className="w-3 h-3 text-purple-500" />
          Attempts
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">
          {totalAttemptsCount.toLocaleString('en-IN')}
        </p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-emerald-500" />
          Avg Score
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{avgScore}</p>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          Pass Rate
        </p>
        <p className="text-lg font-bold text-slate-900 dark:text-white mt-1">{passRate}%</p>
      </div>
    </div>

    {/* Description Card */}
    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70 space-y-2">
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Description
      </h4>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
        {test.description ||
          'এই মক টেস্টটি পশ্চিমবঙ্গ সরকারের পুলিশ ও অন্যান্য রাজ্য স্তরের প্রতিযোগিতামূলক পরীক্ষার সিলেবাস অনুযায়ী তৈরি করা হয়েছে।'}
      </p>
    </div>

    {/* Test Information Card */}
    <div className="p-4 rounded-xl bg-slate-50/80 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70 space-y-3">
      <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
        Test Information
      </h4>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-slate-400 block text-[11px]">Exam / Subject</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {test.examTitle || test.subjectName || 'General'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Topic</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {test.chapterName || '—'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Negative Marking</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {test.negativeMarking > 0 ? `-${test.negativeMarking} marks` : 'None'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Passing Marks</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {test.passingMarks} marks (
            {Math.round((test.passingMarks / (test.totalMarks || 100)) * 100)}%)
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Access Level</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {test.isPremium ? 'PRO Members Only' : 'Free Practice'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block text-[11px]">Test Slug</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
            {test.slug}
          </span>
        </div>
      </div>

      {/* Test ID with Copy button */}
      <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between">
        <div>
          <span className="text-slate-400 block text-[11px]">System Test ID</span>
          <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
            {test.id}
          </span>
        </div>
        <button
          type="button"
          onClick={() => handleCopy(test.id, 'id')}
          className="px-2.5 py-1 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 flex items-center gap-1 transition-colors"
        >
          {copiedKey === 'id' ? (
            <>
              <Check className="w-3 h-3 text-emerald-500" /> Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" /> Copy
            </>
          )}
        </button>
      </div>
    </div>
  </div>
);
