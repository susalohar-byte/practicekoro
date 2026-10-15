export const MOTION = {
  fast: 150,
  base: 200,
  page: 220,
  exit: 120,
  easeOut: 'cubic-bezier(0.22, 1, 0.36, 1)',
} as const;

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

/**
 * Plays a short fade-up on an already-mounted element without remounting it.
 * No fill mode, so the element keeps its own styles once the animation ends.
 */
export function playEnter(el: HTMLElement | null, offsetY = 4): void {
  if (!el || typeof el.animate !== 'function' || prefersReducedMotion()) return;
  el.animate(
    [
      { opacity: 0, transform: `translateY(${offsetY}px)` },
      { opacity: 1, transform: 'none' },
    ],
    { duration: MOTION.page, easing: MOTION.easeOut }
  );
}
