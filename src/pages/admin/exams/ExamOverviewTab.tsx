import {
  Edit2,
  Trash2,
  CheckCircle2,
  Layers,
  FileText,
  BookOpen,
  Users,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnrichedExamRow } from './examsUtils';
import type { AdminExamsState } from './useAdminExams';

export interface ExamOverviewTabProps {
  qb: AdminExamsState;
  selectedExam: EnrichedExamRow;
}

export function ExamOverviewTab({ qb, selectedExam }: ExamOverviewTabProps) {
  const { detailsTab, handleOpenEditModal, handleArchiveExam } = qb;
  return (
    <>
      {/* TAB CONTENT: OVERVIEW */}
      {detailsTab === 'overview' && (
        <div className="space-y-3.5">
          {/* 6 Mini KPI Cards (3 columns x 2 rows) matching screenshot */}
          <div className="grid grid-cols-3 gap-1.5">
            {/* 1. Subjects */}
            <div className="p-2 rounded-xl bg-[#EBF5FF] dark:bg-blue-950/30 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
                <BookOpen className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {selectedExam.subjectsCount}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">Subjects</span>
              </div>
            </div>

            {/* 2. Full Mocks */}
            <div className="p-2 rounded-xl bg-[#EBFBF0] dark:bg-emerald-950/30 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
                <Layers className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {selectedExam.fullMockCount}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">Full Mocks</span>
              </div>
            </div>

            {/* 3. Total Tests */}
            <div className="p-2 rounded-xl bg-[#FEECEC] dark:bg-rose-950/30 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FCD4D4] text-[#EF4444] flex items-center justify-center shrink-0">
                <FileText className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {selectedExam.totalTestsCount}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">Total Tests</span>
              </div>
            </div>

            {/* 4. Enrollments */}
            <div className="p-2 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
                <Users className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {selectedExam.enrollmentsFormatted ||
                    selectedExam.enrollmentsCount.toLocaleString('en-IN')}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">Enrollments</span>
              </div>
            </div>

            {/* 5. Avg. Score */}
            <div className="p-2 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
                <TrendingUp className="w-3 h-3" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 dark:text-white block leading-tight">
                  {selectedExam.avgScoreFormatted || '68%'}
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
                  {selectedExam.completionRateFormatted || '72%'}
                </span>
                <span className="text-[9.5px] text-slate-400 block truncate">Completion Rate</span>
              </div>
            </div>
          </div>

          {/* Description Box with Bengali Text */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white">Description</span>
              <button
                type="button"
                onClick={() => handleOpenEditModal(selectedExam)}
                className="text-[11px] font-semibold text-[#026BFC] flex items-center gap-0.5"
              >
                <Edit2 className="w-2.5 h-2.5" />
                Edit
              </button>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              {selectedExam.description ||
                'WBP Constable পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি সিরিজ। এই পরীক্ষায় যুক্ত রয়েছে Full Mock, Topic Test ইত্যাদি বিভিন্ন ধরণের পরীক্ষার সিরিজ যা আপনাকে পরীক্ষার প্রস্তুতিকে শক্তিশালী করবে।'}
            </p>
          </div>

          {/* Basic Information Key-Value Table matching screenshot */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white block">
              Basic Information
            </span>

            <div className="grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-slate-400">Exam Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.title}
              </span>

              <span className="text-slate-400">Short Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.shortName || selectedExam.title.split(' ')[0]}
              </span>

              <span className="text-slate-400">Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.categoryLabel || selectedExam.category || 'State Govt'}
              </span>

              <span className="text-slate-400">Total Subjects</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.subjectsCount}
              </span>

              <span className="text-slate-400">Full Mock Tests</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.fullMockCount}
              </span>

              <span className="text-slate-400">Total Tests</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.totalTestsCount}
              </span>

              <span className="text-slate-400">Total Enrollments</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.enrollmentsFormatted ||
                  selectedExam.enrollmentsCount.toLocaleString('en-IN')}
              </span>

              <span className="text-slate-400">Status</span>
              <span
                className={cn(
                  'font-semibold text-right',
                  selectedExam.statusLabel === 'Published' ? 'text-[#10B981]' : 'text-[#D97706]'
                )}
              >
                {selectedExam.statusLabel}
              </span>

              <span className="text-slate-400">Created By</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.createdByName || 'Admin'}
              </span>

              <span className="text-slate-400">Created At</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.createdAtFormatted || '10 Sep 2026, 04:30 PM'}
              </span>

              <span className="text-slate-400">Last Updated</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedExam.updatedAtFormatted || '12 Sep 2026, 10:15 AM'}
              </span>
            </div>
          </div>

          {/* Bottom 2 Action Buttons matching screenshot */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleArchiveExam(selectedExam)}
              className="flex-1 py-2 px-2.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Archive Exam
            </button>

            <a
              href={`/exams/${selectedExam.slug}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 py-2 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[#026BFC] hover:bg-slate-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              View on Website
            </a>
          </div>
        </div>
      )}
    </>
  );
}
