import { Plus, ExternalLink, Download } from 'lucide-react';
import type { AdminBlogState } from './useAdminBlog';

export interface BlogPageHeaderProps {
  blogState: AdminBlogState;
}

export function BlogPageHeader({ blogState }: BlogPageHeaderProps) {
  const {
    setIsCreateModalOpen,
    setEditingPost,
    setIsImportModalOpen,
    setPreviewPost,
    selectedPost,
  } = blogState;
  return (
    <>
      {/* Top Header Row */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Blog</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, edit and manage blog posts for students and exam preparation content.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (selectedPost) {
                  setPreviewPost(selectedPost);
                } else {
                  window.open('/questions', '_blank');
                }
              }}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <ExternalLink className="w-4 h-4 text-blue-600" />
              <span>View Website</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4 text-blue-600" />
              <span>Import Posts</span>
            </button>
            <button
              onClick={() => {
                setEditingPost(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Blog Post</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
