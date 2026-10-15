import { useEffect, useState } from 'react';
import { MOTION, prefersReducedMotion } from '@/lib/motion';

/**
 * Keeps an element mounted briefly after `open` turns false so it can play an
 * exit animation. `closing` is true during that window.
 */
export function usePresence(open: boolean, exitMs: number = MOTION.exit) {
  const [mounted, setMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setMounted(true);
      return;
    }
    if (prefersReducedMotion()) {
      setMounted(false);
      return;
    }
    const timer = setTimeout(() => setMounted(false), exitMs);
    return () => clearTimeout(timer);
  }, [open, exitMs]);

  return { mounted: open || mounted, closing: !open && mounted };
}
