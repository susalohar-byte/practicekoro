import { cn } from '@/lib/cn';

export interface ChipOption<T> {
  value: T;
  label: string;
  count?: number;
}

/** UIChips: a single-select row of pills (scrolls horizontally on small screens). */
export function Chips<T extends string | number | null>({
  options,
  value,
  onChange,
  label,
  className,
  wrap,
}: {
  options: ChipOption<T>[];
  value: T;
  onChange: (v: T) => void;
  label: string;
  className?: string;
  /** Wrap onto several lines instead of scrolling (for narrow side columns). */
  wrap?: boolean;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cn('no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 py-0.5', wrap && 'flex-wrap overflow-visible', className)}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={cn(
              'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] transition-colors',
              selected
                ? 'bg-primary font-bold text-white shadow-[0_3px_8px_rgba(31,72,232,0.25)]'
                : 'border border-line bg-white font-medium text-ink-soft hover:border-primary/40'
            )}
          >
            {o.label}
            {o.count !== undefined && (
              <span className={cn('rounded-lg px-1.5 text-[11px] font-bold', selected ? 'bg-white/25 text-white' : 'bg-muted/10 text-muted')}>
                {o.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
