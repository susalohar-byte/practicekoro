import { AdminSectionSkeleton } from '@/components/admin/AdminSkeleton';
import {
  Eye,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  Copy,
  FileCheck,
  ArrowUpDown,
  BookOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getPageNumbers } from '@/utils/pagination';
import { PRESET_THUMBNAILS, CATEGORY_COLORS } from './blogConstants';
import { formatPublishedDate } from './blogFormatting';
import type { AdminBlogState } from './useAdminBlog';

export interface BlogPostsTableCardProps {
  blogState: AdminBlogState;
}

export function BlogPostsTableCard({ blogState }: BlogPostsTableCardProps) {
  const {
    loading,
    setSelectedPostId,
    sortField,
    setSortField,
    setSortOrder,
    selectedIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    isDrawerOpen,
    setIsDrawerOpen,
    setIsCreateModalOpen,
    setEditingPost,
    setDeleteCandidate,
    activeMenuId,
    setActiveMenuId,
    filteredPosts,
    totalPages,
    paginatedPosts,
    selectedPost,
    handleToggleFeatured,
    handleToggleStatus,
    handleDuplicate,
    handleSelectAll,
    handleToggleSelectRow,
  } = blogState;
  return (
    <>
      {/* Main Table Container */}
      <div className="flex-1 min-w-0 bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedPosts.length > 0 &&
                      paginatedPosts.every((p) => selectedIds.has(p.id))
                    }
                    onChange={handleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-2 w-8 text-center text-slate-400">#</th>
                <th className="py-3 px-3 text-center">Featured</th>
                <th className="py-3 px-3">Thumbnail</th>
                <th className="py-3 px-3">Title</th>
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3">Author</th>
                <th
                  className="py-3 px-3 cursor-pointer select-none hover:text-slate-800"
                  onClick={() => {
                    if (sortField === 'views') {
                      setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'));
                    } else {
                      setSortField('views');
                      setSortOrder('desc');
                    }
                  }}
                >
                  <div className="flex items-center gap-1">
                    <span>Views</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Published At</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={11} className="p-4">
                    <AdminSectionSkeleton label="Loading blog posts..." variant="table" />
                  </td>
                </tr>
              ) : paginatedPosts.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BookOpen className="w-8 h-8 text-slate-300" />
                      <p className="text-sm font-medium text-slate-600">No blog posts found</p>
                      <p className="text-xs text-slate-400">Try adjusting your search or filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPosts.map((post, index) => {
                  const rowNumber = (currentPage - 1) * pageSize + index + 1;
                  const isSelected = Boolean(isDrawerOpen && selectedPost?.id === post.id);
                  const pubDate = formatPublishedDate(post.publishedAt);
                  const catStyle = CATEGORY_COLORS[post.category] || {
                    bg: 'bg-slate-50',
                    text: 'text-slate-700',
                    border: 'border-slate-200',
                  };

                  return (
                    <tr
                      key={post.id}
                      onClick={() => {
                        setSelectedPostId(post.id);
                        setIsDrawerOpen(true);
                      }}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors cursor-pointer group',
                        isSelected && 'bg-blue-50/40'
                      )}
                    >
                      {/* Checkbox */}
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => handleToggleSelectRow(post.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(post.id)}
                          onChange={() => {}}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Index # */}
                      <td className="py-3.5 px-2 text-center text-xs text-slate-400 font-medium">
                        {rowNumber}
                      </td>

                      {/* Featured Toggle */}
                      <td
                        className="py-3.5 px-3 text-center"
                        onClick={(e) => handleToggleFeatured(post, e)}
                      >
                        <div
                          className={cn(
                            'w-9 h-5 rounded-full transition-colors relative inline-block p-0.5 cursor-pointer',
                            post.isFeatured ? 'bg-blue-600' : 'bg-slate-200'
                          )}
                        >
                          <div
                            className={cn(
                              'w-4 h-4 rounded-full bg-white transition-transform shadow-xs',
                              post.isFeatured ? 'translate-x-4' : 'translate-x-0'
                            )}
                          />
                        </div>
                      </td>

                      {/* Thumbnail */}
                      <td className="py-3.5 px-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          <img
                            src={post.thumbnail || PRESET_THUMBNAILS[0].url}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = PRESET_THUMBNAILS[0].url;
                            }}
                          />
                        </div>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-3 max-w-[280px]">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                          {post.title}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5 px-3">
                        <span
                          className={cn(
                            'inline-block text-xs font-medium px-2.5 py-1 rounded-full border whitespace-nowrap',
                            catStyle.bg,
                            catStyle.text,
                            catStyle.border
                          )}
                        >
                          {post.category}
                        </span>
                      </td>

                      {/* Author */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={
                              post.authorAvatar ||
                              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                            }
                            alt={post.author}
                            className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80';
                            }}
                          />
                          <span className="text-xs font-medium text-slate-700">{post.author}</span>
                        </div>
                      </td>

                      {/* Views */}
                      <td className="py-3.5 px-3 text-xs font-semibold text-slate-700 whitespace-nowrap">
                        {post.views.toLocaleString('en-IN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {post.status === 'published' && (
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                            Published
                          </span>
                        )}
                        {post.status === 'draft' && (
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                            Draft
                          </span>
                        )}
                        {post.status === 'scheduled' && (
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                            Scheduled
                          </span>
                        )}
                        {post.status === 'archived' && (
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                            Archived
                          </span>
                        )}
                      </td>

                      {/* Published At */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {pubDate ? (
                          <div>
                            <div className="text-xs font-medium text-slate-800">{pubDate.date}</div>
                            <div className="text-[11px] text-slate-400">{pubDate.time}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">—</span>
                        )}
                      </td>

                      {/* Actions Three-Dot Menu */}
                      <td className="py-3.5 px-3 text-right relative action-menu-container">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === post.id ? null : post.id);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>

                        {activeMenuId === post.id && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-3 top-10 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 text-left text-xs font-medium"
                          >
                            <button
                              onClick={() => {
                                setSelectedPostId(post.id);
                                setIsDrawerOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-500" />
                              <span>View Details</span>
                            </button>
                            <button
                              onClick={() => {
                                setEditingPost(post);
                                setIsCreateModalOpen(true);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Edit className="w-3.5 h-3.5 text-blue-600" />
                              <span>Edit Post</span>
                            </button>
                            <button
                              onClick={() => handleDuplicate(post)}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <Copy className="w-3.5 h-3.5 text-purple-600" />
                              <span>Duplicate Post</span>
                            </button>
                            <button
                              onClick={() => handleToggleStatus(post)}
                              className="w-full px-3 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                            >
                              <FileCheck className="w-3.5 h-3.5 text-amber-600" />
                              <span>Toggle Status</span>
                            </button>
                            <div className="border-t border-slate-100 my-1" />
                            <button
                              onClick={() => {
                                setDeleteCandidate(post);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-3 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete Post</span>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Matching Reference */}
        <div className="py-4 px-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-white">
          <div>
            Showing{' '}
            <span className="font-semibold text-slate-700">
              {filteredPosts.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filteredPosts.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{filteredPosts.length}</span> posts
          </div>

          <div className="flex items-center gap-1">
            <button
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {getPageNumbers(currentPage, totalPages).map((item, idx) =>
              item === 'ellipsis' ? (
                <span key={`ellipsis-${idx}`} className="text-slate-400 px-1">
                  ...
                </span>
              ) : (
                <button
                  key={item}
                  onClick={() => setCurrentPage(item)}
                  className={cn(
                    'min-w-7 h-7 px-2 rounded-md font-medium text-xs transition-colors cursor-pointer',
                    currentPage === item
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  {item}
                </button>
              )
            )}

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-md border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-600"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>
          </div>
        </div>
      </div>
    </>
  );
}
