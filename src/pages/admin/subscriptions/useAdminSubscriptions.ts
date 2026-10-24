import React, { useState, useMemo, useEffect } from 'react';
import { csvCell } from '@/utils/csvExport';
import { api } from '@/services/api';
import type { SubscriptionPlan } from '@/types';
import { getRecordedSubscriptionRevenue } from '@/utils/adminFinancialDisplay';
import type { SubscriptionRecord } from './subscriptionTypes';
import { getErrorMessage, mapAdminSubscriptionRow } from './subscriptionMapping';

export function useAdminSubscriptions() {
  // Financial records always start from the backend, not stale demo/cache prices.
  const [subscriptionsList, setSubscriptionsList] = useState<SubscriptionRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem(
        'practicekoro_admin_subscriptions_v2',
        JSON.stringify(subscriptionsList)
      );
    } catch {
      // ignore
    }
  }, [subscriptionsList]);

  // Load live subscriptions from database on mount
  useEffect(() => {
    let isMounted = true;
    api
      .getAllAdminSubscriptions()
      .then((remote) => {
        if (!isMounted) return;
        setRecordsLoading(false);
        if (!remote || remote.length === 0) {
          setSubscriptionsList([]);
          return;
        }
        const mapped = remote.map(mapAdminSubscriptionRow);
        setSubscriptionsList(mapped);
        setSelectedRowId((prev) => {
          if (!prev) return null;
          return mapped.some((m) => m.id === prev) ? prev : null;
        });
      })
      .catch((err) => {
        console.warn('Failed to load admin subscriptions from database:', err);
        if (isMounted) {
          setRecordsLoading(false);
          setRecordsError(
            'Subscriptions could not be fully loaded. Totals and exports are unavailable; please refresh.'
          );
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Selected row (Neutral initial state - nothing selected by default)
  const [selectedRowId, setSelectedRowId] = useState<number | string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState<boolean>(false);

  // Dynamic KPI computations
  const totalSubscriptionsCount = subscriptionsList.length;
  const activeSubscriptionsCount = useMemo(() => {
    return subscriptionsList.filter((s) => s.status === 'Active').length;
  }, [subscriptionsList]);
  const expiringSoonCount = useMemo(() => {
    return subscriptionsList.filter(
      (s) => s.status === 'Active' && (s.daysLeft ?? 0) <= 7 && (s.daysLeft ?? 0) > 0
    ).length;
  }, [subscriptionsList]);
  const expiredSubscriptionsCount = useMemo(() => {
    return subscriptionsList.filter((s) => s.status === 'Expired').length;
  }, [subscriptionsList]);
  const totalRevenueAmount = useMemo(() => {
    return getRecordedSubscriptionRevenue(subscriptionsList);
  }, [subscriptionsList]);
  const revenueUnavailable = subscriptionsList.some(
    (s) =>
      s.paymentId &&
      (s.amount == null ||
        !s.paymentStatus ||
        (s.paymentCurrency != null && s.paymentCurrency !== 'INR'))
  );

  // Checkbox selections
  const [selectedCheckboxes, setSelectedCheckboxes] = useState<(number | string)[]>([]);

  // Filter toolbar states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlan, setFilterPlan] = useState('All Plans');
  const [filterStatus, setFilterStatus] = useState('All Status');
  const [filterMethod, setFilterMethod] = useState('All Payment Methods');

  // Detail panel tabs ('Overview' | 'Payments' | 'Test Access' | 'Activity')
  const [activeDetailTab, setActiveDetailTab] = useState<
    'Overview' | 'Payments' | 'Test Access' | 'Activity'
  >('Overview');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Action Menu State
  const [activeMenuId, setActiveMenuId] = useState<number | string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [isCancellingSubscription, setIsCancellingSubscription] = useState(false);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isChangePlanModalOpen, setIsChangePlanModalOpen] = useState(false);
  // 'today' starts the new plan period now; 'stack' adds it after the current expiry.
  const [changePlanStart, setChangePlanStart] = useState<'today' | 'stack'>('today');
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);

  // Available database plans
  const [availablePlans, setAvailablePlans] = useState<SubscriptionPlan[]>([]);
  const [formStudentName, setFormStudentName] = useState('');
  const [formStudentEmail, setFormStudentEmail] = useState('');
  const [formSelectedPlanId, setFormSelectedPlanId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  // Fetch configured plans from database
  useEffect(() => {
    let mounted = true;
    api
      .getSubscriptionPlans(true)
      .then((plans) => {
        if (mounted && plans && plans.length > 0) {
          const active = plans.filter((p) => p.isActive);
          setAvailablePlans(active);
          if (active.length > 0) {
            setFormSelectedPlanId(active[0].id);
          }
        }
      })
      .catch((err) => console.warn('Could not load subscription plans:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
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

  // Selected subscription
  const selectedSubscription = useMemo(() => {
    if (!selectedRowId) return null;
    return subscriptionsList.find((s) => s.id === selectedRowId) || null;
  }, [subscriptionsList, selectedRowId]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    return subscriptionsList.filter((item) => {
      if (filterPlan !== 'All Plans' && !item.plan.includes(filterPlan.replace(' Plan', '')))
        return false;
      if (filterStatus !== 'All Status' && item.status !== filterStatus) return false;
      if (filterMethod !== 'All Payment Methods' && item.paymentMethod !== filterMethod)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.studentName.toLowerCase().includes(q) ||
          item.studentEmail.toLowerCase().includes(q) ||
          (item.transactionId && item.transactionId.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [subscriptionsList, filterPlan, filterStatus, filterMethod, searchQuery]);

  // Checkbox handlers
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCheckboxes(filteredRows.map((r) => r.id));
    } else {
      setSelectedCheckboxes([]);
    }
  };

  const handleToggleRow = (id: number | string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedCheckboxes((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Export CSV
  const handleExport = () => {
    if (recordsLoading || recordsError) return;
    const headers = [
      'Student Name',
      'Email',
      'Plan',
      'Amount',
      'Payment Method',
      'Start Date',
      'End Date',
      'Status',
      'Days Left',
    ];
    const rows = filteredRows.map((s) => [
      s.studentName,
      s.studentEmail,
      s.plan,
      s.amount,
      s.paymentMethod,
      s.startDate,
      s.endDate,
      s.status,
      s.daysLeft ?? 0,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.map(csvCell).join(','))].join('\n');
    const encodedUri =
      'data:text/csv;charset=utf-8,' +
      encodeURIComponent(csvContent.replace(/^data:text\/csv;charset=utf-8,/, ''));
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `practicekoro_subscriptions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported active subscriptions successfully.');
  };

  // Create Subscription Submit
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formStudentEmail.trim()) {
      showToast('Please enter registered student email.', 'error');
      return;
    }
    if (!formSelectedPlanId) {
      showToast('Please select a valid subscription plan.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createAdminSubscription({
        studentName: formStudentName.trim() || undefined,
        studentEmail: formStudentEmail.trim(),
        planId: formSelectedPlanId,
      });
      if (!res.success) {
        showToast(res.error || 'Subscription creation failed.', 'error');
        return;
      }
      const records = await api.getAllAdminSubscriptions();
      setSubscriptionsList(records.map(mapAdminSubscriptionRow));
      if (res.subscriptionId) setSelectedRowId(res.subscriptionId);
      setIsCreateModalOpen(false);
      setFormStudentName('');
      setFormStudentEmail('');
      showToast(`Subscription activated successfully for ${formStudentEmail.trim()}!`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Could not save the subscription.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cancel Subscription
  const handleCancelSubscription = async (target: SubscriptionRecord | null) => {
    if (!target || isCancellingSubscription || target.status !== 'Active') return;
    if (!window.confirm(`Cancel subscription access for ${target.studentName}?`)) return;
    const targetId = target.id;
    setIsCancellingSubscription(true);
    try {
      const result = await api.cancelSubscription(String(targetId));
      if (!result.success) {
        showToast(result.error || 'Could not cancel the subscription.', 'error');
        return;
      }
      setSubscriptionsList((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                status: 'Expired',
                statusBadgeClass: 'bg-[#FEE2E2] text-[#DC2626]',
                daysLeft: 0,
                endDate: result.expiresAt
                  ? new Date(result.expiresAt).toLocaleDateString('en-GB', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })
                  : s.endDate,
              }
            : s
        )
      );
      showToast(`Subscription cancelled for ${target.studentName}.`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Could not cancel the subscription.', 'error');
    } finally {
      setIsCancellingSubscription(false);
    }
  };

  // Extend Subscription Action
  const handleExtendConfirm = async (days: number) => {
    if (!selectedSubscription || isSubmitting) return;
    const targetId = selectedSubscription.id;
    try {
      setIsSubmitting(true);
      const res = await api.extendSubscription(targetId, days);
      if (!res.success) {
        showToast(res.error || 'Failed to extend subscription.', 'error');
        return;
      }

      const formattedNewEnd = res.newExpiresAt
        ? new Date(res.newExpiresAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : selectedSubscription.endDate;

      const newDaysLeft = res.newExpiresAt
        ? Math.max(0, Math.ceil((new Date(res.newExpiresAt).getTime() - Date.now()) / 86400000))
        : (selectedSubscription.daysLeft || 0) + days;

      setSubscriptionsList((prev) =>
        prev.map((s) =>
          s.id === targetId
            ? {
                ...s,
                status: 'Active',
                statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
                daysLeft: newDaysLeft,
                endDate: formattedNewEnd,
              }
            : s
        )
      );
      setIsExtendModalOpen(false);
      showToast(`Extended subscription by ${days} days for ${selectedSubscription.studentName}.`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to extend subscription in database.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Change Plan Action
  const handleChangePlanConfirm = async (plan: SubscriptionPlan) => {
    if (!selectedSubscription || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const res = await api.changeSubscriptionPlan(
        selectedSubscription.id,
        plan.id,
        changePlanStart
      );
      if (!res.success) {
        showToast(res.error || 'Failed to update plan.', 'error');
        return;
      }

      const formattedNewEnd = res.newExpiresAt
        ? new Date(res.newExpiresAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })
        : selectedSubscription.endDate;

      const newDaysLeft = res.newExpiresAt
        ? Math.max(0, Math.ceil((new Date(res.newExpiresAt).getTime() - Date.now()) / 86400000))
        : selectedSubscription.daysLeft;

      setSubscriptionsList((prev) =>
        prev.map((s) =>
          s.id === selectedSubscription.id
            ? {
                ...s,
                plan: res.planTitle || plan.title,
                planFullTitle: res.planTitle || plan.title,
                endDate: formattedNewEnd,
                daysLeft: newDaysLeft,
                status: 'Active',
                statusBadgeClass: 'bg-[#DCFCE7] text-[#15803D]',
              }
            : s
        )
      );
      setIsChangePlanModalOpen(false);
      showToast(
        `Plan upgraded to "${res.planTitle || plan.title}" for ${selectedSubscription.studentName}!`
      );
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to change subscription plan.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Notification Action
  const handleSendReminder = async () => {
    if (!selectedSubscription || isSubmitting) return;
    const msg =
      notificationMessage.trim() ||
      `Hello ${selectedSubscription.studentName}, your PracticeKoro ${selectedSubscription.planFullTitle} has ${selectedSubscription.daysLeft ?? 0} days remaining. Renew today to maintain uninterrupted mock test access!`;

    if (!selectedSubscription.userId) {
      showToast('Student user profile ID is missing.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createTargetedNotification({
        title: 'Subscription Reminder',
        message: msg,
        channel: 'in_app',
        userIds: [selectedSubscription.userId],
      });
      if (!res.success) {
        showToast(res.error || 'Failed to send notification.', 'error');
        return;
      }
      setIsNotificationModalOpen(false);
      setNotificationMessage('');
      showToast(`In-app notification sent to ${selectedSubscription.studentName}!`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Failed to send notification.'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    subscriptionsList,
    setSubscriptionsList,
    recordsLoading,
    setRecordsLoading,
    recordsError,
    setRecordsError,
    selectedRowId,
    setSelectedRowId,
    isDetailsPanelOpen,
    setIsDetailsPanelOpen,
    selectedCheckboxes,
    setSelectedCheckboxes,
    searchQuery,
    setSearchQuery,
    filterPlan,
    setFilterPlan,
    filterStatus,
    setFilterStatus,
    filterMethod,
    setFilterMethod,
    activeDetailTab,
    setActiveDetailTab,
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
    activeMenuId,
    setActiveMenuId,
    toastMessage,
    setToastMessage,
    toastType,
    setToastType,
    isCancellingSubscription,
    setIsCancellingSubscription,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isExtendModalOpen,
    setIsExtendModalOpen,
    isChangePlanModalOpen,
    setIsChangePlanModalOpen,
    changePlanStart,
    setChangePlanStart,
    isNotificationModalOpen,
    setIsNotificationModalOpen,
    availablePlans,
    setAvailablePlans,
    formStudentName,
    setFormStudentName,
    formStudentEmail,
    setFormStudentEmail,
    formSelectedPlanId,
    setFormSelectedPlanId,
    isSubmitting,
    setIsSubmitting,
    notificationMessage,
    setNotificationMessage,
    totalSubscriptionsCount,
    activeSubscriptionsCount,
    expiringSoonCount,
    expiredSubscriptionsCount,
    totalRevenueAmount,
    revenueUnavailable,
    showToast,
    selectedSubscription,
    filteredRows,
    handleSelectAll,
    handleToggleRow,
    handleExport,
    handleCreateSubmit,
    handleCancelSubscription,
    handleExtendConfirm,
    handleChangePlanConfirm,
    handleSendReminder,
  };
}

export type AdminSubscriptionsState = ReturnType<typeof useAdminSubscriptions>;
