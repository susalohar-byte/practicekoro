import { useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, CheckCircle2, Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Wordmark } from '@/components/ui/Brand';

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateEmail(v: string): string | null {
  const t = v.trim();
  if (!t) return 'Enter your email';
  if (!EMAIL_RE.test(t)) return 'Enter a valid email address';
  return null;
}

export function validatePassword(v: string): string | null {
  if (!v) return 'Enter your password';
  if (v.length < 6) return 'Password must be at least 6 characters';
  return null;
}

/** _AuthScaffold: centred card with the brand mark, title and subtitle; a brand panel on wide screens. */
export function AuthLayout({
  title,
  subtitle,
  back,
  children,
}: {
  title: string;
  subtitle: string;
  back?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-white">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-hero p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" aria-hidden />
        <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-white/10" aria-hidden />
        <div className="relative inline-flex w-fit rounded-2xl bg-white px-4 py-2.5">
          <Wordmark className="h-9" />
        </div>
        <div className="relative">
          <p lang="bn" className="text-lg font-bold text-indigo-100">পশ্চিমবঙ্গের বিশ্বস্ত পরীক্ষার প্রস্তুতি</p>
          <h2 className="mt-2 text-4xl font-extrabold leading-tight tracking-tight">Practice Today,<br />Progress Tomorrow</h2>
          <p className="mt-4 max-w-sm text-[15px] text-indigo-100">
            Real exam-pattern mock tests, live tests, previous year papers and detailed Bengali explanations.
          </p>
          <p className="mt-6 inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1.5 text-[12px] font-bold tracking-wide">
            WBCS • WBP • WBPSC • SSC • RAILWAY
          </p>
        </div>
        <p className="relative text-[13px] text-indigo-100">Trusted by aspirants across all 23 districts of West Bengal.</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-10">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" aria-hidden />
        <div className="relative w-full max-w-[420px]">
          {back && (
            <Link to={back} aria-label="Back" className="mb-6 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-ink hover:bg-line">
              <ArrowLeft className="h-[18px] w-[18px]" />
            </Link>
          )}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[18px] border border-[#E2E8F0] bg-white shadow-[0_8px_20px_rgba(31,72,232,0.08)]">
              <img src={`${import.meta.env.BASE_URL}brand/logo-icon.png`} alt="PracticeKoro" className="h-12 w-12 rounded-xl" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0F172A]">{title}</h1>
            <p className="mt-1.5 text-[14px] text-[#64748B]">{subtitle}</p>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}

export function Banner({ tone, children }: { tone: 'error' | 'success'; children: ReactNode }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'mb-4 flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-[13px] font-medium',
        tone === 'error' ? 'border-[#FEE2E2] bg-[#FEF2F2] text-danger' : 'border-[#DCFCE7] bg-[#F0FDF4] text-success'
      )}
    >
      {tone === 'error' ? <AlertCircle className="mt-px h-[18px] w-[18px] shrink-0" /> : <CheckCircle2 className="mt-px h-[18px] w-[18px] shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon: ReactNode;
  error?: string | null;
}

export function Field({ label, icon, error, id, className, ...rest }: FieldProps) {
  const fid = id ?? rest.name ?? label;
  return (
    <div className={cn('mb-3.5', className)}>
      <label htmlFor={fid} className="mb-1.5 block text-[13px] font-semibold text-[#475569]">
        {label}
      </label>
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] [&>svg]:h-5 [&>svg]:w-5">{icon}</span>
        <input
          id={fid}
          aria-invalid={!!error}
          aria-describedby={error ? `${fid}-err` : undefined}
          className={cn(
            'h-[52px] w-full rounded-card border-[1.2px] bg-[#F8FAFC] pl-11 pr-4 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/15',
            error ? 'border-[#EF4444]' : 'border-[#E2E8F0]'
          )}
          {...rest}
        />
      </div>
      {error && (
        <p id={`${fid}-err`} className="mt-1 text-[12.5px] font-medium text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField(props: Omit<FieldProps, 'icon' | 'type'>) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Field {...props} type={show ? 'text' : 'password'} icon={<Lock />} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-[34px] flex h-9 w-9 items-center justify-center rounded-full text-[#94A3B8] hover:text-ink"
      >
        {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
      </button>
    </div>
  );
}

export function SubmitButton({ loading, children }: { loading: boolean; children: ReactNode }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-2 flex h-[52px] w-full items-center justify-center rounded-card bg-primary text-[15px] font-semibold text-white shadow-[0_8px_16px_rgba(31,72,232,0.22)] hover:bg-primary-dark disabled:opacity-60"
    >
      {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-label="Please wait" /> : children}
    </button>
  );
}

export function GoogleButton({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="flex h-[52px] w-full items-center justify-center gap-3 rounded-card border-[1.2px] border-[#E2E8F0] bg-white text-[15px] font-semibold text-[#1E293B] hover:bg-[#F8FAFC] disabled:opacity-60"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-[#64748B]" />
      ) : (
        <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
        </svg>
      )}
      {label}
    </button>
  );
}

export function OrDivider() {
  return (
    <div className="my-5 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-muted">
      <span className="h-px flex-1 bg-line" />
      OR CONTINUE WITH EMAIL
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

export const callbackUrl = () => `${window.location.origin}${import.meta.env.BASE_URL}login-callback`;
