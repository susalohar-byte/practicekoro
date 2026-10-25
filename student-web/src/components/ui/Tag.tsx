import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  gold: 'bg-gold/15 text-[#B45309]',
  purple: 'bg-purple/10 text-purple',
  muted: 'bg-[#F1F5F9] text-[#64748B]',
  teal: 'bg-teal/10 text-[#0369A1]',
} as const;

export type Tone = keyof typeof tones;

export function Tag({ tone = 'primary', icon, children, className }: { tone?: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-lg px-2 py-0.5 text-[11px] font-bold tracking-wide [&>svg]:h-3 [&>svg]:w-3', tones[tone], className)}>
      {icon}
      {children}
    </span>
  );
}

export function ProBadge({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-[#FDE68A] bg-[#FEF3C7] px-2.5 py-1 text-[11px] font-black text-[#92400E]', className)}>
      <svg viewBox="0 0 24 24" className="h-3 w-3 fill-[#D97706]" aria-hidden><path d="M17 9V7a5 5 0 0 0-10 0v2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2Zm-8-2a3 3 0 0 1 6 0v2H9Z" /></svg>
      PRO
    </span>
  );
}
