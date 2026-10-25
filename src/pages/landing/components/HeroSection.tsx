import React from 'react';
import { Link } from 'react-router-dom';
import { motion, type Variants } from 'motion/react';
import { ArrowRight, Play } from 'lucide-react';

const EASE = [0.22, 1, 0.36, 1] as const;

// The hero plays its entrance on load: each block rises in shortly after the one before
const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.7, ease: EASE } },
};

interface HeroSectionProps {
  onWatchVideo: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onWatchVideo }) => {
  return (
    <section
      id="hero"
      className="relative overflow-x-clip bg-gradient-to-b from-[#0A0F24] via-[#080C1C] to-[#05070F]"
    >
      {/* Student studying at his desk, fading into the dark backdrop behind the headline.
          Phones get a smaller copy of the photo. */}
      <motion.div
        initial={{ scale: 1.12, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: EASE }}
        className="absolute inset-x-0 top-0 origin-top h-[420px] sm:h-[max(46vw,520px)] max-h-[760px] bg-[url('/images/landing/hero_student_room_sm.webp')] sm:bg-[url('/images/landing/hero_student_room.webp')] bg-cover bg-[34%_30%] sm:bg-[center_35%]"
        style={{
          maskImage: 'linear-gradient(to bottom, #000 60%, rgba(0,0,0,0.45) 82%, transparent 100%)',
          WebkitMaskImage:
            'linear-gradient(to bottom, #000 60%, rgba(0,0,0,0.45) 82%, transparent 100%)',
        }}
        aria-hidden
      />
      {/* Darken the photo a little so the white headline stays readable */}
      <div
        className="absolute inset-x-0 top-0 h-[420px] sm:h-[max(46vw,520px)] max-h-[760px] bg-gradient-to-b from-black/35 via-black/10 to-transparent"
        aria-hidden
      />

      <motion.div
        variants={heroContainer}
        initial="hidden"
        animate="show"
        className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-[340px] sm:pt-[min(calc(max(46vw,520px)-110px),650px)] pb-16 sm:pb-24 text-center"
      >
        <h1 className="font-['Li_Subha_Letterpress_Unicode','Hind_Siliguri',sans-serif] text-[36px] sm:text-[50px] lg:text-[56px] leading-[1.15] text-white [text-shadow:0_2px_24px_rgba(0,0,0,0.85),0_0_8px_rgba(0,0,0,0.6)]">
          <motion.span variants={heroItem} className="block">
            স্বপ্নের{' '}
            <motion.span
              className="inline-block text-[#FFD43B]"
              animate={{
                textShadow: [
                  '0 0 0px rgba(255,212,59,0)',
                  '0 0 22px rgba(255,212,59,0.55)',
                  '0 0 0px rgba(255,212,59,0)',
                ],
              }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
            >
              সরকারি চাকরির
            </motion.span>
          </motion.span>
          <motion.span variants={heroItem} className="block">
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
                {/* Drawn in like a pen stroke once the line has arrived */}
                <motion.path
                  d="M3 12 C 30 4, 70 3, 117 8"
                  stroke="#FF8A1F"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, delay: 1.1, ease: 'easeInOut' }}
                />
              </svg>
            </span>
          </motion.span>
        </h1>

        <motion.p
          variants={heroItem}
          className="mt-5 sm:mt-6 max-w-2xl mx-auto text-[15px] sm:text-xl leading-relaxed text-white/80 font-medium [text-shadow:0_1px_12px_rgba(0,0,0,0.8)]"
        >
          West Bengal-এর সরকারি পরীক্ষার জন্য{' '}
          <strong className="font-semibold text-white">Mock Test, Topic Test,</strong>
          <br className="hidden sm:block" />{' '}
          <strong className="font-semibold text-white">PYQ</strong> ও{' '}
          <strong className="font-semibold text-white">Detailed Solutions</strong> — সব এক জায়গায়।
        </motion.p>

        <motion.div
          variants={heroItem}
          className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:gap-5"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
            <Link
              to="/login"
              className="group relative overflow-hidden inline-flex items-center gap-2.5 px-7 sm:px-9 py-3.5 sm:py-4 bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] hover:brightness-110 text-white text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-blue-600/30 transition-all"
            >
              {/* A sheen sweeps across the main button every few seconds */}
              <motion.span
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/3 skew-x-[-20deg] bg-gradient-to-r from-transparent via-white/40 to-transparent"
                animate={{ x: ['0%', '520%'] }}
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  repeatDelay: 3.2,
                  ease: 'easeInOut',
                  delay: 2,
                }}
              />
              Start Practicing
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            type="button"
            onClick={onWatchVideo}
            className="inline-flex items-center gap-3 px-7 sm:px-9 py-3.5 sm:py-4 bg-white hover:bg-slate-50 text-[#0B1650] text-sm sm:text-base font-semibold rounded-2xl shadow-lg shadow-black/30 border border-white/20 transition-all cursor-pointer"
          >
            <span className="relative flex h-4 w-4 items-center justify-center">
              <span
                className="absolute inline-flex h-6 w-6 rounded-full bg-[#1A5CFF]/25 animate-ping"
                aria-hidden
              />
              <Play className="relative w-4 h-4 fill-current" />
            </span>
            Watch Video
          </motion.button>
        </motion.div>

        <motion.div
          variants={heroItem}
          className="mt-10 flex items-center justify-center gap-2"
          aria-hidden
        >
          <span className="w-2 h-2 rounded-full bg-white/30" />
          <span className="w-2 h-2 rounded-full bg-[#5B95FF]" />
          <span className="w-2 h-2 rounded-full bg-white/30" />
          <span className="w-2 h-2 rounded-full bg-white/30" />
        </motion.div>
      </motion.div>

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
