import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { GoogleIcon } from '@/components/common/GoogleIcon';
import {
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Eye,
  EyeOff,
  AlertCircle,
  FileText,
  Target,
  FolderOpen,
  BarChart3,
} from 'lucide-react';
import { mapAuthError } from '@/lib/errors';
import { openStudentPanel, studentPanelUrl } from '@/lib/studentPanel';

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const FEATURES = [
  { label: ['Mock', 'Tests'], icon: FileText, color: '#EF4444', bg: '#FEE2E2' },
  { label: ['Topic-wise', 'Practice'], icon: Target, color: '#2563EB', bg: '#DBEAFE' },
  { label: ['Previous Year', 'Questions'], icon: FolderOpen, color: '#F59E0B', bg: '#FEF3C7' },
  { label: ['Track', 'Progress'], icon: BarChart3, color: '#16A34A', bg: '#DCFCE7' },
];

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

/** Three short yellow "spark" strokes beside "Welcome Back!". */
const Sparks: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden fill="none">
    <path d="M24 4L30 18" stroke="#FACC15" strokeWidth="5" strokeLinecap="round" />
    <path d="M6 17L19 25" stroke="#FACC15" strokeWidth="5" strokeLinecap="round" />
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
    'h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 text-[15px] text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-[#1F5BFF] focus:ring-4 focus:ring-blue-500/10';

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0B1027] font-sans">
      {/* The landing page's hero photo fills the screen; a dark wash keeps the text readable */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[url('/images/landing/hero_student_room_sm.webp')] bg-cover bg-[34%_30%] sm:bg-[url('/images/landing/hero_student_room.webp')] sm:bg-[center_35%]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[#0B1027]/55 lg:bg-gradient-to-r lg:from-[#0B1027]/85 lg:via-[#0B1027]/45 lg:to-[#0B1027]/30"
      />

      {/* Back to the landing page */}
      <Link
        to="/"
        aria-label="Home পেজে ফিরুন"
        title="Home পেজে ফিরুন"
        className="absolute left-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/90 text-slate-700 shadow-sm backdrop-blur-sm transition-colors hover:text-blue-600 sm:left-6 sm:top-6"
      >
        <ArrowLeft className="h-[18px] w-[18px]" />
      </Link>

      <div className="relative mx-auto grid min-h-screen max-w-[1240px] items-center gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:gap-16 lg:px-10 lg:py-8">
        {/* Left: headline and features (desktop) */}
        <section className="hidden flex-col items-start text-left lg:flex">
          <h1 className="font-headline text-[64px] font-extrabold leading-[1.05] tracking-tight drop-shadow-[0_4px_18px_rgba(0,0,0,0.45)]">
            <span className="block text-white">আবারও</span>
            <span className="relative inline-block text-[#7FA6FF]">
              প্রস্তুতির পথে?
              <BrushUnderline className="absolute -bottom-3 left-1/2 w-[78%] -translate-x-1/2" />
            </span>
          </h1>
          <p className="mt-8 font-headline text-[22px] font-medium leading-snug text-white/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">
            Practice Koro-র সাথে
            <br />
            প্রতিদিন একটু করে এগিয়ে চলুন।
          </p>

          <ul className="mt-10 grid w-full max-w-[560px] grid-cols-4 rounded-[24px] border border-white/60 bg-white/90 px-3 py-4 shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur">
            {FEATURES.map(({ label, icon: Icon, color, bg }, i) => (
              <li
                key={label.join(' ')}
                className={`flex flex-col items-center px-2 text-center ${i > 0 ? 'border-l border-slate-200' : ''}`}
              >
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-full shadow-sm"
                  style={{ background: bg, color }}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span className="mt-2 text-[13px] font-bold leading-tight text-slate-900">
                  {label[0]}
                  <br />
                  {label[1]}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right: sign-in card */}
        <section className="mx-auto w-full max-w-[420px] rounded-[24px] border border-white/70 bg-white px-6 py-7 shadow-[0_24px_60px_rgba(0,0,0,0.35)] sm:px-8 sm:py-8">
          <Link to="/" className="mx-auto flex w-fit items-center" aria-label="PracticeKoro home">
            <img
              src="/logo-transparent.png"
              alt="PracticeKoro"
              className="h-11 w-auto object-contain"
            />
          </Link>

          <div className="relative mt-5 text-center">
            <Sparks className="absolute -left-1 -top-4 h-8 w-8" />
            <h2 className="font-headline text-[32px] font-extrabold leading-tight tracking-tight sm:text-[36px]">
              <span className="text-[#0B1446]">Welcome </span>
              <span className="text-[#1F5BFF]">Back!</span>
            </h2>
            <p className="mt-1.5 font-headline text-[15px] font-medium text-slate-600">
              আপনার প্রস্তুতির যাত্রা এখান থেকে আবার শুরু করুন।
            </p>
          </div>

          {openingStudentPanel ? (
            <div className="mt-8 flex flex-col items-center gap-3 py-6 text-center" role="status">
              <Loader2 className="h-8 w-8 animate-spin text-[#1F5BFF]" />
              <p className="text-sm font-semibold text-slate-700">Opening your student panel…</p>
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
                className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-[15px] font-semibold text-slate-800 transition hover:border-slate-400 hover:bg-slate-50 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isGoogleLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
                ) : (
                  <GoogleIcon className="h-5 w-5" />
                )}
                <span>Continue with Google</span>
              </button>

              <div className="my-5 flex items-center gap-6 text-[13px] text-slate-500">
                <span className="h-px flex-1 bg-slate-200" />
                OR
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <form className="space-y-4" onSubmit={handleSubmit} noValidate>
                <div>
                  <label
                    htmlFor="login-id"
                    className="mb-1.5 block text-[14px] font-semibold text-slate-800"
                  >
                    Email or Phone Number
                  </label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                    <input
                      id="login-id"
                      type="text"
                      inputMode="email"
                      autoComplete="username"
                      placeholder="Enter your email or phone number"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-1.5 block text-[14px] font-semibold text-slate-800"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-500" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`${inputClass} pr-12`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-slate-500 hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <div className="mt-1.5 text-right">
                    <Link
                      to="/forgot-password"
                      className="text-[13px] font-medium text-[#1F5BFF] hover:underline"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || isGoogleLoading}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-xl bg-[#0B5CFF] text-[16px] font-bold text-white shadow-[0_12px_24px_rgba(11,92,255,0.28)] transition hover:bg-[#0A4FDB] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-label="Signing in" />
                  ) : null}
                  <span>Sign In</span>
                  {!isLoading && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>

              <p className="mt-6 text-center text-[14px] text-slate-600">
                Don&apos;t have an account?{' '}
                <a
                  href={studentPanelUrl('signup')}
                  className="ml-1 font-bold text-[#1F5BFF] hover:underline"
                >
                  Create Account
                </a>
              </p>
            </>
          )}
        </section>
      </div>
    </div>
  );
};
