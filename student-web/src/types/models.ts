// Shapes mirror the Flutter app's models (practicekoro_mobile/lib/data/models) and the
// Supabase schema they are read from.

export interface Exam {
  id: string;
  title: string;
  slug: string;
  shortName: string | null;
  subtitle: string | null;
  category: string | null;
  description: string | null;
  iconUrl: string | null;
  bannerUrl: string | null;
  totalTests: number;
  orderIndex: number;
}

export interface Subject {
  id: string;
  examId: string | null;
  nameEnglish: string;
  nameBengali: string;
  slug: string;
  iconName: string | null;
  chapterCount: number;
  totalTests: number;
  orderIndex: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  titleBengali: string | null;
  slug: string;
  totalTests: number;
}

/** 'Full Test' | 'Topic Test' | 'PYQ' (MockTestModel.normalizeCategory) */
export type TestCategory = 'Full Test' | 'Topic Test' | 'PYQ' | string;

export interface MockTest {
  id: string;
  examId: string | null;
  subjectId: string | null;
  chapterId: string | null;
  testSeriesId: string | null;
  title: string;
  description: string | null;
  totalQuestions: number;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  passingMarks: number | null;
  isPro: boolean;
  category: TestCategory;
  year: number | null;
  paperName: string | null;
  shift: string | null;
  examDate: string | null;
  iconUrl: string | null;
  orderIndex: number;
  createdAt: string | null;
  isLiveOnly: boolean;
}

export interface LiveTest {
  id: string;
  testId: string;
  title: string;
  examId: string | null;
  examTitle: string | null;
  status: string;
  startAt: Date | null;
  endAt: Date | null;
  registrationDeadline: Date | null;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  negativeMarking: number;
  enrolledCount: number;
  logo: string | null;
  rankingEnabled: boolean;
  subscriptionRequired: boolean;
  instructions: string | null;
}

export type OptionLetter = 'A' | 'B' | 'C' | 'D';
export const OPTION_LETTERS: OptionLetter[] = ['A', 'B', 'C', 'D'];

export interface Question {
  id: string;
  order: number;
  textEnglish: string;
  textBengali: string | null;
  imageUrl: string | null;
  options: Record<OptionLetter, string>;
  marks: number;
  negativeMarks: number;
}

export interface SolutionQuestion extends Question {
  selected: OptionLetter | null;
  correct: OptionLetter | null;
  isCorrect: boolean;
  marksAwarded: number;
  explanation: string | null;
  explanationBengali: string | null;
  isBookmarked: boolean;
}

export interface ServerAttempt {
  id: string;
  testId: string;
  startedAt: Date;
  durationMinutes: number;
}

export interface Attempt {
  id: string;
  testId: string;
  testTitle: string;
  examId: string | null;
  category: TestCategory;
  isLive: boolean;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  skippedCount: number;
  timeSpentSeconds: number;
  completedAt: Date;
  rank: number | null;
  totalCandidates: number | null;
  percentile: number | null;
  passed: boolean | null;
}

export interface AttemptRankings {
  testSeries: { id: string | null; name: string | null; rank: number | null; participants: number };
  district: { name: string | null; rank: number | null; participants: number };
  westBengal: { rank: number | null; participants: number };
}

export type LeaderboardScope = 'global' | 'west_bengal' | 'district';

export interface RankRow {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  score: number;
  totalMarks: number;
  percentage: number;
  district: string | null;
  block: string | null;
  isCurrentUser: boolean;
}

export interface Profile {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
  targetExamId: string | null;
  targetExamTitle: string | null;
  state: string | null;
  district: string | null;
  block: string | null;
  gender: string | null;
  category: string | null;
  dob: string | null;
  preparationStatus: string | null;
  preferredSubjects: string[];
  createdAt: string | null;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  title: string;
  description: string;
  durationDays: number;
  price: number;
  originalPrice: number | null;
  currency: string;
  features: string[];
  orderIndex: number;
  renewalWindowDays: number | null;
}

export interface UpgradeOption {
  planId: string;
  planTitle: string;
  durationDays: number | null;
  amount: number;
  currency: string;
  newExpiresAt: Date | null;
}

export interface StudentSubscription {
  hasSubscription: boolean;
  isActive: boolean;
  status: string;
  subscriptionId: string | null;
  planId: string | null;
  planTitle: string | null;
  durationDays: number | null;
  purchasedAt: Date | null;
  startsAt: Date | null;
  expiresAt: Date | null;
  renewalWindowDays: number | null;
  upgradeOptions: UpgradeOption[];
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  authorName: string;
  authorKind: string;
  body: string;
  createdAt: Date;
}

export interface SupportTicket {
  id: string;
  subject: string;
  issue: string;
  category: string;
  priority: string;
  status: string;
  resolutionNotes: string | null;
  createdAt: Date;
  updatedAt: Date;
  messages: SupportMessage[];
}

export interface SupportContact {
  email: string | null;
  whatsapp: string | null;
  phone: string | null;
  hours: string | null;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: string | null;
  actionLink: string | null;
  sentAt: Date;
}

export interface HeroBanner {
  id: string;
  title: string;
  subtitle: string | null;
  badgeText: string | null;
  imageUrl: string;
  mobileImageUrl: string | null;
  showTextOverlay: boolean;
  ctaText: string;
  ctaLink: string;
  displayOrder: number;
}

export interface Bookmark {
  id: string;
  questionId: string;
  note: string | null;
  createdAt: Date;
}
