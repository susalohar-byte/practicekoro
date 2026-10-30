import type { TestAttempt, MistakeItem } from '@/types';
import { MOCK_QUESTIONS } from './questions';

export const MOCK_ATTEMPTS: TestAttempt[] = [
  {
    id: 'att-001',
    userId: 'usr-student-001',
    testId: 'test-indus-01',
    testTitle: 'Mock Test Part 01: Indus Valley (Free)',
    status: 'completed',
    startTime: '2025-02-10T14:00:00Z',
    endTime: '2025-02-10T14:11:30Z',
    timeSpentSeconds: 690,
    score: 4.75,
    totalMarks: 5.0,
    correctCount: 4,
    wrongCount: 1,
    skippedCount: 0,
    accuracy: 80.0,
    rank: 14,
    percentile: 94.5,
    createdAt: '2025-02-10T14:12:00Z',
  },
];

export const MOCK_MISTAKES: MistakeItem[] = [
  {
    id: 'mst-001',
    userId: 'usr-student-001',
    questionId: 'q-indus-05',
    question: MOCK_QUESTIONS['test-indus-01'][4],
    wrongCount: 2,
    isResolved: false,
    lastReviewedAt: '2025-02-10T14:15:00Z',
    createdAt: '2025-02-10T14:12:00Z',
  },
];
