import React from 'react';
import { Shield, BookOpen, Clock, Upload, Trash2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import type { CreateMockTestForm } from './useCreateMockTestModal';

export const TestIconField: React.FC<{ form: CreateMockTestForm }> = ({ form }) => {
  const {
    iconUrl,
    setIconUrl,
    dragActiveIcon,
    setDragActiveIcon,
    handleUploadIconFile,
    selectedExam,
    testType,
    isUploadingIcon,
  } = form;
  return (
    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
            Test Icon / Logo
          </label>
          <span className="text-[11px] text-slate-400">
            Upload custom PNG, JPG, WebP, or SVG badge to display next to test name
          </span>
        </div>
        {iconUrl && (
          <button
            type="button"
            onClick={() => setIconUrl('')}
            className="text-[11px] font-medium text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            Remove
          </button>
        )}
      </div>

      <div
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActiveIcon(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleUploadIconFile(file);
        }}
        className={cn(
          'flex items-center gap-3 p-2 rounded-2xl transition-all border-2',
          dragActiveIcon
            ? 'border-dashed border-blue-500 bg-blue-50/70 dark:bg-blue-950/40'
            : 'border-transparent'
        )}
      >
        {/* Icon Preview */}
        <div className="w-12 h-12 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] flex items-center justify-center shrink-0 shadow-2xs overflow-hidden p-0.5">
          {iconUrl ? (
            <img
              src={iconUrl}
              alt="Test Icon"
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : selectedExam ? (
            <ExamEmblemBadge
              title={selectedExam.title}
              slug={selectedExam.slug}
              iconName={selectedExam.iconName}
              className="w-11 h-11"
            />
          ) : (
            <div
              className={cn(
                'w-full h-full rounded-lg flex items-center justify-center font-bold text-white',
                testType === 'full_mock'
                  ? 'bg-[#026BFC]'
                  : testType === 'topic'
                    ? 'bg-[#10B981]'
                    : 'bg-[#F59E0B]'
              )}
            >
              {testType === 'full_mock' ? (
                <Shield className="w-5 h-5" />
              ) : testType === 'topic' ? (
                <BookOpen className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
          )}
        </div>

        {/* Upload Controls */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                isUploadingIcon
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-[#026BFC] hover:bg-blue-700 text-white'
              )}
            >
              <Upload className="w-3.5 h-3.5" />
              {isUploadingIcon
                ? 'Uploading...'
                : iconUrl
                  ? 'Change Custom Icon'
                  : 'Upload or Drop Icon'}
              <input
                type="file"
                accept="image/*"
                disabled={isUploadingIcon}
                className="hidden"
                onChange={(ev) => {
                  const file = ev.target.files?.[0];
                  if (file) handleUploadIconFile(file);
                }}
              />
            </label>

            {selectedExam && !iconUrl && (
              <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                Official {selectedExam.title} emblem applied automatically
              </span>
            )}
          </div>
          {dragActiveIcon && (
            <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-1">
              Drop image to set test icon
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
