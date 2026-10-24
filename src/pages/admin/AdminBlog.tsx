import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { api } from '@/services/api';
import { toast } from './blog/blogToast';
import { useAdminBlog } from './blog/useAdminBlog';
import { BlogPageHeader } from './blog/BlogPageHeader';
import { BlogKpiCards } from './blog/BlogKpiCards';
import { BlogStatusTabs } from './blog/BlogStatusTabs';
import { BlogFilterToolbar } from './blog/BlogFilterToolbar';
import { BlogPostsTableCard } from './blog/BlogPostsTableCard';
import { BlogPostDetailsDrawer } from './blog/BlogPostDetailsDrawer';
import { CreateEditPostModal } from './blog/CreateEditPostModal';
import { ImportPostsModal } from './blog/ImportPostsModal';
import { DeleteBlogPostDialog } from './blog/DeleteBlogPostDialog';
import { BlogPostPreviewModal } from './blog/BlogPostPreviewModal';
import { BlogToastNotification } from './blog/BlogToastNotification';

export const AdminBlog: React.FC = () => {
  const blogState = useAdminBlog();
  const {
    loading,
    setPosts,
    setSelectedPostId,
    setIsDrawerOpen,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingPost,
    setEditingPost,
    isImportModalOpen,
    setIsImportModalOpen,
  } = blogState;

  return withAdminSkeleton(
    loading,
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <BlogPageHeader blogState={blogState} />

      <div className="px-6 py-6 space-y-6">
        <BlogKpiCards blogState={blogState} />

        <BlogStatusTabs blogState={blogState} />

        <BlogFilterToolbar blogState={blogState} />

        {/* Main Content Layout: Table on Left + Details Drawer on Right */}
        <div className="flex items-start gap-6">
          <BlogPostsTableCard blogState={blogState} />

          <BlogPostDetailsDrawer blogState={blogState} />
        </div>
      </div>

      {/* CREATE / EDIT BLOG POST MODAL */}
      {isCreateModalOpen && (
        <CreateEditPostModal
          isOpen={isCreateModalOpen}
          initialData={editingPost}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPost(null);
          }}
          onSave={async (savedPost) => {
            if (editingPost) {
              setPosts((prev) => prev.map((p) => (p.id === savedPost.id ? savedPost : p)));
              toast.success('Blog post updated successfully');
            } else {
              setPosts((prev) => [savedPost, ...prev]);
              setSelectedPostId(savedPost.id);
              setIsDrawerOpen(true);
              toast.success('Blog post created successfully');
            }
            setIsCreateModalOpen(false);
            setEditingPost(null);
          }}
        />
      )}

      {/* IMPORT BLOG POSTS MODAL */}
      {isImportModalOpen && (
        <ImportPostsModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={async (newPosts) => {
            try {
              const created = await api.importBlogPosts(newPosts);
              setPosts((prev) => [...created, ...prev]);
              toast.success(`Imported ${created.length} blog posts`);
              setIsImportModalOpen(false);
            } catch {
              toast.error('Import failed');
            }
          }}
        />
      )}

      <DeleteBlogPostDialog blogState={blogState} />

      <BlogPostPreviewModal blogState={blogState} />

      <BlogToastNotification blogState={blogState} />
    </div>,
    { label: 'Loading blog…', variant: 'table' }
  );
};
