import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '@/services/api';
import type { BlogPost, BlogPostStatus } from '@/types';
import { toast, setGlobalToastHandler, type ToastType } from './blogToast';

export function useAdminBlog() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    'all' | 'published' | 'draft' | 'scheduled' | 'archived'
  >('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<'views' | 'date' | 'title'>('views');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Selected Row Checkboxes
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Drawer (Neutral initial state - closed by default)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'content' | 'seo' | 'analytics'>(
    'overview'
  );

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [deleteCandidate, setDeleteCandidate] = useState<BlogPost | null>(null);
  const [previewPost, setPreviewPost] = useState<BlogPost | null>(null);

  // Active Dropdown Action Menu
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Toast Notification State
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    type: ToastType;
  } | null>(null);

  useEffect(() => {
    setGlobalToastHandler((message: string, type: ToastType) => {
      setToastNotification({ message, type });
      setTimeout(() => setToastNotification(null), 3200);
    });
    return () => {
      setGlobalToastHandler(null);
    };
  }, []);

  // Load Posts from Service
  const loadPosts = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getAllBlogPosts();
      setPosts(data);
      setSelectedPostId((prev) => {
        if (!prev) return null;
        return data.some((p) => p.id === prev) ? prev : null;
      });
    } catch (err) {
      console.error('Failed to load blog posts:', err);
      toast.error('Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPosts();

    const handleUpdate = () => {
      loadPosts();
    };
    window.addEventListener('pk_blog_posts_updated', handleUpdate);
    return () => {
      window.removeEventListener('pk_blog_posts_updated', handleUpdate);
    };
  }, [loadPosts]);

  // Click outside to close action menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.action-menu-container')) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute Overall KPI Metrics
  const stats = useMemo(() => {
    const total = posts.length;
    const published = posts.filter((p) => p.status === 'published').length;
    const drafts = posts.filter((p) => p.status === 'draft').length;
    const scheduled = posts.filter((p) => p.status === 'scheduled').length;
    const archived = posts.filter((p) => p.status === 'archived').length;
    const totalViews = posts.reduce((sum, p) => sum + (p.views || 0), 0);

    return {
      total,
      published,
      drafts,
      scheduled,
      archived,
      totalViews,
    };
  }, [posts]);

  // Distinct Categories & Authors for Filters
  const { allCategories, allAuthors } = useMemo(() => {
    const cats = new Set<string>();
    const auths = new Set<string>();
    posts.forEach((p) => {
      if (p.category) cats.add(p.category);
      if (p.author) auths.add(p.author);
    });
    return {
      allCategories: Array.from(cats),
      allAuthors: Array.from(auths),
    };
  }, [posts]);

  // Filtering Logic
  const filteredPosts = useMemo(() => {
    return posts
      .filter((post) => {
        // Tab filter
        if (activeTab === 'published' && post.status !== 'published') return false;
        if (activeTab === 'draft' && post.status !== 'draft') return false;
        if (activeTab === 'scheduled' && post.status !== 'scheduled') return false;
        if (activeTab === 'archived' && post.status !== 'archived') return false;

        // Status dropdown filter
        if (statusFilter !== 'all' && post.status !== statusFilter) return false;

        // Category filter
        if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;

        // Author filter
        if (authorFilter !== 'all' && post.author !== authorFilter) return false;

        // Time filter
        if (timeFilter !== 'all') {
          const postDate = new Date(post.createdAt || post.publishedAt || Date.now());
          const now = new Date();
          if (timeFilter === 'today') {
            if (postDate.toDateString() !== now.toDateString()) return false;
          } else if (timeFilter === 'this_week') {
            const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            if (postDate < sevenDaysAgo) return false;
          } else if (timeFilter === 'this_month') {
            if (
              postDate.getMonth() !== now.getMonth() ||
              postDate.getFullYear() !== now.getFullYear()
            )
              return false;
          } else if (timeFilter === 'this_year') {
            if (postDate.getFullYear() !== now.getFullYear()) return false;
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = post.title.toLowerCase().includes(q);
          const matchCategory = post.category.toLowerCase().includes(q);
          const matchAuthor = post.author.toLowerCase().includes(q);
          const matchSlug = post.slug.toLowerCase().includes(q);
          const matchExcerpt = post.excerpt.toLowerCase().includes(q);
          if (!matchTitle && !matchCategory && !matchAuthor && !matchSlug && !matchExcerpt) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'views') {
          return sortOrder === 'desc' ? b.views - a.views : a.views - b.views;
        }
        if (sortField === 'title') {
          return sortOrder === 'desc'
            ? b.title.localeCompare(a.title)
            : a.title.localeCompare(b.title);
        }
        if (sortField === 'date') {
          const timeA = new Date(a.publishedAt || a.createdAt).getTime();
          const timeB = new Date(b.publishedAt || b.createdAt).getTime();
          return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        }
        return 0;
      });
  }, [
    posts,
    activeTab,
    statusFilter,
    categoryFilter,
    authorFilter,
    timeFilter,
    searchQuery,
    sortField,
    sortOrder,
  ]);

  // Paginated Posts
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / pageSize));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPosts.slice(start, start + pageSize);
  }, [filteredPosts, currentPage, pageSize]);

  // Keep currentPage within bounds when posts are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Selected Post for Drawer
  const selectedPost = useMemo(() => {
    if (!selectedPostId) return null;
    return posts.find((p) => p.id === selectedPostId) || null;
  }, [posts, selectedPostId]);

  // Featured Toggle Handler
  const handleToggleFeatured = async (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const updated = await api.toggleBlogPostFeatured(post.id);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(updated.isFeatured ? 'Post marked as Featured' : 'Removed from Featured');
    } catch {
      toast.error('Failed to update featured status');
    }
  };

  // Status Toggle Handler
  const handleToggleStatus = async (post: BlogPost) => {
    try {
      const updated = await api.toggleBlogPostStatus(post.id);
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      toast.success(`Post status updated to ${updated.status}`);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to change status');
    }
  };

  // Duplicate Handler
  const handleDuplicate = async (post: BlogPost) => {
    try {
      const dup = await api.duplicateBlogPost(post.id);
      setPosts((prev) => [dup, ...prev]);
      setSelectedPostId(dup.id);
      setIsDrawerOpen(true);
      toast.success('Blog post duplicated successfully');
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to duplicate post');
    }
  };

  // Delete Handler
  const handleDeleteConfirm = async () => {
    if (!deleteCandidate) return;
    try {
      await api.deleteBlogPost(deleteCandidate.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteCandidate.id));
      if (selectedPostId === deleteCandidate.id) {
        setSelectedPostId(null);
        setIsDrawerOpen(false);
      }
      toast.success('Blog post deleted successfully');
      setDeleteCandidate(null);
      setActiveMenuId(null);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('all');
    setStatusFilter('all');
    setAuthorFilter('all');
    setTimeFilter('all');
    setActiveTab('all');
    setCurrentPage(1);
    toast.success('Filters reset');
  };

  // Select All Checkbox Handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(paginatedPosts.map((p) => p.id));
      setSelectedIds(allIds);
    } else {
      setSelectedIds(new Set());
    }
  };

  // Row Select Checkbox Handler
  const handleToggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Bulk Status Update
  const handleBulkStatusChange = async (status: BlogPostStatus) => {
    const batch = await runConfirmedBatch(Array.from(selectedIds), (id) =>
      api.updateBlogPost(id, { status })
    );
    const saved = new Map(batch.results.map((r) => [r.input, r.value]));
    setPosts((prev) => prev.map((p) => saved.get(p.id) || p));
    setSelectedIds(new Set(batch.failures.map((f) => f.input)));
    if (batch.failures.length)
      toast.error(
        batch.results.length +
          ' saved; ' +
          batch.failures.length +
          ' failed: ' +
          batch.failures[0].error
      );
    else toast.success('Post statuses saved.');
  };

  // Bulk Delete
  const handleBulkDelete = async () => {
    if (!selectedIds.size || !window.confirm('Delete selected posts?')) return;
    const batch = await runConfirmedBatch(Array.from(selectedIds), (id) => api.deleteBlogPost(id));
    const gone = new Set(batch.results.map((r) => r.input));
    setPosts((prev) => prev.filter((p) => !gone.has(p.id)));
    setSelectedIds(new Set(batch.failures.map((f) => f.input)));
    if (batch.failures.length)
      toast.error(
        gone.size + ' deleted; ' + batch.failures.length + ' failed: ' + batch.failures[0].error
      );
    else toast.success(gone.size + ' deleted.');
  };

  return {
    posts,
    setPosts,
    loading,
    setLoading,
    selectedPostId,
    setSelectedPostId,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    statusFilter,
    setStatusFilter,
    authorFilter,
    setAuthorFilter,
    timeFilter,
    setTimeFilter,
    sortField,
    setSortField,
    sortOrder,
    setSortOrder,
    selectedIds,
    setSelectedIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isDrawerOpen,
    setIsDrawerOpen,
    drawerTab,
    setDrawerTab,
    isCreateModalOpen,
    setIsCreateModalOpen,
    editingPost,
    setEditingPost,
    isImportModalOpen,
    setIsImportModalOpen,
    deleteCandidate,
    setDeleteCandidate,
    previewPost,
    setPreviewPost,
    activeMenuId,
    setActiveMenuId,
    toastNotification,
    setToastNotification,
    loadPosts,
    stats,
    allCategories,
    allAuthors,
    filteredPosts,
    totalPages,
    paginatedPosts,
    selectedPost,
    handleToggleFeatured,
    handleToggleStatus,
    handleDuplicate,
    handleDeleteConfirm,
    handleResetFilters,
    handleSelectAll,
    handleToggleSelectRow,
    handleBulkStatusChange,
    handleBulkDelete,
  };
}

export type AdminBlogState = ReturnType<typeof useAdminBlog>;
