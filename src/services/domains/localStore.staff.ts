import type { SupportTicketItem, AdminAuditLog, AdminStaffMember } from '@/types';

export const localSupportTickets: SupportTicketItem[] = [
  {
    id: 'tkt_101',
    userId: 'user_student_1',
    studentName: 'Sourav Ganguly',
    studentEmail: 'sourav.aspirant@example.com',
    subject: 'Question 14 Answer Key in WBCS Prelims Mock #2',
    issue:
      'In question 14, option B was marked correct, but according to latest syllabus Option C is verified by standard texts.',
    category: 'Test Issue',
    priority: 'medium',
    status: 'open',
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString(),
  },
  {
    id: 'tkt_102',
    userId: 'user_student_2',
    studentName: 'Ananya Roy',
    studentEmail: 'ananya.wb@example.com',
    subject: 'UPI Payment debited but Pro Pass delayed',
    issue:
      'I paid ₹499 via Google Pay for 1-Year Pro Pass. UTR 428198271891. Please verify and activate.',
    category: 'Payment Issue',
    priority: 'high',
    status: 'resolved',
    resolutionNotes:
      'Verified with gateway logs. Transaction was captured. Pro Pass manually renewed for 365 days.',
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export const localStaffUsers: AdminStaffMember[] = [
  {
    id: 'staff_super_admin',
    email: 'admin@practicekoro.online',
    fullName: 'Chief Super Admin',
    role: 'admin',
    adminRole: 'super_admin',
    createdAt: new Date(Date.now() - 3600000 * 24 * 30).toISOString(),
  },
  {
    id: 'staff_content_writer',
    email: 'writer@practicekoro.online',
    fullName: 'Debabrata Mukherjee (Content Specialist)',
    role: 'admin',
    adminRole: 'content_writer',
    createdAt: new Date(Date.now() - 3600000 * 24 * 14).toISOString(),
  },
  {
    id: 'staff_support_agent',
    email: 'support.lead@practicekoro.online',
    fullName: 'Priya Sen (Student Support Lead)',
    role: 'admin',
    adminRole: 'support_agent',
    createdAt: new Date(Date.now() - 3600000 * 24 * 7).toISOString(),
  },
];

export const localAuditLogs: AdminAuditLog[] = [
  {
    id: 'log_001',
    adminEmail: 'admin@practicekoro.online',
    adminName: 'Chief Super Admin',
    adminRole: 'super_admin',
    action: 'SETTINGS_UPDATE',
    entityType: 'settings',
    entityId: 'sys_maintenance_mode',
    entityName: 'Platform Maintenance Mode',
    details: { maintenance_mode: false },
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'log_002',
    adminEmail: 'writer@practicekoro.online',
    adminName: 'Debabrata Mukherjee',
    adminRole: 'content_writer',
    action: 'QUESTION_CREATE',
    entityType: 'question',
    entityId: 'q-wbp-const-001',
    entityName: 'WBP Constable Reasoning Pattern Q1',
    details: { exam: 'WBP Constable', subject: 'Reasoning', hasDiagram: true },
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'log_003',
    adminEmail: 'admin@practicekoro.online',
    adminName: 'Chief Super Admin',
    adminRole: 'super_admin',
    action: 'SUBSCRIPTION_MANUAL_GRANT',
    entityType: 'subscription',
    entityId: 'sub_manual_102',
    entityName: 'Ananya Roy (ananya.wb@example.com)',
    details: { plan: '1-Year Pro Pass', durationDays: 365, note: 'Resolved UPI discrepancy' },
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
