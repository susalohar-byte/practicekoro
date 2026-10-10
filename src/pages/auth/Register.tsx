import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { GoogleIcon } from '@/components/common/GoogleIcon';
import {
  Lock,
  Mail,
  User,
  ArrowRight,
  Loader2,
  CheckCircle2,
  MapPin,
  ChevronDown,
} from 'lucide-react';
import { mapAuthError } from '@/lib/errors';
import { WEST_BENGAL_DISTRICTS } from '@/data/districts';

export const Register: React.FC = () => {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const handleGoogleRegister = async () => {
    setIsGoogleLoading(true);
    setError(null);

    const res = await loginWithGoogle(`${window.location.origin}/dashboard`);
    setIsGoogleLoading(false);

    if (res.error) {
      setError(res.error.message);
    } else {
      navigate('/dashboard', { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password || !district) {
      setError('Please fill in all required fields including your district.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await register(fullName.trim(), email.trim(), password, district);
    setIsLoading(false);

    if (res.error) {
      setError(mapAuthError(res.error, 'Registration failed. Please try again.'));
    } else if (res.needsConfirmation) {
      // Email confirmation required: do NOT navigate — show inbox guidance.
      setRegisteredEmail(email.trim());
    } else {
      // Registration always creates student accounts; admin is DB-only
      if (res.role === 'admin') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center justify-center mb-3">
          <img
            src="/logo-transparent.png"
            alt="PracticeKoro"
            className="h-11 sm:h-12 w-auto object-contain"
          />
        </Link>
        <h2 className="text-xl font-black text-pk-navy">Create your student account</h2>
        <p className="mt-1 text-xs text-slate-500">Start practicing high-yield mock tests today</p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 shadow-xs rounded-2xl border border-slate-200 sm:px-10">
          {registeredEmail ? (
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-pk-navy">Verify your email</h3>
              <p className="text-xs text-slate-500 mt-2 mb-6 leading-relaxed">
                We sent a verification link to <strong>{registeredEmail}</strong>. Click the link in
                your inbox, then sign in to start practicing.
              </p>
              <Button onClick={() => navigate('/login')} className="w-full">
                Go to Sign In
              </Button>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {error}
                </div>
              )}

              {/* 1-Click Google Sign Up */}
              <button
                type="button"
                onClick={handleGoogleRegister}
                disabled={isGoogleLoading || isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-2.5 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                ) : (
                  <GoogleIcon className="w-5 h-5" />
                )}
                <span>Sign up with Google</span>
              </button>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-3 text-slate-400 font-medium">
                    Or register with email
                  </span>
                </div>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <Input
                  label="Full Name"
                  placeholder="e.g. Subir Ghosh"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  leftIcon={<User className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="aspirant@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-4 h-4" />}
                  required
                />

                <Input
                  label="Create Password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-4 h-4" />}
                  required
                />

                {/* Mandatory West Bengal District Selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    District (West Bengal) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      required
                      aria-label="Select your district in West Bengal"
                      className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-9 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#0158FC] focus:outline-none focus:ring-2 focus:ring-blue-500/20 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>
                        Select your District (Mandatory)
                      </option>
                      {WEST_BENGAL_DISTRICTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Required for district-wise rank &amp; leaderboard standing
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  isLoading={isLoading}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Sign Up Free
                </Button>
              </form>

              <div className="mt-6 text-center text-xs text-slate-600">
                Already have an account?{' '}
                <Link
                  to="/login"
                  className="font-bold text-pk-primary hover:text-pk-primary-interactive transition-colors"
                >
                  Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
