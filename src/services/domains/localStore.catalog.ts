import {
  MOCK_EXAMS,
  MOCK_SUBJECTS,
  MOCK_CHAPTERS,
  MOCK_TESTS,
  MOCK_QUESTIONS,
} from '@/services/mockData';
import { STANDARD_EXAM_CATEGORIES } from './examCategoryDefaults';
import type { Database } from '@/types/database';
import type {
  AttemptAnswerState,
  Chapter,
  Exam,
  ExamCategory,
  GradedResult,
  MockTest,
  Question,
  Subject,
  TestAttempt,
  TestSeries,
} from '@/types';

// Catalog stores: exams, subjects, chapters, series, tests, questions and attempts.

export type ExamRow = Database['public']['Tables']['exams']['Row'];
export type SubjectRow = Database['public']['Tables']['subjects']['Row'];
export type ChapterRow = Database['public']['Tables']['chapters']['Row'];
export type TestRow = Database['public']['Tables']['tests']['Row'];
export type QuestionRow = Database['public']['Tables']['questions']['Row'];
export type AttemptRow = Database['public']['Tables']['test_attempts']['Row'];
export type MistakeRow = Database['public']['Tables']['mistakes']['Row'];
export type BookmarkRow = Database['public']['Tables']['bookmarks']['Row'];
export type PlanRow = Database['public']['Tables']['subscription_plans']['Row'];

export const localExams: Exam[] = [...MOCK_EXAMS];
export const localSubjects: Subject[] = Object.values(MOCK_SUBJECTS).flat();
export const localChapters: Chapter[] = Object.values(MOCK_CHAPTERS).flat();
export const DEFAULT_SHOWCASE_SERIES: TestSeries[] = [
  {
    id: 'wbp-prelims-2025',
    examId: 'wbp-constable',
    title: 'WBP Constable',
    subtitle: 'Complete Preparation Series',
    slug: 'wbp-constable-complete-series',
    description:
      'WBP Constable পরীক্ষার জন্য সম্পূর্ণ প্রস্তুতি সিরিজ। এখানে রয়েছে ফুল মক টেস্ট, বিষয়ভিত্তিক টেস্ট এবং অফিসিয়াল PYQ, যা আপনার পরীক্ষার প্রস্তুতিকে শক্তিশালী করবে।',
    examTitle: 'WBP Constable',
    examCategory: 'Police',
    isPremium: false,
    orderIndex: 1,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_wbp.png',
    fullMockCount: 5,
    topicTestCount: 12,
    pyqTestCount: 8,
    testCount: 25,
    testsCount: 25,
    enrollmentCount: 1240,
    avgCompletion: 78,
    avgAccuracy: 82,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ssc-mts-2025',
    examId: 'ssc-mts',
    title: 'SSC MTS',
    subtitle: 'Target SSC MTS 2025',
    slug: 'ssc-mts-target-2025',
    description:
      'Staff Selection Commission MTS complete mock drill and chapter-wise tests in Bengali & English.',
    examTitle: 'SSC MTS',
    examCategory: 'SSC & Central Govt.',
    isPremium: false,
    orderIndex: 2,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_ssc.png',
    fullMockCount: 6,
    topicTestCount: 15,
    pyqTestCount: 10,
    testCount: 31,
    testsCount: 31,
    enrollmentCount: 860,
    avgCompletion: 74,
    avgAccuracy: 79,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'railway-group-d-2025',
    examId: 'railway-group-d',
    title: 'Railway Group D',
    subtitle: 'Complete Test Series',
    slug: 'railway-group-d-complete',
    description:
      'RRB Group D CBT full mocks, science specials, reasoning drills, and previous years official papers.',
    examTitle: 'Railway Group D',
    examCategory: 'Railways (RRB)',
    isPremium: false,
    orderIndex: 3,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_railway.png',
    fullMockCount: 8,
    topicTestCount: 20,
    pyqTestCount: 12,
    testCount: 40,
    testsCount: 40,
    enrollmentCount: 620,
    avgCompletion: 71,
    avgAccuracy: 76,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wbpsc-clerkship-2025',
    examId: 'wbpsc-clerkship',
    title: 'WBPSC Clerkship',
    subtitle: 'Mock Test Series 2025',
    slug: 'wbpsc-clerkship-mock-2025',
    description:
      'WBPSC Clerkship Part 1 General Studies, Arithmetic, and English dedicated mock test series.',
    examTitle: 'WBPSC Clerkship',
    examCategory: 'WBPSC',
    isPremium: false,
    orderIndex: 4,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_wbpsc.png',
    fullMockCount: 5,
    topicTestCount: 18,
    pyqTestCount: 10,
    testCount: 33,
    testsCount: 33,
    enrollmentCount: 410,
    avgCompletion: 76,
    avgAccuracy: 81,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'icds-supervisor-2025',
    examId: 'icds-supervisor',
    title: 'ICDS Supervisor',
    subtitle: 'Practice & PYQ Series',
    slug: 'icds-supervisor-practice',
    description:
      'Integrated Child Development Services Supervisor preliminary and mains mock tests.',
    examTitle: 'ICDS',
    examCategory: 'WBPSC',
    isPremium: false,
    orderIndex: 5,
    isActive: false,
    status: 'draft',
    iconUrl: '/images/exams/logo_wbtet.png',
    fullMockCount: 4,
    topicTestCount: 14,
    pyqTestCount: 8,
    testCount: 26,
    testsCount: 26,
    enrollmentCount: 320,
    avgCompletion: 65,
    avgAccuracy: 72,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'food-si-2025',
    examId: 'food-si',
    title: 'Food SI',
    subtitle: 'Full Preparation Series',
    slug: 'food-si-full-prep',
    description: 'WBPSC Sub-Inspector in Food & Supplies department 100-mark full mock drills.',
    examTitle: 'Food SI',
    examCategory: 'WBPSC',
    isPremium: false,
    orderIndex: 6,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_wbp.png',
    fullMockCount: 6,
    topicTestCount: 16,
    pyqTestCount: 9,
    testCount: 31,
    testsCount: 31,
    enrollmentCount: 290,
    avgCompletion: 80,
    avgAccuracy: 83,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wbpsc-misc-2025',
    examId: 'wbpsc-misc',
    title: 'WBPSC Miscellaneous',
    subtitle: 'Topic + Mock + PYQ',
    slug: 'wbpsc-misc-topic-mock',
    description: 'WBPSC Miscellaneous Services Prelims and Mains oriented chapter drills.',
    examTitle: 'WBPSC Misc',
    examCategory: 'WBPSC',
    isPremium: false,
    orderIndex: 7,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_wbpsc.png',
    fullMockCount: 5,
    topicTestCount: 12,
    pyqTestCount: 7,
    testCount: 24,
    testsCount: 24,
    enrollmentCount: 260,
    avgCompletion: 69,
    avgAccuracy: 75,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'kolkata-police-2025',
    examId: 'kolkata-police',
    title: 'Kolkata Police',
    subtitle: 'Practice Series',
    slug: 'kolkata-police-practice',
    description: 'KP Constable & Lady Constable full mock tests and speed calculations.',
    examTitle: 'Kolkata Police',
    examCategory: 'Police',
    isPremium: false,
    orderIndex: 8,
    isActive: false,
    status: 'under_review',
    iconUrl: '/images/exams/icon_kolkata_police.png',
    fullMockCount: 4,
    topicTestCount: 10,
    pyqTestCount: 6,
    testCount: 20,
    testsCount: 20,
    enrollmentCount: 210,
    avgCompletion: 72,
    avgAccuracy: 77,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'ssc-gd-2025',
    examId: 'ssc-gd',
    title: 'SSC GD',
    subtitle: 'Complete Test Series',
    slug: 'ssc-gd-complete-series',
    description:
      'SSC GD Constable General Intelligence, Math, Elementary English & Hindi, and GK drills.',
    examTitle: 'SSC GD',
    examCategory: 'SSC & Central Govt.',
    isPremium: false,
    orderIndex: 9,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_ssc.png',
    fullMockCount: 6,
    topicTestCount: 14,
    pyqTestCount: 10,
    testCount: 30,
    testsCount: 30,
    enrollmentCount: 190,
    avgCompletion: 75,
    avgAccuracy: 80,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'gk-practice-2025',
    examId: 'general-knowledge',
    title: 'General Knowledge',
    subtitle: 'GK Practice Series',
    slug: 'gk-practice-series',
    description:
      'Comprehensive static GK, Indian History, Geography, Polity, Science topic-wise test packs.',
    examTitle: 'General Knowledge',
    examCategory: 'General Knowledge',
    isPremium: false,
    orderIndex: 10,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_railway.png',
    fullMockCount: 3,
    topicTestCount: 20,
    pyqTestCount: 5,
    testCount: 28,
    testsCount: 28,
    enrollmentCount: 160,
    avgCompletion: 82,
    avgAccuracy: 85,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wbtet-primary-2025',
    examId: 'wbtet-primary',
    title: 'WBTET Primary',
    subtitle: 'Primary TET Mock Pack',
    slug: 'wbtet-primary-mock-pack',
    description:
      'West Bengal Primary Teacher Eligibility Test Child Development & Pedagogy, Bengali, EVS, and Math.',
    examTitle: 'WBTET Primary',
    examCategory: 'Teaching',
    isPremium: false,
    orderIndex: 11,
    isActive: false,
    status: 'draft',
    iconUrl: '/images/exams/logo_wbtet.png',
    fullMockCount: 4,
    topicTestCount: 12,
    pyqTestCount: 6,
    testCount: 22,
    testsCount: 22,
    enrollmentCount: 130,
    avgCompletion: 60,
    avgAccuracy: 68,
    createdAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'wbcs-prelims-2025',
    examId: 'wbcs-prelims',
    title: 'WBCS Executive',
    subtitle: 'Prelims Mock Series',
    slug: 'wbcs-prelims-series',
    description:
      'West Bengal Civil Services Preliminary Examination 200-question comprehensive full mocks.',
    examTitle: 'WBCS Prelims',
    examCategory: 'WBPSC',
    isPremium: true,
    orderIndex: 12,
    isActive: true,
    status: 'published',
    iconUrl: '/images/exams/logo_wbpsc.png',
    fullMockCount: 8,
    topicTestCount: 25,
    pyqTestCount: 15,
    testCount: 48,
    testsCount: 48,
    enrollmentCount: 980,
    avgCompletion: 73,
    avgAccuracy: 78,
    createdAt: '2026-01-01T00:00:00Z',
  },
];

export const localTestSeries: TestSeries[] = [...DEFAULT_SHOWCASE_SERIES];
export const localTests: MockTest[] = Object.values(MOCK_TESTS).flat();
export const localQuestions: Question[] = Object.values(MOCK_QUESTIONS).flat();

export const localExamCategories: ExamCategory[] = STANDARD_EXAM_CATEGORIES.map((c) => ({ ...c }));

// Local test-question assignments store for offline demo
export const localTestQuestions: {
  id: string;
  testId: string;
  questionId: string;
  questionOrder: number;
  marks: number;
  negativeMarks: number;
}[] = [];

// Initialize localTestQuestions from MOCK_QUESTIONS and MOCK_TESTS
Object.entries(MOCK_QUESTIONS).forEach(([testId, questions]) => {
  questions.forEach((q, idx) => {
    localTestQuestions.push({
      id: `tq-${testId}-${q.id}`,
      testId,
      questionId: q.id,
      questionOrder: idx + 1,
      marks: q.defaultMarks || 1.0,
      // Questions never carry negative marks — scoring uses the test-level scheme.
      negativeMarks: q.defaultNegativeMarks || 0,
    });
  });
});

// Local in-memory store for session attempts & submissions (for fallback/offline demo)
export const localAttemptsStore: Record<
  string,
  {
    attempt: TestAttempt;
    answers: Record<string, AttemptAnswerState>;
    result?: GradedResult;
  }
> = {};
