import React from 'react';
import { motion } from 'motion/react';
import { Reveal } from './Reveal';

/** Poppins for Latin text, Hind Siliguri picks up the Bengali glyphs. */
export const LANDING_FONT = "font-['Poppins','Hind_Siliguri',sans-serif]";

interface SectionHeadingProps {
  icon: string;
  title: string;
  subtitle: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title, subtitle, className = '' }) => (
  <Reveal className={`text-center ${className}`}>
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      {/* The icon pops in after the heading and gives a little wiggle */}
      <motion.img
        src={icon}
        alt=""
        aria-hidden
        className="w-8 h-8 sm:w-11 sm:h-11 object-contain flex-shrink-0"
        variants={{
          hidden: { scale: 0, rotate: -30 },
          show: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 14, delay: 0.15 } },
        }}
        whileHover={{ rotate: [0, -12, 12, -6, 0], transition: { duration: 0.5 } }}
      />
      <h2 className="text-[22px] sm:text-[30px] font-bold text-[#0B1B4F] tracking-tight leading-tight">{title}</h2>
    </div>
    <p className="mt-1.5 text-sm sm:text-[17px] text-[#3A4462] font-['Hind_Siliguri',sans-serif] font-medium">
      {subtitle}
    </p>
  </Reveal>
);
