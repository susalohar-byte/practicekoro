import DOMPurify from 'dompurify';
import { X } from 'lucide-react';
import { PRESET_THUMBNAILS } from './blogConstants';
import type { AdminBlogState } from './useAdminBlog';

export interface BlogPostPreviewModalProps {
  blogState: AdminBlogState;
}

export function BlogPostPreviewModal({ blogState }: BlogPostPreviewModalProps) {
  const { previewPost, setPreviewPost } = blogState;
  return (
    <>
      {/* VIEW / PREVIEW BLOG POST MODAL */}
      {previewPost && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                  {previewPost.category}
                </span>
                <span className="text-xs text-slate-400 font-mono">/{previewPost.slug}</span>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="w-full h-56 rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <img
                src={previewPost.thumbnail || PRESET_THUMBNAILS[0].url}
                alt={previewPost.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-snug">{previewPost.title}</h1>
              <div className="flex items-center gap-3 mt-3 text-xs text-slate-500 pb-3 border-b border-slate-100">
                <span className="font-semibold text-slate-700">By {previewPost.author}</span>
                <span>•</span>
                <span>{previewPost.readTime} read</span>
                <span>•</span>
                <span>{previewPost.views.toLocaleString('en-IN')} views</span>
              </div>
            </div>

            <div
              className="prose prose-sm max-w-none text-slate-700 leading-relaxed max-h-72 overflow-y-auto"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(previewPost.content, { USE_PROFILES: { html: true } }),
              }}
            />

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewPost(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
