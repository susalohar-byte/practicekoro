import React from 'react';
import { Shield, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

// WBP Golden Crest Police Shield Badge SVG (Pixel-perfect recreation matching screenshot)
export const PoliceShieldBadge: React.FC<{ className?: string }> = ({ className = 'w-9 h-10' }) => (
  <div
    className={cn(
      'relative flex items-center justify-center shrink-0 drop-shadow-xs select-none',
      className
    )}
  >
    <svg
      viewBox="0 0 40 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
    >
      <path
        d="M20 2C20 2 35 4.5 37 10C39 18 37 34 20 46C3 34 1 18 3 10C5 4.5 20 2 20 2Z"
        fill="#7F1D1D"
        stroke="#F59E0B"
        strokeWidth="2.5"
      />
      <path
        d="M20 6C20 6 32 8.5 33.5 13C35 19 33.5 32 20 42C6.5 32 5 19 6.5 13C8 8.5 20 6 20 6Z"
        fill="#5A0B0B"
        stroke="#FCD34D"
        strokeWidth="1"
      />
      <path
        d="M20 13L21.8 17.5L26.5 18L22.8 21.2L24 25.8L20 23.2L16 25.8L17.2 21.2L13.5 18L18.2 17.5L20 13Z"
        fill="#FCD34D"
      />
      <text
        x="20"
        y="36"
        textAnchor="middle"
        fontSize="8"
        fontWeight="900"
        fill="#FCD34D"
        letterSpacing="0.8"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        POLICE
      </text>
    </svg>
  </div>
);

// High-fidelity exam emblem generator matching reference screenshot
export const ExamEmblemBadge: React.FC<{
  title?: string;
  slug?: string;
  iconName?: string;
  className?: string;
}> = ({ title = '', slug = '', iconName, className = 'w-8 h-8' }) => {
  // 1. If custom uploaded logo or URL is set, ALWAYS display it
  if (
    iconName &&
    (iconName.startsWith('data:') ||
      iconName.startsWith('/') ||
      iconName.startsWith('http') ||
      iconName.startsWith('blob:'))
  ) {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src={iconName}
          alt={title || 'Exam Logo'}
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const norm = (title + ' ' + slug + ' ' + (iconName || '')).toLowerCase();

  // 1. Kolkata Police -> Real KP emblem
  if (norm.includes('kolkata') || norm.includes('kp') || iconName === 'kolkata') {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_kp.png"
          alt={title || 'Kolkata Police'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. West Bengal Police -> Real WBP Shield
  if (norm.includes('wbp') || norm.includes('police') || iconName === 'Shield') {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_wbp.png"
          alt={title || 'West Bengal Police'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 3. SSC MTS / SSC GD -> Real SSC official logo
  if (norm.includes('ssc') || iconName === 'ssc') {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_ssc.png"
          alt={title || 'SSC'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 4. Railway Group D / RRB -> Real Indian Railways official logo
  if (norm.includes('railway') || norm.includes('rrb') || iconName === 'railway') {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_railway.png"
          alt={title || 'Indian Railways'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 5. Primary TET / TET -> Real WBBPE official logo
  if (norm.includes('tet') || norm.includes('primary') || iconName === 'tet') {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_wbtet.png"
          alt={title || 'Primary TET'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 6. WBPSC / Clerkship / WBCS / Food SI / ICDS -> Real WBPSC official emblem
  if (
    norm.includes('wbpsc') ||
    norm.includes('clerkship') ||
    norm.includes('wbcs') ||
    norm.includes('food') ||
    norm.includes('icds') ||
    norm.includes('wbssc') ||
    iconName === 'wbpsc' ||
    iconName === 'wbssc' ||
    iconName === 'food' ||
    iconName === 'icds'
  ) {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_wbpsc.png"
          alt={title || 'WBPSC'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 9. WBSSC Group C & D -> Green rounded square with open book
  if (norm.includes('wbssc')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#059669] text-white flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <BookOpen className="w-4 h-4 text-emerald-100" />
      </div>
    );
  }

  // 10. General Knowledge -> Blue rounded square with open book
  if (norm.includes('knowledge') || norm.includes('general')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#026BFC] text-white flex items-center justify-center shrink-0 shadow-2xs',
          className
        )}
      >
        <BookOpen className="w-4 h-4 text-blue-100" />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs',
        className
      )}
    >
      <Shield className="w-4 h-4 text-white" />
    </div>
  );
};
