import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { MotionConfig, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Newspaper } from 'lucide-react';
import { Navbar } from '@/pages/landing/components/Navbar';
import { Footer } from '@/pages/landing/components/Footer';
import { BlogPostCard } from '@/pages/landing/components/BlogSection';
import { LANDING_FONT } from '@/pages/landing/components/SectionHeading';
import { RevealGroup, popIn, hoverLift } from '@/pages/landing/components/Reveal';
import { formatPostDate, formatReadTime, usePublishedPosts } from './publicBlog';

const SITE = 'https://practicekoro.online';

const BlogShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MotionConfig reducedMotion="user">
    <div className={`min-h-screen bg-[#F7F8FD] text-slate-900 ${LANDING_FONT} flex flex-col`}>
      <Navbar />
      <main className="flex-1 pt-28 sm:pt-32 pb-16">{children}</main>
      <Footer />
    </div>
  </MotionConfig>
);

const CardSkeletons: React.FC = () => (
  <>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="overflow-hidden rounded-2xl bg-white ring-1 ring-[#EDF0F8] animate-pulse"
        aria-hidden
      >
        <div className="aspect-[16/9] bg-slate-100" />
        <div className="space-y-3 p-5">
          <div className="h-5 w-4/5 rounded bg-slate-100" />
          <div className="h-4 rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </>
);

/** /blog — every published article, newest first. */
export const BlogListPage: React.FC = () => {
  const { data: posts, isPending, isError } = usePublishedPosts();

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);

  return (
    <BlogShell>
      <Helmet>
        <title>Blog | Practice Koro</title>
        <meta
          name="description"
          content="পশ্চিমবঙ্গের সরকারি চাকরির পরীক্ষার প্রস্তুতির টিপস, সিলেবাস, বুক লিস্ট ও গাইড — Practice Koro ব্লগ।"
        />
        <link rel="canonical" href={`${SITE}/blog`} />
      </Helmet>

      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] text-white shadow-lg shadow-amber-500/30">
            <Newspaper className="h-6 w-6" strokeWidth={2.2} />
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[#0B1B4F]">
            Practice Koro Blog
          </h1>
          <p className="mt-2 text-base sm:text-lg text-[#3A4462] font-['Poppins','Anek_Bangla',sans-serif]">
            পরীক্ষার প্রস্তুতির টিপস, সিলেবাস আর গাইড।
          </p>
        </div>

        {isError ? (
          <p className="mt-12 text-center text-[#5B6478] font-['Poppins','Anek_Bangla',sans-serif]">
            লেখাগুলো এই মুহূর্তে লোড করা যাচ্ছে না। একটু পরে আবার চেষ্টা করুন।
          </p>
        ) : !isPending && posts?.length === 0 ? (
          <p className="mt-12 text-center text-[#5B6478] font-['Poppins','Anek_Bangla',sans-serif]">
            শীঘ্রই নতুন লেখা আসছে।
          </p>
        ) : (
          <RevealGroup
            key={isPending ? 'loading' : 'posts'}
            stagger={0.08}
            className="mt-10 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {isPending ? (
              <CardSkeletons />
            ) : (
              posts.map((post) => (
                <motion.div key={post.id} variants={popIn} {...hoverLift}>
                  <BlogPostCard post={post} />
                </motion.div>
              ))
            )}
          </RevealGroup>
        )}
      </div>
    </BlogShell>
  );
};

/** /blog/:slug — one article. */
export const BlogPostPage: React.FC = () => {
  const { slug } = useParams();
  const { data: posts, isPending, isError } = usePublishedPosts();
  const post = posts?.find((p) => p.slug === slug);
  const more = posts?.filter((p) => p.slug !== slug).slice(0, 3) ?? [];

  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [slug]);

  // Admin-written HTML: keep the formatting, drop anything that could run script
  const html = React.useMemo(
    () => (post ? DOMPurify.sanitize(post.content, { USE_PROFILES: { html: true } }) : ''),
    [post]
  );

  if (isPending) {
    return (
      <BlogShell>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 animate-pulse" aria-hidden>
          <div className="h-4 w-24 rounded bg-slate-200" />
          <div className="mt-6 h-9 w-4/5 rounded bg-slate-200" />
          <div className="mt-8 aspect-[16/9] rounded-3xl bg-slate-200" />
        </div>
      </BlogShell>
    );
  }

  if (isError || !post) {
    return (
      <BlogShell>
        <Helmet>
          <title>Article not found | Practice Koro</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#0B1B4F]">
            {isError ? 'This article could not be loaded' : 'Article not found'}
          </h1>
          <p className="mt-3 text-[#5B6478]">
            {isError ? 'Please try again in a moment.' : 'It may have been moved or taken down.'}
          </p>
          <Link
            to="/blog"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1A5CFF] px-6 py-3 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>
        </div>
      </BlogShell>
    );
  }

  const readTime = formatReadTime(post.readTime);
  const title = post.seoTitle || `${post.title} | Practice Koro`;
  const description = post.seoDescription || post.excerpt;

  return (
    <BlogShell>
      <Helmet>
        <title>{title}</title>
        {description && <meta name="description" content={description} />}
        {post.seoKeywords && <meta name="keywords" content={post.seoKeywords} />}
        <link rel="canonical" href={`${SITE}/blog/${post.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={title} />
        {description && <meta property="og:description" content={description} />}
        {post.thumbnail && <meta property="og:image" content={post.thumbnail} />}
      </Helmet>

      <article className="max-w-3xl mx-auto px-4 sm:px-6">
        <Link
          to="/blog"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-[#1A5CFF]"
        >
          <ArrowLeft className="h-4 w-4" />
          All articles
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {post.category && (
            <span className="mt-6 inline-block rounded-full bg-[#EAF1FF] px-3 py-1 text-xs font-semibold text-[#1A5CFF]">
              {post.category}
            </span>
          )}
          <h1 className="mt-3 text-[28px] sm:text-4xl font-bold leading-tight text-[#0B1B4F] font-['Poppins','Anek_Bangla',sans-serif]">
            {post.title}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
            {post.author && <span className="font-medium text-slate-700">{post.author}</span>}
            <span>{formatPostDate(post)}</span>
            {readTime && <span>· {readTime}</span>}
          </div>
        </motion.header>

        {post.thumbnail && (
          <motion.img
            src={post.thumbnail}
            alt=""
            className="mt-8 aspect-[16/9] w-full rounded-3xl object-cover"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          />
        )}

        <div
          className="mt-8 rounded-3xl bg-white px-6 py-7 sm:px-10 sm:py-9 ring-1 ring-slate-200/70 font-['Poppins','Anek_Bangla',sans-serif] text-[16px] sm:text-[17px] leading-relaxed text-slate-700 [&_h2]:mt-8 [&_h2]:mb-3 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[#0B1B4F] [&_h3]:mt-6 [&_h3]:mb-2 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[#0B1B4F] [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_a]:text-[#1A5CFF] [&_a]:underline [&_img]:my-5 [&_img]:rounded-2xl [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-[#1A5CFF] [&_blockquote]:pl-4 [&_blockquote]:italic [&_strong]:text-[#0B1B4F] [&>*:first-child]:mt-0"
          dangerouslySetInnerHTML={{ __html: html }}
        />

        {/* After reading, nudge towards practice */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-3xl bg-gradient-to-br from-[#0B1B4F] to-[#1450F0] px-6 py-6 sm:px-8 text-white">
          <p className="text-lg font-semibold font-['Poppins','Anek_Bangla',sans-serif]">
            পড়া শেষ? এবার একটা মক টেস্ট দিয়ে দেখুন।
          </p>
          <Link
            to="/login"
            className="group inline-flex flex-shrink-0 items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-semibold text-[#0B1B4F]"
          >
            Start Practicing
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </article>

      {more.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mt-14">
          <h2 className="text-xl sm:text-2xl font-bold text-[#0B1B4F]">More articles</h2>
          <RevealGroup
            stagger={0.1}
            className="mt-5 grid gap-5 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {more.map((p) => (
              <motion.div key={p.id} variants={popIn} {...hoverLift}>
                <BlogPostCard post={p} />
              </motion.div>
            ))}
          </RevealGroup>
        </section>
      )}
    </BlogShell>
  );
};
