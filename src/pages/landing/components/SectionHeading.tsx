import React from 'react';
import { motion } from 'motion/react';
import type { LucideIcon } from 'lucide-react';
import { Reveal } from './Reveal';

/** Poppins for Latin text, Anek Bangla picks up the Bengali glyphs. */
export const LANDING_FONT = "font-['Poppins','Anek_Bangla',sans-serif]";

/** Colour of the icon tile beside a heading; each section has its own. */
const TONES = {
  blue: 'from-[#4F8BFF] to-[#1450F0] shadow-blue-600/30',
  amber: 'from-[#FCD34D] to-[#F59E0B] shadow-amber-500/30',
  violet: 'from-[#A78BFA] to-[#6D28D9] shadow-violet-600/30',
  orange: 'from-[#FDBA74] to-[#EA580C] shadow-orange-500/30',
  rose: 'from-[#FDA4AF] to-[#E11D48] shadow-rose-500/30',
  emerald: 'from-[#6EE7B7] to-[#059669] shadow-emerald-500/30',
} as const;

interface SectionHeadingProps {
  icon: LucideIcon;
  tone: keyof typeof TONES;
  title: string;
  subtitle: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon: Icon, tone, title, subtitle, className = '' }) => (
  <Reveal className={`text-center ${className}`}>
    <div className="flex items-center justify-center gap-3">
      {/* The tile pops in after the heading and gives a little wiggle on hover */}
      <motion.span
        aria-hidden
        className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl sm:rounded-2xl bg-gradient-to-br ${TONES[tone]} text-white shadow-lg ring-1 ring-inset ring-white/30`}
        variants={{
          hidden: { scale: 0, rotate: -30 },
          show: { scale: 1, rotate: 0, transition: { type: 'spring', stiffness: 260, damping: 14, delay: 0.15 } },
        }}
        whileHover={{ rotate: [0, -12, 12, -6, 0], transition: { duration: 0.5 } }}
      >
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2.2} />
      </motion.span>
      <h2 className="text-[22px] sm:text-[30px] font-bold text-[#0B1B4F] tracking-tight leading-tight">{title}</h2>
    </div>
    <p className="mt-1.5 text-sm sm:text-[17px] text-[#3A4462] font-['Poppins','Anek_Bangla',sans-serif] font-medium">
      {subtitle}
    </p>
  </Reveal>
);
