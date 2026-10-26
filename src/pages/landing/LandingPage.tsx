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
        className={`min-h-screen bg-[#F7F8FD] text-slate-900 ${LANDING_FONT} selection:bg-blue-600 selection:text-white flex flex-col`}
      >
        {/* SEO Metadata */}
        {/* Title and description come from Admin → Settings → SEO (PlatformRuntimeSettings),
            so the homepage stays editable there; this page only adds its share image. */}
        <Helmet>
          <meta property="og:image" content="https://practicekoro.online/images/landing/hero_student_room.webp" />
          <meta property="og:type" content="website" />
          <link rel="canonical" href="https://practicekoro.online/" />
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
