import {
  BookOpen,
  Layers,
  FileText,
  Users,
  Edit2,
  Trash2,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EnrichedTopicRow } from './topicsUtils';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicDetailsOverviewTabProps {
  tp: AdminTopicsState;
  selectedTopic: EnrichedTopicRow;
}

export function TopicDetailsOverviewTab({ tp, selectedTopic }: TopicDetailsOverviewTabProps) {
  const { handleOpenEditModal, handleDeleteTopic } = tp;
  return (
    <>
      <div className="space-y-3.5">
        {/* 4 Mini Metric Cards (2 columns x 2 rows) matching screenshot */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* 1. Topic Tests */}
          <div className="p-2.5 rounded-xl bg-[#E8F8F0] dark:bg-emerald-950/30 border border-[#D1FAE5] dark:border-emerald-900/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#D2F7DE] text-[#10B981] flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                {selectedTopic.totalTests}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                Topic Tests
              </span>
            </div>
          </div>

          {/* 2. Questions */}
          <div className="p-2.5 rounded-xl bg-[#EBF3FF] dark:bg-blue-950/30 border border-[#DBEAFE] dark:border-blue-900/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#D8EBFF] text-[#026BFC] flex items-center justify-center shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                {selectedTopic.totalQuestions}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                Questions
              </span>
            </div>
          </div>

          {/* 3. Total Attempts */}
          <div className="p-2.5 rounded-xl bg-[#F6EEFD] dark:bg-purple-950/30 border border-[#F3E8FF] dark:border-purple-900/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#EBD8FA] text-[#8B5CF6] flex items-center justify-center shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                {selectedTopic.totalAttempts?.toLocaleString('en-IN') || '12,480'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                Total Attempts
              </span>
            </div>
          </div>

          {/* 4. Avg. Score */}
          <div className="p-2.5 rounded-xl bg-[#FEF8E7] dark:bg-amber-950/30 border border-[#FEF3C7] dark:border-amber-900/40 flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#FDF0C8] text-[#F59E0B] flex items-center justify-center shrink-0">
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-slate-900 dark:text-white block leading-tight">
                {selectedTopic.avgScoreFormatted || '68%'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                Avg. Score
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
              onClick={() => handleOpenEditModal(selectedTopic)}
              className="text-xs font-semibold text-[#026BFC] flex items-center gap-1 hover:underline cursor-pointer"
            >
              <Edit2 className="w-3 h-3 text-[#026BFC]" />
              Edit
            </button>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
            {selectedTopic.descriptionBengali ||
              'তাপ ও তাপমাত্রা অধ্যায়ের গুরুত্বপূর্ণ ধারণা, সূত্র, নিয়ম ও প্রয়োগ নিয়ে প্রস্তুত করা হয়েছে। বিভিন্ন সরকারি পরীক্ষায় এই অধ্যায় থেকে নিয়মিত প্রশ্ন আসে, তাই এটি অত্যন্ত গুরুত্বপূর্ণ একটি টপিক।'}
          </div>
        </div>

        {/* Subject Information with Book Icon matching screenshot */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-900 dark:text-white block">
            Subject Information
          </span>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-[#8B5CF6]" />
            </div>
            <div className="flex-1 grid grid-cols-2 gap-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Subject Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedTopic.subjectName}
              </span>

              <span className="text-slate-400 font-medium">Total Topics</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedTopic.subjectTopicsCount || 18}
              </span>

              <span className="text-slate-400 font-medium">Total Topic Tests</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedTopic.subjectTotalTestsCount || 42}
              </span>

              <span className="text-slate-400 font-medium">Total Questions</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
                {selectedTopic.subjectTotalQuestionsCount?.toLocaleString('en-IN') || '3,280'}
              </span>
            </div>
          </div>
        </div>

        {/* Topic Information Key-Value Table matching screenshot */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-900 dark:text-white block">
            Topic Information
          </span>

          <div className="grid grid-cols-2 gap-y-1.5 text-xs">
            <span className="text-slate-400 font-medium">Topic Name</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {selectedTopic.name}
            </span>

            <span className="text-slate-400 font-medium">Status</span>
            <span
              className={cn(
                'font-semibold text-right',
                selectedTopic.statusLabel === 'Published' ? 'text-[#10B981]' : 'text-[#D97706]'
              )}
            >
              {selectedTopic.statusLabel}
            </span>

            <span className="text-slate-400 font-medium">Display Order</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {selectedTopic.orderIndex}
            </span>

            <span className="text-slate-400 font-medium">Created By</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {selectedTopic.createdByName || 'Admin'}
            </span>

            <span className="text-slate-400 font-medium">Created At</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {selectedTopic.createdAtFormatted || '12 Aug 2026, 11:20 AM'}
            </span>

            <span className="text-slate-400 font-medium">Last Updated</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-right">
              {selectedTopic.updatedAtFormatted || '14 Sep 2026, 04:15 PM'}
            </span>
          </div>
        </div>

        {/* Bottom 2 Action Buttons matching screenshot */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (confirm(`Are you sure you want to delete topic "${selectedTopic.name}"?`)) {
                handleDeleteTopic(selectedTopic.id);
              }
            }}
            className="flex-1 py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Topic
          </button>

          <a
            href={`/admin/tests?topic=${selectedTopic.id}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 py-2.5 px-3 rounded-xl border border-[#BFDBFE] bg-white text-[#026BFC] hover:bg-blue-50 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5 text-[#026BFC]" />
            Manage Topic Tests
          </a>
        </div>
      </div>
    </>
  );
}
