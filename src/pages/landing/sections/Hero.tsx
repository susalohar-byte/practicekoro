import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { SUPPORTED_EXAM_CATEGORIES } from '../data';
import { Reveal } from './Reveal';
import {
  GraduationCap,
  LayoutGrid,
  BookOpen,
  ArrowRight,
  FileText,
  BarChart3,
  Target,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const dashboardUrl = isAdmin ? '/admin' : '/dashboard';
  const navigate = useNavigate();

  return (
    <section className="relative overflow-hidden min-h-screen min-h-[100dvh] flex flex-col justify-between pt-16 sm:pt-20 lg:pt-20 pb-2 sm:pb-3 lg:pb-4 bg-slate-950 text-white">
      {/* Background Lifestyle Video of Indian Aspirant Studying */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/hero_student_study_bg.jpg"
          className="w-full h-full object-cover object-[center_35%] opacity-90 transition-opacity duration-300"
        >
          <source src="/videos/hero-background.mp4" type="video/mp4" />
          <source src="/Hero video.mp4" type="video/mp4" />
          <source src="/Hero%20video.mp4" type="video/mp4" />
          {/* Fallback image if video cannot be played */}
          <img
            src="/images/hero_student_study_bg.jpg"
            alt="Government Exam Aspirant Studying at Home"
            className="w-full h-full object-cover object-[center_35%]"
          />
        </video>
        {/* Dark cinematic gradient scrim - clear video, no white blur, 100% text focus */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/55 to-slate-950/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/65" />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Main Content Column */}
      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex-1 flex flex-col justify-center my-auto py-1 sm:py-2">
        <div className="flex flex-col items-center">
          <div className="w-full max-w-3xl text-center">
            {/* Top Eyebrow Badge */}
            <Reveal>
              <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 -mt-1 sm:-mt-2 mb-2 sm:mb-2.5">
                <span className="text-amber-400 font-bold select-none text-xs">✨</span>
                <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/80 text-xs sm:text-sm font-semibold text-slate-100 shadow-md">
                  <GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  <span>For Government Job Exam Aspirants</span>
                </div>
                <span className="text-amber-400 font-bold select-none text-xs">✨</span>
              </div>
            </Reveal>

            {/* Main Headline */}
            <Reveal delay={80}>
              <h1 className="mt-2 sm:mt-3 text-2xl xs:text-3xl sm:text-4xl lg:text-[3.15rem] font-extrabold text-white tracking-tight font-headline text-balance drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)]">
                <span className="block leading-[1.15] sm:leading-[1.18] mb-0 sm:mb-0.5">
                  আত্মবিশ্বাসের সাথে জয়
                </span>
                <span className="block leading-[1.15] sm:leading-[1.18]">
                  করো{' '}
                  <span className="relative inline-block">
                    <span className="text-white">স্বপ্নের সরকারি </span>
                    <span className="text-blue-400 font-extrabold drop-shadow-[0_0_25px_rgba(96,165,250,0.6)]">
                      চাকরি।
                    </span>
                    {/* Handcrafted Decorated Underline - Single Elegant Line */}
                    <svg
                      className="absolute -bottom-1.5 sm:-bottom-2 left-0 w-full h-2.5 sm:h-3 pointer-events-none drop-shadow-[0_2px_8px_rgba(96,165,250,0.5)]"
                      viewBox="0 0 280 12"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M3 8C45 3 105 2 150 4.5C195 7 235 6.5 277 5"
                        stroke="url(#hero-underline-grad)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="hero-underline-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="50%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </span>
                </span>
              </h1>
            </Reveal>

            {/* Subheadline - Streamlined & uncluttered */}
            <Reveal delay={160}>
              <p className="mt-2.5 sm:mt-3.5 text-xs sm:text-base text-slate-200 max-w-xl mx-auto leading-relaxed font-normal text-balance drop-shadow-sm px-2 sm:px-0">
                আসল পরীক্ষার ধাঁচে পূর্ণাঙ্গ প্রস্তুতি — WBP, WBPSC, WBSSC, TET ও Railways পরীক্ষার
                জন্য।
              </p>
            </Reveal>

            {/* Action Buttons */}
            <Reveal delay={240}>
              <div className="mt-3.5 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none mx-auto">
                <button
                  type="button"
                  onClick={() => navigate(user ? dashboardUrl : '/register')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm sm:text-base shadow-lg shadow-blue-600/35 hover:shadow-blue-500/50 transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  {user ? (
                    <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  ) : (
                    <Sparkles className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-blue-200" />
                  )}
                  <span>{user ? 'Go to Dashboard' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4 ml-0.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('exams');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-2.5 sm:py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/25 hover:border-white/40 backdrop-blur-md shadow-md font-bold text-sm sm:text-base transition-all cursor-pointer hover:-translate-y-0.5"
                >
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span>Explore Exams &amp; Tests</span>
                </button>
              </div>
            </Reveal>

            {/* Three Compact, Elegant Feature Cards */}
            <Reveal delay={300}>
              <div className="mt-4 sm:mt-6 grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full max-w-2xl mx-auto">
                <div className="rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 p-2 sm:px-3.5 sm:py-2.5 shadow-lg shadow-black/20 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left transition-all hover:-translate-y-0.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-[13px] font-bold text-white leading-tight truncate">
                      Full Mocks
                    </h3>
                    <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5 truncate">
                      Exam pattern based
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 p-2 sm:px-3.5 sm:py-2.5 shadow-lg shadow-black/20 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left transition-all hover:-translate-y-0.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-[13px] font-bold text-white leading-tight truncate">
                      10+ Yrs PYQs
                    </h3>
                    <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5 truncate">
                      With detailed solutions
                    </p>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 p-2 sm:px-3.5 sm:py-2.5 shadow-lg shadow-black/20 flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 text-center sm:text-left transition-all hover:-translate-y-0.5">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center shrink-0">
                    <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[11px] sm:text-[13px] font-bold text-white leading-tight truncate">
                      Topic Tests
                    </h3>
                    <p className="hidden sm:block text-[11px] text-slate-400 mt-0.5 truncate">
                      Strengthen weak areas
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Exam marquee strip with elevated positioning */}
      <Reveal delay={150}>
        <div className="relative w-full pb-6 sm:pb-8 lg:pb-10 mt-auto pt-2 sm:pt-3">
          {/* Centered Floating Badge - lifted above marquee */}
          <div className="flex justify-center mb-2 sm:mb-2.5 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-slate-800/95 border border-slate-700 shadow-md text-[11px] font-extrabold tracking-wider text-amber-400 uppercase">
              <span>🔥</span>
              <span>POPULAR EXAMS</span>
            </div>
          </div>

          {/* Marquee row */}
          <div className="relative flex items-center">
            <div className="w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_6%,black_92%,transparent)] py-2">
              <div className="flex w-max animate-marquee gap-3 pr-3">
                {[...SUPPORTED_EXAM_CATEGORIES, ...SUPPORTED_EXAM_CATEGORIES].map((exam, i) => (
                  <span
                    key={`${exam}-${i}`}
                    aria-hidden={i >= SUPPORTED_EXAM_CATEGORIES.length}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-800 text-xs sm:text-sm font-bold text-slate-100 whitespace-nowrap shadow-md"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{exam}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
};
