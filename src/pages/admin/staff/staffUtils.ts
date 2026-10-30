// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export type SystemAdminRole =
  'Super Admin' | 'Content Manager' | 'Support Manager' | 'Finance Manager' | 'Analyst';

export type AdminUserStatus = 'Active' | 'Inactive';

export interface AdminUserRecord {
  id: string;
  num: number;
  name: string;
  isCurrentUser?: boolean;
  avatarType: 'photo' | 'initials';
  avatarSrc?: string;
  avatarInitials?: string;
  avatarBgColor?: string;
  avatarTextColor?: string;
  email: string;
  phone?: string;
  role: SystemAdminRole;
  status: AdminUserStatus;
  lastActive: string;
}

export interface SystemRoleCardData {
  title: SystemAdminRole;
  description: string;
  adminsCount: number;
  permissionsPercentage: number;
  iconBg: string;
  iconColor: string;
  rolePillClass: string;
}

// Static system role definitions (metadata, styling, and base permissions)
export const SYSTEM_ROLE_CONFIGS: Omit<SystemRoleCardData, 'adminsCount'>[] = [
  {
    title: 'Super Admin',
    description: 'Full access to all features',
    permissionsPercentage: 100,
    iconBg: 'bg-[#EDE9FE]',
    iconColor: 'text-[#7C3AED]',
    rolePillClass: 'bg-[#EDE9FE] text-[#7C3AED]',
  },
  {
    title: 'Content Manager',
    description: 'Manage questions, tests, exams',
    permissionsPercentage: 65,
    iconBg: 'bg-[#DBEAFE]',
    iconColor: 'text-[#2563EB]',
    rolePillClass: 'bg-[#DBEAFE] text-[#1D4ED8]',
  },
  {
    title: 'Support Manager',
    description: 'Handle support and communication',
    permissionsPercentage: 40,
    iconBg: 'bg-[#DCFCE7]',
    iconColor: 'text-[#16A34A]',
    rolePillClass: 'bg-[#DCFCE7] text-[#15803D]',
  },
  {
    title: 'Finance Manager',
    description: 'Manage payments and subscriptions',
    permissionsPercentage: 45,
    iconBg: 'bg-[#FEF3C7]',
    iconColor: 'text-[#D97706]',
    rolePillClass: 'bg-[#FEF3C7] text-[#B45309]',
  },
  {
    title: 'Analyst',
    description: 'View analytics and performance',
    permissionsPercentage: 30,
    iconBg: 'bg-[#FEE2E2]',
    iconColor: 'text-[#DC2626]',
    rolePillClass: 'bg-[#FEE2E2] text-[#DC2626]',
  },
];

// Helper to get role badge pill style
export const getRoleBadgeClass = (role: SystemAdminRole) => {
  switch (role) {
    case 'Super Admin':
      return 'bg-[#EDE9FE] text-[#7C3AED]';
    case 'Content Manager':
      return 'bg-[#DBEAFE] text-[#1D4ED8]';
    case 'Support Manager':
      return 'bg-[#DCFCE7] text-[#15803D]';
    case 'Finance Manager':
      return 'bg-[#FEF3C7] text-[#B45309]';
    case 'Analyst':
      return 'bg-[#FEE2E2] text-[#DC2626]';
  }
};

// Helper to convert backend role to UI role
export const backendRoleToUiRole = (role?: string): SystemAdminRole => {
  if (role === 'super_admin') return 'Super Admin';
  if (role === 'support_agent') return 'Support Manager';
  if (role === 'finance_manager') return 'Finance Manager';
  if (role === 'analyst') return 'Analyst';
  return 'Content Manager';
};
