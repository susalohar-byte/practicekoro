// Shared in-memory fallback stores (used when Supabase is unconfigured).
// Extracted verbatim from the original src/services/api.ts during the domain split.
// This module is a barrel: the stores live in the localStore.* siblings.
export type {
  ExamRow,
  SubjectRow,
  ChapterRow,
  TestRow,
  QuestionRow,
  AttemptRow,
  MistakeRow,
  BookmarkRow,
  PlanRow,
} from './localStore.catalog';
export {
  localExams,
  localSubjects,
  localChapters,
  DEFAULT_SHOWCASE_SERIES,
  localTestSeries,
  localTests,
  localQuestions,
  localExamCategories,
  localTestQuestions,
  localAttemptsStore,
} from './localStore.catalog';
export { localLiveTests, localLiveTestParticipations } from './localStore.liveTests';
export {
  localCoupons,
  localNotifications,
  syncLocalScheduledNotifications,
} from './localStore.engagement';
export type { LocalPaymentGatewayRecord } from './localStore.settings';
export { localAppSettings, localPaymentGateways } from './localStore.settings';
export { localSupportTickets, localStaffUsers, localAuditLogs } from './localStore.staff';
export { localPayments, localStudents } from './localStore.analytics';
export { localItemAnalysisStore } from './localStore.itemAnalysis';
