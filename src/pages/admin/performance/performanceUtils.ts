import type { DateRangePreset } from '@/types';

export const RANGE_OPTIONS: { preset: DateRangePreset; label: string }[] = [
  { preset: 'today', label: 'Today' },
  { preset: 'yesterday', label: 'Yesterday' },
  { preset: 'last_7_days', label: 'Last 7 Days' },
  { preset: 'last_30_days', label: 'Last 30 Days' },
  { preset: 'this_month', label: 'This Month' },
  { preset: 'all_time', label: 'All Time' },
];

export const formatKolkataDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface WrongQuestionItem {
  id: number | string;
  questionId?: string;
  questionText: string;
  questionTextBn?: string;
  subject: string;
  chapter?: string;
  difficulty?: string;
  subjectColor: string;
  wrongPercentage: number;
  totalAttempts: number;
  wrongCount?: number;
  accuracyRate?: number;
}

export interface TopicMetricItem {
  rank: number;
  topicId?: string;
  topic: string;
  subject: string;
  subjectBadgeColor: string;
  avgScore: number;
  attempts: number;
}

export interface SubjectMetricItem {
  rank: number;
  subjectId?: string;
  subject: string;
  avgScore: number;
  attempts: number;
  subjectColor: string;
}
