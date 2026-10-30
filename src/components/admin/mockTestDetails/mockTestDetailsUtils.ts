import { Shield, BookOpen, Clock } from 'lucide-react';

export type DrawerTab = 'overview' | 'questions' | 'settings' | 'analytics';

export interface SettingsFormState {
  title: string;
  description: string;
  iconUrl: string;
  durationMinutes: number;
  totalMarks: number;
  passingMarks: number;
  negativeMarking: number;
  isPremium: boolean;
  status: 'draft' | 'published' | 'archived';
}

export interface ScoredAttempt {
  score?: number | null;
}

// Metrics calculation
export function computeAttemptMetrics(attempts: ScoredAttempt[], passingMarks: number) {
  const totalAttemptsCount = attempts.length;
  const avgScore =
    attempts.length > 0
      ? (attempts.reduce((sum, a) => sum + (a.score || 0), 0) / attempts.length).toFixed(1)
      : '0.0';
  const highestScore =
    attempts.length > 0 ? Math.max(...attempts.map((a) => a.score || 0)).toFixed(1) : '0.0';
  const passRate =
    attempts.length > 0
      ? Math.round(
          (attempts.filter((a) => (a.score || 0) >= (passingMarks || 40)).length /
            attempts.length) *
            100
        )
      : 0;
  return { totalAttemptsCount, avgScore, highestScore, passRate };
}

// Type badge colors
export const getTypeBadge = (type: string) => {
  if (type === 'full_mock') {
    return {
      label: 'Full Mock',
      color:
        'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800',
      icon: Shield,
    };
  }
  if (type === 'topic') {
    return {
      label: 'Topic Test',
      color:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800',
      icon: BookOpen,
    };
  }
  return {
    label: 'Official PYQ',
    color:
      'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800',
    icon: Clock,
  };
};
