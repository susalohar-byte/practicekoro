import React from 'react';
import { api } from '@/services/api';
import {
  Radio,
  Calendar,
  X,
  Trash2,
  Upload,
  Clock,
  Target,
  FileText,
  ListChecks,
  ArrowRight,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRESET_LOGOS } from './liveTestsUtils';
import { toast } from './useAdminLiveTests';
import {
  useCreateEditLiveTestForm,
  type CreateEditLiveTestModalProps,
} from './useCreateEditLiveTestForm';

// ----------------------------------------------------
// CREATE / EDIT LIVE TEST MODAL COMPONENT
// ----------------------------------------------------

export const CreateEditLiveTestModal: React.FC<CreateEditLiveTestModalProps> = (props) => {
  const { initialData, exams, onClose } = props;
  const {
    title,
    setTitle,
    examId,
    logo,
    setLogo,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    durationMinutes,
    setDurationMinutes,
    totalQuestions,
    setTotalQuestions,
    totalMarks,
    setTotalMarks,
    negativeMarking,
    setNegativeMarking,
    status,
    setStatus,
    rankingEnabled,
    setRankingEnabled,
    isUploadingLogo,
    setIsUploadingLogo,
    isSubmitting,
    handleExamChange,
    scheduleSummary,
    handleSubmit,
  } = useCreateEditLiveTestForm(props);

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          onClose();
        }
      }}
    >
      <div
        className="relative bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-edit-live-test-title"
      >
        {/* Sticky Header */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs flex items-center justify-between gap-4 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 shadow-2xs">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div className="min-w-0">
              <h2
                id="create-edit-live-test-title"
                className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate"
              >
                {initialData ? 'Edit Live Test' : 'Create New Live Test'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {initialData
                  ? 'Update event schedule, duration and marking parameters'
                  : 'Step 1 of 2 · Configure parameters and initialize hidden paper'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            title="Close dialog (Esc)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
          >
            <span className="hidden sm:inline-block text-[10px] font-mono font-medium text-slate-400 group-hover:text-slate-600 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5">
              ESC
            </span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Container wrapping scrollable body and sticky footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
            {/* Context callout for create mode */}
            {!initialData && (
              <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/30 border border-blue-100 dark:border-blue-900/60 rounded-xl flex items-start gap-3">
                <div className="p-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">
                    Dedicated Live Mock Architecture:
                  </span>{' '}
                  This creates a clean, isolated full mock paper for this live test. Questions are
                  uploaded exclusively inside this test and stay hidden until published.
                </div>
              </div>
            )}

            {/* Exam and Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Exam {!initialData && <span className="text-rose-500">*</span>}
                </label>
                {initialData ? (
                  <input
                    type="text"
                    disabled
                    value={
                      initialData.examTitle ||
                      exams.find((ex) => ex.id === examId)?.title ||
                      'Assigned Exam'
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium"
                  />
                ) : (
                  <select
                    required
                    value={examId}
                    onChange={(e) => handleExamChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">-- Choose Target Exam --</option>
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Event Status
                </label>
                {initialData ? (
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="upcoming">Scheduled (Upcoming)</option>
                    <option value="live">Live Now (Ongoing)</option>
                    <option value="draft">Draft (Hidden)</option>
                    <option value="ended">Completed</option>
                    {initialData.status === 'cancelled' && (
                      <option value="cancelled">Cancelled</option>
                    )}
                  </select>
                ) : (
                  <div className="w-full px-3 py-2 text-xs font-medium border border-amber-200 dark:border-amber-900/60 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Draft (Auto-switches to Scheduled on Publish)
                  </div>
                )}
              </div>
            </div>

            {/* Test Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Live Test Title <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. WBP Constable Special Full Live Mock 01"
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            {/* Date & Time with Schedule Summary */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  Scheduled Slot (IST)
                </span>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {scheduleSummary}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Exam Date
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Paper Parameters (4 Clean Metric Cards) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Paper Parameters & Marking Scheme
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Duration */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Duration</span>
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={durationMinutes}
                      onChange={(e) => setDurationMinutes(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">min</span>
                  </div>
                </div>

                {/* Questions */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Total Qs</span>
                    <ListChecks className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={totalQuestions}
                      onChange={(e) => setTotalQuestions(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">Qs</span>
                  </div>
                </div>

                {/* Total Marks */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Total Marks</span>
                    <Award className="w-3.5 h-3.5 text-purple-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      required
                      value={totalMarks}
                      onChange={(e) => setTotalMarks(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">pts</span>
                  </div>
                </div>

                {/* Negative Marks */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                    <span className="text-[11px] font-semibold">Negative</span>
                    <Target className="w-3.5 h-3.5 text-rose-500" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      required
                      value={negativeMarking}
                      onChange={(e) => setNegativeMarking(Number(e.target.value))}
                      className="w-full text-base font-bold text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none"
                    />
                    <span className="text-xs text-slate-400 font-medium shrink-0">/err</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam / Live Test Logo Section */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                    Live Test Logo & Branding
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Pick an official preset badge or upload a custom image
                  </span>
                </div>
                {logo && logo !== '/images/exams/logo_wbp.png' && (
                  <button
                    type="button"
                    onClick={() => setLogo('/images/exams/logo_wbp.png')}
                    className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                    title="Reset to default icon"
                  >
                    <Trash2 className="w-3 h-3" />
                    Reset
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3.5">
                {/* Live Preview */}
                <div className="w-13 h-13 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                  <img
                    src={logo || '/images/exams/logo_wbp.png'}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
                    }}
                  />
                </div>

                {/* Upload Controls */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                        isUploadingLogo
                          ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                      )}
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingLogo ? 'Uploading...' : 'Upload Custom Icon'}
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploadingLogo}
                        className="hidden"
                        onChange={async (ev) => {
                          const file = ev.target.files?.[0];
                          if (!file) return;
                          try {
                            setIsUploadingLogo(true);
                            const uploadedUrl = await api.uploadLiveTestLogo(
                              file,
                              initialData?.id || 'new'
                            );
                            setLogo(uploadedUrl);
                          } catch (err: any) {
                            toast.error('Failed to upload logo: ' + (err?.message || 'Error'));
                          } finally {
                            setIsUploadingLogo(false);
                          }
                        }}
                      />
                    </label>

                    <span className="text-[11px] text-slate-400">or image URL:</span>
                  </div>

                  <input
                    type="text"
                    placeholder="https://... or data:image/..."
                    value={logo}
                    onChange={(e) => setLogo(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preset Logos */}
              <div className="pt-2.5 border-t border-slate-200/80 dark:border-slate-700/80">
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block mb-2">
                  Official Exam Badges
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {PRESET_LOGOS.map((pl) => {
                    const isSelected = logo === pl.url;
                    return (
                      <button
                        type="button"
                        key={pl.name}
                        onClick={() => setLogo(pl.url)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-xl border flex items-center gap-2 text-xs transition-all text-left cursor-pointer',
                          isSelected
                            ? 'border-[#026BFC] bg-blue-50/80 dark:bg-blue-950/40 text-[#026BFC] dark:text-blue-400 font-bold ring-2 ring-[#026BFC]/25 shadow-xs'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                        )}
                      >
                        <div className="w-7 h-7 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0 shadow-2xs">
                          <img
                            src={pl.url}
                            alt={pl.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <span className="truncate text-xs">{pl.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Ranking Toggle Card */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rankingEnabled}
                  onChange={(e) => setRankingEnabled(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                    Enable Statewide Real-Time Ranking & Percentile
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Automatically computes statewide rank, district rank, and percentile score for
                    every student upon submission.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="shrink-0 px-6 py-3.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 z-10">
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{durationMinutes} mins</span>
              <span>•</span>
              <span>{totalQuestions} Qs</span>
              <span>•</span>
              <span>{totalMarks} Marks</span>
            </div>

            <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Saving...</span>
                ) : initialData ? (
                  <span>Update Live Test</span>
                ) : (
                  <>
                    <span>Create & Upload Questions</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
