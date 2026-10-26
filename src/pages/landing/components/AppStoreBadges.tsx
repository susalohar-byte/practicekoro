import React from 'react';

interface AppBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GooglePlayBadge: React.FC<AppBadgeProps> = ({ className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-10 px-3.5 py-1.5 text-xs',
    md: 'h-12 px-4 py-2 text-xs',
    lg: 'h-14 px-5 py-2.5 text-sm',
  };

  return (
    <a
      href="/PracticeKoro.apk"
      download="PracticeKoro.apk"
      aria-label="Download Practice Koro for Android on Google Play"
      className={`inline-flex items-center gap-2.5 bg-black hover:bg-slate-900 active:scale-95 text-white rounded-xl font-medium shadow-md transition-all border border-slate-700/60 group cursor-pointer ${sizeClasses[size]} ${className}`}
    >
      {/* Official Google Play multicolor icon vector */}
      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none">
        <path
          d="M3.609 1.814L13.792 12 3.61 22.186A2.213 2.213 0 0 1 3 20.627V3.373c0-.613.226-1.176.609-1.559z"
          fill="#00E5FF"
        />
        <path
          d="M17.158 8.634L5.19 1.733c-.534-.308-1.096-.282-1.581.081L13.792 12l3.366-3.366z"
          fill="#00F076"
        />
        <path
          d="M3.609 22.186c.485.363 1.047.389 1.581.081l11.968-6.901-3.366-3.366L3.609 22.186z"
          fill="#FF3A44"
        />
        <path
          d="M20.67 10.638l-3.512-2.004L13.792 12l3.366 3.366 3.512-2.004c1.006-.574 1.006-1.516 0-2.09l-.001-.001-.001-.001l.002-.001.002-.001.001-.001.001-.001z"
          fill="#FFC400"
        />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[10px] uppercase tracking-wider text-slate-300 font-normal">
          GET IT ON
        </span>
        <span className="text-sm font-semibold tracking-tight text-white mt-0.5">Google Play</span>
      </div>
    </a>
  );
};
