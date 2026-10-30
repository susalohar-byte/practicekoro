import {
  FileText,
  Clock,
  Star,
  Users,
  BarChart3,
  CheckCircle2,
  Edit2,
  Trash2,
  Copy,
  Play,
} from 'lucide-react';
import type { MockTest } from '@/types';
import type { AdminTestsState } from './useAdminTests';

export interface TestOverviewTabProps {
  testsState: AdminTestsState;
  selectedTest: MockTest;
}

export function TestOverviewTab({ testsState, selectedTest }: TestOverviewTabProps) {
  const {
    setDetailsTab,
    setIsPreviewModalOpen,
    setPreviewTest,
    handleDeleteTest,
    handleDuplicateTest,
  } = testsState;
  return (
    <div className="space-y-3.5">
      {/* 6 Mini KPI Cards (3 columns x 2 rows) */}
      <div className="grid grid-cols-3 gap-1.5">
        {/* 1. Questions */}
        <div className="p-2 rounded-xl bg-[#EBF5FF] dark:bg-blue-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
            <FileText className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedTest.totalQuestions ?? 0}
            </span>
            <span className="text-[9.5px] text-slate-400 block truncate">Questions</span>
          </div>
        </div>

        {/* 2. Duration */}
        <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
            <Clock className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedTest.durationMinutes ?? 0} min
            </span>
            <span className="text-[9.5px] text-slate-400 block truncate">Duration</span>
          </div>
        </div>

        {/* 3. Total Marks */}
        <div className="p-2 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedTest.totalMarks ?? 0}
            </span>
            <span className="text-[9.5px] text-slate-400 block truncate">Total Marks</span>
          </div>
        </div>

        {/* 4. Total Attempts */}
        <div className="p-2 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Users className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedTest.attemptsCount
                ? selectedTest.attemptsCount.toLocaleString('en-IN')
                : '0'}
            </span>
            <span className="text-[9.5px] text-slate-400 block truncate">Total Attempts</span>
          </div>
        </div>

        {/* 5. Avg. Score */}
        <div className="p-2 rounded-xl bg-[#FEECEC] dark:bg-rose-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#FCD4D4] text-[#EF4444] flex items-center justify-center shrink-0">
            <BarChart3 className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedTest.avgScore ? `${Math.round(selectedTest.avgScore)}%` : '—'}
            </span>
            <span className="text-[9.5px] text-slate-400 block truncate">Avg. Score</span>
          </div>
        </div>

        {/* 6. Completion Rate */}
        <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3 h-3" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              —
            </span>
            <span className="text-[9.5px] text-slate-400 block truncate">Completion</span>
          </div>
        </div>
      </div>

      {/* Description Box with Exact Bengali Text */}
      <div className="space-y-1 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">Description</span>
          <button
            type="button"
            onClick={() => setDetailsTab('settings')}
            className="text-[11px] font-semibold text-[#026BFC] flex items-center gap-0.5"
          >
            <Edit2 className="w-2.5 h-2.5" />
            Edit
          </button>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
          {selectedTest.description || 'No description provided for this test.'}
        </p>
      </div>

      {/* Test Information Key-Value Table - 9 Exact Fields */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-900 dark:text-white block">
          Test Information
        </span>

        <div className="grid grid-cols-2 gap-y-1.5 text-xs">
          <span className="text-slate-400">Exam</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.examTitle || selectedTest.subjectName || '—'}
          </span>

          <span className="text-slate-400">Test Type</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.testType === 'full_mock'
              ? 'Full Mock'
              : selectedTest.testType === 'topic'
                ? 'Topic Test'
                : 'Official PYQ'}
          </span>

          <span className="text-slate-400">Total Questions</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.totalQuestions ?? 0}
          </span>

          <span className="text-slate-400">Duration</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.durationMinutes || 0} minutes
          </span>

          <span className="text-slate-400">Total Marks</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.totalMarks || 0}
          </span>

          <span className="text-slate-400">Negative Marks</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.negativeMarking
              ? `${selectedTest.negativeMarking} (Per Wrong Answer)`
              : 'None'}
          </span>

          <span className="text-slate-400">Created By</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">Admin</span>

          <span className="text-slate-400">Created At</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.createdAt
              ? new Date(selectedTest.createdAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>

          <span className="text-slate-400">Last Updated</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedTest.updatedAt
              ? new Date(selectedTest.updatedAt).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })
              : '—'}
          </span>
        </div>
      </div>

      {/* Bottom 3 Action Buttons matching screenshot */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${selectedTest.title}"?`)) {
              handleDeleteTest(selectedTest.id);
            }
          }}
          className="px-2.5 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 hover:bg-rose-100 text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Test
        </button>

        <button
          type="button"
          onClick={() => handleDuplicateTest(selectedTest.id)}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#026BFC] text-[11px] font-semibold flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
        >
          <Copy className="w-3.5 h-3.5" />
          Duplicate
        </button>

        <button
          type="button"
          onClick={() => {
            setPreviewTest(selectedTest);
            setIsPreviewModalOpen(true);
          }}
          className="flex-1 py-1.5 rounded-lg bg-[#026BFC] hover:bg-blue-700 text-white text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          Preview Test
        </button>
      </div>
    </div>
  );
}
