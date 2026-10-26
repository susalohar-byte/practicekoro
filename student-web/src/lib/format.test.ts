import { describe, expect, it } from 'vitest';
import { compactCount, fmtClock, fmtDuration, fmtNum, ordinal } from './format';

describe('format helpers', () => {
  it('formats ranks as English ordinals', () => {
    expect(ordinal(1)).toBe('1st');
    expect(ordinal(2)).toBe('2nd');
    expect(ordinal(3)).toBe('3rd');
    expect(ordinal(11)).toBe('11th');
    expect(ordinal(22)).toBe('22nd');
    expect(ordinal(113)).toBe('113th');
    expect(ordinal(0)).toBe('-');
  });

  it('formats the countdown clock', () => {
    expect(fmtClock(65)).toBe('01:05');
    expect(fmtClock(3725)).toBe('01:02:05');
    expect(fmtClock(-4)).toBe('00:00');
  });

  it('formats durations and numbers', () => {
    expect(fmtDuration(45)).toBe('45s');
    expect(fmtDuration(125)).toBe('2m 5s');
    expect(fmtDuration(3900)).toBe('1h 5m');
    expect(fmtNum(12)).toBe('12');
    expect(fmtNum(12.5)).toBe('12.5');
    expect(fmtNum(0.25)).toBe('0.25');
    expect(compactCount(2400)).toBe('2.4K');
    expect(compactCount(1000)).toBe('1K');
    expect(compactCount(850)).toBe('850');
  });
});
