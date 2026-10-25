import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

interface HeroSectionProps {
  onWatchVideo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onWatchVideo }) => {
  return (
    <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-white via-[#F7F8FE] to-[#EEF1FC]">
      {/* Study-room scene, fading into the page behind the headline */}
      <div
        className="absolute inset-x-0 top-0 h-[400px] sm:h-[max(39vw,480px)] max-h-[720px] bg-[url('/images/landing/hero_scene.jpg')] bg-cover bg-[center_top]"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 74%, rgba(0,0,0,0.45) 90%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 74%, rgba(0,0,0,0.45) 90%, transparent 100%)',
        }}
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-[350px] sm:pt-[min(calc(39vw-36px),660px)] pb-16 sm:pb-24 text-center">
        <img
          src="/images/landing/hero_clipboard.png"
          alt=""
          aria-hidden
          className="hidden sm:block absolute left-6 lg:left-4 top-[min(calc(39vw+40px),760px)] w-20 lg:w-24 animate-float"
        />
        <img
          src="/images/landing/hero_star.png"
          alt=""
          aria-hidden
          className="hidden sm:block absolute right-10 lg:right-16 top-[min(calc(39vw+50px),770px)] w-14 lg:w-[70px] animate-float"
        />

        <h1 className="font-['Li_Subha_Letterpress_Unicode','Hind_Siliguri',sans-serif] text-[36px] sm:text-[50px] lg:text-[56px] leading-[1.15] text-[#0B1650] [text-shadow:0_0_24px_rgba(255,255,255,0.9),0_0_8px_rgba(255,255,255,0.9)]">
          স্বপ্নের <span className="text-[#1A5CFF]">সরকারি চাকরির</span>
          <br />
          প্রস্তুতি হোক{' '}
          <span className="relative inline-block">
            সহজ
            <svg
              className="absolute left-[-12%] -bottom-1 sm:-bottom-2 w-[95%] h-3 sm:h-4"
              viewBox="0 0 120 16"
              fill="none"
              preserveAspectRatio="none"
              aria-hidden
            >
              <path d="M3 12 C 30 4, 70 3, 117 8" stroke="#FF8A1F" strokeWidth="4" strokeLinecap="round" />
            </svg>
          </span>
        </h1>

        <p className="mt-5 sm:mt-6 max-w-2xl mx-auto text-[15px] sm:text-xl leading-relaxed text-[#1F2A44] font-medium">
          West Bengal-এর সরকারি পরীক্ষার জন্য <strong className="font-semibold text-[#0B1650]">Mock Test, Topic Test,</strong>
          <br className="hidden sm:block" />{' '}
          <strong className="font-semibold text-[#0B1650]">PYQ</strong> ও{' '}
          <strong className="font-semibold text-[#0B1650]">Detailed Solutions</strong> — সব এক জায়গায়।
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5">
          <Link
            to="/login"
            className="inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] hover:brightness-110 active:scale-95 text-white text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-blue-600/30 transition-all"
          >
            Start Practicing
            <ArrowRight className="w-5 h-5" />
          </Link>
          <button
            type="button"
            onClick={onWatchVideo}
            className="inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 bg-white hover:bg-slate-50 active:scale-95 text-[#0B1650] text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-slate-900/10 border border-slate-100 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Video
          </button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-[#C9D2EC]" />
          <span className="w-2 h-2 rounded-full bg-[#1A5CFF]" />
          <span className="w-2 h-2 rounded-full bg-[#C9D2EC]" />
          <span className="w-2 h-2 rounded-full bg-[#C9D2EC]" />
        </div>
      </div>

      {/* Soft wave into the sections below */}
      <svg
        className="absolute bottom-0 left-0 w-full h-10 sm:h-16 text-[#F7F8FD]"
        viewBox="0 0 1440 80"
        preserveAspectRatio="none"
        fill="currentColor"
        aria-hidden
      >
        <path d="M0 40 C 360 90, 720 0, 1080 30 S 1440 50, 1440 50 V80 H0 Z" />
      </svg>
    </section>
  );
};
