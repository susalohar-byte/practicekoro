import React from 'react';
import { ArrowRight } from 'lucide-react';
import { SectionHeading } from './SectionHeading';

const STEPS = [
  {
    title: 'Choose a Topic',
    description: 'আপনার পছন্দের বিষয় নির্বাচন করুন',
    icon: '/images/landing/step_topic.png',
    tint: 'bg-[#EAF2FF]',
  },
  {
    title: 'Practice Questions',
    description: 'বিভিন্ন ধরনের প্রশ্নে অনুশীলন করুন',
    icon: '/images/landing/step_practice.png',
    tint: 'bg-[#FFECEE]',
  },
  {
    title: 'Review Solutions',
    description: 'সহজ ব্যাখ্যা দেখে ভুলগুলো বুঝে নিন',
    icon: '/images/landing/step_review.png',
    tint: 'bg-[#F6EAFF]',
  },
  {
    title: 'Track Progress',
    description: 'নিজের উন্নতি নিয়মিত পর্যবেক্ষণ করুন',
    icon: '/images/landing/step_progress.png',
    tint: 'bg-[#E6F8EC]',
  },
];

export const LearningJourneySection: React.FC = () => {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-6 sm:py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-[#EDF0F8] shadow-[0_6px_24px_rgba(30,50,120,0.06)] px-5 sm:px-8 pt-6 sm:pt-8 pb-8 sm:pb-10">
          <SectionHeading
            icon="/images/landing/ic_rocket.png"
            title="Your Learning Journey"
            subtitle="সহজ ৪ ধাপে এগিয়ে চলুন আপনার স্বপ্নের দিকে।"
          />

          <ol className="mt-8 grid grid-cols-2 lg:flex lg:items-start lg:justify-between gap-x-4 gap-y-8">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.title}>
                <li className="relative flex flex-col items-center text-center lg:flex-1">
                  <div className="relative">
                    <span className="absolute -left-12 sm:-left-14 top-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-b from-[#2F7BFF] to-[#1450F0] text-white text-sm font-bold flex items-center justify-center shadow-md shadow-blue-600/30">
                      {index + 1}
                    </span>
                    <div className={`w-16 h-16 sm:w-[76px] sm:h-[76px] rounded-full ${step.tint} flex items-center justify-center`}>
                      <img src={step.icon} alt="" aria-hidden className="w-full h-full object-contain scale-110" />
                    </div>
                  </div>
                  <h3 className="mt-4 text-[15px] sm:text-[17px] font-bold text-[#0B1B4F]">{step.title}</h3>
                  <p className="mt-1.5 text-[13px] sm:text-[15px] text-[#5B6478] leading-relaxed max-w-[11rem] font-['Hind_Siliguri',sans-serif]">
                    {step.description}
                  </p>
                </li>
                {index < STEPS.length - 1 && (
                  <li aria-hidden className="hidden lg:flex pt-7 text-[#9AA3B8]">
                    <ArrowRight className="w-5 h-5" />
                  </li>
                )}
              </React.Fragment>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
};
