import type { UserProfile } from '@/types';

export const MOCK_STUDENT_USER: UserProfile = {
  id: 'usr-student-001',
  fullName: 'Subhamoy Banerjee',
  email: 'student@practicekoro.com',
  phone: '+91 98765 43210',
  avatarUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  targetExamId: 'wbp-constable',
  role: 'student',
  createdAt: '2025-01-10T10:00:00Z',
};

export const MOCK_ADMIN_USER: UserProfile = {
  id: 'usr-admin-001',
  fullName: 'Admin PracticeKoro',
  email: 'admin@practicekoro.online',
  phone: '+91 98300 12345',
  avatarUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  role: 'admin',
  createdAt: '2024-12-01T10:00:00Z',
};
