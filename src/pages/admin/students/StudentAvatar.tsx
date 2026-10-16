import React, { useState } from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// STUDENT AVATAR WITH BULLETPROOF FALLBACK & GOOGLE REFERRER-POLICY
// ============================================================================
export interface StudentAvatarProps {
  avatarUrl?: string;
  fullName: string;
  initials?: string;
  initialsBg?: string;
  initialsColor?: string;
  className?: string;
  textClassName?: string;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  avatarUrl,
  fullName,
  initials,
  initialsBg = 'bg-blue-100 dark:bg-blue-950/60',
  initialsColor = 'text-[#026BFC] dark:text-blue-400',
  className = 'w-7 h-7',
  textClassName = 'text-[10px]',
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Clean URL: ignore 'null', 'undefined', or empty strings
  const cleanUrl =
    avatarUrl &&
    typeof avatarUrl === 'string' &&
    avatarUrl.trim() !== '' &&
    avatarUrl.trim() !== 'null' &&
    avatarUrl.trim() !== 'undefined'
      ? avatarUrl.trim()
      : null;

  const displayInitials =
    initials ||
    fullName
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'ST';

  // If no URL or load errored, render clean initials badge directly
  if (!cleanUrl || hasError) {
    return (
      <div
        className={cn(
          'rounded-full flex items-center justify-center font-bold shrink-0 shadow-2xs border border-blue-200/60 dark:border-blue-900/40 select-none',
          className,
          initialsBg,
          initialsColor,
          textClassName
        )}
        title={fullName}
      >
        {displayInitials}
      </div>
    );
  }

  // When cleanUrl exists, render container with initials in background and image on top once loaded
  return (
    <div
      className={cn(
        'rounded-full relative flex items-center justify-center font-bold shrink-0 shadow-2xs overflow-hidden border border-blue-200/60 dark:border-blue-900/40 select-none',
        className,
        initialsBg,
        initialsColor,
        textClassName
      )}
      title={fullName}
    >
      {/* Fallback initials underneath */}
      <span className={cn('select-none', isLoaded ? 'sr-only' : '')}>
        {displayInitials}
      </span>

      <img
        src={cleanUrl}
        alt={fullName}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setHasError(true);
          setIsLoaded(false);
        }}
        className={cn(
          'absolute inset-0 w-full h-full object-cover transition-opacity duration-200',
          isLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
};
