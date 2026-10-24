import { describe, expect, it } from 'vitest';
import { isAdminEmail, ADMIN_EMAILS } from './authPolicy';

describe('authentication policy', () => {
  it('defines trusted admin emails', () => {
    expect(ADMIN_EMAILS).toContain('admin@practicekoro.online');
    expect(ADMIN_EMAILS).not.toContain('susalohar@gmail.com');
    expect(ADMIN_EMAILS).not.toContain('admin@practicekoro.com');
  });

  it('blocks non-admin or partial admin matches', () => {
    expect(isAdminEmail(null)).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
    expect(isAdminEmail('')).toBe(false);
    expect(isAdminEmail('admin@practicekoro.com')).toBe(false);
    expect(isAdminEmail('not-admin@example.com')).toBe(false);
    expect(isAdminEmail('admin.attacker@example.com')).toBe(false);
    expect(isAdminEmail('admin@practicekoro.online.fake')).toBe(false);
    expect(isAdminEmail('student@practicekoro.online')).toBe(false);
    expect(isAdminEmail('susalohar@gmail.com')).toBe(false);
  });

  it('accepts authorized admin emails case-insensitively', () => {
    expect(isAdminEmail('admin@practicekoro.online')).toBe(true);
    expect(isAdminEmail('ADMIN@PRACTICEKORO.ONLINE')).toBe(true);
    expect(isAdminEmail('  admin@practicekoro.online  ')).toBe(true);
  });
});
