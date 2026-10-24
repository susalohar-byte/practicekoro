import { isSupabaseConfigured } from '@/lib/supabase';
import React, { useCallback, useState, useEffect } from 'react';
import { api } from '@/services/api';
import type { PlanFeature, SubscriptionPlanItem } from './subscriptionPlanTypes';
import { INITIAL_PLANS } from './subscriptionPlanData';

export function useAdminSubscriptionPlans() {
  const [pageLoading, setPageLoading] = useState(true);
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
      const remote = await api.getSubscriptionPlans(true);
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

  return {
    pageLoading,
    setPageLoading,
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
