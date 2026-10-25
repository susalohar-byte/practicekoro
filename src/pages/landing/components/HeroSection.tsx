import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';

interface HeroSectionProps {
  onWatchVideo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onWatchVideo }) => {
  return (
    <section id="hero" className="relative overflow-x-clip bg-gradient-to-b from-[#0A0F24] via-[#080C1C] to-[#05070F]">
      {/* Student studying at his desk, fading into the dark backdrop behind the headline.
          Phones get a smaller copy of the photo. */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] sm:h-[max(46vw,520px)] max-h-[760px] bg-[url('/images/landing/hero_student_room_sm.webp')] sm:bg-[url('/images/landing/hero_student_room.webp')] bg-cover bg-[34%_30%] sm:bg-[center_35%]"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 60%, rgba(0,0,0,0.45) 82%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, #000 60%, rgba(0,0,0,0.45) 82%, transparent 100%)',
        }}
        aria-hidden
      />
      {/* Darken the photo a little so the white headline stays readable */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] sm:h-[max(46vw,520px)] max-h-[760px] bg-gradient-to-b from-black/35 via-black/10 to-transparent"
        aria-hidden
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-[340px] sm:pt-[min(calc(max(46vw,520px)-110px),650px)] pb-16 sm:pb-24 text-center">
        <h1 className="font-['Li_Subha_Letterpress_Unicode','Hind_Siliguri',sans-serif] text-[36px] sm:text-[50px] lg:text-[56px] leading-[1.15] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_0_8px_rgba(0,0,0,0.6)]">
          স্বপ্নের <span className="text-[#FFD43B]">সরকারি চাকরির</span>
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

        <p className="mt-5 sm:mt-6 max-w-2xl mx-auto text-[15px] sm:text-xl leading-relaxed text-white/80 font-medium [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]">
          West Bengal-এর সরকারি পরীক্ষার জন্য <strong className="font-semibold text-white">Mock Test, Topic Test,</strong>
          <br className="hidden sm:block" />{' '}
          <strong className="font-semibold text-white">PYQ</strong> ও{' '}
          <strong className="font-semibold text-white">Detailed Solutions</strong> — সব এক জায়গায়।
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
            className="inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 bg-white hover:bg-slate-50 active:scale-95 text-[#0B1650] text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-black/30 border border-white/20 transition-all cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            Watch Video
          </button>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2" aria-hidden>
          <span className="w-2 h-2 rounded-full bg-white/30" />
          <span className="w-2 h-2 rounded-full bg-[#5B95FF]" />
          <span className="w-2 h-2 rounded-full bg-white/30" />
          <span className="w-2 h-2 rounded-full bg-white/30" />
        </div>
      </div>

      {/* Soft wave into the sections below */}
      <svg
        className="absolute -bottom-0.5 left-0 w-full h-10 sm:h-16 text-[#F7F8FD]"
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
