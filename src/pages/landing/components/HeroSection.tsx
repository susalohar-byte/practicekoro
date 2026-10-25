import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play, Sparkles, BookOpen, Flame } from 'lucide-react';

interface HeroSectionProps {
  onWatchVideo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onWatchVideo }) => {
  const [activeSlide, setActiveSlide] = useState(0);

  const heroSlides = [
    {
      badge: 'পশ্চিমবঙ্গের ১ নম্বর বিশ্বস্ত প্ল্যাটফর্ম',
      headlinePrefix: 'স্বপ্নের',
      headlineHighlight: 'সরকারি চাকরির',
      headlineSuffix: 'প্রস্তুতি হোক সহজ',
      subtitle:
        'পশ্চিমবঙ্গের সরকারি পরীক্ষার জন্য Mock Test, Topic Test, PYQ এবং Detailed Solution — সব এক জায়গায়।',
    },
    {
      badge: 'বাস্তব পরীক্ষার অভিজ্ঞতা',
      headlinePrefix: 'সঠিক মূল্যায়নে',
      headlineHighlight: 'সেরা র‍্যাঙ্ক',
      headlineSuffix: 'গড়ার সুযোগ',
      subtitle:
        'WBP, WBSSC, Clerkship ও Railway পরীক্ষার নিখুঁত মক টেস্ট ও লাইভ স্টেট র‍্যাঙ্কিং।',
    },
    {
      badge: 'অধ্যায়ভিত্তিক পূর্ণাঙ্গ সমাধান',
      headlinePrefix: 'প্রতিটি প্রশ্নের',
      headlineHighlight: 'সহজ ব্যাখ্যা',
      headlineSuffix: 'ও স্মার্ট শর্টনোটস',
      subtitle:
        'বাংলা ভাষায় বিস্তারিত উত্তর ব্যাখ্যা, যা আপনার কনসেপ্ট সম্পূর্ণ পরিষ্কার করবে।',
    },
    {
      badge: 'বিগত বছরের প্রশ্ন ব্যাংক',
      headlinePrefix: '১০+ বছরের',
      headlineHighlight: 'PYQ প্রশ্নাবলি',
      headlineSuffix: 'অনুশীলন করুন',
      subtitle:
        'পূর্ববর্তী বছরের সকল প্রশ্ন ও প্যাটার্ন বিশ্লেষণ করে নিজের প্রস্তুতি এক ধাপ এগিয়ে রাখুন।',
    },
  ];

  const current = heroSlides[activeSlide];

  return (
    <section id="hero" className="relative pt-20 sm:pt-24 pb-12 sm:pb-16 overflow-hidden">
      {/* Background Soft Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none -z-10">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl" />
        <div className="absolute top-24 right-1/4 w-80 h-80 bg-sky-300/20 rounded-full blur-3xl" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-gradient-to-b from-blue-50/60 to-transparent rounded-full blur-2xl" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Hero Card Container matching the reference image layout */}
        <div className="relative bg-white rounded-3xl sm:rounded-[36px] shadow-xl shadow-blue-500/5 border border-blue-50/80 overflow-hidden">
          
          {/* Top Illustrated Study Room Banner */}
          <div className="relative w-full h-[220px] sm:h-[320px] md:h-[380px] lg:h-[420px] overflow-hidden bg-[#2D3047] flex items-center justify-center">
            {/* Background High-res study room image */}
            <img
              src="/images/hero_student_desk_hd.png"
              alt="Practice Koro Student Studying for WB Government Exam"
              className="w-full h-full object-cover object-center transform hover:scale-[1.01] transition-transform duration-700"
            />

            {/* Subtle Gradient overlay to smoothly transition to the white card below */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-black/20 pointer-events-none" />

            {/* Handwritten Doodles / Floating Stickers matching the reference */}
            {/* Left Note above lamp */}
            <div className="absolute top-4 sm:top-8 left-4 sm:left-10 bg-white/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-sm border border-white/60 -rotate-3 hidden sm:flex items-center gap-1.5 pointer-events-none">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-800 font-sans tracking-tight">
                Small Steps Big Success!
              </span>
            </div>

            {/* Right Note near window */}
            <div className="absolute top-6 sm:top-10 right-4 sm:right-12 bg-white/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl shadow-sm border border-white/60 rotate-2 hidden sm:flex items-center gap-1.5 pointer-events-none">
              <span className="text-[11px] sm:text-xs font-bold text-blue-700 font-sans tracking-tight">
                Practice • Test • Improve • Repeat
              </span>
            </div>

            {/* Floating WB Exam Books Badge on Desk Stack */}
            <div className="absolute bottom-6 left-4 sm:left-8 bg-blue-600/90 text-white backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-md flex items-center gap-1.5 pointer-events-none">
              <BookOpen className="w-3 h-3 text-white" />
              <span>WBP • WBSSC • Clerkship • Railway • SSC</span>
            </div>

            {/* Floating motivational quote near mug */}
            <div className="absolute bottom-6 right-4 sm:right-8 bg-white/90 text-slate-800 backdrop-blur-md px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold shadow-md border border-slate-100 hidden sm:flex items-center gap-1.5 pointer-events-none">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Better Practice, Brighter Future!</span>
            </div>
          </div>

          {/* Hero Content Section Below Study Room */}
          <div className="relative px-4 sm:px-8 md:px-12 pt-6 sm:pt-8 pb-10 sm:pb-12 text-center bg-gradient-to-b from-white via-blue-50/20 to-white">
            
            {/* Playful Side Stickers / Floating Doodles */}
            <div className="absolute top-4 left-4 sm:left-10 w-9 sm:w-12 h-9 sm:h-12 bg-blue-50 rounded-2xl border border-blue-200/60 shadow-xs flex items-center justify-center -rotate-12 pointer-events-none">
              <svg className="w-5 sm:w-6 h-5 sm:h-6 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="2" width="16" height="20" rx="2" />
                <line x1="8" y1="6" x2="16" y2="6" />
                <line x1="8" y1="10" x2="16" y2="10" />
                <line x1="8" y1="14" x2="16" y2="14" />
                <line x1="8" y1="18" x2="16" y2="18" />
              </svg>
            </div>

            <div className="absolute top-4 right-4 sm:right-10 w-9 sm:w-12 h-9 sm:h-12 bg-amber-50 rounded-2xl border border-amber-200/60 shadow-xs flex items-center justify-center rotate-12 pointer-events-none">
              <span className="text-lg sm:text-xl">🐱</span>
            </div>

            {/* Headline Badge */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold mb-4 sm:mb-5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>{current.badge}</span>
            </div>

            {/* Bengali Headline matching reference typography */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight font-headline max-w-3xl mx-auto leading-tight sm:leading-snug">
              <span>{current.headlinePrefix} </span>
              <span className="text-blue-600 drop-shadow-xs font-black">
                {current.headlineHighlight}
              </span>{' '}
              <span>{current.headlineSuffix}</span>
            </h1>

            {/* Subtitle in Bengali */}
            <p className="mt-3 sm:mt-4 text-xs sm:text-base md:text-lg text-slate-600 font-medium max-w-2xl mx-auto leading-relaxed font-headline">
              {current.subtitle}
            </p>

            {/* Call To Action Buttons matching reference */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              {/* Primary Start Practicing Pill linking directly to /login */}
              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-sm sm:text-base rounded-full shadow-lg shadow-blue-600/30 hover:shadow-xl transition-all cursor-pointer group"
              >
                <span>Start Practicing</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>

              {/* Secondary Watch Video Pill */}
              <button
                type="button"
                onClick={onWatchVideo}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-white hover:bg-slate-50 active:scale-95 text-slate-800 font-bold text-sm sm:text-base rounded-full shadow-xs border border-slate-200 hover:border-slate-300 transition-all cursor-pointer group"
              >
                <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Play className="w-3 h-3 ml-0.5 fill-current" />
                </div>
                <span>Watch Video</span>
              </button>
            </div>

            {/* Carousel Indicator Dots */}
            <div className="mt-7 sm:mt-9 flex items-center justify-center gap-2">
              {heroSlides.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveSlide(idx)}
                  aria-label={`Go to slide ${idx + 1}`}
                  className={`transition-all duration-300 rounded-full cursor-pointer ${
                    activeSlide === idx
                      ? 'w-6 h-2 bg-blue-600'
                      : 'w-2 h-2 bg-blue-200 hover:bg-blue-300'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
