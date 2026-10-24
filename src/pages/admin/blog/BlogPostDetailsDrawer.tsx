import DOMPurify from 'dompurify';
import {
  Clock,
  Eye,
  ExternalLink,
  X,
  Edit,
  Trash2,
  Copy,
  Users,
  Heart,
  MessageSquare,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PRESET_THUMBNAILS } from './blogConstants';
import { formatPublishedDate } from './blogFormatting';
import type { AdminBlogState } from './useAdminBlog';

export interface BlogPostDetailsDrawerProps {
  blogState: AdminBlogState;
}

export function BlogPostDetailsDrawer({ blogState }: BlogPostDetailsDrawerProps) {
  const {
    setSelectedPostId,
    isDrawerOpen,
    setIsDrawerOpen,
    drawerTab,
    setDrawerTab,
    setIsCreateModalOpen,
    setEditingPost,
    setDeleteCandidate,
    setPreviewPost,
    selectedPost,
    handleDuplicate,
  } = blogState;
  return (
    <>
      {/* Right Details Drawer Matching Reference */}
      {isDrawerOpen && selectedPost && (
        <div className="w-96 shrink-0 bg-white rounded-xl border border-slate-200/80 shadow-xs p-5 space-y-5">
          {/* Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h2 className="text-base font-bold text-slate-900">Post Details</h2>
            <button
              onClick={() => {
                setIsDrawerOpen(false);
                setSelectedPostId(null);
              }}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Top Post Card */}
          <div className="bg-slate-50/70 rounded-xl p-3.5 border border-slate-200/70">
            <div className="flex items-start gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden border border-slate-200 bg-white shrink-0">
                <img
                  src={selectedPost.thumbnail || PRESET_THUMBNAILS[0].url}
                  alt={selectedPost.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = PRESET_THUMBNAILS[0].url;
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2">
                  {selectedPost.title}
                </h3>
                <div className="mt-1.5">
                  {selectedPost.status === 'published' && (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                      Published
                    </span>
                  )}
                  {selectedPost.status === 'draft' && (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">
                      Draft
                    </span>
                  )}
                  {selectedPost.status === 'scheduled' && (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                      Scheduled
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Top Action Buttons */}
            <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60">
              <button
                onClick={() => setPreviewPost(selectedPost)}
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-slate-50 shadow-2xs"
              >
                <span>View Post</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => {
                  setEditingPost(selectedPost);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-600 hover:bg-slate-50 shadow-2xs"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            </div>
          </div>

          {/* Drawer Tabs */}
          <div className="border-b border-slate-200">
            <div className="flex items-center justify-between text-xs font-medium">
              <button
                onClick={() => setDrawerTab('overview')}
                className={cn(
                  'pb-2.5 transition-colors border-b-2',
                  drawerTab === 'overview'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Overview
              </button>
              <button
                onClick={() => setDrawerTab('content')}
                className={cn(
                  'pb-2.5 transition-colors border-b-2',
                  drawerTab === 'content'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Content
              </button>
              <button
                onClick={() => setDrawerTab('seo')}
                className={cn(
                  'pb-2.5 transition-colors border-b-2',
                  drawerTab === 'seo'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                SEO
              </button>
              <button
                onClick={() => setDrawerTab('analytics')}
                className={cn(
                  'pb-2.5 transition-colors border-b-2',
                  drawerTab === 'analytics'
                    ? 'border-blue-600 text-blue-600 font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                )}
              >
                Analytics
              </button>
            </div>
          </div>

          {/* Tab 1: Overview */}
          {drawerTab === 'overview' && (
            <div className="space-y-5">
              {/* 6 Metric Grid in Drawer */}
              <div className="grid grid-cols-3 gap-2.5">
                {/* 1. Total Views */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-purple-600">
                    <Eye className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedPost.views.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Total Views</p>
                </div>

                {/* 2. Unique Views */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-emerald-600">
                    <Users className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedPost.uniqueViews.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Unique Views</p>
                </div>

                {/* 3. Likes */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-rose-600">
                    <Heart className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedPost.likes.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Likes</p>
                </div>

                {/* 4. Comments */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-blue-600">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedPost.comments.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Comments</p>
                </div>

                {/* 5. Shares */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Share2 className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedPost.shares.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Shares</p>
                </div>

                {/* 6. Avg Read Time */}
                <div className="bg-slate-50/80 p-2.5 rounded-lg border border-slate-100">
                  <div className="flex items-center gap-1.5 text-indigo-600">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-bold text-slate-900">
                      {selectedPost.readTime}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">Avg. Read Time</p>
                </div>
              </div>

              {/* Post Information Key-Value */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900">Post Information</h4>
                  <button
                    onClick={() => {
                      setEditingPost(selectedPost);
                      setIsCreateModalOpen(true);
                    }}
                    className="text-xs font-medium text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit</span>
                  </button>
                </div>

                <div className="text-xs space-y-1.5 text-slate-600 divide-y divide-slate-100">
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Title</span>
                    <span className="font-medium text-slate-800 text-right">
                      {selectedPost.title}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Slug</span>
                    <span className="font-mono text-[11px] text-slate-700 text-right">
                      {selectedPost.slug}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Category</span>
                    <span className="font-medium text-slate-800 text-right">
                      {selectedPost.category}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Author</span>
                    <span className="font-medium text-slate-800 text-right">
                      {selectedPost.author}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Status</span>
                    <span className="font-semibold text-emerald-600 capitalize text-right">
                      {selectedPost.status}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Featured</span>
                    <span className="font-medium text-slate-800 text-right">
                      {selectedPost.isFeatured ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Published At</span>
                    <span className="font-medium text-slate-800 text-right">
                      {selectedPost.publishedAt
                        ? formatPublishedDate(selectedPost.publishedAt)?.date +
                          ', ' +
                          formatPublishedDate(selectedPost.publishedAt)?.time
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-start justify-between pt-1">
                    <span className="text-slate-400 w-24 shrink-0">Last Updated</span>
                    <span className="font-medium text-slate-800 text-right">
                      {formatPublishedDate(selectedPost.updatedAt)?.date +
                        ', ' +
                        formatPublishedDate(selectedPost.updatedAt)?.time}
                    </span>
                  </div>
                </div>
              </div>

              {/* Excerpt */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-slate-900">Excerpt</h4>
                <div className="bg-slate-50 border border-slate-200/70 rounded-lg p-3 text-xs text-slate-600 leading-relaxed font-normal">
                  {selectedPost.excerpt || 'No excerpt provided.'}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => setDeleteCandidate(selectedPost)}
                  className="py-2 px-3 border border-rose-200 text-rose-600 rounded-lg text-xs font-semibold hover:bg-rose-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Post</span>
                </button>
                <button
                  onClick={() => handleDuplicate(selectedPost)}
                  className="py-2 px-3 border border-blue-200 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Duplicate Post</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab 2: Content Tab */}
          {drawerTab === 'content' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">Body Preview</span>
                <button
                  onClick={() => {
                    setEditingPost(selectedPost);
                    setIsCreateModalOpen(true);
                  }}
                  className="text-xs font-medium text-blue-600 hover:underline"
                >
                  Edit Content
                </button>
              </div>
              <div
                className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 leading-relaxed prose prose-sm max-h-80 overflow-y-auto"
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(
                    selectedPost.content || '<p>No content written yet.</p>',
                    { USE_PROFILES: { html: true } }
                  ),
                }}
              />
              <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 text-xs text-blue-800 space-y-1">
                <p className="font-semibold">Article Reading Analytics</p>
                <p>Estimated reading time: {selectedPost.readTime}</p>
                <p>
                  Word count: ~{selectedPost.content ? selectedPost.content.split(/\s+/).length : 0}{' '}
                  words
                </p>
              </div>
            </div>
          )}

          {/* Tab 3: SEO Tab */}
          {drawerTab === 'seo' && (
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700">Search Engine Snippet</span>
                <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-1">
                  <div className="text-[11px] text-slate-500 font-mono">
                    practicekoro.com &gt; blog &gt; {selectedPost.slug}
                  </div>
                  <div className="text-sm font-semibold text-blue-700 hover:underline line-clamp-1">
                    {selectedPost.seoTitle || selectedPost.title}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {selectedPost.seoDescription || selectedPost.excerpt}
                  </p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-400 font-medium">Meta Title:</span>
                  <p className="font-medium text-slate-800">
                    {selectedPost.seoTitle || selectedPost.title}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Meta Description:</span>
                  <p className="text-slate-700">
                    {selectedPost.seoDescription || selectedPost.excerpt}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Keywords:</span>
                  <p className="font-mono text-[11px] text-slate-600">
                    {selectedPost.seoKeywords ||
                      'exam preparation, practicekoro, bengali education'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Analytics Tab */}
          {drawerTab === 'analytics' && (
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-600">Total Pageviews</span>
                  <span className="font-bold text-slate-900">
                    {selectedPost.views.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400">
                Device and traffic-source breakdowns are not tracked for blog posts yet.
              </p>
            </div>
          )}
        </div>
      )}
    </>
  );
}
