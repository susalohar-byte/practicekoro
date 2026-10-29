import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, Newspaper } from 'lucide-react';
import {
  formatPostDate,
  formatReadTime,
  pickHomepagePosts,
  useHomepagePosts,
  type BlogPostSummary,
} from '@/pages/blog/publicBlog';
import { RevealGroup, popIn, hoverLift } from './Reveal';
import { SectionHeading } from './SectionHeading';

export const BlogPostCard: React.FC<{ post: BlogPostSummary }> = ({ post }) => {
  const readTime = formatReadTime(post.readTime);
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white ring-1 ring-[#EDF0F8] shadow-[0_6px_24px_rgba(30,50,120,0.07)] transition-shadow hover:shadow-[0_14px_34px_rgba(30,80,240,0.14)]"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
        {post.thumbnail && (
          <img
            src={post.thumbnail}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        {post.category && (
          <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-[#1A5CFF] shadow-sm">
            {post.category}
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold leading-snug text-[#0B1B4F] line-clamp-2 font-['Poppins','Anek_Bangla',sans-serif] group-hover:text-[#1A5CFF] transition-colors">
          {post.title}
        </h3>
        {post.excerpt && (
          <p className="mt-2 text-[15px] leading-relaxed text-[#5B6478] line-clamp-3 font-['Poppins','Anek_Bangla',sans-serif]">
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-5 text-[13px] text-slate-400">
          <span>
            {formatPostDate(post)}
            {readTime && ` · ${readTime}`}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[#1A5CFF]">
            Read
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
};

/** Three articles from the admin panel's blog: featured ones first, then the latest. */
export const BlogSection: React.FC = () => {
  // Featured-first, one more than is shown (so "View all" knows there are more)
  const { data: posts, isPending, isError } = useHomepagePosts();

  // No articles yet (or the list could not load): leave the section out
  if (isError || (!isPending && (!posts || posts.length === 0))) return null;

  const shown = posts ? pickHomepagePosts(posts) : [];

  return (
    <section id="blog" className="scroll-mt-24 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon={Newspaper}
          tone="amber"
          title="From Our Blog"
          subtitle="পরীক্ষার প্রস্তুতির টিপস, সিলেবাস আর গাইড।"
        />

        <RevealGroup
          key={isPending ? 'loading' : 'posts'}
          stagger={0.12}
          className="mt-8 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {isPending
            ? [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#EDF0F8] animate-pulse"
                  aria-hidden
                >
                  <div className="aspect-[16/9] bg-slate-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 w-4/5 rounded bg-slate-100" />
                    <div className="h-4 rounded bg-slate-100" />
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                  </div>
                </div>
              ))
            : shown.map((post) => (
                <motion.div key={post.id} variants={popIn} {...hoverLift}>
                  <BlogPostCard post={post} />
                </motion.div>
              ))}
        </RevealGroup>

        {!isPending && posts && posts.length > shown.length && (
          <div className="mt-8 text-center">
            <Link
              to="/blog"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0B1B4F] ring-1 ring-slate-200 shadow-sm transition-colors hover:text-[#1A5CFF]"
            >
              View all articles
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};
