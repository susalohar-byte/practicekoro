/**
 * Production stand-in for the demo engine's data modules (mockData/index.ts and
 * domains/localStore.ts). vite.config.ts swaps it in for every build that is
 * not a demo build, so the fake exams, tests, payments and students never ship.
 *
 * Live code reads these only inside `!isSupabaseConfigured` branches, which a
 * production build removes. The names still have to exist for those imports
 * to resolve; a name missing here fails the production build, which is the
 * signal that new code reaches into the demo store.
 */
import type { LocalPaymentGatewayRecord } from './domains/localStore';
import type { UserProfile } from '@/types';

const none = <T>(): T[] => [];

// domains/localStore.ts
export const localExams = none();
export const localSubjects = none();
export const localChapters = none();
export const DEFAULT_SHOWCASE_SERIES = none();
export const localTestSeries = none();
export const localTests = none();
export const localQuestions = none();
export const localLiveTests = none();
export const localLiveTestParticipations = none();
export const localExamCategories = none();
export const localTestQuestions = none();
export const localAttemptsStore: Record<string, never> = {};
export const localCoupons = none();
export const localNotifications = none();
export const syncLocalScheduledNotifications = () => none();
export const localAppSettings = none();
export const localPaymentGateways: Record<string, LocalPaymentGatewayRecord> = {};
export const localSupportTickets = none();
export const localStaffUsers = none();
export const localAuditLogs = none();
export const localPayments = none();
export const localStudents = none();
export const localItemAnalysisStore = none();

// mockData/index.ts
export const MOCK_STUDENT_USER = null as unknown as UserProfile;
export const MOCK_ADMIN_USER = null as unknown as UserProfile;
export const MOCK_EXAMS = none();
export const MOCK_SUBJECTS: Record<string, never[]> = {};
export const MOCK_CHAPTERS: Record<string, never[]> = {};
export const MOCK_TEST_SERIES: Record<string, never[]> = {};
export const MOCK_TESTS: Record<string, never[]> = {};
export const MOCK_QUESTIONS: Record<string, never[]> = {};
export const MOCK_ATTEMPTS = none();
export const MOCK_MISTAKES = none();
export const MOCK_BOOKMARKS = none();
export const MOCK_SUBSCRIPTION_PLANS = none();
