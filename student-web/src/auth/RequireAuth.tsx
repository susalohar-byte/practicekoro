import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { FullPageLoader } from '@/components/ui/Feedback';

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

/** Signed-in students skip the login/sign-up screens. */
export function GuestOnly() {
  const { user, loading, recovery } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageLoader />;
  if (recovery) return <Navigate to="/reset-password" replace />;
  if (user) {
    const next = new URLSearchParams(location.search).get('next');
    return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/home'} replace />;
  }
  return <Outlet />;
}
