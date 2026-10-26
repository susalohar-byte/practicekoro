import React, { useState } from 'react';
import {
  Layers,
  FileText,
  Users,
  TrendingUp,
  BookOpen,
  FlaskConical,
  Lightbulb,
  Landmark,
  Building2,
  Globe,
  Brain,
  Newspaper,
  Monitor,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Subject Icon Badge matching the reference screenshot colors and icons
export const SubjectIconBadge: React.FC<{
  name: string;
  iconName?: string;
  className?: string;
}> = ({ name, iconName, className = 'w-8 h-8' }) => {
  const [failedSource, setFailedSource] = useState('');
  // 0. If custom uploaded icon or URL is set, render image
  if (
    iconName &&
    failedSource !== iconName &&
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
          alt={name}
          className="w-full h-full object-contain rounded-lg"
          onError={() => setFailedSource(iconName)}
        />
      </div>
    );
  }

  const namedIcons: Record<string, typeof BookOpen> = {
    BookOpen,
    FlaskConical,
    Lightbulb,
    Landmark,
    Building2,
    Globe,
    Brain,
    Newspaper,
    Monitor,
    TrendingUp,
    Layers,
    FileText,
    Users,
  };
  const NamedIcon = iconName ? namedIcons[iconName] : undefined;
  if (NamedIcon)
    return (
      <div
        className={cn(
          'rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100',
          className
        )}
      >
        <NamedIcon aria-label={iconName} className="w-4 h-4" />
      </div>
    );
  const norm = name.toLowerCase();

  // 1. General Science -> Purple Flask / Beaker
  if (
    norm.includes('science') ||
    norm.includes('physics') ||
    norm.includes('chemistry') ||
    norm.includes('biology')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs border border-[#E9D5FF]',
          className
        )}
      >
        <FlaskConical className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // 2. General Knowledge / Static GK -> Amber Lightbulb
  if (norm.includes('knowledge') || norm.includes('gk') || norm.includes('awareness')) {
    if (norm.includes('computer')) {
      return (
        <div
          className={cn(
            'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs border border-[#E9D5FF]',
            className
          )}
        >
          <Monitor className="w-4 h-4 text-[#8B5CF6]" />
        </div>
      );
    }
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs border border-[#FDE68A]',
          className
        )}
      >
        <Lightbulb className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 3. History -> Rose / Red Landmark Pillar
  if (norm.includes('history') || norm.includes('heritage') || norm.includes('movement')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs border border-[#FECDD3]',
          className
        )}
      >
        <Landmark className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // 4. Indian Polity / Constitution -> Blue Classical Parliament / Building
  if (norm.includes('polity') || norm.includes('constitution') || norm.includes('law')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 shadow-2xs border border-[#BFDBFE]',
          className
        )}
      >
        <Building2 className="w-4 h-4 text-[#026BFC]" />
      </div>
    );
  }

  // 5. Geography -> Green Globe / Earth
  if (norm.includes('geography') || norm.includes('environment')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs border border-[#A7F3D0]',
          className
        )}
      >
        <Globe className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 6. Economics -> Orange Line Chart / Growth
  if (norm.includes('economic') || norm.includes('economy')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 shadow-2xs border border-[#FDE68A]',
          className
        )}
      >
        <TrendingUp className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 7. Reasoning / GI -> Red Brain / Mind
  if (norm.includes('reasoning') || norm.includes('intelligence') || norm.includes('logic')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 shadow-2xs border border-[#FECDD3]',
          className
        )}
      >
        <Brain className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // 8. Mathematics / Quantitative -> Blue Math square with √x
  if (norm.includes('math') || norm.includes('arithmetic') || norm.includes('quant')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 shadow-2xs border border-[#BFDBFE]',
          className
        )}
      >
        <span className="font-bold text-[11px] font-mono tracking-tighter leading-none select-none">
          √x
        </span>
      </div>
    );
  }

  // 9. Current Affairs -> Green Newspaper / Calendar
  if (norm.includes('current') || norm.includes('affairs') || norm.includes('news')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 shadow-2xs border border-[#A7F3D0]',
          className
        )}
      >
        <Newspaper className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 10. Computer Awareness -> Purple Monitor
  if (norm.includes('computer') || norm.includes('it') || norm.includes('digital')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 shadow-2xs border border-[#E9D5FF]',
          className
        )}
      >
        <Monitor className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // Default fallback -> Blue Open Book
  return (
    <div
      className={cn(
        'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 shadow-2xs border border-[#BFDBFE]',
        className
      )}
    >
      <BookOpen className="w-4 h-4 text-[#026BFC]" />
    </div>
  );
};
