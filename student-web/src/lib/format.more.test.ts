import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fmtDate,
  fmtDateLong,
  fmtSchedule,
  fmtTime,
  greeting,
  initials,
  inr,
  num,
  relativeTime,
} from './format';

afterEach(() => vi.useRealTimers());

describe('num', () => {
  it('parses numbers and numeric strings, rejecting the rest', () => {
    expect(num(5)).toBe(5);
    expect(num('0.25')).toBe(0.25);
    expect(num('')).toBeNull();
    expect(num(null)).toBeNull();
    expect(num(undefined)).toBeNull();
    expect(num('abc')).toBeNull();
    expect(num(Number.NaN)).toBeNull();
    expect(num(Infinity)).toBeNull();
    expect(num(0)).toBe(0);
  });
});

describe('dates and times', () => {
  it('formats short and long dates, ignoring empty or invalid input', () => {
    const d = new Date(2026, 9, 5, 14, 7);
    expect(fmtDate(d)).toBe('5 Oct 2026');
    expect(fmtDateLong(d)).toBe('5 October 2026');
    expect(fmtDate(null)).toBe('');
    expect(fmtDate('not a date')).toBe('');
    expect(fmtDateLong(undefined)).toBe('');
  });

  it('formats 12-hour clock times', () => {
    expect(fmtTime(new Date(2026, 0, 1, 0, 5))).toBe('12:05 AM');
    expect(fmtTime(new Date(2026, 0, 1, 12, 0))).toBe('12:00 PM');
    expect(fmtTime(new Date(2026, 0, 1, 16, 30))).toBe('4:30 PM');
  });

  it('labels schedules as today, tomorrow or a date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 25, 9, 0));
    expect(fmtSchedule(null)).toBe('Schedule Announced Soon');
    expect(fmtSchedule(new Date(2026, 9, 25, 16, 0))).toBe('Today, 4:00 PM');
    expect(fmtSchedule(new Date(2026, 9, 26, 9, 30))).toBe('Tomorrow, 9:30 AM');
    expect(fmtSchedule(new Date(2026, 10, 12, 16, 0))).toBe('12 Nov, 4:00 PM');
  });

  it('describes relative times', () => {
    vi.useFakeTimers();
    const now = new Date(2026, 9, 25, 12, 0);
    vi.setSystemTime(now);
    const ago = (s: number) => new Date(now.getTime() - s * 1000);
    expect(relativeTime(ago(30))).toBe('Just now');
    expect(relativeTime(ago(5 * 60))).toBe('5m ago');
    expect(relativeTime(ago(3 * 3600))).toBe('3h ago');
    expect(relativeTime(ago(2 * 86400).toISOString())).toBe('2d ago');
    expect(relativeTime(new Date(2026, 8, 1))).toBe('1 Sep 2026');
  });
});

describe('text helpers', () => {
  it('formats rupees with Indian grouping', () => {
    expect(inr(499)).toBe('₹499');
    expect(inr(125000.4)).toBe('₹1,25,000');
  });

  it('greets by time of day', () => {
    expect(greeting(new Date(2026, 0, 1, 8))).toBe('Good Morning');
    expect(greeting(new Date(2026, 0, 1, 12))).toBe('Good Afternoon');
    expect(greeting(new Date(2026, 0, 1, 17))).toBe('Good Evening');
  });

  it('takes the first and last initials', () => {
    expect(initials('susanta kumar lohar')).toBe('SL');
    expect(initials('  Ria ')).toBe('R');
    expect(initials('')).toBe('S');
  });
});
