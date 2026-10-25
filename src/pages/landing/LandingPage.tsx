import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { PopularExamsSection } from './components/PopularExamsSection';
import { WhyPracticeKoroSection } from './components/WhyPracticeKoroSection';
import { LearningJourneySection } from './components/LearningJourneySection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { FaqSection } from './components/FaqSection';
import { AppDownloadBanner } from './components/AppDownloadBanner';
import { Footer } from './components/Footer';
import { LANDING_FONT } from './components/SectionHeading';
import { VideoModal } from './components/VideoModal';
import { ExamModal, ExamData } from './components/ExamModal';
import { X, Smartphone } from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [selectedExam, setSelectedExam] = useState<ExamData | null>(null);
  const [iosNoticeOpen, setIosNoticeOpen] = useState(false);

  return (
    <div className={`min-h-screen bg-[#F7F8FD] text-slate-900 ${LANDING_FONT} selection:bg-blue-600 selection:text-white flex flex-col`}>
      {/* SEO Metadata */}
      <Helmet>
        <title>Practice Koro | পশ্চিমবঙ্গের সরকারি চাকরির প্রস্তুতি — Mock Test, PYQ & Solutions</title>
        <meta
          name="description"
          content="পশ্চিমবঙ্গের সরকারি চাকরির (WBP Constable, WBSSC, Clerkship, Railway, SSC) সেরা মক টেস্ট, বিষয়ভিত্তিক অনুশীলন, বিগত বছরের প্রশ্নপত্র ও সমাধান।"
        />
        <meta property="og:title" content="Practice Koro — স্বপ্নের সরকারি চাকরির প্রস্তুতি হোক সহজ" />
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

        {/* 6. Student Testimonials */}
        <TestimonialsSection />

        {/* 7. FAQ (linked from the navbar and footer) */}
        <FaqSection />

        {/* 8. Final App Download Banner (Positioned immediately above footer) */}
        <AppDownloadBanner onIosClick={() => setIosNoticeOpen(true)} />
      </main>

      {/* 9. Navy Footer */}
      <Footer onIosClick={() => setIosNoticeOpen(true)} />

      {/* Video Modal Player */}
      <VideoModal isOpen={videoOpen} onClose={() => setVideoOpen(false)} />

      {/* Exam Details Drawer/Modal */}
      <ExamModal
        exam={selectedExam}
        onClose={() => setSelectedExam(null)}
      />

      {/* iOS App Store Notice Modal */}
      {iosNoticeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setIosNoticeOpen(false)}
          />
          <div className="relative bg-white rounded-3xl p-6 sm:p-7 max-w-sm w-full text-center shadow-2xl border border-slate-100 z-10 animate-scaleUp">
            <button
              onClick={() => setIosNoticeOpen(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 font-headline">
              Apple iOS App Status
            </h3>
            <p className="text-xs text-slate-600 mt-2 leading-relaxed font-headline">
              আমাদের iOS সংস্করণটি বর্তমানে প্রাইভেট বিটাতে রয়েছে। শীঘ্রই অ্যাপল অ্যাপ স্টোরে উন্মুক্ত করা হবে!
            </p>
            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-2xl text-left">
              <span className="block text-[11px] font-bold text-blue-900">
                অ্যান্ড্রয়েড ইউজারদের জন্য:
              </span>
              <p className="text-[11px] text-blue-700 mt-0.5">
                অ্যান্ড্রয়েড ফোনে এখনই PracticeKoro.apk ডাউনলোড করে সম্পূর্ণ বিনামূল্যে মক টেস্ট শুরু করতে পারেন।
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setIosNoticeOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                বন্ধ করুন
              </button>
              <a
                href="/PracticeKoro.apk"
                download="PracticeKoro.apk"
                onClick={() => setIosNoticeOpen(false)}
                className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm text-center"
              >
                Download APK
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
