/** A message that is safe and useful to show to a student. */
export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AppError';
  }
}

type PgLike = { code?: string; message?: string; details?: string };

/**
 * Maps Postgres/RPC errors to the same student-facing copy the Flutter app uses
 * (AttemptRepository._friendly).
 */
export function friendlyError(err: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (err instanceof AppError) return err.message;
  const e = (err ?? {}) as PgLike;
  const m = (e.message ?? '').toLowerCase();
  if (e.code === '40300' || m.includes('pro pass')) {
    return 'This test is part of PracticeKoro Pro. Upgrade to unlock it.';
  }
  if (e.code === '40400' || m.includes('not found')) return 'This test is not available right now.';
  if (e.code === '40100' || m.includes('authentication')) return 'Please log in again to continue.';
  if (m.includes('failed to fetch') || m.includes('network')) {
    return 'Could not reach the server. Check your internet and try again.';
  }
  return e.message || fallback;
}

export function isProLockedError(err: unknown): boolean {
  const e = (err ?? {}) as PgLike;
  return e.code === '40300' && (e.message ?? '').toLowerCase().includes('pro pass');
}

/** Auth error copy matching AuthRepository._friendly in the Flutter app. */
export function friendlyAuthError(err: unknown): string {
  const raw = ((err ?? {}) as PgLike).message ?? '';
  const m = raw.toLowerCase();
  if (m.includes('invalid login')) return 'Incorrect email or password.';
  if (m.includes('email not confirmed')) {
    return 'Please confirm your email first. Check your inbox for the link.';
  }
  if (m.includes('already registered') || m.includes('already been registered')) {
    return 'An account with this email already exists. Please log in.';
  }
  if (m.includes('password should be')) return 'Password must be at least 6 characters.';
  if (m.includes('rate limit')) return 'Too many attempts. Please wait a minute and try again.';
  if (m.includes('failed to fetch')) return 'No internet connection. Please check your network.';
  return raw || 'Something went wrong. Please try again.';
}
