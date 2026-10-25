import { isSupabaseConfigured } from '@/lib/supabase';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { bannerService, optimizeBannerImage } from '@/services/bannerService';
import type { HeroBanner } from '@/types';
import { AdminBannerItem, bannerStatusToRecord, mapHeroBannerToAdminItem } from './bannersUtils';
import { INITIAL_BANNERS } from './demoBanners';

export function useAdminBanners() {
  const queryClient = useQueryClient();

  // Banners state
  const [banners, setBanners] = useState<AdminBannerItem[]>(
    isSupabaseConfigured ? [] : INITIAL_BANNERS
  );
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('All Status');
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState('All Devices');

  // Active filters applied
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    type: 'All Types',
    status: 'All Status',
    device: 'All Devices',
  });

  // Right Panel State (Active editing copy)
  const [activeTab, setActiveTab] = useState<'Details' | 'Settings' | 'Preview'>('Details');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<AdminBannerItem | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const fileUploadInputRef = useRef<HTMLInputElement>(null);
  const [dragActiveEditBanner, setDragActiveEditBanner] = useState(false);
  const [dragActiveNewBanner, setDragActiveNewBanner] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [reorderedList, setReorderedList] = useState<AdminBannerItem[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // New Banner Form state
  const [newBannerData, setNewBannerData] = useState<
    Omit<AdminBannerItem, 'id' | 'order' | 'clickCount'>
  >({
    title: '',
    subtitle: '',
    description: '',
    bannerType: 'Test Series',
    showTextOverlay: false,
    linkUrl: '/test-series',
    openIn: 'Same Tab',
    devices: { desktop: true, mobile: true },
    startDate: '',
    endDate: '',
    hasDateRange: false,
    startsAt: '',
    expiresAt: '',
    status: 'Active',
    imageUrl: '/images/exam_hero_banner.png',
    fileName: 'banner-new.jpg',
  });

  // Toast notifier
  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync with service on load
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rows = await bannerService.getBanners();
        const mapped = rows.map(mapHeroBannerToAdminItem);
        setBanners(mapped);
        setSelectedBannerId((prev) => (prev && mapped.some((r) => r.id === prev) ? prev : null));
        setEditFormData((prev) => (prev ? mapped.find((r) => r.id === prev.id) || null : null));
      } catch (err) {
        showToast('error', err instanceof Error ? err.message : 'Banner load failed.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Handle Filter Button click
  const handleApplyFilters = () => {
    setAppliedFilters({
      search: searchQuery,
      type: selectedTypeFilter,
      status: selectedStatusFilter,
      device: selectedDeviceFilter,
    });
    setCurrentPage(1);
  };

  // Handle Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedTypeFilter('All Types');
    setSelectedStatusFilter('All Status');
    setSelectedDeviceFilter('All Devices');
    setAppliedFilters({
      search: '',
      type: 'All Types',
      status: 'All Status',
      device: 'All Devices',
    });
    setCurrentPage(1);
  };

  // Filtered banners list
  const filteredBanners = useMemo(() => {
    return banners.filter((b) => {
      // Search
      if (appliedFilters.search.trim()) {
        const q = appliedFilters.search.toLowerCase();
        const matchTitle = b.title.toLowerCase().includes(q);
        const matchSubtitle = b.subtitle.toLowerCase().includes(q);
        const matchLink = b.linkUrl.toLowerCase().includes(q);
        if (!matchTitle && !matchSubtitle && !matchLink) return false;
      }
      // Type
      if (appliedFilters.type !== 'All Types' && b.bannerType !== appliedFilters.type) {
        return false;
      }
      // Status
      if (appliedFilters.status !== 'All Status' && b.status !== appliedFilters.status) {
        return false;
      }
      // Device
      if (appliedFilters.device !== 'All Devices') {
        if (appliedFilters.device === 'Desktop Only' && (!b.devices.desktop || b.devices.mobile))
          return false;
        if (appliedFilters.device === 'Mobile Only' && (!b.devices.mobile || b.devices.desktop))
          return false;
        if (
          appliedFilters.device === 'Desktop & Mobile' &&
          (!b.devices.desktop || !b.devices.mobile)
        )
          return false;
      }
      return true;
    });
  }, [banners, appliedFilters]);

  // Pagination calculations
  const totalItems = filteredBanners.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const visibleBanners = filteredBanners.slice(startIndex, startIndex + itemsPerPage);

  // Keep currentPage within bounds when banners are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Statistics for KPI Cards
  const stats = useMemo(() => {
    const total = banners.length;
    const active = banners.filter((b) => b.status === 'Active').length;
    const scheduled = banners.filter((b) => b.status === 'Scheduled').length;
    const archived = banners.filter((b) => b.status === 'Archived').length;
    return { total, active, scheduled, archived };
  }, [banners]);

  // 1-Click quick toggle status (Enable/Disable banner)
  const handleQuickToggleStatus = async (banner: AdminBannerItem) => {
    try {
      const nextIsActive = banner.status !== 'Active';
      const updated = await bannerService.toggleBannerStatus(banner.id, nextIsActive);
      const row = mapHeroBannerToAdminItem(updated, 0);
      setBanners((prev) => prev.map((b) => (b.id === row.id ? row : b)));
      if (editFormData && editFormData.id === banner.id) {
        setEditFormData(row);
      }
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', `Banner ${nextIsActive ? 'enabled' : 'disabled'}.`);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Status update failed.');
    }
  };

  // Save changes from Right Panel
  const handleUpdateBanner = async () => {
    if (!editFormData || isUpdating) return;
    try {
      setIsUpdating(true);
      const original = banners.find((b) => b.id === editFormData.id);
      const record = bannerStatusToRecord(
        editFormData.status,
        editFormData.startsAt || '',
        editFormData.expiresAt || ''
      );
      const updates: Partial<HeroBanner> = {
        title: editFormData.title,
        subtitle: editFormData.description,
        primaryCtaLink: editFormData.linkUrl,
        primaryCtaText: editFormData.ctaText,
        badgeText: editFormData.badgeText,
        imageUrl: editFormData.imageUrl,
        displayOrder: editFormData.order,
        isActive: record.isActive,
        showTextOverlay: Boolean(editFormData.showTextOverlay),
        bannerType: editFormData.showTextOverlay ? 'text_overlay' : 'full_image',
      };
      // Only send schedule boundaries that actually changed ('' clears a date).
      if (record.startsAt !== (original?.startsAt || '')) updates.startsAt = record.startsAt;
      if (record.expiresAt !== (original?.expiresAt || '')) updates.expiresAt = record.expiresAt;
      const saved = await bannerService.updateBanner(editFormData.id, updates);
      const row = mapHeroBannerToAdminItem(saved, 0);
      setBanners((prev) => prev.map((b) => (b.id === row.id ? row : b)));
      setEditFormData(row);
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'Banner saved.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Banner save failed.');
    } finally {
      setIsUpdating(false);
    }
  };

  // Delete banner handler
  const handleDeleteConfirm = async () => {
    if (!editFormData) return;
    try {
      const id = editFormData.id;
      await bannerService.deleteBanner(id);
      setBanners((prev) => prev.filter((b) => b.id !== id));
      setSelectedBannerId(null);
      setEditFormData(null);
      setIsPanelOpen(false);
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'Banner deleted.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Banner deletion failed.');
    }
  };

  // Image upload with compression and live preview update
  const handleBannerImageUpload = async (file: File) => {
    if (!editFormData) return;

    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    const activeId = editFormData.id;
    try {
      // Optimize image client-side via bannerService
      const { url } = await bannerService.uploadBannerImage(file);
      setEditFormData((prev) =>
        prev
          ? {
              ...prev,
              imageUrl: url,
              fileName: file.name,
            }
          : null
      );
      // Update in banners list immediately so table preview updates live
      setBanners((prev) =>
        prev.map((b) => (b.id === activeId ? { ...b, imageUrl: url, fileName: file.name } : b))
      );
      showToast('success', `Selected image: ${file.name}`);
    } catch {
      // Fallback: compress client-side to lightweight data URI (< 150KB)
      try {
        const opt = await optimizeBannerImage(file);
        setEditFormData((prev) =>
          prev
            ? {
                ...prev,
                imageUrl: opt.dataUrl,
                fileName: file.name,
              }
            : null
        );
        setBanners((prev) =>
          prev.map((b) =>
            b.id === activeId ? { ...b, imageUrl: opt.dataUrl, fileName: file.name } : b
          )
        );
        showToast('success', `Selected image: ${file.name}`);
      } catch {
        showToast('error', 'Failed to process banner image.');
      }
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleBannerImageUpload(file);
  };

  const handleProcessNewBannerFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast('error', 'Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    try {
      const { url } = await bannerService.uploadBannerImage(file);
      setNewBannerData((prev) => ({
        ...prev,
        imageUrl: url,
        fileName: file.name,
      }));
      showToast('success', `Selected image: ${file.name}`);
    } catch {
      try {
        const opt = await optimizeBannerImage(file);
        setNewBannerData((prev) => ({
          ...prev,
          imageUrl: opt.dataUrl,
          fileName: file.name,
        }));
        showToast('success', `Selected image: ${file.name}`);
      } catch {
        showToast('error', 'Failed to process banner image.');
      }
    }
  };

  // Create Banner handler
  const handleCreateBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (!newBannerData.title.trim()) {
      showToast('error', 'Title is required.');
      return;
    }
    try {
      setIsCreating(true);
      const record = bannerStatusToRecord(
        newBannerData.status,
        newBannerData.startsAt || '',
        newBannerData.expiresAt || ''
      );
      const saved = await bannerService.createBanner({
        title: newBannerData.title,
        subtitle: newBannerData.subtitle,
        primaryCtaLink: newBannerData.linkUrl,
        primaryCtaText: newBannerData.ctaText || 'Start Now',
        badgeText: newBannerData.badgeText,
        imageUrl: newBannerData.imageUrl,
        isActive: record.isActive,
        showTextOverlay: Boolean(newBannerData.showTextOverlay),
        bannerType: newBannerData.showTextOverlay ? 'text_overlay' : 'full_image',
        ...(record.startsAt ? { startsAt: record.startsAt } : {}),
        ...(record.expiresAt ? { expiresAt: record.expiresAt } : {}),
        displayOrder: banners.length + 1,
      });
      const row = mapHeroBannerToAdminItem(saved, 0);
      setBanners((prev) => [row, ...prev]);
      setIsCreateModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'Banner created.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Banner creation failed.');
    } finally {
      setIsCreating(false);
    }
  };

  // Open Reorder Modal
  const handleOpenOrderModal = () => {
    setReorderedList([...banners].sort((a, b) => a.order - b.order));
    setIsOrderModalOpen(true);
  };

  // Move banner up in reorder modal
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setReorderedList((prev) => {
      const next = [...prev];
      const temp = next[index - 1];
      next[index - 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Move banner down in reorder modal
  const handleMoveDown = (index: number) => {
    if (index === reorderedList.length - 1) return;
    setReorderedList((prev) => {
      const next = [...prev];
      const temp = next[index + 1];
      next[index + 1] = next[index];
      next[index] = temp;
      return next.map((item, idx) => ({ ...item, order: idx + 1 }));
    });
  };

  // Save new order
  const handleSaveOrder = async () => {
    try {
      await bannerService.reorderBanners(reorderedList.map((b) => b.id));
      setBanners(reorderedList.map((b, i) => ({ ...b, order: i + 1 })));
      setIsOrderModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hero-banners'] });
      showToast('success', 'Banner order saved.');
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Order save failed.');
    }
  };

  return {
    queryClient,
    banners,
    setBanners,
    selectedBannerId,
    setSelectedBannerId,
    loading,
    setLoading,
    toastMessage,
    setToastMessage,
    searchQuery,
    setSearchQuery,
    selectedTypeFilter,
    setSelectedTypeFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    selectedDeviceFilter,
    setSelectedDeviceFilter,
    appliedFilters,
    setAppliedFilters,
    activeTab,
    setActiveTab,
    isPanelOpen,
    setIsPanelOpen,
    editFormData,
    setEditFormData,
    isUpdating,
    setIsUpdating,
    fileUploadInputRef,
    dragActiveEditBanner,
    setDragActiveEditBanner,
    dragActiveNewBanner,
    setDragActiveNewBanner,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    isOrderModalOpen,
    setIsOrderModalOpen,
    reorderedList,
    setReorderedList,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    isCreating,
    setIsCreating,
    newBannerData,
    setNewBannerData,
    showToast,
    handleApplyFilters,
    handleResetFilters,
    filteredBanners,
    totalItems,
    totalPages,
    startIndex,
    visibleBanners,
    stats,
    handleQuickToggleStatus,
    handleUpdateBanner,
    handleDeleteConfirm,
    handleBannerImageUpload,
    handleImageFileChange,
    handleProcessNewBannerFile,
    handleCreateBannerSubmit,
    handleOpenOrderModal,
    handleMoveUp,
    handleMoveDown,
    handleSaveOrder,
  };
}

export type AdminBannersState = ReturnType<typeof useAdminBanners>;
