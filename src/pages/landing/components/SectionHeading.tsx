import React from 'react';

/** Poppins for Latin text, Hind Siliguri picks up the Bengali glyphs. */
export const LANDING_FONT = "font-['Poppins','Hind_Siliguri',sans-serif]";

interface SectionHeadingProps {
  icon: string;
  title: string;
  subtitle: string;
  className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({ icon, title, subtitle, className = '' }) => (
  <div className={`text-center ${className}`}>
    <div className="flex items-center justify-center gap-2.5 sm:gap-3">
      <img src={icon} alt="" aria-hidden className="w-8 h-8 sm:w-11 sm:h-11 object-contain flex-shrink-0" />
      <h2 className="text-[22px] sm:text-[30px] font-bold text-[#0B1B4F] tracking-tight leading-tight">{title}</h2>
    </div>
    <p className="mt-1.5 text-sm sm:text-[17px] text-[#3A4462] font-['Hind_Siliguri',sans-serif] font-medium">
      {subtitle}
    </p>
  </div>
);
