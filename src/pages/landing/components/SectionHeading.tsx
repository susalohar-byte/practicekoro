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
  <div className={`flex items-start gap-3 sm:gap-4 ${className}`}>
    <img src={icon} alt="" aria-hidden className="w-9 h-9 sm:w-12 sm:h-12 object-contain flex-shrink-0 -mt-0.5" />
    <div>
      <h2 className="text-[22px] sm:text-[30px] font-bold text-[#0B1B4F] tracking-tight leading-tight">{title}</h2>
      <p className="mt-1 text-sm sm:text-[17px] text-[#3A4462] font-['Hind_Siliguri',sans-serif] font-medium">
        {subtitle}
      </p>
    </div>
  </div>
);
