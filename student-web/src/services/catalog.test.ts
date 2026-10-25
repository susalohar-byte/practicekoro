import { describe, expect, it } from 'vitest';
import { isLiveNow, isUpcoming, normalizeCategory, paperYear, toTest, toTopic } from './catalog';
import type { LiveTest } from '@/types/models';

describe('catalog mapping', () => {
  it('normalizes test_type like the app', () => {
    expect(normalizeCategory('full_mock')).toBe('Full Test');
    expect(normalizeCategory('chapter_mock')).toBe('Topic Test');
    expect(normalizeCategory('topic')).toBe('Topic Test');
    expect(normalizeCategory('pyq')).toBe('PYQ');
    expect(normalizeCategory(null)).toBe('Full Test');
  });

  it('reads the paper year from the column or the title', () => {
    expect(paperYear(toTest({ id: 't', title: 'WBP 2019 Paper', year: null }))).toBe(2019);
    expect(paperYear(toTest({ id: 't', title: 'Paper', year: 2024 }))).toBe(2024);
    expect(paperYear(toTest({ id: 't', title: 'Paper' }))).toBeNull();
  });

  it('splits a bilingual chapter title', () => {
    const t = toTopic({ id: 'c', name: 'Indus Valley Civilization (সিন্ধু সভ্যতা)', subject_id: 's' });
    expect(t.title).toBe('Indus Valley Civilization');
    expect(t.titleBengali).toBe('সিন্ধু সভ্যতা');
  });

  it('decides live / upcoming status from the schedule', () => {
    const now = new Date('2026-10-25T10:00:00Z');
    const base: LiveTest = {
      id: 'l', testId: 't', title: 'Live', examId: null, examTitle: null, status: 'upcoming',
      startAt: new Date('2026-10-25T09:30:00Z'), endAt: new Date('2026-10-25T11:00:00Z'), registrationDeadline: null,
      durationMinutes: 90, totalQuestions: 100, totalMarks: 100, negativeMarking: 0.25, enrolledCount: 0,
      logo: null, rankingEnabled: true, subscriptionRequired: false, instructions: null,
    };
    expect(isLiveNow(base, now)).toBe(true);
    expect(isUpcoming({ ...base, startAt: new Date('2026-10-26T09:00:00Z'), endAt: new Date('2026-10-26T10:30:00Z') }, now)).toBe(true);
    expect(isLiveNow({ ...base, status: 'cancelled' }, now)).toBe(false);
  });
});
