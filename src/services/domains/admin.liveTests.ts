/**
 * Service domain for Live Tests Management & Student Participation
 *
 * Core Principle:
 * LIVE TEST = EXISTING TEST + SCHEDULED EVENT + OPTIONAL RANKING
 * A Live Test does NOT have its own questions or runner; it is a thin event layer.
 *
 * Persistence:
 * 1. `public.live_tests` & `public.live_test_participants` tables (the only remote source).
 * 2. Local Cache: `localStorage` (`pk_live_tests_list` & `pk_live_test_participations`) + in-memory store.
 */
// This module is a barrel: the implementation lives in the admin.liveTests.* siblings.
import {
  getLiveTests,
  getActiveLiveTest,
  getLiveTestById,
  isTestLockedForEditing,
} from './admin.liveTests.read';
import { scheduleLiveTest, createLiveTestWithPaper } from './admin.liveTests.schedule';
import {
  releaseLivePaperToPractice,
  duplicateLiveTest,
  updateLiveTest,
  uploadLiveTestLogo,
  uploadLiveTestBackground,
  cancelLiveTest,
  deleteLiveTest,
} from './admin.liveTests.write';
import {
  registerForLiveTest,
  isLiveTestRegistered,
  joinLiveTestEvent,
  recordLiveTestSubmission,
  fetchRemoteParticipations,
} from './admin.liveTests.participants';
import {
  getLiveQuestionIndex,
  getLiveTestsStats,
  getLiveTestLeaderboard,
  getLiveTestLeaderboards,
} from './admin.liveTests.stats';
import { subscribeToLiveTestUpdates } from './admin.liveTests.realtime';

export {
  deriveLiveTestStatus,
  localDateTimeToIso,
  isoToLocalDateTimeParts,
} from './admin.liveTests.store';
export { getLiveTests, getActiveLiveTest, getLiveTestById, isTestLockedForEditing };
export type {
  ScheduleLiveTestInput,
  CreateLiveTestWithPaperInput,
} from './admin.liveTests.schedule';
export { scheduleLiveTest, createLiveTestWithPaper };
export {
  releaseLivePaperToPractice,
  duplicateLiveTest,
  updateLiveTest,
  uploadLiveTestLogo,
  uploadLiveTestBackground,
  cancelLiveTest,
  deleteLiveTest,
};
export { registerForLiveTest, isLiveTestRegistered, joinLiveTestEvent, recordLiveTestSubmission };
export type { LiveTestStats } from './admin.liveTests.stats';
export { EMPTY_LIVE_TEST_STATS } from './admin.liveTests.stats';
export { getLiveQuestionIndex, getLiveTestsStats, getLiveTestLeaderboard, getLiveTestLeaderboards };
export type { LiveTestLeaderboardContext } from './admin.liveTests.stats';
export { subscribeToLiveTestUpdates };

/** Backward-compatible aliases */
export const createLiveTest = scheduleLiveTest;
export const joinLiveTest = registerForLiveTest;

export const adminLiveTestsApi = {
  getLiveTests,
  getActiveLiveTest,
  getLiveTestById,
  isTestLockedForEditing,
  scheduleLiveTest,
  createLiveTest,
  createLiveTestWithPaper,
  duplicateLiveTest,
  releaseLivePaperToPractice,
  updateLiveTest,
  cancelLiveTest,
  deleteLiveTest,
  registerForLiveTest,
  joinLiveTest,
  isLiveTestRegistered,
  joinLiveTestEvent,
  recordLiveTestSubmission,
  getLiveTestLeaderboard,
  getLiveTestLeaderboards,
  fetchLiveTestParticipations: fetchRemoteParticipations,
  getLiveTestsStats,
  getLiveQuestionIndex,
  subscribeToLiveTestUpdates,
  uploadLiveTestLogo,
  uploadLiveTestBackground,
};
