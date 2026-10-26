import type { HTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('rounded-card border border-line bg-white shadow-card', className)} {...rest} />;
}

/** A whole card that navigates; keeps one focusable element per card. */
export function CardLink({
  to,
  className,
  children,
  state,
  ariaLabel,
}: {
  to: string;
  className?: string;
  children: ReactNode;
  state?: unknown;
  ariaLabel?: string;
}) {
  return (
    <Link
      to={to}
      state={state}
      aria-label={ariaLabel}
      className={cn(
        'block rounded-card border border-line bg-white shadow-card transition hover:-translate-y-px hover:border-primary/30 hover:shadow-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
        className
      )}
    >
      {children}
    </Link>
  );
}

export function SectionHeader({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3 mt-7 flex items-center justify-between gap-3', className)}>
      <h2 className="text-[16.5px] font-bold tracking-tight text-ink">{title}</h2>
      {action}
    </div>
  );
}

export function SeeAll({ to, label = 'See All' }: { to: string; label?: string }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-[#F8FAFC] px-3 py-1 text-[12.5px] font-semibold text-[#2563EB] hover:bg-primary-soft"
    >
      {label}
      <span aria-hidden>→</span>
    </Link>
  );
}
