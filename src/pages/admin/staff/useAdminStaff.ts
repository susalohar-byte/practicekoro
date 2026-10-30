import React, { useState, useMemo, useEffect } from 'react';
import { api } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import {
  AdminUserRecord,
  AdminUserStatus,
  SystemAdminRole,
  SYSTEM_ROLE_CONFIGS,
  backendRoleToUiRole,
} from './staffUtils';
import { INITIAL_ADMIN_USERS } from './demoStaff';

export function useAdminStaff() {
  const [pageLoading, setPageLoading] = useState(true);
  const { user: currentAdmin } = useAuth();

  // Master admins list with localStorage persistence
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_staff_users_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_ADMIN_USERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_staff_users_v2', JSON.stringify(adminUsers));
    } catch {
      // ignore
    }
  }, [adminUsers]);

  // Load real staff members from database/backend
  useEffect(() => {
    let isMounted = true;
    setPageLoading(true);
    api
      .getStaffMembers()
      .then((members) => {
        if (!isMounted) return;
        if (!members || members.length === 0) {
          if (isSupabaseConfigured) setAdminUsers([]);
          return;
        }
        const mapped: AdminUserRecord[] = members.map((m, idx) => {
          const initials = (m.fullName || m.email || 'Admin')
            .split(' ')
            .map((s) => s[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
          return {
            id: m.id,
            num: idx + 1,
            name: m.fullName || 'Admin User',
            isCurrentUser: currentAdmin?.id === m.id || currentAdmin?.email === m.email,
            avatarType: m.avatarUrl ? 'photo' : 'initials',
            avatarSrc: m.avatarUrl,
            avatarInitials: initials || 'AD',
            avatarBgColor: 'bg-blue-100',
            avatarTextColor: 'text-blue-600',
            email: m.email,
            phone: m.phone,
            role: backendRoleToUiRole(m.adminRole),
            status: m.accountStatus === 'inactive' ? 'Inactive' : 'Active',
            lastActive: 'Unavailable',
          };
        });

        if (isSupabaseConfigured) {
          setAdminUsers(mapped);
        } else {
          setAdminUsers((prev) => {
            const serverEmails = new Set(mapped.map((x) => x.email.toLowerCase()));
            const remainingLocal = prev.filter((x) => !serverEmails.has(x.email.toLowerCase()));
            return [...mapped, ...remainingLocal];
          });
        }
      })
      .catch((err) => {
        console.warn('[AdminStaff] Failed to fetch staff members:', err);
        if (isMounted) {
          setToastError(true);
          setToastMessage('Staff records could not be loaded. Please refresh and try again.');
        }
      })
      .finally(() => {
        if (isMounted) setPageLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [currentAdmin?.id, currentAdmin?.email]);

  // Top Navigation Tabs: 'Roles & Permissions' | 'Admin Users' | 'Activity Log'
  const [activeMainTab, setActiveMainTab] = useState<
    'Roles & Permissions' | 'Admin Users' | 'Activity Log'
  >('Roles & Permissions');

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('All Roles');
  const [filterStatus, setFilterStatus] = useState('All Status');

  // Checkbox selections in table
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Action Menu state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Side Panel state: Create New Admin (Neutral initial state - closed by default)
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [panelTab, setPanelTab] = useState<'Basic Info' | 'Role & Permissions' | 'Access Control'>(
    'Basic Info'
  );

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formRole, setFormRole] = useState<SystemAdminRole>('Content Manager');
  const [formStatus, setFormStatus] = useState<AdminUserStatus>('Active');
  const formWelcomeEmail = false;

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastError, setToastError] = useState(false);
  const [isWorking, setIsWorking] = useState(false);

  const showToast = (msg: string, error = false) => {
    setToastError(error);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Close menus on outside click
  useEffect(() => {
    const handleClick = () => setActiveMenuId(null);
    if (activeMenuId !== null) {
      window.addEventListener('click', handleClick);
    }
    return () => window.removeEventListener('click', handleClick);
  }, [activeMenuId]);

  // Filtered admin users
  const filteredAdmins = useMemo(() => {
    return adminUsers.filter((adm) => {
      if (filterRole !== 'All Roles' && adm.role !== filterRole) return false;
      if (filterStatus !== 'All Status' && adm.status !== filterStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          adm.name.toLowerCase().includes(q) ||
          adm.email.toLowerCase().includes(q) ||
          adm.role.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [adminUsers, filterRole, filterStatus, searchQuery]);

  // Synchronized statistics derived reactively from live adminUsers
  const stats = useMemo(() => {
    const total = adminUsers.length;
    const active = adminUsers.filter((a) => a.status === 'Active').length;
    const inactive = adminUsers.filter((a) => a.status === 'Inactive').length;
    const assignedRolesCount = new Set(adminUsers.map((a) => a.role)).size;
    const totalRoles = SYSTEM_ROLE_CONFIGS.length;

    const roleCounts: Record<SystemAdminRole, number> = {
      'Super Admin': 0,
      'Content Manager': 0,
      'Support Manager': 0,
      'Finance Manager': 0,
      Analyst: 0,
    };
    adminUsers.forEach((a) => {
      if (roleCounts[a.role] !== undefined) {
        roleCounts[a.role]++;
      }
    });

    return {
      total,
      active,
      inactive,
      assignedRolesCount,
      totalRoles,
      roleCounts,
    };
  }, [adminUsers]);

  // Dynamic system roles with live adminsCount calculated directly from admin users
  const systemRoles = useMemo(() => {
    return SYSTEM_ROLE_CONFIGS.map((config) => ({
      ...config,
      adminsCount: stats.roleCounts[config.title] || 0,
    }));
  }, [stats.roleCounts]);

  // Pagination calculations and clamped values
  const totalPages = Math.max(1, Math.ceil(filteredAdmins.length / rowsPerPage));
  const currentPageClamped = Math.min(currentPage, totalPages);
  const startIndex = filteredAdmins.length === 0 ? 0 : (currentPageClamped - 1) * rowsPerPage + 1;
  const endIndex = Math.min(currentPageClamped * rowsPerPage, filteredAdmins.length);
  const paginatedAdmins = useMemo(() => {
    return filteredAdmins.slice(
      (currentPageClamped - 1) * rowsPerPage,
      currentPageClamped * rowsPerPage
    );
  }, [filteredAdmins, currentPageClamped, rowsPerPage]);

  // Table selection handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredAdmins.map((a) => a.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterRole('All Roles');
    setFilterStatus('All Status');
    setCurrentPage(1);
    showToast('Filters reset.');
  };

  // Send a Supabase Auth password recovery email (same flow as Students).
  const handleResetPassword = async (email: string) => {
    if (isWorking) return;
    if (!email) {
      showToast('This admin has no email address on record.', true);
      return;
    }
    setIsWorking(true);
    try {
      if (isSupabaseConfigured) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
      }
      showToast(`Password recovery email initiated for ${email}`);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Failed to send password recovery email.',
        true
      );
    } finally {
      setIsWorking(false);
    }
  };

  // Create New Admin submit
  const handleCreateAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formEmail.trim()) {
      showToast('Please enter admin name and email.');
      return;
    }

    if (isWorking) return;
    // Super Admin is reserved for the platform owner account and cannot be assigned here.
    if (!['Content Manager', 'Support Manager'].includes(formRole)) {
      showToast('This role has no supported backend permission mapping.', true);
      return;
    }
    if (formStatus === 'Inactive') {
      showToast('Assign the staff role first, then deactivate the account.', true);
      return;
    }
    setIsWorking(true);
    try {
      const backendRole = formRole === 'Support Manager' ? 'support_agent' : 'content_writer';
      const result = await api.assignStaffByEmail(formEmail.trim(), backendRole, currentAdmin);
      if (!result.success || !result.member) {
        showToast(result.error || 'Staff assignment was not confirmed.', true);
        return;
      }
      const m = result.member;
      setAdminUsers((prev) => [
        ...prev.filter((a) => a.id !== m.id),
        {
          id: m.id,
          num: prev.length + 1,
          name: m.fullName,
          email: m.email,
          phone: m.phone,
          role: backendRoleToUiRole(m.adminRole),
          status: m.accountStatus === 'inactive' ? 'Inactive' : 'Active',
          avatarType: 'initials',
          avatarInitials: m.fullName.slice(0, 2).toUpperCase(),
          avatarBgColor: 'bg-blue-100',
          avatarTextColor: 'text-blue-600',
          lastActive: 'Unavailable',
        },
      ]);
      setFormName('');
      setFormEmail('');
      setFormPhone('');
      setFormPassword('');
      showToast(`Assigned staff role to ${m.fullName}. No new login account was created.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Staff assignment failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    if (isWorking) return;
    const target = adminUsers.find((a) => a.id === id);
    if (!target) return;
    const status = target.status === 'Active' ? 'inactive' : 'active';
    setIsWorking(true);
    try {
      const result = await api.setStaffAccountStatus(id, status);
      if (!result.success) {
        showToast(result.error || 'Status update was not confirmed.', true);
        return;
      }
      setAdminUsers((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: status === 'active' ? 'Active' : 'Inactive' } : a
        )
      );
      showToast('Account status updated in the backend.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Status update failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (
      isWorking ||
      !window.confirm(
        'Remove this staff role? The registered account will remain a student account.'
      )
    )
      return;
    setIsWorking(true);
    try {
      const result = await api.removeStaffMember(id, currentAdmin);
      if (!result.success) {
        showToast(result.error || 'Staff removal was not confirmed.', true);
        return;
      }
      setAdminUsers((prev) => prev.filter((a) => a.id !== id));
      showToast('Staff role removed.');
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Staff removal failed.', true);
    } finally {
      setIsWorking(false);
    }
  };

  return {
    pageLoading,
    currentAdmin,
    adminUsers,
    setAdminUsers,
    activeMainTab,
    setActiveMainTab,
    searchQuery,
    setSearchQuery,
    filterRole,
    setFilterRole,
    filterStatus,
    setFilterStatus,
    selectedIds,
    setSelectedIds,
    activeMenuId,
    setActiveMenuId,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    isSidePanelOpen,
    setIsSidePanelOpen,
    panelTab,
    setPanelTab,
    formName,
    setFormName,
    formEmail,
    setFormEmail,
    formPhone,
    setFormPhone,
    formPassword,
    setFormPassword,
    showPassword,
    setShowPassword,
    formRole,
    setFormRole,
    formStatus,
    setFormStatus,
    formWelcomeEmail,
    toastMessage,
    toastError,
    isWorking,
    showToast,
    filteredAdmins,
    stats,
    systemRoles,
    totalPages,
    currentPageClamped,
    startIndex,
    endIndex,
    paginatedAdmins,
    handleSelectAll,
    handleToggleRow,
    handleResetFilters,
    handleResetPassword,
    handleCreateAdminSubmit,
    handleToggleStatus,
    handleDeleteAdmin,
  };
}

export type AdminStaffState = ReturnType<typeof useAdminStaff>;
