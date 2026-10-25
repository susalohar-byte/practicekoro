import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';

/** Finishes Google, email-confirmation and password-reset links (supabase-js reads the URL). */
export default function AuthCallbackPage() {
  const { user, recovery } = useAuth();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 8000);
    return () => clearTimeout(t);
  }, []);

  if (recovery) return <Navigate to="/reset-password" replace />;
  // /login decides where a signed-in account goes (admin console or panel).
  if (user) return <Navigate to="/login" replace />;
  if (timedOut) return <Navigate to="/login" replace />;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-page" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-base font-semibold text-ink">Completing sign-in...</p>
    </div>
  );
}
