import React, { useState } from 'react';
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
import { Footer } from './components/Footer';
import { LANDING_FONT } from './components/SectionHeading';
import { VideoModal } from './components/VideoModal';
import { ExamModal, ExamData } from './components/ExamModal';

export const LandingPage: React.FC = () => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamData | null>(null);

  return (
    // Visitors who turn on Reduce Motion in their OS get the page without the movement
    <MotionConfig reducedMotion="user">
      <div
        className={`min-h-screen bg-[#F7F8FD] text-slate-900 ${LANDING_FONT} selection:bg-blue-600 selection:text-white flex flex-col`}
      >
        {/* SEO Metadata */}
        <Helmet>
          <title>
            Practice Koro | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ & Solutions
          </title>
          <meta
            name="description"
            content="পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।"
          />
          <meta
            property="og:title"
            content="Practice Koro — স্বপ্নের সরকারি চাকরির প্রস্তুতি হোক সহজ"
          />
          <meta
            property="og:description"
            content="WBP Constable, WBPSC Clerkship, School Service, Railway এবং SSC পরীক্ষার জন্য সেরা অনলাইন মক টেস্ট প্ল্যাটফর্ম।"
          />
          <meta property="og:image" content="/images/hero_student_desk_hd.png" />
          <meta property="og:type" content="website" />
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

          {/* 8. Final App Download Banner (Positioned immediately above footer) */}
          <AppDownloadBanner />
        </main>

        {/* 9. Navy Footer */}
        <Footer />

        {/* Video Modal Player */}
        <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />

        {/* Exam Details Drawer/Modal */}
        <ExamModal exam={selectedExam} onClose={() => setSelectedExam(null)} />
      </div>
    </MotionConfig>
  );
};
