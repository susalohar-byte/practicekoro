import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { GoogleIcon } from '@/components/common/GoogleIcon';
import { Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { mapAuthError } from '@/lib/errors';

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const routeState = location.state as {
    from?: { pathname?: string };
    adminRequired?: boolean;
  } | null;
  const from = routeState?.from?.pathname;
  const isFromAdmin = Boolean(from && from.startsWith('/admin'));

  useEffect(() => {
    if (routeState?.adminRequired) {
      setError('This account does not have access to the admin panel.');
    }
  }, [routeState?.adminRequired]);

  // Catch any OAuth redirect error parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorDesc = params.get('error_description') || params.get('error');
    if (errorDesc) {
      // URLSearchParams already decodes percent escapes and plus signs.
      setError(errorDesc);
    }
  }, [location.search]);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);

    const redirectPath = isFromAdmin ? from! : '/admin';
    const redirectDest = `${window.location.origin}${redirectPath}`;

    const res = await loginWithGoogle(redirectDest);
    setIsGoogleLoading(false);

    if (res.error) {
      setError(mapAuthError(res.error, 'Google sign-in failed. Please try again.'));
    } else {
      // In demo mode or if session was resolved synchronously without page reload
      const dest = redirectPath;
      navigate(dest, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(email, password);
    setIsLoading(false);

    if (res.error) {
      setError(mapAuthError(res.error, 'Sign-in failed. Please try again.'));
    } else {
      // Admin role is determined exclusively from the database
      if (res.role === 'admin') {
        const adminDest = from && from !== '/' && from !== '/login' ? from : '/admin';
        navigate(adminDest, { replace: true });
      } else {
        setError('This account does not have access to the admin panel.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/admin" className="inline-flex items-center justify-center mb-3">
          <img
            src="/logo-transparent.png"
            alt="PracticeKoro"
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </Link>
        <h2 className="text-xl font-black text-pk-navy">Admin sign in</h2>
        <p className="mt-1 text-xs text-slate-500">PracticeKoro administration</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-slate-200 sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* 1-Click Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            ) : (
              <GoogleIcon className="w-5 h-5" />
            )}
            <span>Continue with Google</span>
          </button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                Or continue with email
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              placeholder="aspirant@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold uppercase tracking-wider text-slate-600"
                >
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-pk-primary hover:text-pk-primary-interactive transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
