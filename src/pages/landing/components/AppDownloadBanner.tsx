import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { GooglePlayBadge, AppStoreBadge } from './AppStoreBadges';
import { GroupStudyScene } from './GroupStudyScene';
import { Reveal, RevealGroup, fadeUp, popIn } from './Reveal';

interface AppDownloadBannerProps {
  onIosClick: () => void;
}

export const AppDownloadBanner: React.FC<AppDownloadBannerProps> = ({ onIosClick }) => {
  return (
    <section className="pt-6 pb-12 sm:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal
          variants={popIn}
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#0B1B4F] via-[#0E2A86] to-[#1450F0] shadow-[0_24px_60px_rgba(20,60,200,0.30)]"
        >
          {/* Slow drifting light, so the card feels alive behind the scene */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -top-32 -left-24 h-80 w-80 rounded-full bg-[#5B95FF]/40 blur-3xl"
            animate={{ x: [0, 60, 0], y: [0, 30, 0] }}
            transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="pointer-events-none absolute -bottom-40 right-10 h-96 w-96 rounded-full bg-[#FFD43B]/20 blur-3xl"
            animate={{ x: [0, -50, 0], y: [0, -30, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative grid md:grid-cols-[1fr_1.1fr] items-center gap-2 md:gap-6 px-6 sm:px-10 lg:px-14 pt-10 md:py-10">
            <RevealGroup stagger={0.12} className="text-center md:text-left">
              <motion.h2
                variants={fadeUp}
                className="font-['Li_Subha_Letterpress_Unicode','Hind_Siliguri',sans-serif] text-[34px] sm:text-[44px] lg:text-[52px] leading-[1.15] text-white"
              >
                একসাথে প্রস্তুতি,
                <br />
                <span className="text-[#FFD43B]">একসাথে সাফল্য।</span>
              </motion.h2>

              <motion.div variants={fadeUp} className="mt-7 flex justify-center md:justify-start">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/login"
                    className="group inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm sm:text-base font-semibold text-[#0B1B4F] shadow-lg shadow-black/20"
                  >
                    Start Practicing
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center justify-center md:justify-start gap-3">
                <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <GooglePlayBadge size="sm" />
                </motion.div>
                <motion.div whileHover={{ scale: 1.06, y: -2 }} whileTap={{ scale: 0.96 }}>
                  <AppStoreBadge size="sm" onIosClick={onIosClick} />
                </motion.div>
              </motion.div>
            </RevealGroup>

            <GroupStudyScene className="w-full max-w-[520px] mx-auto md:ml-auto -mb-1 md:mb-0" />
          </div>
        </Reveal>
      </div>
    </section>
  );
};
