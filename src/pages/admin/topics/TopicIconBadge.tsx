import React from 'react';
import {
  BookOpen,
  Layers,
  Thermometer,
  Sun,
  Activity,
  Zap,
  Power,
  Shield,
  CheckSquare,
  Crown,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Custom Topic Icon Badge matching screenshot colors and icons
export const TopicIconBadge: React.FC<{
  name: string;
  iconName?: string;
  className?: string;
}> = ({ name, iconName, className = 'w-8 h-8' }) => {
  // 0. If custom uploaded icon or URL is set, render image
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
          alt={name}
          className="w-full h-full object-contain rounded-lg"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const norm = name.toLowerCase();

  // 1. Heat & Temperature -> Red / Coral Thermometer
  if (iconName === 'Thermometer' || norm.includes('heat') || norm.includes('temp')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 border border-[#FECDD3] shadow-2xs',
          className
        )}
      >
        <Thermometer className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // 2. Light -> Amber Sun
  if (iconName === 'Sun' || norm.includes('light') || norm.includes('optics')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 border border-[#FDE68A] shadow-2xs',
          className
        )}
      >
        <Sun className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 3. Sound -> Purple Wave / Activity
  if (
    iconName === 'Activity' ||
    iconName === 'Waves' ||
    norm.includes('sound') ||
    norm.includes('wave') ||
    norm.includes('acoustic')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#E9D5FF] shadow-2xs',
          className
        )}
      >
        <Activity className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // 4. Work, Power and Energy -> Blue Zap
  if (
    iconName === 'Zap' ||
    norm.includes('work') ||
    norm.includes('energy') ||
    norm.includes('force')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 border border-[#BFDBFE] shadow-2xs',
          className
        )}
      >
        <Zap className="w-4 h-4 text-[#026BFC]" />
      </div>
    );
  }

  // 5. Electricity -> Green Power / Plug
  if (
    iconName === 'Power' ||
    norm.includes('electric') ||
    norm.includes('current') ||
    norm.includes('circuit')
  ) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0] shadow-2xs',
          className
        )}
      >
        <Power className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 6. Indian Constitution -> Blue BookOpen
  if (norm.includes('constitution') || norm.includes('preamble')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#EBF3FF] text-[#026BFC] flex items-center justify-center shrink-0 border border-[#BFDBFE] shadow-2xs',
          className
        )}
      >
        <BookOpen className="w-4 h-4 text-[#026BFC]" />
      </div>
    );
  }

  // 7. Fundamental Rights -> Purple Shield
  if (norm.includes('right') || norm.includes('duty') || norm.includes('fundamental')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#F6EEFD] text-[#8B5CF6] flex items-center justify-center shrink-0 border border-[#E9D5FF] shadow-2xs',
          className
        )}
      >
        <Shield className="w-4 h-4 text-[#8B5CF6]" />
      </div>
    );
  }

  // 8. Directive Principles -> Green CheckSquare
  if (norm.includes('directive') || norm.includes('principle') || norm.includes('dpsp')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0] shadow-2xs',
          className
        )}
      >
        <CheckSquare className="w-4 h-4 text-[#10B981]" />
      </div>
    );
  }

  // 9. President -> Amber Crown
  if (norm.includes('president') || norm.includes('governor') || norm.includes('executive')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEF8E7] text-[#F59E0B] flex items-center justify-center shrink-0 border border-[#FDE68A] shadow-2xs',
          className
        )}
      >
        <Crown className="w-4 h-4 text-[#F59E0B]" />
      </div>
    );
  }

  // 10. Parliament -> Red Parliament Building
  if (norm.includes('parliament') || norm.includes('assembly') || norm.includes('judiciary')) {
    return (
      <div
        className={cn(
          'rounded-xl bg-[#FEECEC] text-[#EF4444] flex items-center justify-center shrink-0 border border-[#FECDD3] shadow-2xs',
          className
        )}
      >
        <Building2 className="w-4 h-4 text-[#EF4444]" />
      </div>
    );
  }

  // Default Fallback -> Green Layers
  return (
    <div
      className={cn(
        'rounded-xl bg-[#E8F8F0] text-[#10B981] flex items-center justify-center shrink-0 border border-[#A7F3D0] shadow-2xs',
        className
      )}
    >
      <Layers className="w-4 h-4 text-[#10B981]" />
    </div>
  );
};
