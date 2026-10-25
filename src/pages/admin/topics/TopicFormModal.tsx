import { Upload, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/services/api';
import { getErrorMessage } from '@/lib/errors';
import { TopicIconBadge } from './TopicIconBadge';
import type { AdminTopicsState } from './useAdminTopics';

export interface TopicFormModalProps {
  tp: AdminTopicsState;
}

export function TopicFormModal({ tp }: TopicFormModalProps) {
  const {
    topicsList,
    subjectsList,
    selectedTopic,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    formData,
    setFormData,
    isUploadingTopicIcon,
    setIsUploadingTopicIcon,
    isSubmitting,
    formError,
    handleSaveTopic,
  } = tp;
  return (
    <>
      {/* 5. CREATE / EDIT TOPIC MODAL */}
      {(isCreateModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#0A1024] rounded-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {isEditModalOpen ? 'Edit Topic' : 'Create New Topic'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isEditModalOpen
                    ? 'Update topic attributes and subject mapping'
                    : 'Add a new topic under a parent subject'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setIsEditModalOpen(false);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTopic} className="p-5 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs">
                  {formError}
                </div>
              )}

              {/* Topic Name */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Heat & Temperature"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData((prev) => ({
                      ...prev,
                      name,
                      slug: !isEditModalOpen
                        ? name
                            .toLowerCase()
                            .replace(/[^a-z0-9]+/g, '-')
                            .replace(/(^-|-$)+/g, '')
                        : prev.slug,
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Topic Slug *
                </label>
                <input
                  type="text"
                  required
                  placeholder="heat-and-temperature"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              {/* Parent Subject */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Parent Subject *
                  </label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => {
                      const newSubId = e.target.value;
                      const countForSub = topicsList.filter((t) => t.subjectId === newSubId).length;
                      setFormData({
                        ...formData,
                        subjectId: newSubId,
                        orderIndex: isEditModalOpen ? formData.orderIndex : countForSub + 1,
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#026BFC]"
                    required
                  >
                    {subjectsList.length === 0 ? (
                      <option value="" disabled>
                        No subjects available
                      </option>
                    ) : (
                      subjectsList.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.statusLabel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        statusLabel: e.target.value as 'Published' | 'Draft',
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-700 dark:text-slate-200 focus:outline-none focus:border-[#026BFC]"
                  >
                    <option value="Published">Published</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Order Index */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.orderIndex}
                  onChange={(e) => setFormData({ ...formData, orderIndex: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC]"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Description (Bengali / English)
                </label>
                <textarea
                  rows={3}
                  placeholder="টপিকের সারসংক্ষেপ ও পরীক্ষার উপযোগী গুরুত্বপূর্ণ তথ্যাবলী..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-slate-900 dark:text-white focus:outline-none focus:border-[#026BFC] resize-none"
                />
              </div>

              {/* Topic Icon Field */}
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="font-semibold text-slate-800 dark:text-slate-200 block text-xs">
                      Topic Icon
                    </label>
                    <span className="text-[11px] text-slate-400">
                      Upload a custom PNG, JPG, WebP, or SVG icon
                    </span>
                  </div>
                  {formData.iconName && (
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, iconName: '' }))}
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
                  <TopicIconBadge
                    name={formData.name || 'Topic Icon'}
                    iconName={formData.iconName}
                    className="w-10 h-10 shadow-xs"
                  />

                  {/* Upload & Change Controls */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label
                        className={cn(
                          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-xs cursor-pointer shadow-2xs transition-colors',
                          isUploadingTopicIcon
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-[#026BFC] hover:bg-blue-700 text-white'
                        )}
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {isUploadingTopicIcon
                          ? 'Uploading...'
                          : formData.iconName
                            ? 'Change Icon'
                            : 'Upload Icon'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={isUploadingTopicIcon}
                          className="hidden"
                          onChange={async (ev) => {
                            const file = ev.target.files?.[0];
                            if (!file) return;
                            try {
                              setIsUploadingTopicIcon(true);
                              const uploadedUrl = await api.uploadTopicIcon(
                                file,
                                selectedTopic?.id || 'new'
                              );
                              setFormData((prev) => ({ ...prev, iconName: uploadedUrl }));
                            } catch (err) {
                              alert('Failed to upload icon: ' + getErrorMessage(err, 'Error'));
                            } finally {
                              setIsUploadingTopicIcon(false);
                            }
                          }}
                        />
                      </label>

                      {formData.iconName && (
                        <button
                          type="button"
                          onClick={() => setFormData((prev) => ({ ...prev, iconName: '' }))}
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
                      placeholder="https://... or data:image/..."
                      value={formData.iconName}
                      onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                      className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#070D1E] text-[11px] font-mono text-slate-700 dark:text-slate-300 placeholder:font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setIsEditModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#026BFC] hover:bg-blue-700 text-white font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  {isSubmitting ? 'Saving...' : isEditModalOpen ? 'Save Changes' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
