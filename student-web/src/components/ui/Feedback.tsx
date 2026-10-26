import type { ReactNode } from 'react';
import { Loader2, RefreshCw, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';
import { friendlyError } from '@/lib/errors';

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-primary', className)} aria-hidden />;
}

export function Loader({ label = 'Loading…', className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn('flex items-center justify-center py-12', className)}>
      <Spinner />
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function FullPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page">
      <div className="flex flex-col items-center gap-4">
        <img src={`${import.meta.env.BASE_URL}brand/logo-icon.png`} alt="" className="h-14 w-14 rounded-2xl shadow-raised" />
        <Spinner />
        <span className="sr-only">Loading PracticeKoro</span>
      </div>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-card bg-[#EEF1F7]', className)} aria-hidden />;
}

/** UIMessage: icon tile, title, message, optional action. */
export function Message({
  icon,
  title,
  message,
  action,
  className,
}: {
  icon: ReactNode;
  title: string;
  message?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center px-4 py-12 text-center', className)}>
      <div className="mb-4 flex h-[76px] w-[76px] items-center justify-center rounded-[22px] border-[1.5px] border-[#E2E8F0] bg-[#F1F5F9] text-[#475569] [&>svg]:h-8 [&>svg]:w-8">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[#0F172A]">{title}</h3>
      {message && <p className="mt-1.5 max-w-xs text-[13px] leading-relaxed text-[#64748B]">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function RetryButton({ onClick, label = 'Try again' }: { onClick: () => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-card border-[1.5px] border-brand bg-[#EFF6FF] px-5 text-[14.5px] font-semibold text-primary hover:bg-primary-soft"
    >
      <RefreshCw className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

/** UIMessage.error */
export function ErrorState({
  message,
  error,
  onRetry,
  className,
}: {
  message: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const detail = error ? friendlyError(error, '') : '';
  return (
    <Message
      className={className}
      icon={<WifiOff />}
      title="Something went wrong"
      message={
        <>
          {message}
          {detail && detail !== message && <span className="mt-1 block text-[12px] text-faint">{detail}</span>}
        </>
      }
      action={onRetry && <RetryButton onClick={onRetry} />}
    />
  );
}
