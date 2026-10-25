import { cn } from '@/lib/cn';

/** UIProgress.colorFor: ≥70% green, ≥40% amber, else red. */
export function scoreColor(fraction: number): string {
  if (fraction >= 0.7) return '#22C55E';
  if (fraction >= 0.4) return '#F59E0B';
  return '#DC2626';
}

export function ProgressBar({ value, color, className, label }: { value: number; color?: string; className?: string; label?: string }) {
  const v = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(v * 100)}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-line', className)}
    >
      <div className="h-full rounded-full transition-[width]" style={{ width: `${v * 100}%`, background: color ?? scoreColor(v) }} />
    </div>
  );
}
