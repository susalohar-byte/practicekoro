import { csvCell } from '@/utils/csvExport';
import type { PlatformAnalyticsData } from '@/types';

export function analyticsCsv(data: PlatformAnalyticsData, period: string) {
  const rows = [
    ['Metric', 'Value', 'Scope'],
    ['Total students', data.studentPerformance.totalStudents, 'Current student profiles'],
    ['New students', data.studentPerformance.newStudents ?? 'Unavailable', period],
    ['Active students', data.studentPerformance.activeStudents, period],
    ['Tests started', data.studentPerformance.testsAttempted, period],
    ['Answered questions', data.studentPerformance.questionsAnswered, period],
    ['Accuracy (%)', data.studentPerformance.overallAccuracy, period],
    ['Retained revenue (INR)', data.revenue.totalRevenue, period],
    ['Distinct paying students', data.revenue.paidStudents, period],
    ['Active Pro students', data.revenue.activeSubscriptions, 'Current unexpired subscriptions'],
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n');
}
