import { describe, expect, it } from 'vitest';
import { AppError, friendlyAuthError, friendlyError, isProLockedError } from './errors';

describe('friendlyError', () => {
  it('passes AppError messages through unchanged', () => {
    expect(friendlyError(new AppError('Exact copy'))).toBe('Exact copy');
  });

  it('maps server codes and messages to student copy', () => {
    expect(friendlyError({ code: '40300', message: 'x' })).toBe(
      'This test is part of PracticeKoro Pro. Upgrade to unlock it.'
    );
    expect(friendlyError({ message: 'Requires an active Pro Pass' })).toMatch(/PracticeKoro Pro/);
    expect(friendlyError({ code: '40400' })).toBe('This test is not available right now.');
    expect(friendlyError({ message: 'Test not found' })).toBe(
      'This test is not available right now.'
    );
    expect(friendlyError({ code: '40100' })).toBe('Please log in again to continue.');
    expect(friendlyError(new TypeError('Failed to fetch'))).toBe(
      'Could not reach the server. Check your internet and try again.'
    );
    expect(friendlyError({ message: 'NetworkError when attempting' })).toMatch(
      /Could not reach the server/
    );
  });

  it('falls back to the raw message, then to the fallback', () => {
    expect(friendlyError({ message: 'Duplicate key' })).toBe('Duplicate key');
    expect(friendlyError(null)).toBe('Something went wrong. Please try again.');
    expect(friendlyError(undefined, 'Custom fallback')).toBe('Custom fallback');
  });
});

describe('isProLockedError', () => {
  it('needs both the 40300 code and a Pro Pass message', () => {
    expect(isProLockedError({ code: '40300', message: 'Pro pass required' })).toBe(true);
    expect(isProLockedError({ code: '40300', message: 'Forbidden' })).toBe(false);
    expect(isProLockedError({ message: 'pro pass required' })).toBe(false);
    expect(isProLockedError(null)).toBe(false);
  });
});

describe('friendlyAuthError', () => {
  it.each([
    ['Invalid login credentials', 'Incorrect email or password.'],
    ['Email not confirmed', 'Please confirm your email first. Check your inbox for the link.'],
    ['User already registered', 'An account with this email already exists. Please log in.'],
    [
      'A user with this email address has already been registered',
      'An account with this email already exists. Please log in.',
    ],
    ['Password should be at least 6 characters', 'Password must be at least 6 characters.'],
    ['Email rate limit exceeded', 'Too many attempts. Please wait a minute and try again.'],
    ['Failed to fetch', 'No internet connection. Please check your network.'],
    ['Something odd', 'Something odd'],
  ])('maps "%s"', (message, expected) => {
    expect(friendlyAuthError({ message })).toBe(expected);
  });

  it('has a generic message for empty errors', () => {
    expect(friendlyAuthError(undefined)).toBe('Something went wrong. Please try again.');
  });
});
