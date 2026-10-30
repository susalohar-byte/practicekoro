import type { AdminAuditLog } from '@/types';

// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type AuditSeverity = 'Info' | 'Warning' | 'High';

export interface AuditLogItem {
  id: string;
  num: number;
  date: string;
  time: string;
  adminName: string;
  adminEmail: string;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Login' | 'Viewed' | 'Refunded' | 'Changed';
  resource:
    | 'Question'
    | 'Test Series'
    | 'Mock Test'
    | 'Coupon'
    | 'Subscription'
    | 'System'
    | 'Student'
    | 'Payment'
    | 'Settings'
    | 'Subject'
    | 'Banner';
  details: string;
  fullDetails?: string;
  resourceId?: string;
  ipAddress: string;
  browser?: string;
  device?: string;
  location?: string;
  severity: AuditSeverity;
  jsonData?: Record<string, unknown>;
}

// Resource Badge Helper
export const getResourceBadge = (res: AuditLogItem['resource']) => {
  switch (res) {
    case 'Question':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/70';
    case 'Test Series':
    case 'Subscription':
    case 'Subject':
      return 'bg-[#EDE9FE] text-[#7C3AED] border border-purple-200/70';
    case 'Mock Test':
    case 'Banner':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/70';
    case 'Coupon':
    case 'Student':
      return 'bg-[#DCFCE7] text-[#15803D] border border-emerald-200/70';
    case 'Payment':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/70';
    case 'System':
    case 'Settings':
    default:
      return 'bg-slate-100 text-slate-600 border border-slate-200/70';
  }
};

// Severity Badge Helper
export const getSeverityBadge = (sev: AuditSeverity) => {
  switch (sev) {
    case 'Info':
      return 'bg-[#DBEAFE] text-[#1D4ED8] border border-blue-200/70';
    case 'Warning':
      return 'bg-[#FEF3C7] text-[#B45309] border border-amber-200/70';
    case 'High':
      return 'bg-[#FEE2E2] text-[#DC2626] border border-rose-200/70';
  }
};

// Raw audit actions come from DB triggers (insert/update/delete) or legacy client logs.
export function mapAuditAction(action: string): AuditLogItem['action'] {
  const a = action.toLowerCase();
  if (a.includes('insert') || a.includes('create') || a.includes('add')) return 'Created';
  if (a.includes('delete') || a.includes('revoke')) return 'Deleted';
  if (a.includes('refund')) return 'Refunded';
  if (a.includes('view')) return 'Viewed';
  if (a.includes('login')) return 'Login';
  if (a.includes('change')) return 'Changed';
  return 'Updated';
}

// Entity types are table names from DB triggers (questions, hero_banners, …) or legacy singular names.
const AUDIT_RESOURCE_BY_ENTITY: Record<string, AuditLogItem['resource']> = {
  question: 'Question',
  questions: 'Question',
  test_series: 'Test Series',
  test: 'Mock Test',
  tests: 'Mock Test',
  live_tests: 'Mock Test',
  test_questions: 'Mock Test',
  test_exams: 'Mock Test',
  coupon: 'Coupon',
  coupons: 'Coupon',
  subscription: 'Subscription',
  subscriptions: 'Subscription',
  subscription_plans: 'Subscription',
  user: 'Student',
  student: 'Student',
  profiles: 'Student',
  student_notes: 'Student',
  student_batches: 'Student',
  student_batch_members: 'Student',
  payment: 'Payment',
  payments: 'Payment',
  payment_gateways: 'Payment',
  settings: 'Settings',
  app_settings: 'Settings',
  subject: 'Subject',
  subjects: 'Subject',
  chapters: 'Subject',
  banner: 'Banner',
  hero_banners: 'Banner',
};
export function mapAuditResource(entityType: string): AuditLogItem['resource'] {
  return AUDIT_RESOURCE_BY_ENTITY[(entityType || '').toLowerCase()] || 'System';
}

export const AUDIT_PAGE_SIZE = 100;

export function mapAuditLog(log: AdminAuditLog, idx: number): AuditLogItem {
  const dt = new Date(log.createdAt);
  const dateStr = dt.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = dt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
  const initials = (log.adminName || log.adminEmail || 'AD')
    .split(' ')
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const action = mapAuditAction(log.action);
  return {
    id: log.id,
    num: idx + 1,
    date: dateStr,
    time: timeStr,
    adminName: log.adminName || 'Admin',
    adminEmail: log.adminEmail || '',
    avatarType: 'initials',
    avatarInitials: initials,
    avatarBgColor: 'bg-blue-100',
    avatarTextColor: 'text-blue-600',
    action,
    resource: mapAuditResource(log.entityType),
    details:
      log.details?.source !== 'database_trigger'
        ? 'Legacy client log (unverified)'
        : log.entityName
          ? `${log.action} ${log.entityName}`.slice(0, 30) + '...'
          : log.action,
    fullDetails: log.entityName
      ? `${log.action}: ${log.entityName}`
      : JSON.stringify(log.details || {}),
    resourceId: log.entityId,
    ipAddress: log.ipAddress || 'Not recorded',
    severity: action === 'Deleted' ? 'Warning' : 'Info',
    jsonData: {
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      details: log.details,
      adminRole: log.adminRole,
    },
  };
}
