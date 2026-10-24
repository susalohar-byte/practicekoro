import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@/lib/supabase', () => ({
  isSupabaseConfigured: false,
  supabase: {},
  supabaseRuntime: {},
}));

import {
  createLiveTestWithPaper,
  duplicateLiveTest,
  getLiveTestById,
  releaseLivePaperToPractice,
  updateLiveTest,
} from './admin.liveTests';
import { getAllAdminTests } from './admin.tests';
import { invalidateApiCache } from '@/services/apiCache';
import { localLiveTests, localTestQuestions, localTests } from './localStore';

const tomorrow = () => new Date(Date.now() + 24 * 3600 * 1000).toISOString();

async function createPaper() {
  return createLiveTestWithPaper({
    examId: 'wbp-constable',
    title: 'WBP Live Test 01',
    startAt: tomorrow(),
    durationMinutes: 60,
    totalQuestions: 2,
    totalMarks: 2,
    negativeMarking: 0.25,
  });
}

function attachQuestions(testId: string, count: number) {
  for (let i = 1; i <= count; i++) {
    localTestQuestions.push({
      id: `${testId}-tq-${i}`,
      testId,
      questionId: `${testId}-q-${i}`,
      questionOrder: i,
      marks: 1,
      negativeMarks: 0,
    });
  }
}

describe('admin.liveTests — Live Test papers', () => {
  beforeEach(() => {
    localStorage.clear();
    invalidateApiCache();
    localLiveTests.length = 0;
    localTests.length = 0;
    localTestQuestions.length = 0;
  });

  it('creates a hidden live-only Full Mock paper with a Draft Live Test', async () => {
    const live = await createPaper();
    const paper = localTests.find((t) => t.id === live.testId);

    expect(live.status).toBe('draft');
    expect(paper).toMatchObject({
      testType: 'full_mock',
      examId: 'wbp-constable',
      isLiveOnly: true,
      status: 'draft',
    });
    // Hidden from the Tests page / pickers, visible only when asked for.
    expect((await getAllAdminTests()).some((t) => t.id === live.testId)).toBe(false);
    expect(
      (await getAllAdminTests({ includeLiveOnly: true })).some((t) => t.id === live.testId)
    ).toBe(true);
  });

  it('refuses to publish a Live Test whose paper has no questions', async () => {
    const live = await createPaper();

    await expect(updateLiveTest(live.id, { status: 'upcoming' })).rejects.toThrow(
      /Upload this Live Test's questions/
    );
    expect((await getLiveTestById(live.id))?.status).toBe('draft');
    expect(localTests.find((t) => t.id === live.testId)?.status).toBe('draft');
  });

  it('publishes the paper together with its Live Test once questions are uploaded', async () => {
    const live = await createPaper();
    attachQuestions(live.testId, 2);

    const published = await updateLiveTest(live.id, { status: 'upcoming' });

    expect(published.status).toBe('upcoming');
    const paper = localTests.find((t) => t.id === live.testId);
    expect(paper).toMatchObject({ status: 'published', isActive: true, isLiveOnly: true });
  });

  it('copies draft scoring edits onto the paper', async () => {
    const live = await createPaper();

    await updateLiveTest(live.id, { durationMinutes: 75, negativeMarking: 0.5, title: 'Renamed' });

    expect(localTests.find((t) => t.id === live.testId)).toMatchObject({
      durationMinutes: 75,
      negativeMarking: 0.5,
      title: 'Renamed',
    });
  });

  it('releases the paper to practice only after the Live Test has ended', async () => {
    const live = await createPaper();
    attachQuestions(live.testId, 2);
    await updateLiveTest(live.id, { status: 'upcoming' });

    await expect(releaseLivePaperToPractice(live.id)).rejects.toThrow(/after the Live Test ends/);

    await updateLiveTest(live.id, { status: 'ended' });
    const released = await releaseLivePaperToPractice(live.id);

    expect(released.isLiveOnly).toBe(false);
    expect((await getAllAdminTests()).some((t) => t.id === live.testId)).toBe(true);
  });

  it('duplicates a live-only Live Test onto a new copy of its paper', async () => {
    const live = await createPaper();
    attachQuestions(live.testId, 2);

    const copy = await duplicateLiveTest(live.id);

    expect(copy.status).toBe('draft');
    expect(copy.testId).not.toBe(live.testId);
    expect(localTests.find((t) => t.id === copy.testId)).toMatchObject({
      isLiveOnly: true,
      status: 'draft',
    });
  });
});
