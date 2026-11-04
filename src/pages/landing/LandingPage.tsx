import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MotionConfig } from 'motion/react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PopularExamsSection } from './components/PopularExamsSection';
import { WhyPracticeKoroSection } from './components/WhyPracticeKoroSection';
import { LearningJourneySection } from './components/LearningJourneySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { PricingSection } from './components/PricingSection';
import { FaqSection } from './components/FaqSection';
import { AppDownloadBanner } from './components/AppDownloadBanner';
import { BlogSection } from './components/BlogSection';
import { Footer } from './components/Footer';
import { LANDING_FONT } from './components/SectionHeading';
import { VideoModal } from './components/VideoModal';
import { ExamModal, ExamData } from './components/ExamModal';

export const LandingPage: React.FC = () => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamData | null>(null);
  const { hash } = useLocation();

  // Links like /#faq from the policy pages land on the right section
  useEffect(() => {
    if (!hash) return;
    const timer = window.setTimeout(() => document.querySelector(hash)?.scrollIntoView(), 300);
    return () => window.clearTimeout(timer);
  }, [hash]);

  return (
    // Visitors who turn on Reduce Motion in their OS get the page without the movement
    <MotionConfig reducedMotion="user">
      <div
        className={`landing-scope min-h-screen bg-[#F7F8FD] text-slate-900 ${LANDING_FONT} selection:bg-blue-600 selection:text-white flex flex-col`}
      >
        {/* SEO Metadata */}
        <Helmet>
          <title>
            Practice Koro | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ &amp; Solutions
          </title>
          <meta
            name="description"
            content="পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।"
          />
          <meta
            name="keywords"
            content="Practice Koro, PracticeKoro, WBP Constable mock test, WBPSC Clerkship mock test, WBSSC Group C Group D, West Bengal Police exam preparation, RRB NTPC Bengali, Primary TET practice, পশ্চিমবঙ্গ সরকারি চাকরির মক টেস্ট, বিগত বছরের প্রশ্নপত্র ও সমাধান, বাংলা মক টেস্ট"
          />
          <link rel="canonical" href="https://practicekoro.online/" />
          <meta property="og:type" content="website" />
          <meta property="og:site_name" content="Practice Koro" />
          <meta
            property="og:title"
            content="Practice Koro | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ &amp; Solutions"
          />
          <meta
            property="og:description"
            content="পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।"
          />
          <meta
            property="og:image"
            content="https://practicekoro.online/images/landing/hero_student_room.webp"
          />
          <meta property="og:url" content="https://practicekoro.online/" />
          <meta name="twitter:card" content="summary_large_image" />
          <meta
            name="twitter:title"
            content="Practice Koro | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ &amp; Solutions"
          />
          <meta
            name="twitter:description"
            content="পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।"
          />
          <meta
            name="twitter:image"
            content="https://practicekoro.online/images/landing/hero_student_room.webp"
          />
          {/* Organization and WebSite live in index.html; the plans' Offers come from PricingSection */}
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'WebPage',
                  '@id': 'https://practicekoro.online/#webpage',
                  url: 'https://practicekoro.online/',
                  name: 'Practice Koro | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ & Solutions',
                  description:
                    'পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।',
                  inLanguage: 'bn-IN',
                  isPartOf: { '@id': 'https://practicekoro.online/#website' },
                  about: { '@id': 'https://practicekoro.online/#organization' },
                  primaryImageOfPage:
                    'https://practicekoro.online/images/landing/hero_student_room.webp',
                },
                {
                  '@type': 'ItemList',
                  '@id': 'https://practicekoro.online/#popular-exams',
                  name: 'পশ্চিমবঙ্গের জনপ্রিয় সরকারি চাকরির পরীক্ষাসমূহ',
                  description:
                    'Practice Koro প্ল্যাটফর্মে উপলব্ধ প্রধান সরকারি চাকরির পরীক্ষার টেস্ট সিরিজ ও প্র্যাকটিস সেট',
                  itemListElement: [
                    {
                      '@type': 'ListItem',
                      position: 1,
                      name: 'WBP Constable & Lady Constable',
                      description:
                        'ওয়েস্ট বেঙ্গল পুলিশ কনস্টেবল ও লেডি কনস্টেবল প্রিলিমিনারি ও মেইনস পরীক্ষার অধ্যায়ভিত্তিক প্রশ্ন ও পূর্ণাঙ্গ মক টেস্ট।',
                    },
                    {
                      '@type': 'ListItem',
                      position: 2,
                      name: 'WBSSC Group C & D',
                      description:
                        'স্কুল সার্ভিস কমিশনের গ্রুপ সি ও গ্রুপ ডি পদের নতুন সিলেবাস ভিত্তিক স্পেশাল প্র্যাকটিস সেট ও মক টেস্ট।',
                    },
                    {
                      '@type': 'ListItem',
                      position: 3,
                      name: 'WBPSC Clerkship',
                      description:
                        'ওয়েস্ট বেঙ্গল পাবলিক সার্ভিস কমিশনের ক্লার্কশিপ পার্ট-১ ও পার্ট-২ পরীক্ষার সেরা প্রশ্নসংগ্রহ ও পূর্ণাঙ্গ টেস্ট সিরিজ।',
                    },
                    {
                      '@type': 'ListItem',
                      position: 4,
                      name: 'Railway RRB NTPC & Group D',
                      description:
                        'রেলওয়ে রিক্রুটমেন্ট বোর্ডের NTPC ও গ্রুপ ডি পরীক্ষার জন্য বাংলা ভাষায় প্রশ্নব্যাংক ও প্রিভিয়াস ইয়ার কোয়েশ্চেন।',
                    },
                    {
                      '@type': 'ListItem',
                      position: 5,
                      name: 'SSC GD & MTS',
                      description:
                        'স্টাফ সিলেকশন কমিশনের জিডি কনস্টেবল ও এমটিএস পরীক্ষার জন্য বাংলায় বিশেষ প্রশ্নব্যাংক ও স্পিড টেস্ট।',
                    },
                  ],
                },
              ],
            })}
          </script>
        </Helmet>

        {/* 1. Header & Navigation matching reference */}
        <Navbar />

        <main className="flex-1">
          {/* 2. Hero Section with Study Room & Mascot */}
          <HeroSection onWatchVideo={() => setVideoOpen(true)} />

          {/* 3. Popular Exams (WBP, WBSSC, Clerkship, Railway, SSC) */}
          <PopularExamsSection onSelectExam={(exam) => setSelectedExam(exam)} />

          {/* 4. Why Practice Koro? (5 Key Features) */}
          <WhyPracticeKoroSection />

          {/* 5. Learning Journey (4 steps) */}
          <LearningJourneySection />

          {/* Subscription plans, as set up in the admin panel */}
          <PricingSection />

          {/* 6. Student Testimonials */}
          <TestimonialsSection />

          {/* 7. FAQ (linked from the navbar and footer) */}
          <FaqSection />

          {/* 8. App Download Banner */}
          <AppDownloadBanner />

          {/* 9. Latest articles from Admin → Blog, right above the footer */}
          <BlogSection />
        </main>

        {/* 10. Navy Footer */}
        <Footer />

        {/* Video Modal Player */}
        <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />

        {/* Exam Details Drawer/Modal */}
        <ExamModal exam={selectedExam} onClose={() => setSelectedExam(null)} />
      </div>
    </MotionConfig>
  );
};
