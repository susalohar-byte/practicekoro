import type { AdminStudentRow } from '@/types';
import { type SubscriptionTier, type EnrichedStudent } from './studentTypes';

// Helper to convert DB row to EnrichedStudent
export function mapDbRowToStudent(row: AdminStudentRow, index: number): EnrichedStudent {
  let plan: SubscriptionTier = 'Free';
  if (row.isPro) {
    if (row.planTitle?.includes('Year') || row.planTitle?.includes('12')) {
      plan = '1 Year';
    } else if (row.planTitle?.includes('Month') && !row.planTitle?.includes('6')) {
      plan = '1 Month';
    } else {
      plan = '6 Months';
    }
  }

  const initials = row.fullName
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const rawAvatar = row.avatarUrl?.trim();
  const validAvatar =
    rawAvatar && rawAvatar !== 'null' && rawAvatar !== 'undefined' ? rawAvatar : undefined;

  return {
    id: row.id,
    studentIdFormatted: `#STU${(100000 + index + 1).toString().slice(1)}`,
    order: index + 1,
    fullName: row.fullName,
    email: row.email,
    phone: row.phone || '',
    avatarUrl: validAvatar,
    initials: initials || 'ST',
    initialsBg: 'bg-blue-100 dark:bg-blue-950/60',
    initialsColor: 'text-[#026BFC] dark:text-blue-400',
    subscriptionPlan: plan,
    subscriptionValidTill: row.expiresAt
      ? new Date(row.expiresAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Unavailable',
    subscriptionMonthsLeft: row.expiresAt
      ? `${Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 86400000))} days left`
      : 'Unavailable',
    testsAttempted: row.totalAttempts || 0,
    avgScore: row.avgScore ?? null,
    bestScore: null,
    daysActive: null,
    lastActive: row.lastActive
      ? new Date(row.lastActive).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      : 'Unavailable',
    status:
      row.accountStatus === 'active'
        ? 'Active'
        : row.accountStatus === 'inactive'
          ? 'Inactive'
          : 'Unavailable',
    joinedDate: row.createdAt
      ? new Date(row.createdAt).toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })
      : 'Unavailable',
    location: row.district ? `${row.district}, WB` : 'West Bengal, India',
    targetExam: row.targetExamTitle || 'WBP Constable',
    activities: [],
  };
}
