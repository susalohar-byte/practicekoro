import { FileText, BookOpen } from 'lucide-react';
import type { MockTest } from '@/types';
import { cn } from '@/lib/utils';
import { PoliceShieldBadge } from './PoliceShieldBadge';

// Helper to render type-specific row icon matching screenshot, with custom uploaded icon support
export const renderRowIcon = (t: MockTest, sizeClass = 'w-8 h-8') => {
  if (t.iconUrl) {
    return (
      <div
        className={cn(
          'rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-2xs',
          sizeClass
        )}
      >
        <img
          src={t.iconUrl}
          alt={t.title}
          className="w-full h-full object-contain rounded-md"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }
  if (t.id === 'test-wbp-full-mock-1' || t.title.includes('WBP Constable Full Mock 1')) {
    return <PoliceShieldBadge className={sizeClass === 'w-11 h-11' ? 'w-10 h-11' : 'w-8 h-9'} />;
  }
  if (t.title.includes('PYQ') || t.testType === 'pyq') {
    return (
      <div
        className={cn(
          'rounded-lg bg-[#EF4444] text-white flex items-center justify-center shrink-0 shadow-2xs',
          sizeClass
        )}
      >
        <FileText className="w-4 h-4" />
      </div>
    );
  }
  if (
    t.title.includes('Modern India') ||
    t.title.includes('Geography') ||
    t.subjectName === 'History'
  ) {
    return (
      <div
        className={cn(
          'rounded-lg bg-[#7C3AED] text-white flex items-center justify-center shrink-0 shadow-2xs',
          sizeClass
        )}
      >
        <BookOpen className="w-4 h-4" />
      </div>
    );
  }
  if (
    t.title.includes('Polity') ||
    t.title.includes('Heat') ||
    t.title.includes('Environment') ||
    t.subjectName === 'General Science' ||
    t.subjectName === 'Polity'
  ) {
    return (
      <div
        className={cn(
          'rounded-lg bg-[#10B981] text-white flex items-center justify-center shrink-0 shadow-2xs',
          sizeClass
        )}
      >
        <BookOpen className="w-4 h-4" />
      </div>
    );
  }
  // Blue for Reasoning and Full Mock
  return (
    <div
      className={cn(
        'rounded-lg bg-[#026BFC] text-white flex items-center justify-center shrink-0 shadow-2xs',
        sizeClass
      )}
    >
      <FileText className="w-4 h-4" />
    </div>
  );
};
