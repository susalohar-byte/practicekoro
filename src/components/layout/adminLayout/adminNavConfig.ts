import type React from 'react';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  Shield,
  BookMarked,
  FolderTree,
  Image as ImageIcon,
  Users,
  FileCheck,
  CreditCard,
  Crown,
  MapPin,
  Activity,
  Target,
  Receipt,
  Tag,
  TicketPercent,
  Bell,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  Radio,
} from 'lucide-react';
import type { AdminPermissions } from '@/types';

export interface NavSubItem {
  label: string;
  path: string;
  altPaths?: string[];
  permission?: keyof AdminPermissions;
  icon?: React.ComponentType<{ className?: string }>;
}

export interface NavItem {
  key: string;
  label: string;
  path?: string;
  icon: React.ComponentType<{ className?: string }>;
  end?: boolean;
  altPaths?: string[];
  badge?: string | number;
  badgeColor?: string;
  permission?: keyof AdminPermissions;
  children?: NavSubItem[];
}

export interface NavSection {
  title?: string;
  items: NavItem[];
}

// Locked final admin sidebar matching exact reference screenshot
export const RAW_NAV_SECTIONS: NavSection[] = [
  {
    items: [
      {
        key: 'dashboard',
        label: 'Dashboard',
        path: '/admin',
        icon: LayoutDashboard,
        end: true,
      },
    ],
  },
  {
    title: 'CONTENT',
    items: [
      {
        key: 'question-bank',
        label: 'Question Bank',
        path: '/admin/question-bank',
        altPaths: ['/admin/questions'],
        icon: BookOpen,
        permission: 'canManageQuestions',
      },
      {
        key: 'mock-tests',
        label: 'Mock Test Management',
        path: '/admin/mock-tests',
        altPaths: ['/admin/tests', '/admin/test-questions'],
        icon: FileText,
        permission: 'canManageTests',
      },
      {
        key: 'live-tests',
        label: 'Live Test',
        path: '/admin/live-tests',
        icon: Radio,
        permission: 'canManageTests',
      },
      {
        key: 'exams',
        label: 'Exams',
        path: '/admin/exams',
        icon: Shield,
        permission: 'canManageExams',
      },
      {
        key: 'subjects',
        label: 'Subjects',
        path: '/admin/subjects',
        icon: BookMarked,
        permission: 'canManageExams',
      },
      {
        key: 'topics',
        label: 'Topics',
        path: '/admin/topics',
        altPaths: ['/admin/topic-manage', '/admin/chapters'],
        icon: FolderTree,
        permission: 'canManageExams',
      },
      {
        key: 'banners',
        label: 'Banners',
        path: '/admin/banners',
        icon: ImageIcon,
        permission: 'canManageExams',
      },
      {
        key: 'blog',
        label: 'Blog',
        path: '/admin/blog',
        icon: FileText,
        permission: 'canManageSettings',
      },
    ],
  },
  {
    title: 'STUDENTS',
    items: [
      {
        key: 'students',
        label: 'Students',
        path: '/admin/students',
        icon: Users,
        permission: 'canManageSubscriptions',
      },
      {
        key: 'test-attempts',
        label: 'Test Attempts',
        path: '/admin/test-attempts',
        icon: FileCheck,
        permission: 'canManageTests',
      },
      {
        key: 'subscriptions',
        label: 'Subscriptions',
        path: '/admin/subscriptions',
        altPaths: ['/admin/pro-users'],
        icon: CreditCard,
        permission: 'canManageSubscriptions',
      },
    ],
  },
  {
    title: 'RANK & PERFORMANCE',
    items: [
      {
        key: 'rankings',
        label: 'Rankings',
        path: '/admin/rankings',
        icon: Crown,
        permission: 'canManageTests',
      },
      {
        key: 'district-rankings',
        label: 'District Rankings',
        path: '/admin/district-rankings',
        icon: MapPin,
        permission: 'canManageTests',
      },
      {
        key: 'performance',
        label: 'Performance',
        path: '/admin/performance',
        icon: Activity,
        permission: 'canManageTests',
      },
      {
        key: 'cutoff',
        label: 'Cutoff',
        path: '/admin/cutoff',
        icon: Target,
        permission: 'canManageTests',
      },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      {
        key: 'payments',
        label: 'Payments',
        path: '/admin/payments',
        altPaths: ['/admin/revenue', '/admin/financials'],
        icon: Receipt,
        permission: 'canManageSubscriptions',
      },
      {
        key: 'subscription-plans',
        label: 'Subscription Plans',
        path: '/admin/subscription-plans',
        icon: Tag,
        permission: 'canManageSubscriptions',
      },
      {
        key: 'coupons',
        label: 'Coupons',
        path: '/admin/coupons',
        icon: TicketPercent,
        permission: 'canManageCoupons',
      },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      {
        key: 'notifications',
        label: 'Notifications',
        path: '/admin/notifications',
        icon: Bell,
        permission: 'canManageNotifications',
      },
      {
        key: 'support',
        label: 'Support',
        path: '/admin/support',
        icon: HelpCircle,
        permission: 'canManageSupport',
      },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      {
        key: 'analytics',
        label: 'Analytics & Insights',
        path: '/admin/analytics',
        altPaths: ['/admin/analytics-insights', '/admin/insights'],
        icon: BarChart3,
        permission: 'canManageSubscriptions',
      },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      {
        key: 'admins',
        label: 'Admins & Roles',
        path: '/admin/admins',
        altPaths: ['/admin/staff'],
        icon: ShieldCheck,
        permission: 'canManageStaff',
      },
      {
        key: 'audit-logs',
        label: 'Audit Logs',
        path: '/admin/audit-logs',
        icon: History,
        permission: 'canViewAuditLogs',
      },
      {
        key: 'settings',
        label: 'Settings',
        path: '/admin/settings',
        icon: Settings,
        permission: 'canManageSettings',
      },
    ],
  },
];
