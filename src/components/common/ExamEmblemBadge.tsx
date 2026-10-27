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
      onError={(e) => {
        (e.currentTarget as HTMLImageElement).src = '/images/popular_exams/logo_wbp.png';
      }}
    />
  </div>
);

/**
 * Resolves the official government/board emblem URL based on exam title, slug, or icon identifier.
 * Guarantees that each board gets its authentic official emblem without incorrect cross-matching.
 */
export function getOfficialExamLogoUrl(
  title: string = '',
  slug: string = '',
  iconName?: string
): string {
  // If iconName is already an image path or URL, use it directly
  if (
    iconName &&
    (iconName.startsWith('/') ||
      iconName.startsWith('http') ||
      iconName.startsWith('data:') ||
      iconName.startsWith('blob:') ||
      iconName.endsWith('.png') ||
      iconName.endsWith('.svg') ||
      iconName.endsWith('.webp'))
  ) {
    return iconName.startsWith('/') || iconName.startsWith('http')
      ? iconName
      : `/${iconName}`;
  }

  const norm = (title + ' ' + slug + ' ' + (iconName || '')).toLowerCase();

  // 1. Kolkata Police (KP) -> Kolkata Police Official Emblem
  if (norm.includes('kolkata') || norm.includes('kp') || iconName === 'kolkata') {
    return '/images/exams/logo_kp.png';
  }

  // 2. WBSSC Group C & D (West Bengal School Service Commission)
  // MUST be checked BEFORE general 'ssc' or 'police' to avoid substring clash
  if (
    norm.includes('wbssc') ||
    norm.includes('school service') ||
    iconName === 'wbssc' ||
    iconName === 'School'
  ) {
    return '/images/exams/emblem_wbssc.png';
  }

  // 3. Primary TET / Upper Primary TET / Teaching / SLST / CTET -> WBBPE Emblem
  if (
    norm.includes('tet') ||
    norm.includes('primary') ||
    norm.includes('slst') ||
    norm.includes('ctet') ||
    norm.includes('teacher') ||
    iconName === 'tet'
  ) {
    return '/images/exams/logo_wbtet.png';
  }

  // 4. Indian Railways (RRB / NTPC / Group D / ALP) -> Official Railway Crest
  if (
    norm.includes('railway') ||
    norm.includes('rrb') ||
    norm.includes('ntpc') ||
    norm.includes('group d') ||
    norm.includes('alp') ||
    iconName === 'railway' ||
    iconName === 'Train'
  ) {
    return '/images/exams/logo_railway.png';
  }

  // 5. SSC (Staff Selection Commission: GD, MTS, CGL, CHSL) -> Official Central SSC Emblem
  if (
    norm.includes('ssc') ||
    norm.includes('cgl') ||
    norm.includes('chsl') ||
    norm.includes('mts') ||
    norm.includes('gd') ||
    iconName === 'ssc'
  ) {
    return '/images/exams/logo_ssc.png';
  }

  // 6. WBPSC / Clerkship / WBCS / Food SI / ICDS / Civil Services -> Official WBPSC Emblem
  if (
    norm.includes('wbpsc') ||
    norm.includes('clerkship') ||
    norm.includes('wbcs') ||
    norm.includes('food') ||
    norm.includes('icds') ||
    norm.includes('civil') ||
    norm.includes('psc') ||
    iconName === 'wbpsc' ||
    iconName === 'food' ||
    iconName === 'icds'
  ) {
    return '/images/exams/logo_wbpsc.png';
  }

  // 7. West Bengal Police (WBP Constable, SI, Lady Constable) -> Official WBP Golden Shield
  if (
    norm.includes('wbp') ||
    norm.includes('police') ||
    norm.includes('constable') ||
    norm.includes('sub-inspector') ||
    norm.includes('sergeant') ||
    iconName === 'Shield' ||
    iconName === 'wbp'
  ) {
    return '/images/exams/logo_wbp.png';
  }

  // 8. General Knowledge / State Govt / Default fallback: Official WBPSC Ashoka Pillar emblem
  return '/images/exams/logo_wbpsc.png';
}

// High-fidelity exam emblem badge matching official government boards
export const ExamEmblemBadge: React.FC<{
  title?: string;
  slug?: string;
  iconName?: string;
  className?: string;
}> = ({ title = '', slug = '', iconName, className = 'w-8 h-8' }) => {
  const resolvedUrl = getOfficialExamLogoUrl(title, slug, iconName);

  return (
    <div
      className={cn(
        'relative rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
        className
      )}
    >
      <img
        src={resolvedUrl}
        alt={title || 'Exam Emblem'}
        className="w-full h-full object-contain rounded-lg"
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget as HTMLImageElement;
          if (!target.dataset.fallbackLevel) {
            target.dataset.fallbackLevel = '1';
            if (target.src.includes('/popular_exams/')) {
              target.src = target.src.replace('/popular_exams/', '/images/exams/');
            } else {
              target.src = target.src.replace('/images/exams/', '/exams/');
            }
          } else if (target.dataset.fallbackLevel === '1') {
            target.dataset.fallbackLevel = '2';
            target.src = target.src.replace('/images/exams/', '/exams/');
          } else if (target.dataset.fallbackLevel === '2') {
            target.dataset.fallbackLevel = 'done';
            target.src = '/images/exams/logo_wbpsc.png';
          }
        }}
      />
    </div>
  );
};
