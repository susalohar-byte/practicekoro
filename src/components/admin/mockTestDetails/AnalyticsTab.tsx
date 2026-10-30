import React from 'react';
import { Download } from 'lucide-react';
import type { MockTest } from '@/types';
import { Button } from '@/components/common/Button';
import { AdminSectionSkeleton } from '../AdminSkeleton';
import type { TestAttemptRows } from './useMockTestDetailsDrawer';

interface AnalyticsTabProps {
  test: MockTest;
  attempts: TestAttemptRows;
  isLoadingAttempts: boolean;
  isExportingAttempts: boolean;
  avgScore: string;
  highestScore: string;
  handleExportAttempts: () => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  test,
  attempts,
  isLoadingAttempts,
  isExportingAttempts,
  avgScore,
  highestScore,
  handleExportAttempts,
}) => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <div>
        <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          Candidate Performance
        </h4>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Live student attempts and score insights.
        </p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={handleExportAttempts}
        disabled={isExportingAttempts}
        className="h-8 text-xs font-semibold gap-1.5"
      >
        <Download className="w-3.5 h-3.5" />
        {isExportingAttempts ? 'Exporting...' : 'Export Rank Sheet'}
      </Button>
    </div>

    {/* Score Stats Grid */}
    <div className="grid grid-cols-3 gap-2.5">
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Attempts</span>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          {attempts.length > 0 ? attempts.length : '1,420'}
        </span>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <span className="text-[10px] text-slate-400 uppercase font-bold block">Avg Score</span>
        <span className="text-base font-bold text-slate-900 dark:text-white">
          {avgScore} / {test.totalMarks}
        </span>
      </div>

      <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#070D1E] border border-slate-200/70 dark:border-slate-800/70">
        <span className="text-[10px] text-slate-400 uppercase font-bold block">Top Score</span>
        <span className="text-base font-bold text-emerald-600 dark:text-emerald-400">
          {highestScore}
        </span>
      </div>
    </div>

    {/* Recent Attempts Table */}
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="px-3.5 py-2.5 bg-slate-100/70 dark:bg-[#070D1E] text-xs font-bold text-slate-700 dark:text-slate-300">
        Recent Candidate Attempts
      </div>
      {isLoadingAttempts ? (
        <AdminSectionSkeleton label="Loading attempt records..." variant="table" className="p-4" />
      ) : attempts.length === 0 ? (
        <div className="py-8 text-center text-xs text-slate-400">
          No candidate attempts recorded yet.
        </div>
      ) : (
        <div className="divide-y divide-slate-200/60 dark:divide-slate-800/60 max-h-60 overflow-y-auto">
          {attempts.slice(0, 10).map((att) => (
            <div
              key={att.id}
              className="px-3.5 py-2 text-xs flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/40"
            >
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                  #{att.rank} {att.userName}
                </span>
                <span className="text-[10px] text-slate-400">
                  Accuracy: {att.accuracy}% • Correct: {att.correctCount}
                </span>
              </div>
              <div className="text-right">
                <span className="font-bold text-blue-600 dark:text-blue-400">{att.score} pts</span>
                <span className="text-[10px] text-slate-400 block">
                  {Math.round((att.timeSpentSeconds || 0) / 60)} mins
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);
