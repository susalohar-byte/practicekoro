import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

/**
 * Accessible dialog: Esc and backdrop close it (unless `dismissible` is false), focus moves
 * into it and returns to the opener, and Tab stays inside.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  dismissible = true,
  hideClose,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dismissible?: boolean;
  hideClose?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    const focusables = () =>
      Array.from(
        node?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );
    (focusables()[0] ?? node)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible) {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab') {
        const els = focusables();
        if (els.length === 0) return;
        const first = els[0];
        const last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      opener?.focus?.();
    };
  }, [open, dismissible, onClose]);

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div className="absolute inset-0 bg-[#0F172A]/45 backdrop-blur-[2px]" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cn(
          'relative max-h-[90vh] w-full overflow-y-auto rounded-t-3xl border border-[#E2E8F0] bg-white p-6 shadow-[0_12px_32px_rgba(15,23,42,0.18)] outline-none sm:rounded-3xl',
          size === 'sm' && 'sm:max-w-sm',
          size === 'md' && 'sm:max-w-md',
          size === 'lg' && 'sm:max-w-2xl',
          className
        )}
      >
        {(title || !hideClose) && (
          <div className="mb-4 flex items-start justify-between gap-4">
            {title ? (
              <h2 id={titleId} className="text-lg font-extrabold text-[#0F172A]">
                {title}
              </h2>
            ) : (
              <span />
            )}
            {!hideClose && dismissible && (
              <button type="button" onClick={onClose} aria-label="Close" className="-m-1 rounded-full p-1.5 text-muted hover:bg-surface">
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}
        {children}
        {footer && <div className="mt-6 flex flex-col gap-2.5">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/** showUICustomDialog layout: icon badge, centred title and message. */
export function DialogHero({
  icon,
  tone = 'primary',
  title,
  message,
}: {
  icon: ReactNode;
  tone?: 'primary' | 'danger' | 'success' | 'gold';
  title: string;
  message?: ReactNode;
}) {
  const tones = {
    primary: 'bg-[#EFF6FF] border-[#BFDBFE] text-brand',
    danger: 'bg-[#FEF2F2] border-[#FECACA] text-danger',
    success: 'bg-[#ECFDF5] border-[#A7F3D0] text-[#059669]',
    gold: 'bg-gold-soft border-[#FDE68A] text-gold',
  };
  return (
    <div className="flex flex-col items-center text-center">
      <div className={cn('mb-4 flex h-16 w-16 items-center justify-center rounded-full border-2 [&>svg]:h-8 [&>svg]:w-8', tones[tone])}>{icon}</div>
      <h2 className="text-xl font-extrabold tracking-tight text-[#0F172A]">{title}</h2>
      {message && <div className="mt-2 text-[13.5px] leading-relaxed text-[#64748B]">{message}</div>}
    </div>
  );
}
