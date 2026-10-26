import { Trash2, X, Upload } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { cn } from '@/lib/utils';
import { getErrorMessage } from '@/lib/errors';
import { ExamEmblemBadge } from '@/components/common/ExamEmblemBadge';
import type { AdminExamsState } from './useAdminExams';

export interface ExamFormModalProps {
  qb: AdminExamsState;
}

export function ExamFormModal({ qb }: ExamFormModalProps) {
  const {
    isSaving,
    categories,
    isModalOpen,
    setIsModalOpen,
    editingExam,
    formTitle,
    setFormTitle,
    formShortName,
    setFormShortName,
    formSubtitle,
    setFormSubtitle,
    formSlug,
    setFormSlug,
    formCategory,
    setFormCategory,
    formDescription,
    setFormDescription,
    formIsActive,
    setFormIsActive,
    formError,
    formIconName,
    setFormIconName,
    isUploadingLogo,
    setIsUploadingLogo,
    handleUploadImageFile,
    handleSaveExam,
  } = qb;
  return (
    <>
      {/* MODAL: Create / Edit Exam Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl lg:max-w-3xl w-full flex flex-col max-h-[min(90vh,820px)] overflow-hidden">
            {/* Header (Pinned) */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-[#0A1024]">
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">
                  {editingExam ? `Edit Exam — ${editingExam.title}` : 'Create Target Exam'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure exam details, official emblem, and public visibility.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSaveExam} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4 text-xs">
                {formError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
                    {formError}
                  </div>
                )}

                {/* Row 1: Title & Short Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Exam Title *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WBP Constable"
                      value={formTitle}
                      onChange={(e) => {
                        setFormTitle(e.target.value);
                        if (!editingExam) {
                          setFormSlug(
                            e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '')
                          );
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] focus:ring-2 focus:ring-[#026BFC]/20 focus:border-[#026BFC] outline-hidden text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Short Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WBP"
                      value={formShortName}
                      onChange={(e) => setFormShortName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] focus:ring-2 focus:ring-[#026BFC]/20 focus:border-[#026BFC] outline-hidden text-xs"
                    />
                  </div>
                </div>

                {/* Row 2: Category & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Category *
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] focus:ring-2 focus:ring-[#026BFC]/20 focus:border-[#026BFC] outline-hidden text-xs"
                    >
                      <option value="State Govt">State Govt</option>
                      <option value="Central Govt">Central Govt</option>
                      <option value="Other">Other</option>
                      {categories
                        .filter((c) => !['State Govt', 'Central Govt', 'Other'].includes(c))
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. wbp-constable"
                      value={formSlug}
                      onChange={(e) => setFormSlug(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] focus:ring-2 focus:ring-[#026BFC]/20 focus:border-[#026BFC] outline-hidden text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Row 3: Full Subtitle */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Subtitle / Board Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. West Bengal Police Constable"
                    value={formSubtitle}
                    onChange={(e) => setFormSubtitle(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] focus:ring-2 focus:ring-[#026BFC]/20 focus:border-[#026BFC] outline-hidden text-xs"
                  />
                </div>

                {/* Section 2: Exam Logo / Emblem */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                        Exam Official Logo & Emblem
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Upload custom logo or pick an official preset
                      </span>
                    </div>
                    {formIconName && (
                      <button
                        type="button"
                        onClick={() => setFormIconName('')}
                        className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                        title="Remove icon"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Icon
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-start">
                    {/* Left Column: Live Preview & Upload */}
                    <div className="md:col-span-5 space-y-2">
                      <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-[#070D1E]">
                        <ExamEmblemBadge
                          title={formTitle || 'Exam Logo'}
                          slug={formSlug}
                          iconName={formIconName}
                          className="w-12 h-12 shadow-sm shrink-0"
                        />
                        <div className="flex-1 min-w-0 space-y-1">
                          <label
                            htmlFor="exam-modal-logo-file-input"
                            className={cn(
                              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs cursor-pointer shadow-2xs transition-colors w-full justify-center',
                              isUploadingLogo
                                ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                                : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                            )}
                          >
                            <Upload className="w-3.5 h-3.5" />
                            {isUploadingLogo
                              ? 'Uploading...'
                              : formIconName
                                ? 'Change Icon'
                                : 'Upload Icon'}
                            <input
                              id="exam-modal-logo-file-input"
                              type="file"
                              accept="image/*"
                              disabled={isUploadingLogo}
                              className="hidden"
                              onChange={async (ev) => {
                                const file = ev.target.files?.[0];
                                if (!file) return;
                                try {
                                  setIsUploadingLogo(true);
                                  const uploadedUrl = await handleUploadImageFile(file);
                                  setFormIconName(uploadedUrl);
                                } catch (err) {
                                  alert('Failed to upload image: ' + getErrorMessage(err, 'Error'));
                                } finally {
                                  setIsUploadingLogo(false);
                                }
                              }}
                            />
                          </label>
                          <input
                            type="text"
                            placeholder="or paste image URL..."
                            value={formIconName}
                            onChange={(e) => setFormIconName(e.target.value)}
                            className="w-full px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-transparent text-[10px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Preset Logos Grid */}
                    <div className="md:col-span-7">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Preset Official Logos
                        </span>
                        <span className="text-[10px] text-slate-400">Click to apply</span>
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          {
                            name: 'WBP Police',
                            url: '/images/exams/logo_wbp.png',
                            label: 'WBP Police',
                          },
                          {
                            name: 'Kolkata Police',
                            url: '/images/exams/logo_kp.png',
                            label: 'Kolkata Police',
                          },
                          {
                            name: 'WBPSC',
                            url: '/images/exams/logo_wbpsc.png',
                            label: 'WBPSC / Food SI',
                          },
                          {
                            name: 'WBSSC',
                            url: '/images/exams/emblem_wbssc.png',
                            label: 'WBSSC Group C/D',
                          },
                          {
                            name: 'Indian Railway',
                            url: '/images/exams/logo_railway.png',
                            label: 'Indian Railway',
                          },
                          {
                            name: 'SSC Commission',
                            url: '/images/exams/logo_ssc.png',
                            label: 'SSC Commission',
                          },
                          {
                            name: 'Primary TET',
                            url: '/images/exams/logo_wbtet.png',
                            label: 'Primary TET',
                          },
                        ].map((preset) => (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => setFormIconName(preset.url)}
                            className={cn(
                              'flex items-center gap-2 px-2 py-1.5 rounded-lg border text-xs font-medium transition-all text-left cursor-pointer',
                              formIconName === preset.url
                                ? 'border-[#026BFC] bg-blue-50/80 dark:bg-blue-950/40 text-[#026BFC] dark:text-blue-400 font-bold ring-2 ring-[#026BFC]/25 shadow-xs'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                            )}
                            title={preset.name}
                          >
                            <div className="w-5 h-5 rounded bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-0.5 flex items-center justify-center shrink-0">
                              <img
                                src={preset.url}
                                alt={preset.name}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <span className="truncate text-[11px]">{preset.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Description */}
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Describe the exam, target vacancies and syllabus..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] focus:ring-2 focus:ring-[#026BFC]/20 focus:border-[#026BFC] outline-hidden text-xs"
                  />
                </div>

                {/* Visibility Toggle Card */}
                <label
                  htmlFor="formIsActive"
                  className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-colors"
                >
                  <input
                    type="checkbox"
                    id="formIsActive"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      Publish on platform (Visible to students)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      When unchecked, this exam will remain as a hidden draft in the admin panel.
                    </span>
                  </div>
                </label>
              </div>

              {/* Footer (Pinned at Bottom) */}
              <div className="px-6 py-3.5 bg-slate-50 dark:bg-[#0A1024] border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0 rounded-b-2xl">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
