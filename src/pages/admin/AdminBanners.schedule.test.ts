import { describe, expect, it } from 'vitest';
import {
  bannerStatusToRecord,
  dateInputToIso,
  deriveBannerStatus,
  isoToDateInput,
} from './AdminBanners';

const NOW = new Date(2026, 9, 11, 12, 0, 0).getTime();

describe('banner schedule mapping', () => {
  it('round-trips local date inputs, with end date at local end of day', () => {
    const start = dateInputToIso('2026-10-20', 'start');
    const end = dateInputToIso('2026-10-25', 'end');
    expect(isoToDateInput(start)).toBe('2026-10-20');
    expect(isoToDateInput(end)).toBe('2026-10-25');
    expect(new Date(end).getHours()).toBe(23);
    expect(dateInputToIso('', 'start')).toBe('');
  });
  it('stores Scheduled as active with a future start and reads it back as Scheduled', () => {
    const startsAt = dateInputToIso('2026-10-20', 'start');
    const rec = bannerStatusToRecord('Scheduled', startsAt, '', NOW);
    expect(rec.isActive).toBe(true);
    expect(deriveBannerStatus(rec, NOW)).toBe('Scheduled');
    expect(() => bannerStatusToRecord('Scheduled', '', '', NOW)).toThrow(/future start/);
  });
  it('keeps Archived distinguishable from Draft', () => {
    const rec = bannerStatusToRecord('Archived', '', '', NOW);
    expect(rec.isActive).toBe(false);
    expect(deriveBannerStatus(rec, NOW + 1)).toBe('Archived');
    expect(deriveBannerStatus({ isActive: false }, NOW)).toBe('Draft');
  });
});
