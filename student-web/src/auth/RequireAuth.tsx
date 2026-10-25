import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { FullPageLoader } from '@/components/ui/Feedback';
import { ADMIN_CONSOLE_URL, isAdminAccount } from '@/lib/adminConsole';

/** Login is required everywhere except the auth screens (same rule as the app router). */
export function RequireAuth() {
  const { user, loading, recovery } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (recovery) return <Navigate to="/reset-password" replace />;
  if (!user) {
    const next = location.pathname + location.search;
    return <Navigate to={`/login${next && next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`} replace />;
  }
  return <Outlet />;
}

/**
 * Signed-in accounts skip the login/sign-up screens: admins (staff) go to the admin console,
 * everyone else into the panel.
 */
export function GuestOnly() {
  const { user, loading, recovery } = useAuth();
  const location = useLocation();
  const [admin, setAdmin] = useState<boolean | null>(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setAdmin(null);
      return;
    }
    let live = true;
    isAdminAccount(userId)
      .then((a) => live && setAdmin(a))
      .catch(() => live && setAdmin(false));
    return () => {
      live = false;
    };
  }, [userId]);

  useEffect(() => {
    if (admin) window.location.replace(ADMIN_CONSOLE_URL);
  }, [admin]);

  if (loading) return <FullPageLoader />;
  if (recovery) return <Navigate to="/reset-password" replace />;
  if (user) {
    if (admin === null || admin) return <FullPageLoader />;
    const next = new URLSearchParams(location.search).get('next');
    return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/home'} replace />;
  }
  return <Outlet />;
}
