import React from 'react';

// ============================================================================
// EXAM ICON EMBLEM COMPONENT
// ============================================================================

export const ExamLogoEmblem: React.FC<{ examName: string }> = ({ examName }) => {
  const norm = examName.toLowerCase();
  let logoUrl = '/images/exams/logo_wbpsc.png';

  if (norm.includes('kolkata') || norm.includes('kp')) {
    logoUrl = '/images/exams/logo_kp.png';
  } else if (norm.includes('wbp') || norm.includes('police')) {
    logoUrl = '/images/exams/logo_wbp.png';
  } else if (norm.includes('railway') || norm.includes('rrb') || norm.includes('ntpc')) {
    logoUrl = '/images/exams/logo_railway.png';
  } else if (norm.includes('ssc')) {
    logoUrl = '/images/exams/logo_ssc.png';
  } else if (norm.includes('tet') || norm.includes('primary')) {
    logoUrl = '/images/exams/logo_wbtet.png';
  } else if (
    norm.includes('wbpsc') ||
    norm.includes('clerkship') ||
    norm.includes('food') ||
    norm.includes('icds') ||
    norm.includes('group c') ||
    norm.includes('group d') ||
    norm.includes('wbcs')
  ) {
    logoUrl = '/images/exams/logo_wbpsc.png';
  }

  return (
    <div className="w-6 h-6 rounded-md bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 p-0.5 flex items-center justify-center shrink-0 shadow-2xs overflow-hidden">
      <img
        src={logoUrl}
        alt={examName}
        className="w-full h-full object-contain rounded-xs"
        loading="lazy"
        onError={(e) => {
          (e.target as HTMLImageElement).src = '/images/exams/logo_wbp.png';
        }}
      />
    </div>
  );
};
