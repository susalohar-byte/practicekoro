import React from 'react';
import {
  Edit2,
  Trash2,
  CheckCircle2,
  X,
  FileText,
  Copy,
  MoreHorizontal,
  Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import type { EnrichedExamRow } from './examsUtils';
import type { AdminExamsState } from './useAdminExams';

export interface ExamTableRowProps {
  qb: AdminExamsState;
  e: EnrichedExamRow;
  index: number;
}

export function ExamTableRow({ qb, e, index }: ExamTableRowProps) {
  const {
    selectedExam,
    showDetailsPanel,
    selectedExamIds,
    openActionMenuId,
    setOpenActionMenuId,
    handleUploadImageFile,
    handleQuickUploadExamLogo,
    handleToggleExamStatus,
    pageStart,
    toggleSelectRow,
    handleSelectExamRow,
    handleOpenEditModal,
    handleArchiveExam,
    handleDeleteExam,
    handleDuplicateExam,
  } = qb;
  const rowNumber = pageStart + index + 1;
  const isSelected = Boolean(showDetailsPanel && selectedExam?.id === e.id);
  const isChecked = selectedExamIds.has(e.id);
  const isPublished = e.statusLabel === 'Published';

  return (
    <tr
      onClick={() => handleSelectExamRow(e)}
      className={cn(
        'transition-colors cursor-pointer group',
        isSelected
          ? 'bg-blue-50/50 dark:bg-blue-950/20'
          : 'hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
      )}
    >
      {/* Checkbox */}
      <td className="py-3.5 px-3 text-center" onClick={(evt) => evt.stopPropagation()}>
        <input
          aria-label="Select row"
          type="checkbox"
          checked={isChecked}
          onChange={(evt) => toggleSelectRow(e.id, evt as unknown as React.MouseEvent)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
        />
      </td>

      {/* Row Index */}
      <td className="py-3.5 px-2 text-center text-slate-400 font-medium">{rowNumber}</td>

      {/* Exam Name: Emblem + Title + Subtitle */}
      <td className="py-3.5 px-3 min-w-[200px]">
        <div className="flex items-center gap-3">
          <div className="relative group/logo shrink-0">
            <ExamEmblemBadge
              title={e.title}
              slug={e.slug}
              iconName={e.iconName}
              className="w-8 h-8 shrink-0"
            />
            <label
              htmlFor={`table-logo-upload-${e.id}`}
              className="absolute inset-0 bg-slate-900/70 rounded-xl opacity-0 group-hover/logo:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white shadow-2xs"
              title="Upload new logo"
              onClick={(ev) => ev.stopPropagation()}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
              <input
                id={`table-logo-upload-${e.id}`}
                type="file"
                accept="image/*"
                className="hidden"
                onClick={(ev) => ev.stopPropagation()}
                onChange={async (ev) => {
                  ev.stopPropagation();
                  const file = ev.target.files?.[0];
                  if (!file) return;
                  try {
                    const uploadedUrl = await handleUploadImageFile(file);
                    await handleQuickUploadExamLogo(e.id, uploadedUrl);
                  } catch (err) {
                    console.error('Failed to upload logo:', err);
                  }
                }}
              />
            </label>
          </div>
          <div className="min-w-0">
            <span className="font-bold text-slate-900 dark:text-white block leading-snug">
              {e.title}
            </span>
            <span className="text-[11px] text-slate-400 block truncate mt-0.5">
              {e.subtitle || 'Competitive Recruitment Exam'}
            </span>
          </div>
        </div>
      </td>

      {/* Category Badge */}
      <td className="py-3.5 px-2.5">
        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#EBF5FF] text-[#026BFC] dark:bg-blue-950/60 dark:text-blue-300 whitespace-nowrap">
          {e.categoryLabel || e.category || 'State Govt'}
        </span>
      </td>

      {/* Subjects Count */}
      <td className="py-3.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
        {e.subjectsCount}
      </td>

      {/* Full Mock Count */}
      <td className="py-3.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
        {e.fullMockCount}
      </td>

      {/* Total Tests */}
      <td className="py-3.5 px-2 text-center text-slate-600 dark:text-slate-300 font-medium">
        {e.totalTestsCount}
      </td>

      {/* Enrollments */}
      <td className="py-3.5 px-3 text-center text-slate-600 dark:text-slate-300 font-medium">
        {e.enrollmentsFormatted || e.enrollmentsCount.toLocaleString('en-IN')}
      </td>

      {/* Status Badge */}
      <td className="py-3.5 px-2.5 text-center" onClick={(evt) => evt.stopPropagation()}>
        <button
          type="button"
          onClick={() => handleToggleExamStatus(e)}
          title={`Click to switch status to ${isPublished ? 'Draft' : 'Published'}`}
          className={cn(
            'px-2.5 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer select-none',
            isPublished
              ? 'bg-[#E8F8F0] text-[#10B981] hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300'
              : 'bg-[#FEF8E7] text-[#D97706] hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
          )}
        >
          <span
            className={cn(
              'w-1.5 h-1.5 rounded-full',
              isPublished ? 'bg-[#10B981]' : 'bg-[#D97706]'
            )}
          />
          {e.statusLabel}
        </button>
      </td>

      {/* Actions Menu */}
      <td className="py-3.5 px-2.5 text-center relative" onClick={(evt) => evt.stopPropagation()}>
        <button
          type="button"
          aria-label={`Actions for ${e.title}`}
          onClick={() => setOpenActionMenuId(openActionMenuId === e.id ? null : e.id)}
          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
        >
          <MoreHorizontal className="w-4 h-4 text-slate-500" />
        </button>

        {openActionMenuId === e.id && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpenActionMenuId(null)} />
            <div className="absolute right-0 mt-1 w-44 rounded-xl bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 shadow-xl z-40 py-1 text-xs">
              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleSelectExamRow(e);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                View Details
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleOpenEditModal(e);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                Edit Exam
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleToggleExamStatus(e);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                {isPublished ? (
                  <>
                    <X className="w-3.5 h-3.5 text-amber-500" />
                    Change to Draft
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    Publish Exam
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleDuplicateExam(e);
                }}
                className="w-full px-3 py-1.5 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80 flex items-center gap-2"
              >
                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                Duplicate Exam
              </button>

              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleArchiveExam(e);
                }}
                className="w-full px-3 py-1.5 text-left text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Archive Exam
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpenActionMenuId(null);
                  handleDeleteExam(e.id);
                }}
                className="w-full px-3 py-1.5 text-left text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Permanently
              </button>
            </div>
          </>
        )}
      </td>
    </tr>
  );
}
