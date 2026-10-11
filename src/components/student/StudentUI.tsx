import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Shared building blocks for the student web panel so every page uses the same
 * header, card chrome and section titles.
 */

export const studentCard =
  'bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/70 dark:border-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(30,42,138,0.12)]';

interface PageHeaderProps {
  title: string;
  subtitle?: React.ReactNode;
  eyebrow?: string;
  icon?: React.ComponentType<{ className?: string }>;
  actions?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  eyebrow,
  icon: Icon,
  actions,
  onBack,
  className,
}) => (
  <header className={cn('flex flex-wrap items-end justify-between gap-x-4 gap-y-3', className)}>
    <div className="flex items-center gap-3 min-w-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      )}
      {Icon && (
        <div className="hidden sm:flex w-11 h-11 shrink-0 rounded-xl bg-gradient-to-br from-[#1E2A8A] to-[#3142D6] text-white items-center justify-center shadow-[0_6px_16px_rgba(49,66,214,0.25)]">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="min-w-0">
        {eyebrow && (
          <p className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#3142D6] dark:text-[#8FB3FF]">
            {eyebrow}
          </p>
        )}
        <h1 className="text-[22px] sm:text-[26px] font-black tracking-tight text-[#121A4D] dark:text-white leading-tight truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-0.5 text-[13px] sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            {subtitle}
          </p>
        )}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </header>
);

interface SectionTitleProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({
  title,
  subtitle,
  action,
  className,
}) => (
  <div className={cn('flex items-end justify-between gap-3', className)}>
    <div className="min-w-0">
      <h2 className="text-[17px] font-extrabold tracking-tight text-[#121A4D] dark:text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[12.5px] font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
      )}
    </div>
    {action}
  </div>
);

interface StatTileProps {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  tone?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'violet';
  hint?: string;
}

const toneClasses: Record<NonNullable<StatTileProps['tone']>, string> = {
  indigo: 'bg-indigo-50 text-[#3142D6] dark:bg-indigo-950/50 dark:text-indigo-300',
  emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300',
  sky: 'bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300',
  violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300',
};

export const StatTile: React.FC<StatTileProps> = ({
  label,
  value,
  icon: Icon,
  tone = 'indigo',
  hint,
}) => (
  <div className={cn(studentCard, 'p-4 flex items-center gap-3')}>
    {Icon && (
      <div
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center shrink-0',
          toneClasses[tone]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
    )}
    <div className="min-w-0">
      <p className="text-[12px] font-semibold text-slate-500 dark:text-slate-400 truncate">
        {label}
      </p>
      <p className="text-xl font-black tracking-tight text-[#121A4D] dark:text-white leading-tight">
        {value}
      </p>
      {hint && <p className="text-[11px] font-medium text-slate-400 truncate">{hint}</p>}
    </div>
  </div>
);

/** Small segmented/pill filter button used for chips rows. */
export const FilterChip: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }
> = ({ active, className, children, ...rest }) => (
  <button
    type="button"
    {...rest}
    className={cn(
      'h-9 px-3.5 rounded-xl text-[13px] font-bold whitespace-nowrap transition-colors cursor-pointer border',
      active
        ? 'bg-[#1E2A8A] border-[#1E2A8A] text-white shadow-[0_4px_12px_rgba(30,42,138,0.25)] dark:bg-[#3142D6] dark:border-[#3142D6]'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-[#3142D6]/40 hover:text-[#1E2A8A]',
      className
    )}
  >
    {children}
  </button>
);
