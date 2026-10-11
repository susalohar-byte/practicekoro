import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  supabaseRuntime: {},
}));

import {
  deriveLiveTestStatus,
  getLiveTests,
  getActiveLiveTest,
  getLiveTestById,
  isTestLockedForEditing,
  scheduleLiveTest,
  updateLiveTest,
  cancelLiveTest,
  deleteLiveTest,
  registerForLiveTest,
  isLiveTestRegistered,
  joinLiveTestEvent,
  recordLiveTestSubmission,
  getLiveTestLeaderboard,
  localDateTimeToIso,
  isoToLocalDateTimeParts,
} from './admin.liveTests';
import { localLiveTests, localLiveTestParticipations, localTests } from './localStore';

describe('admin.liveTests domain — Live Mock Test lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    localLiveTests.length = 0;
    localLiveTestParticipations.length = 0;
    localTests.length = 0;
    localTests.push(
      {
        id: 'mock-test-wbp-1',
        examId: 'wbp-constable',
        title: 'WBP Constable Grand Mock #1',
        slug: 'wbp-constable-grand-mock-1',
        description: 'Full 85-mark statewide live simulation.',
        testType: 'full_mock',
        durationMinutes: 60,
        totalQuestions: 85,
        totalMarks: 85,
        passingMarks: 30,
        negativeMarking: 0.25,
        isPremium: false,
        orderIndex: 1,
        isActive: true,
        status: 'published',
        examTitle: 'WB Police (WBP / KP)',
      },
      {
        id: 'mock-test-wbpsc-2',
        examId: 'wbpsc-clerkship',
        title: 'WBPSC Clerkship Prelims Live Mock',
        slug: 'wbpsc-clerkship-prelims-live-mock',
        description: 'Official WBPSC Clerkship pattern.',
        testType: 'full_mock',
        durationMinutes: 90,
        totalQuestions: 100,
        totalMarks: 100,
        passingMarks: 40,
        negativeMarking: 0.25,
        isPremium: true,
        orderIndex: 2,
        isActive: true,
        status: 'published',
        examTitle: 'WBPSC Clerkship',
      }
    );
  });

  describe('deriveLiveTestStatus', () => {
    it('returns upcoming when startAt is in the future', () => {
      const future = new Date(Date.now() + 3600 * 1000).toISOString();
      expect(deriveLiveTestStatus('upcoming', future, 60)).toBe('upcoming');
    });

    it('returns live when current time is within [startAt, startAt + duration]', () => {
      const started10mAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(deriveLiveTestStatus('upcoming', started10mAgo, 60)).toBe('live');
    });

    it('returns ended when current time is past startAt + duration', () => {
      const started2hAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();
      expect(deriveLiveTestStatus('upcoming', started2hAgo, 60)).toBe('ended');
    });

    it('preserves cancelled and manually ended statuses', () => {
      const future = new Date(Date.now() + 3600 * 1000).toISOString();
      expect(deriveLiveTestStatus('cancelled', future, 60)).toBe('cancelled');
      expect(deriveLiveTestStatus('ended', future, 60)).toBe('ended');
    });

    it('keeps an explicitly started (live) event live only until its window closes', () => {
      const started10mAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const started2hAgo = new Date(Date.now() - 120 * 60 * 1000).toISOString();
      expect(deriveLiveTestStatus('live', started10mAgo, 60)).toBe('live');
      expect(deriveLiveTestStatus('live', started2hAgo, 60)).toBe('ended');
    });

    it('still respects explicit cancelled/ended over a live window', () => {
      const started10mAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(deriveLiveTestStatus('cancelled', started10mAgo, 60)).toBe('cancelled');
      expect(deriveLiveTestStatus('ended', started10mAgo, 60)).toBe('ended');
    });
  });

  describe('local date/time <-> ISO conversion', () => {
    const originalTz = process.env.TZ;
    afterEach(() => {
      process.env.TZ = originalTz;
    });

    it('interprets the admin input as local (IST) time, not UTC', () => {
      process.env.TZ = 'Asia/Kolkata';
      expect(localDateTimeToIso('2026-10-15', '10:00')).toBe('2026-10-15T04:30:00.000Z');
    });

    it('splits a stored UTC timestamp back into local (IST) date and time parts', () => {
      process.env.TZ = 'Asia/Kolkata';
      expect(isoToLocalDateTimeParts('2026-10-15T04:30:00.000Z')).toEqual({
        date: '2026-10-15',
        time: '10:00',
      });
      // Crosses midnight: 20:00 UTC is 01:30 the next day in IST
      expect(isoToLocalDateTimeParts('2026-10-15T20:00:00.000Z')).toEqual({
        date: '2026-10-16',
        time: '01:30',
      });
    });

    it('round-trips in any timezone and rejects invalid input', () => {
      const iso = localDateTimeToIso('2026-03-01', '23:45');
      expect(isoToLocalDateTimeParts(iso)).toEqual({ date: '2026-03-01', time: '23:45' });
      expect(isoToLocalDateTimeParts('not-a-date')).toBeNull();
      expect(() => localDateTimeToIso('', 'xx')).toThrow();
    });
  });

  describe('Scheduling, Listing, and Active Selection', () => {
    it('schedules a live test and enriches metadata from the source MockTest', async () => {
      const startAt = new Date(Date.now() + 2 * 3600 * 1000).toISOString();
      const created = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt,
        rankingEnabled: true,
        subscriptionRequired: false,
      });

      expect(created.testId).toBe('mock-test-wbp-1');
      expect(created.title).toBe('WBP Constable Grand Mock #1');
      expect(created.durationMinutes).toBe(60);
      expect(created.totalQuestions).toBe(85);
      expect(created.totalMarks).toBe(85);
      expect(created.status).toBe('upcoming');

      const list = await getLiveTests();
      expect(list).toHaveLength(1);
      expect(list[0].id).toBe(created.id);
    });

    it('supports custom event title override while preserving source test metadata', async () => {
      const startAt = new Date(Date.now() + 3600 * 1000).toISOString();
      const created = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        title: 'Sunday Mega All-Bengal WBP Live Test',
        startAt,
      });

      expect(created.title).toBe('Sunday Mega All-Bengal WBP Live Test');
      expect(created.totalQuestions).toBe(85);
      expect(created.durationMinutes).toBe(60);
    });

    it('prevents scheduling duplicate active live tests for the same MockTest', async () => {
      const startAt = new Date(Date.now() + 3600 * 1000).toISOString();
      await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt,
      });

      expect(await isTestLockedForEditing('mock-test-wbp-1')).toBe(true);

      await expect(
        scheduleLiveTest({
          testId: 'mock-test-wbp-1',
          startAt,
        })
      ).rejects.toThrow(/already scheduled/i);
    });

    it('prioritizes LIVE NOW tests over UPCOMING tests in getActiveLiveTest()', async () => {
      const futureStart = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
      const liveStart = new Date(Date.now() - 5 * 60 * 1000).toISOString();

      await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt: futureStart,
      });

      const liveEvent = await scheduleLiveTest({
        testId: 'mock-test-wbpsc-2',
        startAt: liveStart,
      });

      const active = await getActiveLiveTest();
      expect(active?.id).toBe(liveEvent.id);
      expect(active?.status).toBe('live');
    });

    it('stores Draft as an unpublished event that does not lock the test', async () => {
      const startAt = new Date(Date.now() + 3600 * 1000).toISOString();
      const draft = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt,
        status: 'draft',
      });
      expect(draft.status).toBe('draft');
      expect(draft.isPublished).toBe(false);
      expect(await isTestLockedForEditing('mock-test-wbp-1')).toBe(false);
      expect(await getActiveLiveTest()).toBeNull();

      const published = await updateLiveTest(draft.id, { status: 'upcoming' });
      expect(published.status).toBe('upcoming');
      expect(published.isPublished).toBe(true);
    });

    it('honours a chosen status when scheduling', async () => {
      const startAt = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const live = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt,
        status: 'live',
      });
      expect(live.status).toBe('live');
      expect(live.isPublished).toBe(true);
    });

    it('updates, cancels, and deletes live tests properly', async () => {
      const startAt = new Date(Date.now() + 3600 * 1000).toISOString();
      const created = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt,
      });

      // Start live now via updateLiveTest
      const nowIso = new Date().toISOString();
      const started = await updateLiveTest(created.id, {
        startAt: nowIso,
        status: 'live',
      });
      expect(started.status).toBe('live');

      // Cancel
      const cancelled = await cancelLiveTest(created.id);
      expect(cancelled).toBe(true);
      expect((await getLiveTestById(created.id))?.status).toBe('cancelled');

      // Cancelled tests should not be returned as activeLiveTest
      expect(await getActiveLiveTest()).toBeNull();

      // Delete
      await deleteLiveTest(created.id);
      expect(await getLiveTests()).toHaveLength(0);
    });
  });

  describe('Student Registration, Joining & Deterministic Leaderboard', () => {
    it('registers a student, increments enrolledCount, and blocks early joining before startAt', async () => {
      const futureStart = new Date(Date.now() + 3600 * 1000).toISOString();
      const event = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt: futureStart,
      });

      expect(await isLiveTestRegistered(event.id, 'student-1')).toBe(false);
      await registerForLiveTest(event.id, 'student-1');
      expect(await isLiveTestRegistered(event.id, 'student-1')).toBe(true);

      const updatedEvent = await getLiveTestById(event.id);
      expect(updatedEvent?.enrolledCount).toBe(1);

      // Cannot join before start time
      const earlyJoin = await joinLiveTestEvent(event.id, 'student-1');
      expect(earlyJoin.success).toBe(false);
      expect(earlyJoin.error).toMatch(/not started yet/i);
    });

    it('allows joining when live and ranks submissions deterministically (Score DESC, Accuracy DESC, Time ASC)', async () => {
      const liveStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const event = await scheduleLiveTest({
        testId: 'mock-test-wbp-1',
        startAt: liveStart,
      });

      const joinRes = await joinLiveTestEvent(event.id, 'student-1');
      expect(joinRes.success).toBe(true);

      // Record 3 student submissions with tie-breaking scenarios
      await recordLiveTestSubmission(event.id, 'student-1', {
        attemptId: 'att-1',
        score: 70,
        accuracy: 80,
        timeTaken: 2500,
      });
      await recordLiveTestSubmission(event.id, 'student-2', {
        attemptId: 'att-2',
        score: 75,
        accuracy: 85,
        timeTaken: 3000,
      });
      // Same score (70) and accuracy (80) as student-1, but faster timeTaken (2100s < 2500s)
      await recordLiveTestSubmission(event.id, 'student-3', {
        attemptId: 'att-3',
        score: 70,
        accuracy: 80,
        timeTaken: 2100,
      });

      const leaderboard = await getLiveTestLeaderboard(event.id);
      expect(leaderboard).toHaveLength(3);

      expect(leaderboard[0].userId).toBe('student-2');
      expect(leaderboard[0].rank).toBe(1);

      expect(leaderboard[1].userId).toBe('student-3');
      expect(leaderboard[1].rank).toBe(2);

      expect(leaderboard[2].userId).toBe('student-1');
      expect(leaderboard[2].rank).toBe(3);
    });
  });
});
