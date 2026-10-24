import React from 'react';
import { cn } from '@/lib/utils';

// Police shield badge with real official WBP logo
export const PoliceShieldBadge: React.FC<{ className?: string }> = ({ className = 'w-9 h-10' }) => (
  <div
    className={cn(
      'rounded-xl overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs select-none',
      className
    )}
  >
    <img
      src="/images/exams/logo_wbp.png"
      alt="WBP Logo"
      className="w-full h-full object-contain rounded-lg"
      loading="lazy"
    />
  </div>
);
