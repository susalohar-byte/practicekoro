import { useQuery } from '@tanstack/react-query';
import { supabaseRuntime as supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { BlogPost } from '@/types';

/**
 * Blog posts as visitors see them. Posts are written in the admin panel (Admin → Blog) and
 * stored in the `blog_posts_list` app setting, which visitors may read without signing in.
 */

const HOMEPAGE_POSTS = 3;

/** Published posts, plus scheduled ones whose time has come. Drafts and archived posts stay hidden. */
function isVisible(post: BlogPost, now: number): boolean {
  if (post.status === 'published') return true;
  if (post.status === 'scheduled' && post.scheduledAt)
    return new Date(post.scheduledAt).getTime() <= now;
  return false;
}

const postTime = (post: BlogPost) =>
  new Date(post.publishedAt || post.scheduledAt || post.createdAt).getTime();

export async function fetchPublishedPosts(): Promise<BlogPost[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('app_settings')
    .select('value')
    .eq('id', 'blog_posts_list')
    .maybeSingle();
  if (error) throw new Error(error.message);
  const value: unknown = typeof data?.value === 'string' ? JSON.parse(data.value) : data?.value;
  if (!Array.isArray(value)) return [];
  const now = Date.now();
  return (value as BlogPost[])
    .filter((p) => p?.slug && isVisible(p, now))
    .sort((a, b) => postTime(b) - postTime(a));
}

/** Featured posts first (newest first), filled up with the latest posts. */
export function pickHomepagePosts(posts: BlogPost[]): BlogPost[] {
  const featured = posts.filter((p) => p.isFeatured);
  const rest = posts.filter((p) => !p.isFeatured);
  return [...featured, ...rest].slice(0, HOMEPAGE_POSTS);
}

export function usePublishedPosts() {
  return useQuery({
    queryKey: ['public-blog', 'posts'],
    queryFn: fetchPublishedPosts,
    staleTime: 5 * 60 * 1000,
  });
}

export function formatPostDate(post: BlogPost): string {
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
