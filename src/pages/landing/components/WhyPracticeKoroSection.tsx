import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { RevealGroup, popIn, hoverLift } from './Reveal';
import { SectionHeading } from './SectionHeading';

const FEATURES = [
  {
    title: 'Topic-wise Practice',
    description: 'প্রতি বিষয়ের জন্য গোছানো Topic Test',
    icon: '/images/landing/icons/page_facing_up.png',
    tint: 'bg-[#EAF2FF]',
  },
  {
    title: 'Full Mock Tests',
    description: 'বাস্তব পরীক্ষার অনুকরণে Mock Test',
    icon: '/images/landing/icons/bullseye.png',
    tint: 'bg-[#FFECEE]',
  },
  {
    title: 'Previous Year Questions',
    description: 'পূর্বের বছরের প্রশ্ন দিয়ে পরিণীত প্রস্তুতি',
    icon: '/images/landing/icons/file_folder.png',
    tint: 'bg-[#FFF5E0]',
  },
  {
    title: 'Detailed Solutions',
    description: 'সহজ ও পরিষ্কার ব্যাখ্যা সহ সমাধান',
    icon: '/images/landing/icons/light_bulb.png',
    tint: 'bg-[#FFF6DC]',
  },
  {
    title: 'Track Your Progress',
    description: 'নিজের অগ্রগতি দেখে পরবর্তী প্রস্তুতি ঠিক করুন',
    icon: '/images/landing/icons/bar_chart.png',
    tint: 'bg-[#E6F8EC]',
  },
];

export const WhyPracticeKoroSection: React.FC = () => {
  return (
    <section id="why-pk" className="scroll-mt-20 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon={Sparkles}
          tone="amber"
          title="Why Practice Koro?"
          subtitle="পরীক্ষার প্রস্তুতি এখন আরও গুছানো, আরও কার্যকরী।"
        />

        <RevealGroup className="mt-6 sm:mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-5">
          {FEATURES.map((feature) => (
            <motion.div
              key={feature.title}
              variants={popIn}
              {...hoverLift}
              className="bg-white rounded-2xl border border-[#EDF0F8] group shadow-[0_6px_24px_rgba(30,50,120,0.07)] hover:shadow-[0_14px_34px_rgba(30,80,240,0.14)] transition-shadow px-3 sm:px-4 py-5 sm:py-6 flex flex-col items-center text-center"
            >
              <div className={`w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full ${feature.tint} flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6`}>
                <img src={feature.icon} alt="" aria-hidden className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
              </div>
              <h3 className="mt-3 sm:mt-4 text-[15px] sm:text-[17px] font-bold text-[#0B1B4F] leading-snug">
                {feature.title}
              </h3>
              <p className="mt-2 text-[13px] sm:text-[15px] text-[#5B6478] leading-relaxed font-['Hind_Siliguri',sans-serif]">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
};
