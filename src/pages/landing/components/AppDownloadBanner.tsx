import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, BarChart3, BookOpen, Crown } from 'lucide-react';
import { GooglePlayBadge } from './AppStoreBadges';
import { APK_ARM64, APK_UNIVERSAL } from './apkDownloads';
import { Reveal, RevealGroup, fadeUp, popIn } from './Reveal';

const FEATURES = [
  { icon: BookOpen, lines: ['বিষয়ভিত্তিক', 'প্র্যাকটিস'] },
  { icon: BarChart3, lines: ['সম্পূর্ণ', 'মক টেস্ট'] },
  { icon: Crown, lines: ['নিজের', 'প্রগ্রেস দেখুন'] },
];

const Sparkle: React.FC<{ className: string; delay?: number }> = ({ className, delay = 0 }) => (
  <motion.svg
    viewBox="0 0 24 24"
    className={className}
    aria-hidden
    animate={{ scale: [0.6, 1.15, 0.6], opacity: [0.5, 1, 0.5], rotate: [0, 20, 0] }}
    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay }}
  >
    <path d="M12 0 L14.5 9.5 L24 12 L14.5 14.5 L12 24 L9.5 14.5 L0 12 L9.5 9.5 Z" fill="#FFD43B" />
  </motion.svg>
);

/** Three short yellow strokes, like the "shine" marks around the heading. */
const Shine: React.FC<{ className: string }> = ({ className }) => (
  <motion.svg
    viewBox="0 0 40 40"
    className={className}
    aria-hidden
    animate={{ opacity: [0.4, 1, 0.4] }}
    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
  >
    <path
      d="M6 22 L2 30 M16 14 L18 4 M26 22 L36 18"
      stroke="#FFD43B"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
  </motion.svg>
);

export const AppDownloadBanner: React.FC = () => {
  return (
    <section className="pt-6 pb-12 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal variants={popIn} className="relative overflow-hidden rounded-[32px] bg-[#001A70]">
          {/* Friends studying together. On wide screens the photo fills the whole card and,
              towards the right, slowly blurs and darkens into navy behind the text. */}
          <div className="relative h-60 sm:h-80 md:absolute md:inset-0 md:h-auto overflow-hidden">
            <motion.picture
              className="block h-full w-full"
              initial={{ scale: 1.08 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <source media="(max-width: 767px)" srcSet="/images/landing/cta_group_study_sm.webp" />
              <img
                src="/images/landing/cta_group_study.webp"
                alt="Friends practising together on Practice Koro"
                className="h-full w-full object-cover object-[35%_center] md:object-left"
              />
            </motion.picture>
            <div
              aria-hidden
              className="hidden md:block absolute inset-0 backdrop-blur-[10px]"
              style={{
                maskImage: 'linear-gradient(to right, transparent 40%, #000 66%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 40%, #000 66%)',
              }}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-b from-transparent from-55% to-[#001A70] md:bg-gradient-to-r md:from-transparent md:from-30% md:via-[#001A70]/55 md:via-55% md:to-[#001A70]/90"
            />
          </div>

          <RevealGroup
            stagger={0.12}
            className="relative flex flex-col items-center text-center px-6 pb-10 -mt-10 md:mt-0 md:ml-auto md:w-[48%] md:px-10 lg:px-12 md:py-14"
          >
            <motion.div variants={fadeUp} className="relative">
              <Shine className="absolute -right-8 -top-5 w-8 h-8 sm:w-10 sm:h-10" />
              <Sparkle className="absolute -left-7 top-[52%] w-5 h-5 sm:w-6 sm:h-6" delay={0.6} />
              <h2 className="font-['Li_Subha_Letterpress_Unicode','Anek_Bangla',sans-serif] text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.15] text-white">
                একসাথে প্রস্তুতি,
                <br />
                <span className="relative inline-block text-[#FFD43B]">
                  একসাথে সফলতা।
                  <svg
                    className="absolute -bottom-2 sm:-bottom-3 right-0 w-[78%] h-3 sm:h-4"
                    viewBox="0 0 200 16"
                    fill="none"
                    preserveAspectRatio="none"
                    aria-hidden
                  >
                    <motion.path
                      d="M4 12 C 60 4, 140 3, 196 7"
                      stroke="#FFD43B"
                      strokeWidth="5"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, delay: 0.6, ease: 'easeInOut' }}
                    />
                  </svg>
                </span>
              </h2>
            </motion.div>

            <motion.ul
              variants={fadeUp}
              className="mt-9 flex items-start justify-center divide-x divide-white/25 font-['Li_Subha_Letterpress_Unicode','Anek_Bangla',sans-serif]"
            >
              {FEATURES.map(({ icon: Icon, lines }) => (
                <li
                  key={lines.join(' ')}
                  className="flex items-center gap-2 lg:gap-2.5 px-2.5 sm:px-4 md:px-2.5 lg:px-4 first:pl-0 last:pr-0 text-left"
                >
                  <motion.span
                    whileHover={{ scale: 1.1, rotate: -6 }}
                    className="flex h-10 w-10 sm:h-12 sm:w-12 md:h-10 md:w-10 lg:h-12 lg:w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#1E5BFF] text-white shadow-lg shadow-blue-900/40"
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </motion.span>
                  <span className="whitespace-nowrap text-[12px] sm:text-[15px] md:text-[12px] lg:text-[15px] leading-snug font-medium text-white">
                    {lines[0]}
                    <br />
                    {lines[1]}
                  </span>
                </li>
              ))}
            </motion.ul>

            <motion.div variants={fadeUp} className="mt-8 w-full max-w-xs">
              <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/login"
                  className="group flex w-full items-center justify-center gap-2.5 rounded-2xl bg-white py-4 text-base sm:text-lg font-semibold text-[#0B1B4F] shadow-lg shadow-black/25"
                >
                  Start Practicing
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-4"
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
            >
              <GooglePlayBadge size="lg" />
            </motion.div>
            <p className="mt-3 text-[13px] text-white/75">
              {APK_ARM64.size}
              <a
                href={APK_UNIVERSAL.href}
                download={APK_UNIVERSAL.file}
                className="flex min-h-11 items-center underline hover:text-white"
              >
                পুরনো ফোনে ইনস্টল না হলে সম্পূর্ণ ভার্সন ({APK_UNIVERSAL.size})
              </a>
            </p>
          </RevealGroup>
        </Reveal>
      </div>
    </section>
  );
};
