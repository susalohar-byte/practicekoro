import { useQuery } from '@tanstack/react-query';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { BlogPost } from '@/types';

/**
 * Blog posts as visitors see them. Posts are written in the admin panel (Admin → Blog) and
 * stored in the `blog_posts_list` app setting. Visitors never download that whole row (every
 * post with its full body): the database returns card fields through `public_blog_summaries`
 * and a single article through `public_blog_post`. Both apply the visibility rule (published,
 * or scheduled and due; needs a slug) and the newest-first order on the server.
 */

const HOMEPAGE_POSTS = 3;

/** The fields a post card needs; the article body is not included. */
export type BlogPostSummary = Pick<
  BlogPost,
  | 'id'
  | 'title'
  | 'slug'
  | 'excerpt'
  | 'category'
  | 'author'
  | 'status'
  | 'isFeatured'
  | 'thumbnail'
  | 'readTime'
  | 'publishedAt'
  | 'scheduledAt'
  | 'createdAt'
>;

type PostDates = Pick<BlogPost, 'publishedAt' | 'scheduledAt' | 'createdAt'>;

/** Visible posts, newest first (or featured first), at most `limit` of them. */
export async function fetchPostSummaries(
  options: { limit?: number; featuredFirst?: boolean } = {}
): Promise<BlogPostSummary[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase.rpc('public_blog_summaries', {
    p_limit: options.limit ?? null,
    p_featured_first: options.featuredFirst ?? false,
  });
  if (error) throw new Error(error.message);
  return Array.isArray(data) ? (data as BlogPostSummary[]) : [];
}

/** One visible post with its body, or null when there is none for this slug. */
export async function fetchPublishedPost(slug: string): Promise<BlogPost | null> {
  if (!isSupabaseConfigured || !slug) return null;
  const { data, error } = await supabase.rpc('public_blog_post', { p_slug: slug });
  if (error) throw new Error(error.message);
  return data && typeof data === 'object' && !Array.isArray(data) ? (data as BlogPost) : null;
}

/** Featured posts first (newest first), filled up with the latest posts. */
export function pickHomepagePosts<T extends Pick<BlogPost, 'isFeatured'>>(posts: T[]): T[] {
  const featured = posts.filter((p) => p.isFeatured);
  const rest = posts.filter((p) => !p.isFeatured);
  return [...featured, ...rest].slice(0, HOMEPAGE_POSTS);
}

/** Every visible post as a card (the /blog list and "More articles"). */
export function usePublishedPosts() {
  return useQuery({
    queryKey: ['public-blog', 'summaries'],
    queryFn: () => fetchPostSummaries(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * The landing page's cards: featured first, then the latest. One more than is shown, so the
 * section knows whether to offer "View all articles".
 */
export function useHomepagePosts() {
  return useQuery({
    queryKey: ['public-blog', 'homepage'],
    queryFn: () => fetchPostSummaries({ limit: HOMEPAGE_POSTS + 1, featuredFirst: true }),
    staleTime: 5 * 60 * 1000,
  });
}

/** One article by slug. */
export function usePublishedPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-blog', 'post', slug],
    queryFn: () => fetchPublishedPost(slug ?? ''),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });
}

export function formatPostDate(post: PostDates): string {
  const date = post.publishedAt || post.scheduledAt || post.createdAt;
  return new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "4m 12s" from the admin panel reads better to visitors as "4 min read". */
export function formatReadTime(readTime: string | undefined): string | null {
  const minutes = readTime?.match(/(\d+)\s*m/)?.[1];
  return minutes ? `${minutes} min read` : null;
}
