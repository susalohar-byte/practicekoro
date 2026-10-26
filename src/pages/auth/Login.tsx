import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/common/GoogleIcon';
import { Lock, Mail, ArrowRight, Loader2, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { mapAuthError } from '@/lib/errors';
import { openStudentPanel, studentPanelUrl } from '@/lib/studentPanel';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/** Yellow brush stroke under the headline. */
const BrushUnderline: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 340 24" className={className} aria-hidden fill="none">
    <path d="M6 17C70 7 170 4 334 9" stroke="#FACC15" strokeWidth="7" strokeLinecap="round" />
    <path
      d="M60 21C130 15 210 14 300 16"
      stroke="#FACC15"
      strokeWidth="3.5"
      strokeLinecap="round"
      opacity="0.8"
    />
  </svg>
);

/** Two short yellow "spark" strokes beside the headline's question mark. */
const Sparks: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none">
    <path d="M10 26L16 8" stroke="#FACC15" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M18 32L34 25" stroke="#FACC15" strokeWidth="4.5" strokeLinecap="round" />
  </svg>
);

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // A student account signed in: the Student Web Panel is opening.
  const [openingStudentPanel, setOpeningStudentPanel] = useState(false);

  const routeState = location.state as { from?: { pathname?: string } } | null;
  const from = routeState?.from?.pathname;
  const isFromAdmin = Boolean(from && from.startsWith('/admin'));

  // Catch any OAuth redirect error parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const errorDesc = params.get('error_description') || params.get('error');
    if (errorDesc) {
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
      navigate(redirectPath, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = email.trim();
    if (!id || !password) {
      setError('Please enter both email and password.');
      return;
    }
    // Accounts sign in with their email; phone sign-in is not enabled on the server.
    if (!EMAIL_RE.test(id)) {
      setError(
        /^[+\d][\d\s-]{6,}$/.test(id)
          ? 'Phone number sign-in is not available yet. Please use your email address.'
          : 'Please enter a valid email address.'
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(id, password);
    setIsLoading(false);

    if (res.error) {
      setError(mapAuthError(res.error, 'Sign-in failed. Please try again.'));
    } else if (res.role === 'admin') {
      const adminDest = from && from !== '/' && from !== '/login' ? from : '/admin';
      navigate(adminDest, { replace: true });
    } else {
      // One login for everyone: student accounts continue to the Student Web Panel.
      setOpeningStudentPanel(true);
      openStudentPanel('home');
    }
  };

  const inputClass =
    'h-[54px] w-full rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] pl-12 text-[15px] text-[#0F172A] placeholder:text-slate-400 outline-none transition focus:border-[#1F5BFF] focus:ring-4 focus:ring-blue-500/10';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B0F1E] font-sans">
      {/* The landing page's hero photo, with a soft dark blur on the left behind the headline */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/images/landing/hero_student_room_sm.webp')] bg-cover bg-[30%_center] sm:bg-[url('/images/landing/hero_student_room.webp')] lg:bg-[center_40%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 backdrop-blur-[3px] [mask-image:radial-gradient(ellipse_at_16%_24%,#000_0%,#000_25%,transparent_50%)]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[#060914]/45 lg:bg-transparent lg:bg-[radial-gradient(ellipse_at_16%_24%,rgba(3,5,14,0.95)_0%,rgba(3,5,14,0.72)_26%,rgba(3,5,14,0.18)_52%,rgba(3,5,14,0.05)_75%)]"
      />

      <div className="relative grid min-h-screen items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,485px)] lg:gap-12 lg:pl-[6%] lg:pr-[8.5%]">
        {/* Left: headline (desktop) */}
        <section className="hidden self-start pt-[14.5vh] text-center lg:block lg:w-[62%]">
          <h1 className="font-['Li_Subha_Letterpress_Unicode','Anek_Bangla',sans-serif] text-[clamp(48px,4.4vw,74px)] leading-[1.08] [text-shadow:0_4px_24px_rgba(0,0,0,0.6)]">
            <span className="block text-white [-webkit-text-stroke:2px_#FFFFFF]">আবারও</span>
            <span className="relative inline-block bg-gradient-to-r from-[#3FD0FF] via-[#2FA8FF] to-[#3C78FF] bg-clip-text text-transparent [-webkit-text-stroke:2px_#33B4FF] [text-shadow:none]">
              প্রস্তুতির পথে?
              <BrushUnderline className="absolute -bottom-4 left-[8%] w-[92%]" />
              <Sparks className="absolute -right-11 -top-4 h-11 w-11" />
            </span>
          </h1>
          <p className="mt-9 text-[clamp(18px,1.45vw,24px)] font-medium leading-snug text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
            Practice Koro-র সাথে
            <br />
            প্রতিদিন একটু করে এগিয়ে চলুন।
          </p>
        </section>

        {/* Right: sign-in card */}
        <section className="mx-auto w-full max-w-[485px] rounded-[28px] bg-[#FFFFFF] px-6 py-8 lg:mt-20 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:px-10 sm:pb-7 sm:pt-8">
          <Link
            to="/"
            className="mx-auto flex w-fit items-center gap-2.5"
            aria-label="PracticeKoro home"
          >
            <img src="/logo-icon.png" alt="" className="h-10 w-10 rounded-xl object-cover" />
            <span className="text-[24px] font-bold tracking-tight">
              <span className="text-[#0B1446]">Practice</span>
              <span className="text-[#1F5BFF]">Koro</span>
            </span>
          </Link>

          <div className="mt-5 text-center">
            <h2 className="text-[34px] font-extrabold leading-tight tracking-tight sm:text-[40px]">
              <span className="text-[#0B1446]">Welcome </span>
              <span className="text-[#1F5BFF]">Back!</span>
            </h2>
            <p className="mt-2 font-headline text-[15px] font-medium text-[#475569]">
              আপনার প্রস্তুতির যাত্রা এখান থেকে আবার শুরু করুন।
            </p>
          </div>

          {openingStudentPanel ? (
            <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F5BFF]" />
              <p className="text-sm font-semibold text-[#334155]">Opening your student panel…</p>
              <a
                href={studentPanelUrl('home')}
                className="text-sm font-bold text-[#1F5BFF] hover:underline"
              >
                Continue to the student panel
              </a>
            </div>
          ) : (
            <>
              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading || isLoading}
                className="mt-7 flex h-[56px] w-full items-center justify-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] text-[16px] font-semibold text-[#1E293B] shadow-[0_2px_8px_rgba(15,23,42,0.06)] transition hover:border-[#CBD5E1] hover:bg-[#F8FAFC] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-[#64748B]" />
                ) : (
                  <GoogleIcon className="h-6 w-6" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="my-[18px] flex items-center gap-6 text-[13px] font-medium text-[#64748B]">
                <span className="h-px flex-1 bg-[#E2E8F0]" />
                OR
                <span className="h-px flex-1 bg-[#E2E8F0]" />
              </div>

              <form className="space-y-3" onSubmit={handleSubmit} noValidate>
                <div className="relative">
                  <label htmlFor="login-id" className="sr-only">
                    Email or Phone Number
                  </label>
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
                  <input
                    id="login-id"
                    type="text"
                    inputMode="email"
                    autoComplete="username"
                    placeholder="Email or Phone Number"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <div className="relative">
                    <label htmlFor="password" className="sr-only">
                      Password
                    </label>
                    <Lock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#64748B]" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-[#64748B] hover:text-[#1E293B]"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-4 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-[14px] font-semibold text-[#1F5BFF] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="!mt-4 flex h-[60px] w-full items-center justify-center gap-2.5 rounded-xl bg-[#0B5CFF] text-[17px] font-semibold text-white shadow-[0_12px_28px_rgba(11,92,255,0.35)] transition hover:bg-[#0A4FDB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-label="Signing in" />
                  ) : null}
                  <span>Sign In</span>
                  {!isLoading && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>

              <p className="mt-5 text-center text-[14px] text-[#475569]">
                Don&apos;t have an account?{' '}
                <a
                  href={studentPanelUrl('signup')}
                  className="ml-1 font-bold text-[#1F5BFF] hover:underline"
                >
                  Sign Up
                </a>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
