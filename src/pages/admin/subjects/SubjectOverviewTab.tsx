import {
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  FileText,
  Users,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectOverviewTabProps {
  sb: AdminSubjectsState;
}

export function SubjectOverviewTab({ sb }: SubjectOverviewTabProps) {
  const { selectedSubject, handleOpenEditModal, handleDeleteSubject } = sb;
  // Only rendered by SubjectDetailsDrawer while a subject is selected.
  if (!selectedSubject) return null;
  return (
    <div className="space-y-3.5">
      {/* 6 Mini KPI Cards (3 columns x 2 rows) matching screenshot */}
      <div className="grid grid-cols-3 gap-2">
        {/* 1. Topics */}
        <div className="p-2.5 rounded-xl bg-[#E8F8F0] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedSubject.topicsCount}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Topics
            </span>
          </div>
        </div>

        {/* 2. Topic Tests */}
        <div className="p-2.5 rounded-xl bg-[#EBF3FF] dark:bg-blue-950/30 border border-[#DBEAFE] dark:border-blue-900/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedSubject.topicTestsCount}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Topic Tests
            </span>
          </div>
        </div>

        {/* 3. Questions */}
        <div className="p-2.5 rounded-xl bg-[#FEECEC] dark:bg-rose-950/30 border border-[#FFE4E6] dark:border-rose-900/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FCD4D4] text-[#EF4444] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedSubject.totalQuestionsFormatted}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Questions
            </span>
          </div>
        </div>

        {/* 4. Total Attempts */}
        <div className="p-2.5 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 border border-[#F3E8FF] dark:border-purple-900/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
            <Users className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedSubject.attemptsCount ?? 'Unavailable'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Total Attempts
            </span>
          </div>
        </div>

        {/* 5. Avg. Score */}
        <div className="p-2.5 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 border border-[#FEF3C7] dark:border-amber-900/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedSubject.avgScoreFormatted || 'Unavailable'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Avg. Score
            </span>
          </div>
        </div>

        {/* 6. Completion Rate */}
        <div className="p-2.5 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
              {selectedSubject.completionRateFormatted || 'Unavailable'}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
              Completion Rate
            </span>
          </div>
        </div>
      </div>

      {/* Description Box with Bengali Text */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 dark:text-white">Description</span>
          <button
            type="button"
            onClick={() => handleOpenEditModal(selectedSubject)}
            className="text-xs font-semibold text-[#026BFC] flex items-center gap-1 hover:underline cursor-pointer"
          >
            <Edit2 className="w-3 h-3 text-[#026BFC]" />
            Edit
          </button>
        </div>
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {selectedSubject.description || 'No description has been saved.'}
        </div>
      </div>

      {/* Subject Information Key-Value Table matching screenshot */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-900 dark:text-white block">
          Subject Information
        </span>

        <div className="grid grid-cols-2 gap-y-2 text-xs">
          <span className="text-slate-400 font-medium">Subject Name</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.name}
          </span>

          <span className="text-slate-400 font-medium">Category</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.category}
          </span>

          <span className="text-slate-400 font-medium">Total Topics</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.topicsCount}
          </span>

          <span className="text-slate-400 font-medium">Total Topic Tests</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.topicTestsCount}
          </span>

          <span className="text-slate-400 font-medium">Total Questions</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.totalQuestionsFormatted}
          </span>

          <span className="text-slate-400 font-medium">Created By</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.createdByName || 'Unavailable'}
          </span>

          <span className="text-slate-400 font-medium">Created At</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.createdAtFormatted || 'Unavailable'}
          </span>

          <span className="text-slate-400 font-medium">Last Updated</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
            {selectedSubject.updatedAtFormatted || 'Unavailable'}
          </span>

          <span className="text-slate-400 font-medium">Status</span>
          <span
            className={cn(
              'font-semibold text-right',
              selectedSubject.statusLabel === 'Published' ? 'text-[#10B981]' : 'text-[#D97706]'
            )}
          >
            {selectedSubject.statusLabel}
          </span>
        </div>
      </div>

      {/* Bottom 2 Action Buttons matching screenshot */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${selectedSubject.name}"?`)) {
              handleDeleteSubject(selectedSubject.id);
            }
          }}
          className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete Subject
        </button>

        <a
          href={`/admin/question-bank?subjectId=${encodeURIComponent(selectedSubject.id)}`}
          target="_blank"
          rel="noreferrer"
          className="flex-1 py-2.5 px-3 rounded-xl border border-[#BFDBFE] bg-white text-[#026BFC] hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5 text-[#026BFC]" />
          View Question Bank
        </a>
      </div>
    </div>
  );
}
