import { Trash2, X, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/common/Button';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { SubjectIconBadge } from './SubjectIconBadge';
import type { AdminSubjectsState } from './useAdminSubjects';

export interface SubjectEditorModalProps {
  sb: AdminSubjectsState;
}

export function SubjectEditorModal({ sb }: SubjectEditorModalProps) {
  const {
    mutationLock,
    uploadLock,
    isSaving,
    isModalOpen,
    setIsModalOpen,
    editingSubject,
    formName,
    setFormName,
    formSlug,
    setFormSlug,
    slugTouched,
    setSlugTouched,
    formCategory,
    setFormCategory,
    formDescription,
    setFormDescription,
    formIconName,
    setFormIconName,
    isUploadingIcon,
    setIsUploadingIcon,
    formIsActive,
    setFormIsActive,
    formError,
    setFormError,
    handleSaveSubject,
  } = sb;
  return (
    <>
      {/* MODAL: Create / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in-50">
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Subject editor"
            className="bg-white dark:bg-[#0A1024] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto p-6 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingSubject ? `Edit Subject — ${editingSubject.name}` : 'Create Subject'}
              </h3>
              <button
                type="button"
                aria-label="Close Subject editor"
                disabled={isSaving || isUploadingIcon}
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="p-2.5 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold"
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveSubject} className="space-y-3.5 text-xs">
              <fieldset disabled={isSaving || isUploadingIcon} className="space-y-3.5">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. General Science"
                    aria-label="Subject name"
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      if (!editingSubject && !slugTouched) {
                        setFormSlug(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)/g, '')
                        );
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Category *
                    </label>
                    <select
                      aria-label="Subject category"
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                    >
                      {formCategory &&
                        !['General', 'Social Science', 'Aptitude'].includes(formCategory) && (
                          <option value={formCategory}>{formCategory}</option>
                        )}
                      <option value="General">General</option>
                      <option value="Social Science">Social Science</option>
                      <option value="Aptitude">Aptitude</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. general-science"
                      aria-label="URL slug"
                      value={formSlug}
                      onChange={(e) => {
                        setSlugTouched(true);
                        setFormSlug(e.target.value);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Detailed description of the subject and topics covered..."
                    aria-label="Subject description"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E]"
                  />
                </div>

                {/* Subject Icon Field */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                        Subject Icon
                      </label>
                      <span className="text-[11px] text-slate-400">
                        PNG, JPG or WebP · up to 2 MB. Changes persist after Save.
                      </span>
                    </div>
                    {formIconName && (
                      <button
                        type="button"
                        onClick={() => setFormIconName('')}
                        className="text-[11px] font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                        title="Remove icon"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove Icon
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Live Icon Preview */}
                    <SubjectIconBadge
                      name={formName || 'Subject Icon'}
                      iconName={formIconName}
                      className="w-10 h-10 shadow-xs"
                    />

                    {/* Upload & Change Controls */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <label
                          className={cn(
                            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                            isUploadingIcon
                              ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                              : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                          )}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {isUploadingIcon
                            ? 'Uploading...'
                            : formIconName
                              ? 'Change Icon'
                              : 'Upload Icon'}
                          <input
                            type="file"
                            aria-label="Subject icon file"
                            accept="image/png,image/jpeg,image/webp"
                            disabled={isUploadingIcon || isSaving}
                            className="hidden"
                            onChange={async (ev) => {
                              const file = ev.target.files?.[0];
                              if (!file || uploadLock.current || mutationLock.current) return;
                              uploadLock.current = true;
                              try {
                                setIsUploadingIcon(true);
                                const uploadedUrl = await api.uploadSubjectIcon(
                                  file,
                                  editingSubject?.id || 'new'
                                );
                                setFormIconName(uploadedUrl);
                              } catch (err) {
                                setFormError(
                                  'Failed to upload icon: ' + getErrorMessage(err, 'Upload failed')
                                );
                              } finally {
                                uploadLock.current = false;
                                setIsUploadingIcon(false);
                              }
                            }}
                          />
                        </label>

                        {formIconName && (
                          <button
                            type="button"
                            onClick={() => setFormIconName('')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-semibold text-xs border border-slate-200 dark:border-slate-700 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Remove
                          </button>
                        )}

                        <span className="text-[11px] text-slate-400">or icon URL:</span>
                      </div>

                      <input
                        type="text"
                        placeholder="HTTPS icon URL or named icon"
                        aria-label="Subject icon reference"
                        value={formIconName}
                        onChange={(e) => setFormIconName(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="formIsActiveSub"
                    checked={formIsActive}
                    onChange={(e) => setFormIsActive(e.target.checked)}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <label
                    htmlFor="formIsActiveSub"
                    className="font-medium text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    Publish on platform (Visible to students)
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSaving || isUploadingIcon}
                    onClick={() => setIsModalOpen(false)}
                    className="text-xs"
                  >
                    Cancel
                  </Button>
                  <button
                    type="submit"
                    disabled={isSaving || isUploadingIcon}
                    className="px-4 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-2xs transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : editingSubject ? 'Update Subject' : 'Create Subject'}
                  </button>
                </div>
              </fieldset>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
