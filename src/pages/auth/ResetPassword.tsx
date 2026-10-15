import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import {
  Lock,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/errors';

export const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const code = searchParams.get('code');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isVerifyingToken, setIsVerifyingToken] = useState(Boolean(tokenHash || code));
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      if (!isSupabaseConfigured) {
        // Demo/local development fallback
        if (isMounted) {
          setIsSessionReady(true);
          setIsVerifyingToken(false);
        }
        return;
      }

      try {
        if (tokenHash) {
          const { error: verifyErr } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: (type as 'recovery') || 'recovery',
          });
          if (verifyErr) throw verifyErr;
          if (isMounted) {
            setIsSessionReady(true);
          }
        } else if (code) {
          const { error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) throw exchangeErr;
          if (isMounted) {
            setIsSessionReady(true);
          }
        } else {
          // Check if session was already established (e.g., from redirect hash)
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            if (isMounted) {
              setIsSessionReady(true);
            }
          } else {
            if (isMounted) {
              setTokenError(
                'No password reset token was found in this link. Please request a new password reset link.'
              );
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Password reset verification failed:', err);
          setTokenError(
            getErrorMessage(
              err,
              'This password reset link is invalid or has expired. Please request a new one.'
            )
          );
        }
      } finally {
        if (isMounted) {
          setIsVerifyingToken(false);
        }
      }
    };

    verifyToken();

    return () => {
      isMounted = false;
    };
  }, [tokenHash, type, code]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured) {
        const { error: updateErr } = await supabase.auth.updateUser({
          password,
        });
        if (updateErr) throw updateErr;
      }
      setIsSuccess(true);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to update your password. Please try again.'));
    } finally {
      setLoading(false);
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
        <h2 className="text-xl font-black text-pk-navy">Set New Password</h2>
        <p className="mt-1 text-xs text-slate-500">
          Create a new secure password for your PracticeKoro account
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-slate-200 sm:px-10">
          {isVerifyingToken ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-pk-primary animate-spin mx-auto mb-3" />
              <h3 className="text-sm font-bold text-pk-navy">Verifying Security Link</h3>
              <p className="text-xs text-slate-500 mt-1">
                Please wait while we validate your password reset token...
              </p>
            </div>
          ) : tokenError ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-pk-navy">Invalid or Expired Link</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6">{tokenError}</p>
              <div className="space-y-2">
                <Link to="/forgot-password" className="block w-full">
                  <Button className="w-full">Request New Reset Link</Button>
                </Link>
                <Link to="/login" className="block w-full">
                  <Button variant="outline" className="w-full">
                    Return to Login
                  </Button>
                </Link>
              </div>
            </div>
          ) : isSuccess ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-pk-navy">Password Updated Successfully!</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6">
                Your password has been changed. You can now log in using your new password.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Log In Now
              </Button>
            </div>
          ) : isSessionReady ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <div className="relative">
                <Input
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <div className="relative">
                <Input
                  label="Confirm New Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-[34px] text-slate-400 hover:text-slate-600"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <Button type="submit" className="w-full" isLoading={loading}>
                Update Password
              </Button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-pk-primary hover:text-pk-primary-interactive transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel and Return to Login
                </Link>
              </div>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};
