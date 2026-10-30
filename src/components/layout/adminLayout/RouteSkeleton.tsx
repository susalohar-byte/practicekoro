import React, { useEffect } from 'react';
import { AdminRouteSkeleton } from '@/components/admin/AdminSkeleton';
import { playPageEnter } from '@/lib/motion';

/**
 * Skeleton shown while a page's code loads. When it goes away the real page
 * has just mounted, so the page transition plays again for it; otherwise a
 * first visit would animate only the skeleton and then pop the page in.
 */
export const RouteSkeleton: React.FC<{ contentRef: React.RefObject<HTMLDivElement | null> }> = ({
  contentRef,
}) => {
  useEffect(() => () => playPageEnter(contentRef.current), [contentRef]);
  return <AdminRouteSkeleton />;
};
