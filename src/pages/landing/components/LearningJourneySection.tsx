import React from 'react';
import { motion } from 'motion/react';
import { ArrowRight, Route } from 'lucide-react';
import { Reveal, RevealGroup, fadeUp } from './Reveal';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    title: 'Choose a Topic',
    description: 'আপনার পছন্দের বিষয় নির্বাচন করুন',
    icon: '/images/landing/icons/page_facing_up.png',
    tint: 'bg-[#EAF2FF]',
  },
  {
    title: 'Practice Questions',
    description: 'বিভিন্ন ধরনের প্রশ্নে অনুশীলন করুন',
    icon: '/images/landing/icons/bullseye.png',
    tint: 'bg-[#FFECEE]',
  },
  {
    title: 'Review Solutions',
    description: 'সহজ ব্যাখ্যা দেখে ভুলগুলো বুঝে নিন',
    icon: '/images/landing/icons/open_book.png',
    tint: 'bg-[#F6EAFF]',
  },
  {
    title: 'Track Progress',
    description: 'নিজের উন্নতি নিয়মিত পর্যবেক্ষণ করুন',
    icon: '/images/landing/icons/chart_increasing.png',
    tint: 'bg-[#E6F8EC]',
  },
];

export const LearningJourneySection: React.FC = () => {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <Reveal className="bg-white rounded-3xl border border-[#EDF0F8] shadow-[0_6px_24px_rgba(30,50,120,0.06)] px-5 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
          <SectionHeading
            icon={Route}
            tone="violet"
            title="Your Learning Journey"
            subtitle="সহজ ৪ ধাপে এগিয়ে চলুন আপনার স্বপ্নের দিকে।"
          />

          <RevealGroup
            as="ol"
            stagger={0.18}
            className="mt-8 grid grid-cols-2 lg:flex lg:items-start lg:justify-between gap-x-4 gap-y-8"
          >
            {STEPS.map((step, index) => (
              <React.Fragment key={step.title}>
                <motion.li
                  variants={fadeUp}
                  className="group relative flex flex-col items-center text-center lg:flex-1"
                >
                  <div className="relative">
                    <motion.span
                      variants={{
                        hidden: { scale: 0 },
                        show: {
                          scale: 1,
                          transition: { type: 'spring', stiffness: 400, damping: 15, delay: 0.25 },
                        },
                      }}
                      className="absolute -left-12 sm:-left-14 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] text-white text-sm font-bold flex items-center justify-center shadow-md shadow-blue-600/30"
                    >
                      {index + 1}
                    </motion.span>
                    {/* Each step bobs gently, a beat after the one before */}
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.4,
                      }}
                      className={`w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full ${step.tint} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}
                    >
                      <img
                        src={step.icon}
                        alt=""
                        aria-hidden
                        className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                      />
                    </motion.div>
                  </div>
                  <h3 className="mt-4 text-[15px] sm:text-[17px] font-bold text-[#0B1B4F]">
                    {step.title}
                  </h3>
                  <p className="mt-1.5 text-[13px] sm:text-[15px] text-[#5B6478] leading-relaxed max-w-[11rem] font-['Poppins','Anek_Bangla',sans-serif]">
                    {step.description}
                  </p>
                </motion.li>
                {index < STEPS.length - 1 && (
                  <motion.li
                    variants={fadeUp}
                    aria-hidden
                    className="hidden lg:flex pt-7 text-[#9AA3B8]"
                  >
                    <motion.span
                      animate={{ x: [0, 6, 0], opacity: [0.5, 1, 0.5] }}
                      transition={{
                        duration: 1.6,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: index * 0.3,
                      }}
                    >
                      <ArrowRight className="w-5 h-5" />
                    </motion.span>
                  </motion.li>
                )}
              </React.Fragment>
            ))}
          </RevealGroup>
        </Reveal>
      </div>
    </section>
  );
};
