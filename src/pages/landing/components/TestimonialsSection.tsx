import React, { useEffect, useState } from 'react';
import { MessageSquareHeart } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { Reveal } from './Reveal';
import { SectionHeading } from './SectionHeading';

const AUTOPLAY_MS = 5000;

const TESTIMONIALS = [
  {
    name: 'Rohit Das',
    role: 'WBP Aspirant',
    avatar: '/images/landing/avatar_rohit.png',
    comment: 'Topic-wise test আর detailed solution খুব helpful. এখন প্রস্তুতি অনেক বেশি organised হয়েছে।',
  },
  {
    name: 'Puja Karmakar',
    role: 'WBSSC Aspirant',
    avatar: '/images/landing/avatar_puja.png',
    comment: 'Mock test দিয়ে নিজের প্রস্তুতি অনেকটা বোঝার সহজ হয়েছে। UI টাও খুব সুন্দর এবং সহজ।',
  },
  {
    name: 'Amit Saha',
    role: 'Clerkship Aspirant',
    avatar: '/images/landing/avatar_amit.png',
    comment: 'Previous year questions এবং explanation দেখে খুব ভালো লাগে। Practice Koro সত্যিই দারুণ একটা platform.',
  },
  {
    name: 'Tania Mondal',
    role: 'Primary TET Aspirant',
    avatar: '/images/avatar_tania.jpg',
    comment: 'পরীক্ষার মতো হুবহু টাইমার আর সিলেবাস অনুযায়ী সাজানো টেস্টগুলো আত্মবিশ্বাস অনেক বাড়িয়ে দিয়েছে।',
  },
  {
    name: 'Abhishek Roy',
    role: 'Railway NTPC Aspirant',
    avatar: '/images/avatar_abhishek.jpg',
    comment: 'বাংলায় বিজ্ঞান ও গণিতের এত চমৎকার ব্যাখ্যা আগে কোথাও পাইনি। প্রতিটি প্রশ্নের নোটস অসাধারণ!',
  },
  {
    name: 'Mousumi Paul',
    role: 'Kolkata Police Aspirant',
    avatar: '/images/avatar_mousumi.jpg',
    comment: 'মোবাইল অ্যাপে নিয়মিত লাইভ টেস্ট আর জেলাভিত্তিক র‍্যাঙ্কিং দেখে নিজের উন্নতি স্পষ্ট বুঝতে পারি।',
  },
];

const PER_VIEW = 3;
const POSITIONS = TESTIMONIALS.length - PER_VIEW + 1;

const QuoteMark: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-6 h-6 text-[#1A5CFF] flex-shrink-0" fill="currentColor" aria-hidden>
    <path d="M10 6c-3.3 1-5 3.6-5 7v5h6v-6H8c0-2 1-3.4 2.6-4L10 6zm9 0c-3.3 1-5 3.6-5 7v5h6v-6h-3c0-2 1-3.4 2.6-4L19 6z" />
  </svg>
);

export const TestimonialsSection: React.FC = () => {
  // The cards slide one at a time, so a dot is shown for every starting position
  const [start, setStart] = useState(0);
  const [paused, setPaused] = useState(false);
  const visible = TESTIMONIALS.slice(start, start + PER_VIEW);

  // Moves on by one review every few seconds, holding still while the visitor is reading
  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(() => setStart((s) => (s + 1) % POSITIONS), AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [paused]);

  return (
    <section id="reviews" className="scroll-mt-20 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <SectionHeading
          icon={MessageSquareHeart}
          tone="rose"
          title="What Our Students Say"
          subtitle="Practice Koro ব্যবহার করে হাজারো ছাত্রছাত্রী তাদের প্রস্তুতিতে আরও শক্তিশালী করেছে।"
        />

        <Reveal
          className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
        >
          <AnimatePresence mode="popLayout" initial={false}>
          {visible.map((item, index) => (
            <motion.article
              key={item.name}
              layout
              initial={{ opacity: 0, x: 60, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -60, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              whileHover={{ y: -6 }}
              className={`bg-white rounded-2xl border border-[#EDF0F8] shadow-[0_6px_24px_rgba(30,50,120,0.07)] p-5 sm:p-6 ${
                index > 0 ? 'hidden md:block' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <img src={item.avatar} alt={item.name} className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover flex-shrink-0" />
                <div className="flex-1 min-w-0 pt-1">
                  <h3 className="text-[15px] font-bold text-[#0B1B4F] leading-tight">{item.name}</h3>
                  <span className="text-[13px] text-[#6B7489]">{item.role}</span>
                </div>
                <QuoteMark />
              </div>
              <p className="mt-4 text-[15px] sm:text-base text-[#4A5470] leading-relaxed font-['Hind_Siliguri',sans-serif]">
                {item.comment}
              </p>
            </motion.article>
          ))}
          </AnimatePresence>
        </Reveal>

        <div className="mt-6 flex items-center justify-center gap-2">
          {Array.from({ length: POSITIONS }, (_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStart(idx)}
              aria-label={`Show reviews ${idx + 1}`}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                start === idx ? 'w-7 bg-[#1A5CFF]' : 'w-2.5 bg-[#C9D2EC] hover:bg-[#A9B5D9]'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
