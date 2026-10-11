import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function HomepageCarousel({ label, children }: { label: string; children: ReactNode }) {
  const row = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });
  const measure = useCallback(() => {
    const element = row.current;
    if (!element) return;
    setEdges({
      left: element.scrollLeft > 2,
      right: element.scrollLeft + element.clientWidth < element.scrollWidth - 2,
    });
  }, []);
  useEffect(() => {
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    if (row.current) observer?.observe(row.current);
    return () => observer?.disconnect();
  }, [children, measure]);
  const move = (direction: number) => {
    const reduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    row.current?.scrollBy({
      left: direction * Math.max(240, row.current.clientWidth * 0.75),
      behavior: reduced ? 'auto' : 'smooth',
    });
  };
  return (
    <div className="study-carousel">
      <div
        ref={row}
        className="study-carousel-row"
        role="group"
        aria-label={label}
        tabIndex={0}
        onScroll={measure}
      >
        {children}
      </div>
      {(edges.left || edges.right) && (
        <div className="study-carousel-controls">
          <button
            type="button"
            aria-label={`Previous ${label}`}
            disabled={!edges.left}
            onClick={() => move(-1)}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            aria-label={`Next ${label}`}
            disabled={!edges.right}
            onClick={() => move(1)}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
