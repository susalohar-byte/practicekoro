import React from 'react';
import { cn } from '@/lib/utils';

// WBP Golden Crest Police Shield Badge (Real Official Logo)
export const PoliceShieldBadge: React.FC<{ className?: string }> = ({ className = 'w-9 h-10' }) => (
  <div
    className={cn(
      'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs select-none',
      className
    )}
  >
    <img
      src="/images/exams/logo_wbp.png"
      alt="WBP Police Logo"
      className="w-full h-full object-contain rounded-lg"
      loading="lazy"
    />
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
            const target = e.target as HTMLImageElement;
            if (target.src.includes('logo_wbp.png')) {
              target.style.display = 'none';
            } else {
              target.src = '/images/exams/logo_wbp.png';
            }
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

  // 7. General Knowledge or Other WB Exams -> Real WBPSC official emblem
  if (norm.includes('knowledge') || norm.includes('general')) {
    return (
      <div
        className={cn(
          'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          className
        )}
      >
        <img
          src="/images/exams/logo_wbpsc.png"
          alt={title || 'General Knowledge'}
          className="w-full h-full object-contain rounded-lg"
          loading="lazy"
        />
      </div>
    );
  }

  // 8. Default fallback -> PracticeKoro official circular badge or WBP logo
  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
        className
      )}
    >
      <img
        src="/logo-icon-circle.png"
        alt={title || 'Exam Logo'}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
        }}
      />
    </div>
  );
};
