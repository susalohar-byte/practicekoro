// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type TestAttemptType = 'Full Mock' | 'Topic Test' | 'Official PYQ';
export type TestAttemptStatus = 'Completed' | 'Not Completed';

export interface QuestionBreakdownItem {
  id: number;
  questionText: string;
  questionTextBn?: string;
  selectedOption: 'A' | 'B' | 'C' | 'D' | null;
  correctOption: 'A' | 'B' | 'C' | 'D';
  options: { key: 'A' | 'B' | 'C' | 'D'; text: string; textBn?: string }[];
  status: 'correct' | 'wrong' | 'skipped';
  marks: number;
  timeSpentSec: number;
  explanation: string;
  subject: string;
}

export interface SectionAnalysisItem {
  sectionName: string;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  marksScored: number;
  maxMarks: number;
  accuracy: number;
  timeSpentMin: number;
}

export interface AdminTestAttempt {
  id: string;
  studentId: string; // e.g. PK100245
  studentName: string;
  studentEmail: string;
  studentAvatar?: string;
  studentInitials?: string;
  studentAvatarColor?: string;
  testName: string;
  exam: string;
  type: TestAttemptType;
  score: number;
  totalMarks: number;
  accuracy: number;
  timeTaken: string; // e.g. "48 min"
  timeTakenSeconds: number;
  status: TestAttemptStatus;
  attemptedAtDate: string; // "30 Sep 2026"
  attemptedAtTime: string; // "10:42 AM"
  startedAt: string; // "30 Sep 2026, 09:54 AM"
  submittedAt: string; // "30 Sep 2026, 10:42 AM"
  /** ISO created_at timestamp, when provided by the service. */
  createdAt?: string;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  questions?: QuestionBreakdownItem[];
  sectionAnalysis?: SectionAnalysisItem[];
}

export const DATE_RANGE_OPTIONS = [
  'All Time',
  'Today',
  'Yesterday',
  'Last 7 Days',
  'Last 30 Days',
  'This Month',
  'Custom Range',
] as const;
export type DateRangeFilter = (typeof DATE_RANGE_OPTIONS)[number];

// Key used by earlier versions to cache attempts; purged on mount.
export const LEGACY_STORAGE_KEY = 'practicekoro_test_attempts_v1';
