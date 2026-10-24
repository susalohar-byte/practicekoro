import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to provide smooth 60fps GPU-accelerated enter and exit animations
 * for modal dialogs and overlay boxes, with keyboard Escape support.
 */
export function useSmoothModal(isOpen: boolean, onClose: () => void, durationMs = 200) {
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => {
          setIsAnimating(true);
        });
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, durationMs + 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen, durationMs]);

  const handleSmoothClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, durationMs);
  }, [onClose, durationMs]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleSmoothClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleSmoothClose]);

  return {
    shouldRender,
    isAnimating,
    handleSmoothClose,
  };
}
