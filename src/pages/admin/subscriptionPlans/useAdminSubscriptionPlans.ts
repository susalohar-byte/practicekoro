import { isSupabaseConfigured } from '@/lib/supabase';
import React, { useCallback, useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import type { AdminSubscriptionRow, AdminDashboardV2Stats } from '@/types';
import type {
  PlanFeature,
  SubscriptionPlanItem,
  RecentSubscriptionItem,
} from './subscriptionPlanTypes';
import { INITIAL_PLANS } from './subscriptionPlanData';

export function useAdminSubscriptionPlans() {
  const [pageLoading, setPageLoading] = useState(true);
  const [subscriptionsList, setSubscriptionsList] = useState<AdminSubscriptionRow[]>([]);
  const [dashboardStats, setDashboardStats] = useState<AdminDashboardV2Stats | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlanItem[]>(() => {
    if (isSupabaseConfigured) return [];
    try {
      const stored = localStorage.getItem('practicekoro_admin_plans_v2');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return INITIAL_PLANS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('practicekoro_admin_plans_v2', JSON.stringify(plans));
    } catch {
      // ignore
    }
  }, [plans]);

  // Billing Cycle Toggle (Monthly vs Yearly)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Modals state
  const [isAddPlanModalOpen, setIsAddPlanModalOpen] = useState(false);
  const [isViewActiveModalOpen, setIsViewActiveModalOpen] = useState(false);
  const [isViewAllRecentOpen, setIsViewAllRecentOpen] = useState(false);
  const [selectedPlanForPurchase, setSelectedPlanForPurchase] =
    useState<SubscriptionPlanItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states for Add Plan
  const [formPlanName, setFormPlanName] = useState('');
  const [formPlanSubtitle, setFormPlanSubtitle] = useState('');
  const [formPlanPrice, setFormPlanPrice] = useState('149');
  const [formPlanOriginalPrice, setFormPlanOriginalPrice] = useState('299');
  const [formPlanDurationDays, setFormPlanDurationDays] = useState('180');
  const [formPlanRenewalWindow, setFormPlanRenewalWindow] = useState('');
  const [formPlanBadge, setFormPlanBadge] = useState('');
  const [formPlanFeatures, setFormPlanFeatures] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Form states for Edit Plan
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlanItem | null>(null);
  const [isEditPlanModalOpen, setIsEditPlanModalOpen] = useState(false);
  const [editPlanName, setEditPlanName] = useState('');
  const [editPlanSubtitle, setEditPlanSubtitle] = useState('');
  const [editPlanPrice, setEditPlanPrice] = useState('99');
  const [editPlanOriginalPrice, setEditPlanOriginalPrice] = useState('179');
  const [editPlanDurationDays, setEditPlanDurationDays] = useState('180');
  const [editPlanRenewalWindow, setEditPlanRenewalWindow] = useState('');
  const [editPlanBadge, setEditPlanBadge] = useState('');
  const [editPlanFeatures, setEditPlanFeatures] = useState('');
  const [editButtonText, setEditButtonText] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  const loadPlans = useCallback(async () => {
    setPageLoading(true);
    try {
      const [plansSettled, subsSettled, statsSettled] = await Promise.allSettled([
        api.getSubscriptionPlans(true),
        api.getAllAdminSubscriptions(),
        api.getAdminDashboardV2Stats(),
      ]);

      if (plansSettled.status === 'fulfilled') {
        const remote = plansSettled.value;
        if (isSupabaseConfigured && (!remote || !remote.length)) setPlans([]);
        if (remote && remote.length > 0) {
          const mapped: SubscriptionPlanItem[] = remote.map((p) => {
            let icon: 'free' | 'basic' | 'pro' | 'ultimate' = 'basic';
            const titleLower = (p.title || '').toLowerCase();
            if (titleLower.includes('free')) icon = 'free';
            else if (titleLower.includes('ultimate')) icon = 'ultimate';
            else if (titleLower.includes('pro')) icon = 'pro';

            return {
              id: p.id,
              name: p.title,
              subtitle: p.description || 'Complete PracticeKoro test preparation access',
              price: p.price,
              originalPrice: p.originalPrice ?? p.price,
              durationDays: p.durationDays || 30,
              renewalWindowDays: p.renewalWindowDays ?? null,
              badge: p.id === 'pro_1_year' ? 'Best Value' : undefined,
              badgeColor: 'bg-[#F43F5E] text-white',
              buttonText: p.price === 0 ? 'Current Plan' : `Get ${p.title}`,
              buttonClass:
                p.price === 0
                  ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-default'
                  : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-2xs',
              themeColor: p.price === 0 ? '#16A34A' : '#0284C7',
              borderClass: 'border-slate-200/80',
              bgClass: 'bg-white',
              iconType: icon,
              features:
                Array.isArray(p.features) && p.features.length > 0
                  ? p.features.map((f) => ({ text: f, included: true }))
                  : [],
            };
          });
          setPlans(mapped);
        }
      } else {
        // The plans are the page itself, so tell the admin instead of failing silently
        const reason = plansSettled.reason;
        showToast(
          reason instanceof Error ? reason.message : 'Subscription plans could not be loaded.'
        );
      }

      if (subsSettled.status === 'fulfilled' && Array.isArray(subsSettled.value)) {
        setSubscriptionsList(subsSettled.value);
      } else if (subsSettled.status === 'rejected') {
        console.warn('Failed to load admin subscriptions:', subsSettled.reason);
      }

      if (statsSettled.status === 'fulfilled' && statsSettled.value) {
        setDashboardStats(statsSettled.value);
      } else if (statsSettled.status === 'rejected') {
        console.warn('Failed to load dashboard stats for subscriptions:', statsSettled.reason);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Subscription plans could not be loaded.');
    } finally {
      setPageLoading(false);
    }
  }, [showToast]);

  // Load live subscription plans from database on mount
  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  // Handle Add Plan Submit
  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingAdd) return;

    if (!formPlanName.trim()) {
      showToast('Plan name is required.');
      return;
    }

    const priceTrimmed = formPlanPrice.trim();
    const priceNum = Number(priceTrimmed);
    if (priceTrimmed === '' || isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price (₹0 or greater).');
      return;
    }

    const durationTrimmed = formPlanDurationDays.trim();
    const durationNum = parseInt(durationTrimmed, 10);
    if (durationTrimmed === '' || isNaN(durationNum) || durationNum <= 0) {
      showToast('Please enter a valid duration in days (greater than 0).');
      return;
    }
    const renewalWindowDays = parseRenewalWindow(formPlanRenewalWindow, durationNum);
    if (renewalWindowDays === undefined) return;

    const origPriceTrimmed = formPlanOriginalPrice.trim();
    let origPriceNum = priceNum;
    if (origPriceTrimmed !== '') {
      origPriceNum = Number(origPriceTrimmed);
      if (isNaN(origPriceNum) || origPriceNum < 0) {
        showToast('Original price must be a valid non-negative number.');
        return;
      }
    }

    const featureItems: PlanFeature[] = formPlanFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((text) => ({ text, included: true }));

    const planId = `plan_${Date.now()}`;
    setIsSubmittingAdd(true);

    try {
      const res = await api.createSubscriptionPlan({
        id: planId,
        title: formPlanName.trim(),
        name: formPlanName.trim(),
        description: formPlanSubtitle.trim() || 'Customized plan package',
        durationDays: durationNum,
        price: priceNum,
        originalPrice: origPriceNum,
        currency: 'INR',
        features: featureItems.map((f) => f.text),
        isActive: true,
        orderIndex: 99,
        renewalWindowDays,
      });

      if (!res.success) {
        showToast(res.error || 'Failed to create plan on backend.');
        setIsSubmittingAdd(false);
        return;
      }

      await loadPlans();
      setIsAddPlanModalOpen(false);
      showToast(`Subscription plan "${formPlanName.trim()}" created successfully.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error creating subscription plan.');
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Renewal window: blank = plan cannot be renewed (upgrade or repurchase after expiry).
  const parseRenewalWindow = (raw: string, durationDays: number): number | null | undefined => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const days = parseInt(trimmed, 10);
    if (isNaN(days) || days < 1 || days > 90 || days >= durationDays) {
      showToast('Renewal window must be 1–90 days and shorter than the plan duration, or blank.');
      return undefined;
    }
    return days;
  };

  const handleOpenEditModal = (plan: SubscriptionPlanItem) => {
    setEditingPlan(plan);
    setEditPlanName(plan.name);
    setEditPlanSubtitle(plan.subtitle);
    setEditPlanPrice(String(plan.price));
    setEditPlanOriginalPrice(String(plan.originalPrice || plan.price));
    setEditPlanDurationDays(String(plan.durationDays || 30));
    setEditPlanRenewalWindow(plan.renewalWindowDays ? String(plan.renewalWindowDays) : '');
    setEditPlanBadge(plan.badge || '');
    setEditPlanFeatures(plan.features.map((f) => f.text).join('\n'));
    setEditButtonText(plan.buttonText);
    setIsEditPlanModalOpen(true);
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || isSubmittingEdit) return;

    if (!editPlanName.trim()) {
      showToast('Plan name is required.');
      return;
    }

    const priceTrimmed = editPlanPrice.trim();
    const priceNum = Number(priceTrimmed);
    if (priceTrimmed === '' || isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price (₹0 or greater).');
      return;
    }

    const durationTrimmed = editPlanDurationDays.trim();
    const durationNum = parseInt(durationTrimmed, 10);
    if (durationTrimmed === '' || isNaN(durationNum) || durationNum <= 0) {
      showToast('Please enter a valid duration in days (greater than 0).');
      return;
    }
    const renewalWindowDays = parseRenewalWindow(editPlanRenewalWindow, durationNum);
    if (renewalWindowDays === undefined) return;

    const origPriceTrimmed = editPlanOriginalPrice.trim();
    let origPriceNum = priceNum;
    if (origPriceTrimmed !== '') {
      origPriceNum = Number(origPriceTrimmed);
      if (isNaN(origPriceNum) || origPriceNum < 0) {
        showToast('Original price must be a valid non-negative number.');
        return;
      }
    }

    const featureItems: PlanFeature[] = editPlanFeatures
      .split('\n')
      .map((f) => f.trim())
      .filter(Boolean)
      .map((text) => ({ text, included: true }));

    setIsSubmittingEdit(true);

    try {
      const res = await api.updateSubscriptionPlan(editingPlan.id, {
        title: editPlanName.trim(),
        name: editPlanName.trim(),
        description: editPlanSubtitle.trim(),
        price: priceNum,
        originalPrice: origPriceNum,
        durationDays: durationNum,
        renewalWindowDays,
        features: featureItems.map((f) => f.text),
      });

      if (!res.success) {
        showToast(res.error || 'Failed to update plan on backend.');
        setIsSubmittingEdit(false);
        return;
      }

      await loadPlans();
      setIsEditPlanModalOpen(false);
      showToast(`Subscription plan "${editPlanName.trim()}" updated successfully.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Error updating subscription plan.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Dynamic KPI and breakdown metrics computed from live database
  const totalSubscribersCount = useMemo(() => {
    if (dashboardStats?.proStudents != null && dashboardStats.proStudents > 0) {
      return Math.max(
        dashboardStats.proStudents,
        new Set(subscriptionsList.map((s) => s.userId)).size
      );
    }
    const uniqueUserIds = new Set(subscriptionsList.map((s) => s.userId).filter(Boolean));
    return uniqueUserIds.size > 0 ? uniqueUserIds.size : subscriptionsList.length;
  }, [dashboardStats, subscriptionsList]);

  const monthlyRevenue = useMemo(() => {
    if (dashboardStats?.monthRevenue != null && dashboardStats.monthRevenue > 0) {
      return dashboardStats.monthRevenue;
    }
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const sum = subscriptionsList
      .filter((s) => {
        if (!s.createdAt && !s.startsAt) return false;
        const d = new Date(s.createdAt || s.startsAt || '');
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
      })
      .reduce((acc, s) => acc + (s.paymentAmount || 0), 0);
    return sum > 0 ? sum : dashboardStats?.totalRevenue || 0;
  }, [dashboardStats, subscriptionsList]);

  const activeSubscriptionsCount = useMemo(() => {
    if (dashboardStats?.activeSubscriptions != null && dashboardStats.activeSubscriptions > 0) {
      return dashboardStats.activeSubscriptions;
    }
    const activeRows = subscriptionsList.filter(
      (s) =>
        s.status?.toLowerCase() === 'active' || (s.daysRemaining != null && s.daysRemaining > 0)
    );
    return activeRows.length;
  }, [dashboardStats, subscriptionsList]);

  const convertedThisMonthCount = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const count = subscriptionsList.filter((s) => {
      if (!s.createdAt) return false;
      const d = new Date(s.createdAt);
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        (s.status?.toLowerCase() === 'active' || s.paymentStatus === 'completed')
      );
    }).length;
    return count > 0 ? count : dashboardStats?.newStudents || activeSubscriptionsCount;
  }, [subscriptionsList, dashboardStats, activeSubscriptionsCount]);

  const totalStudentsCount =
    dashboardStats?.totalStudents ?? Math.max(totalSubscribersCount, subscriptionsList.length);
  const freeStudentsCount =
    dashboardStats?.freeStudents ?? Math.max(0, totalStudentsCount - totalSubscribersCount);

  const planSubscriberCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const sub of subscriptionsList) {
      const isActive =
        sub.status?.toLowerCase() === 'active' ||
        (sub.daysRemaining != null && sub.daysRemaining > 0);
      if (isActive) {
        if (sub.planId) {
          counts[sub.planId] = (counts[sub.planId] || 0) + 1;
        }
        if (sub.planTitle) {
          counts[sub.planTitle.toLowerCase()] = (counts[sub.planTitle.toLowerCase()] || 0) + 1;
        }
      }
    }
    return counts;
  }, [subscriptionsList]);

  const recentSubscriptions: RecentSubscriptionItem[] = useMemo(() => {
    if (!subscriptionsList.length) return [];
    const sorted = [...subscriptionsList].sort((a, b) => {
      const timeA = new Date(a.createdAt || a.startsAt || 0).getTime();
      const timeB = new Date(b.createdAt || b.startsAt || 0).getTime();
      return timeB - timeA;
    });

    return sorted.map((row, idx) => {
      const planName = row.planTitle || 'Pro Pass';
      const planLower = planName.toLowerCase();
      let badgeClass = 'bg-[#DBEAFE] text-[#1E40AF]';
      if (planLower.includes('pro')) badgeClass = 'bg-[#FEF3C7] text-[#B45309]';
      else if (planLower.includes('ultimate')) badgeClass = 'bg-[#EDE9FE] text-[#6D28D9]';
      else if (planLower.includes('free')) badgeClass = 'bg-[#DCFCE7] text-[#15803D]';

      const dateStr =
        row.createdAt || row.startsAt
          ? new Date(row.createdAt || row.startsAt!).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })
          : 'Recent';

      const isSuccess =
        row.status?.toLowerCase() === 'active' ||
        row.paymentStatus === 'completed' ||
        row.status?.toLowerCase() === 'completed';

      return {
        id: row.id || idx + 1,
        studentName: row.studentName || 'Student Aspirant',
        studentAvatar:
          row.avatarUrl ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(row.studentName || 'Student')}&background=0284c7&color=fff`,
        studentEmail: row.studentEmail || undefined,
        plan: planName,
        planBadgeClass: badgeClass,
        amount: row.paymentAmount ?? 0,
        date: dateStr,
        status: isSuccess
          ? 'Success'
          : row.status
            ? row.status.charAt(0).toUpperCase() + row.status.slice(1)
            : 'Active',
      };
    });
  }, [subscriptionsList]);

  return {
    pageLoading,
    setPageLoading,
    subscriptionsList,
    dashboardStats,
    totalSubscribersCount,
    monthlyRevenue,
    activeSubscriptionsCount,
    convertedThisMonthCount,
    totalStudentsCount,
    freeStudentsCount,
    planSubscriberCounts,
    recentSubscriptions,
    plans,
    setPlans,
    billingCycle,
    setBillingCycle,
    isAddPlanModalOpen,
    setIsAddPlanModalOpen,
    isViewActiveModalOpen,
    setIsViewActiveModalOpen,
    isViewAllRecentOpen,
    setIsViewAllRecentOpen,
    selectedPlanForPurchase,
    setSelectedPlanForPurchase,
    toastMessage,
    setToastMessage,
    formPlanName,
    setFormPlanName,
    formPlanSubtitle,
    setFormPlanSubtitle,
    formPlanPrice,
    setFormPlanPrice,
    formPlanOriginalPrice,
    setFormPlanOriginalPrice,
    formPlanDurationDays,
    setFormPlanDurationDays,
    formPlanRenewalWindow,
    setFormPlanRenewalWindow,
    formPlanBadge,
    setFormPlanBadge,
    formPlanFeatures,
    setFormPlanFeatures,
    isSubmittingAdd,
    editingPlan,
    isEditPlanModalOpen,
    setIsEditPlanModalOpen,
    editPlanName,
    setEditPlanName,
    editPlanSubtitle,
    setEditPlanSubtitle,
    editPlanPrice,
    setEditPlanPrice,
    editPlanOriginalPrice,
    setEditPlanOriginalPrice,
    editPlanDurationDays,
    setEditPlanDurationDays,
    editPlanRenewalWindow,
    setEditPlanRenewalWindow,
    editPlanBadge,
    setEditPlanBadge,
    editPlanFeatures,
    setEditPlanFeatures,
    editButtonText,
    setEditButtonText,
    isSubmittingEdit,
    showToast,
    loadPlans,
    handleSavePlan,
    handleOpenEditModal,
    handleUpdatePlan,
  };
}

export type AdminSubscriptionPlansState = ReturnType<typeof useAdminSubscriptionPlans>;
