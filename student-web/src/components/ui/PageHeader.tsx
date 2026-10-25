import type { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/cn';

/** Back goes to the previous page, or to `fallback` when the page was opened directly. */
export function useBack(fallback: string) {
  const navigate = useNavigate();
  return () => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}

export function BackButton({ fallback, label = 'Back', className }: { fallback: string; label?: string; className?: string }) {
  const back = useBack(fallback);
  return (
    <button
      type="button"
      onClick={back}
      aria-label={label}
      className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-line bg-white text-ink hover:bg-surface', className)}
    >
      <ChevronLeft className="h-5 w-5" />
    </button>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  actions,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  back?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn('mb-5 flex items-center gap-3', className)}>
      {back && <BackButton fallback={back} />}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-extrabold tracking-tight text-[#0F172A] sm:text-2xl">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-[13px] text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}
