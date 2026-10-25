import React from 'react';

interface AppBadgeProps {
  onIosClick?: () => void;
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
        <span className="text-[10px] uppercase tracking-wider text-slate-300 font-normal">GET IT ON</span>
        <span className="text-sm font-semibold tracking-tight text-white mt-0.5">Google Play</span>
      </div>
    </a>
  );
};

export const AppStoreBadge: React.FC<AppBadgeProps> = ({ onIosClick, className = '', size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-10 px-3.5 py-1.5 text-xs',
    md: 'h-12 px-4 py-2 text-xs',
    lg: 'h-14 px-5 py-2.5 text-sm',
  };

  return (
    <button
      type="button"
      onClick={onIosClick}
      aria-label="Download Practice Koro on Apple App Store"
      className={`inline-flex items-center gap-2.5 bg-black hover:bg-slate-900 active:scale-95 text-white rounded-xl font-medium shadow-md transition-all border border-slate-700/60 group cursor-pointer ${sizeClasses[size]} ${className}`}
    >
      {/* Official Apple Logo vector */}
      <svg className="w-6 h-6 flex-shrink-0 fill-current text-white" viewBox="0 0 24 24">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.85-.9.04-2 .6-2.64 1.35-.56.65-1.06 1.71-.93 2.73 1.01.08 2.05-.51 2.65-1.23z" />
      </svg>
      <div className="flex flex-col text-left leading-none">
        <span className="text-[10px] text-slate-300 font-normal">Download on the</span>
        <span className="text-sm font-semibold tracking-tight text-white mt-0.5">App Store</span>
      </div>
    </button>
  );
};
