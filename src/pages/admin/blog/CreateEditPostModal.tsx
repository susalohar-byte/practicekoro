import React, { useState } from 'react';
import type { BlogPost, BlogPostStatus } from '@/types';
import { api } from '@/services/api';
import { X } from 'lucide-react';
import { PRESET_THUMBNAILS } from './blogConstants';
import { toast } from './blogToast';

// ----------------------------------------------------
// CREATE / EDIT BLOG POST MODAL COMPONENT
// ----------------------------------------------------

export interface CreateEditPostModalProps {
  isOpen: boolean;
  initialData: BlogPost | null;
  onClose: () => void;
  onSave: (post: BlogPost) => Promise<void>;
}

export const CreateEditPostModal: React.FC<CreateEditPostModalProps> = ({
  initialData,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [category, setCategory] = useState(initialData?.category || 'WBP Constable');
  const [author, setAuthor] = useState(initialData?.author || 'Admin');
  const [status, setStatus] = useState<BlogPostStatus>(initialData?.status || 'published');
  const [isFeatured, setIsFeatured] = useState<boolean>(initialData?.isFeatured || false);
  const [thumbnail, setThumbnail] = useState(initialData?.thumbnail || PRESET_THUMBNAILS[0].url);
  const [excerpt, setExcerpt] = useState(initialData?.excerpt || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [seoTitle, setSeoTitle] = useState(initialData?.seoTitle || '');
  const [seoDescription, setSeoDescription] = useState(initialData?.seoDescription || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-slugify on title changes if creating new
  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!initialData) {
      const generated = val
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-');
      setSlug(generated || `post-${Date.now().toString(36)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: Partial<BlogPost> = {
        title,
        slug: slug.trim() || `post-${Date.now().toString(36)}`,
        category,
        author,
        status,
        isFeatured,
        thumbnail,
        excerpt: excerpt.trim() || title,
        content,
        seoTitle: seoTitle || title,
        seoDescription: seoDescription || excerpt,
        publishedAt: status === 'published' ? new Date().toISOString() : null,
      };

      let result: BlogPost;
      if (initialData) {
        result = await api.updateBlogPost(initialData.id, payload);
      } else {
        result = await api.createBlogPost(payload);
      }

      await onSave(result);
    } catch {
      toast.error('Failed to save post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">
            {initialData ? 'Edit Blog Post' : 'Create Blog Post'}
          </h2>
          <button
            aria-label="Close"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Title <span className="text-rose-500">*</span>
            </label>
            <input
              aria-label="Title"
              type="text"
              required
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. WBP Constable পরীক্ষার প্রস্তুতি : সম্পূর্ণ গাইড"
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Slug & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <input
                aria-label="Slug"
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="wbp-constable-guide"
                className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
              <select
                aria-label="Category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="WBP Constable">WBP Constable</option>
                <option value="General Knowledge">General Knowledge</option>
                <option value="Study Tips">Study Tips</option>
                <option value="Indian Polity">Indian Polity</option>
                <option value="General Science">General Science</option>
                <option value="Railway">Railway</option>
                <option value="Mathematics">Mathematics</option>
                <option value="History">History</option>
                <option value="Current Affairs">Current Affairs</option>
                <option value="Exam Strategy">Exam Strategy</option>
              </select>
            </div>
          </div>

          {/* Author & Status & Featured */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Author</label>
              <select
                aria-label="Author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Admin">Admin</option>
                <option value="Susanta">Susanta</option>
                <option value="Puja">Puja</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
              <select
                aria-label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="scheduled">Scheduled</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Featured</label>
              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 font-medium">Show in Featured</span>
                </label>
              </div>
            </div>
          </div>

          {/* Thumbnail Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Thumbnail Image
            </label>
            <div className="flex items-center gap-3">
              <div className="w-16 h-12 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0">
                <img
                  src={thumbnail}
                  alt="Thumbnail preview"
                  className="w-full h-full object-cover"
                />
              </div>
              <input
                aria-label="Thumbnail Image"
                type="text"
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                placeholder="Image URL or choose preset"
                className="flex-1 px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2 mt-2 overflow-x-auto pb-1">
              {PRESET_THUMBNAILS.map((pt) => (
                <button
                  type="button"
                  key={pt.name}
                  onClick={() => setThumbnail(pt.url)}
                  className="px-2 py-1 text-[11px] font-medium border border-slate-200 rounded-md hover:bg-slate-50 text-slate-600 whitespace-nowrap"
                >
                  {pt.name}
                </button>
              ))}
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Excerpt</label>
            <textarea
              rows={2}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short summary for preview cards..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Content Body */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Content (HTML / Rich Text) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={6}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<p>Write your detailed blog post content here...</p>"
              className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* SEO Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SEO Title</label>
              <input
                aria-label="SEO Title"
                type="text"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Google SERP Title"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                SEO Description
              </label>
              <input
                aria-label="SEO Description"
                type="text"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Google Meta Description"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update Post' : 'Publish Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
