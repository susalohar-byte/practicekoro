import React, { useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  X,
  Maximize2,
  ExternalLink,
  Image as ImageIcon,
} from 'lucide-react';

export interface QuestionImageProps {
  /** The image URL or data URL. If undefined or null, nothing is rendered. */
  src?: string | null;
  /** Alt text for accessibility. Defaults to "Question figure" */
  alt?: string;
  /** Custom wrapper CSS class */
  className?: string;
  /** Custom max height CSS class (defaults to "max-h-64 sm:max-h-80") */
  maxHeightClass?: string;
  /** Whether to show the hover hint badge "Click to enlarge" */
  showEnlargeHint?: boolean;
  /** Priority loading for above-the-fold or active question */
  priority?: boolean;
}

/**
 * QuestionImage
 *
 * Global, resilient component for displaying figures, diagrams, and illustrations
 * across all question types (Topic, Mock, PYQ, Practice, Saved Questions).
 *
 * Key features:
 * - Responsive container adapting to mobile & desktop viewports
 * - Silent error suppression (if the image fails to load, renders null so NO broken image icons appear)
 * - Click-to-enlarge Lightbox modal with zoom controls (In, Out, Reset), full screen view, and Escape key listener
 * - Zero layout shift or DOM pollution when src is absent
 */
export const QuestionImage: React.FC<QuestionImageProps> = ({
  src,
  alt = 'Question figure',
  className = '',
  maxHeightClass = 'max-h-64 sm:max-h-80',
  showEnlargeHint = true,
  priority = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Reset states if src changes
  useEffect(() => {
    setHasError(false);
    setIsLoaded(false);
    setIsLightboxOpen(false);
    setZoomLevel(1);
  }, [src]);

  // Handle Escape key to close lightbox
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsLightboxOpen(false);
    }
  }, []);

  useEffect(() => {
    if (isLightboxOpen) {
      window.addEventListener('keydown', handleKeyDown);
      // Lock scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isLightboxOpen, handleKeyDown]);

  if (!src || !src.trim() || hasError) {
    return null;
  }

  const cleanSrc = src.trim();

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = (e: React.MouseEvent) => {
    e.stopPropagation();
    setZoomLevel(1);
  };

  return (
    <>
      <div className={`my-3 sm:my-4 w-full flex justify-center ${className}`}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            setZoomLevel(1);
            setIsLightboxOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setZoomLevel(1);
              setIsLightboxOpen(true);
            }
          }}
          aria-label="Click to enlarge question image"
          className="group relative cursor-pointer inline-block max-w-full rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 shadow-xs transition-all hover:shadow-md hover:border-indigo-400 dark:hover:border-indigo-500/50"
        >
          {/* Subtle loading placeholder */}
          {!isLoaded && !hasError && (
            <div className="w-48 sm:w-64 h-36 flex items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-400 animate-pulse">
              <ImageIcon className="w-6 h-6 animate-pulse" />
            </div>
          )}

          <img
            src={cleanSrc}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            onLoad={() => setIsLoaded(true)}
            onError={() => setHasError(true)}
            className={`w-auto mx-auto object-contain rounded-xl transition-all duration-200 group-hover:scale-[1.01] ${maxHeightClass} ${
              isLoaded ? 'block' : 'hidden'
            }`}
          />

          {/* Hover hint badge */}
          {showEnlargeHint && isLoaded && (
            <div className="absolute bottom-3 right-3 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/85 backdrop-blur-xs text-white text-[11px] font-semibold shadow-md pointer-events-none">
                <Maximize2 className="w-3 h-3 text-indigo-300" />
                <span>Enlarge</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {isLightboxOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Question Image Fullscreen View"
          onClick={() => setIsLightboxOpen(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-6 animate-in fade-in duration-200 select-none"
        >
          {/* Top Bar Controls */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl flex items-center justify-between gap-3 text-white py-2 px-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 shadow-lg"
          >
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                <ImageIcon className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-200">Question Figure</span>
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                ({Math.round(zoomLevel * 100)}%)
              </span>
            </div>

            {/* Zoom & Action Controls */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
                title="Zoom Out (-25%)"
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset Zoom (100%)"
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
                title="Zoom In (+25%)"
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-white/20 mx-1" />

              <a
                href={cleanSrc}
                target="_blank"
                rel="noopener noreferrer"
                title="Open original in new tab"
                className="p-1.5 sm:p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
              >
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                title="Close (Esc)"
                className="p-1.5 sm:p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-all ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Centered Image Viewport */}
          <div
            onClick={(e) => {
              // Click inside viewport toggles 1x/1.5x zoom or stops propagation
              e.stopPropagation();
            }}
            className="flex-1 w-full max-w-5xl flex items-center justify-center p-2 sm:p-4 overflow-auto"
          >
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out',
              }}
              className="max-w-full max-h-[75vh] flex items-center justify-center"
            >
              <img
                src={cleanSrc}
                alt={alt}
                className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl bg-white dark:bg-slate-900 border border-white/10"
              />
            </div>
          </div>

          {/* Bottom Hint */}
          <div className="text-[11px] text-slate-400 py-1 text-center font-medium">
            Tap outside or press{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[10px]">
              Esc
            </kbd>{' '}
            to close
          </div>
        </div>
      )}
    </>
  );
};
