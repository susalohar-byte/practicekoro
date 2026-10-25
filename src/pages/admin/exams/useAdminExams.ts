import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@/services/api';
import { supabaseRuntime, isSupabaseConfigured } from '@/lib/supabase';
import type { Exam, MockTest } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import { LEGACY_EXAM_CATEGORY_NAMES } from '@/services/domains/admin.examCategories';
import { calculatePaginationRange } from '@/utils/pagination';
import { CANONICAL_EXAMS_PRESET } from './examPresets';
import {
  STORAGE_KEY_CATEGORIES,
  LEGACY_FILTER_BUCKETS,
  DEFAULT_EXAM_CATEGORIES,
  EXAM_LOGO_CACHE_KEY,
  EXAM_OVERRIDES_CACHE_KEY,
  getExamLogoCache,
  getExamOverridesCache,
  type EnrichedExamRow,
} from './examsUtils';

export function useAdminExams() {
  // Data States
  const [exams, setExams] = useState<EnrichedExamRow[]>(
    isSupabaseConfigured ? [] : CANONICAL_EXAMS_PRESET
  );
  const [dbTests, setDbTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Selected Exam & Side Panel
  const [selectedExam, setSelectedExam] = useState<EnrichedExamRow | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState<boolean>(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'subjects' | 'tests' | 'settings'>(
    'overview'
  );

  // Row selection checkboxes
  const [selectedExamIds, setSelectedExamIds] = useState<Set<string>>(new Set());

  // Actions Dropdown Menu
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Filter Toolbar States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    category: 'all',
    status: 'all',
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Success Notification Banner
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Categories & Modal
  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CATEGORIES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error reading categories:', e);
    }
    return DEFAULT_EXAM_CATEGORIES;
  });
  const [kpiLoadFailed, setKpiLoadFailed] = useState({ tests: false });
  // Backend ids by category name (required to persist a reorder).
  const [categoryIds, setCategoryIds] = useState<Record<string, string>>({});
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');

  // Create / Edit Exam Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState<EnrichedExamRow | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formShortName, setFormShortName] = useState('');
  const [formSubtitle, setFormSubtitle] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [formCategory, setFormCategory] = useState('State Govt');
  const [formDescription, setFormDescription] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');
  const [formIconName, setFormIconName] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // File upload helper: uploads to Supabase storage if available, falls back to Base64 data URL
  const handleUploadImageFile = async (file: File): Promise<string> => {
    if (isSupabaseConfigured) {
      {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `exam-logos/${Date.now()}-${cleanName}`;
        const { data, error } = await supabaseRuntime.storage.from('banners').upload(path, file, {
          cacheControl: '3600',
          upsert: true,
        });
        if (!error && data) {
          return supabaseRuntime.storage.from('banners').getPublicUrl(data.path).data.publicUrl;
        }
      }
      throw new Error('Image upload failed. Check Storage permissions.');
    }

    // Fallback to Base64 Data URL (durable, works offline & online)
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.readAsDataURL(file);
    });
  };

  // The confirmed backend record remains authoritative even if a later refresh fails.
  const applySavedExam = (saved: Exam) => {
    const merge = (previous?: EnrichedExamRow): EnrichedExamRow => ({
      subjectsCount: 0,
      fullMockCount: 0,
      totalTestsCount: 0,
      enrollmentsCount: 0,
      enrollmentsFormatted: 'Unavailable',
      createdByName: 'Unavailable',
      createdAtFormatted: 'Unavailable',
      updatedAtFormatted: 'Unavailable',
      avgScoreFormatted: 'Unavailable',
      completionRateFormatted: 'Unavailable',
      ...previous,
      ...saved,
      shortName: saved.shortName || saved.title.split(' ')[0],
      subtitle: saved.subtitle || saved.description || '',
      categoryLabel: saved.category,
      statusLabel: saved.isActive ? 'Published' : 'Draft',
    });
    setExams((previous) =>
      previous.some((exam) => exam.id === saved.id)
        ? previous.map((exam) => (exam.id === saved.id ? merge(exam) : exam))
        : [...previous, merge()]
    );
    setSelectedExam((previous) => (previous?.id === saved.id ? merge(previous) : previous));
  };

  // Quick direct upload exam logo (e.g. from drawer or table hover)
  const handleQuickUploadExamLogo = async (examId: string, logoUrl: string) => {
    try {
      const saved = await api.updateExam(examId, { iconName: logoUrl });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam logo saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Failed to update logo'));
    }
  };

  // Details Drawer Settings Tab States
  const [settingsTitle, setSettingsTitle] = useState('');
  const [settingsCategory, setSettingsCategory] = useState('State Govt');
  const [settingsStatus, setSettingsStatus] = useState<'Published' | 'Draft'>('Published');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  useEffect(() => {
    if (selectedExam) {
      setSettingsTitle(selectedExam.title);
      setSettingsCategory(selectedExam.category || 'State Govt');
      setSettingsStatus(selectedExam.isActive ? 'Published' : 'Draft');
    }
  }, [selectedExam]);

  // Quick Toggle Exam Status (Published <-> Draft)
  const handleToggleExamStatus = async (exam: EnrichedExamRow, forcedStatus?: boolean) => {
    try {
      const saved = await api.updateExam(exam.id, { isActive: forcedStatus ?? !exam.isActive });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam status saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Status update failed'));
    }
  };

  // Save Settings from Drawer Settings Tab
  const handleSaveDrawerSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!selectedExam || isSavingSettings) return;
    try {
      setIsSavingSettings(true);
      const saved = await api.updateExam(selectedExam.id, {
        title: settingsTitle.trim(),
        category: settingsCategory,
        isActive: settingsStatus === 'Published',
      });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam settings saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Settings save failed'));
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Load authoritative records; presets only enrich matching backend identities.
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError('');
      const [rawExams, allTests, allSubjects, mappingCounts, dbCats] = await Promise.all([
        api.getAllAdminExams(),
        api.getAllAdminTests().catch(() => null),
        api.getSubjects().catch(() => []),
        api.getExamMappingCounts().catch(() => null),
        api.getExamCategories().catch(() => []),
      ]);

      // A failed count source shows "—" instead of a misleading zero.
      setKpiLoadFailed({ tests: allTests === null });
      setDbTests(allTests || []);

      if (dbCats && dbCats.length > 0) {
        setCategoryIds(Object.fromEntries(dbCats.map((c) => [c.name, c.id])));
        const catNames = dbCats
          .map((c) => c.name)
          .filter((name) => !LEGACY_EXAM_CATEGORY_NAMES.has(name.toLowerCase()));
        if (catNames.length > 0) {
          const merged = isSupabaseConfigured
            ? catNames
            : Array.from(new Set([...['State Govt', 'Central Govt', 'Other'], ...catNames]));
          setCategories(merged);
        }
      }

      const mergedList: EnrichedExamRow[] = rawExams.map((dbEx) => {
        const preset = CANONICAL_EXAMS_PRESET.find((e) => e.id === dbEx.id);
        return {
          ...preset,
          ...dbEx,
          shortName: dbEx.shortName || dbEx.title.split(' ')[0],
          subtitle: dbEx.subtitle || dbEx.description || '',
          categoryLabel: dbEx.category,
          // Exam -> Subject mappings (exam_subjects / exam_topics); legacy subjects.exam_id fallback.
          subjectsCount:
            mappingCounts?.[dbEx.id]?.subjects ??
            allSubjects.filter((x) => x.examId === dbEx.id).length,
          fullMockCount: (allTests || []).filter(
            (x) => x.examId === dbEx.id && x.testType === 'full_mock'
          ).length,
          totalTestsCount:
            dbEx.testsCount ?? (allTests || []).filter((x) => x.examId === dbEx.id).length,
          enrollmentsCount: 0,
          enrollmentsFormatted: 'Unavailable',
          statusLabel: dbEx.isActive ? 'Published' : 'Draft',
          createdByName: 'Unavailable',
          createdAtFormatted: 'Unavailable',
          updatedAtFormatted: 'Unavailable',
          avgScoreFormatted: 'Unavailable',
          completionRateFormatted: 'Unavailable',
        };
      });
      setExams(mergedList);
      setSelectedExam((prev) => {
        if (!prev) return null;
        const found = mergedList.find((e) => e.id === prev.id);
        return found || null;
      });
    } catch (err) {
      console.error('Error loading exams data:', err);
      setLoadError(getErrorMessage(err, 'Exams could not be loaded.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-dismiss success notification
  useEffect(() => {
    if (!actionSuccessMessage) return;
    const timer = setTimeout(() => setActionSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccessMessage]);

  // Filter application
  const handleApplyFilter = () => {
    setAppliedFilters({
      search: searchTerm,
      category: selectedCategory,
      status: selectedStatus,
    });
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setAppliedFilters({
      search: '',
      category: 'all',
      status: 'all',
    });
    setCurrentPage(1);
  };

  // Filtered exams list
  const filteredExams = useMemo(() => {
    return exams.filter((e) => {
      const q = appliedFilters.search.toLowerCase().trim();
      if (q) {
        const matchTitle = e.title.toLowerCase().includes(q);
        const matchSub = (e.subtitle || '').toLowerCase().includes(q);
        const matchCat = (e.category || '').toLowerCase().includes(q);
        if (!matchTitle && !matchSub && !matchCat) return false;
      }

      if (appliedFilters.category !== 'all') {
        const catNorm = (e.category || '').trim().toLowerCase();
        const targetNorm = appliedFilters.category.trim().toLowerCase();
        // Real (backend) categories match exactly; the legacy local buckets below
        // only apply in offline mode to categories without a backend record.
        const isRealCategory =
          isSupabaseConfigured ||
          Boolean(categoryIds[appliedFilters.category]) ||
          !LEGACY_FILTER_BUCKETS.has(targetNorm);
        if (isRealCategory) {
          if (catNorm !== targetNorm) return false;
        } else {
          if (
            targetNorm === 'state govt' &&
            !catNorm.includes('state') &&
            !catNorm.includes('wb')
          ) {
            return false;
          }
          if (
            targetNorm === 'central govt' &&
            !catNorm.includes('central') &&
            !catNorm.includes('ssc') &&
            !catNorm.includes('rail')
          ) {
            return false;
          }
          if (
            targetNorm === 'other' &&
            (catNorm.includes('state') || catNorm.includes('central'))
          ) {
            return false;
          }
        }
      }

      if (appliedFilters.status !== 'all') {
        if (appliedFilters.status === 'published' && (!e.isActive || e.statusLabel === 'Draft')) {
          return false;
        }
        if (appliedFilters.status === 'draft' && e.isActive && e.statusLabel === 'Published') {
          return false;
        }
      }

      return true;
    });
  }, [exams, appliedFilters, categoryIds]);

  // Pagination calculation
  const totalItems = filteredExams.length;
  const paginationRange = calculatePaginationRange(currentPage, pageSize, totalItems);
  const totalPages = paginationRange.totalPages;
  const pageStart = (paginationRange.currentPage - 1) * paginationRange.pageSize;
  const pagedExams = filteredExams.slice(pageStart, pageStart + paginationRange.pageSize);

  // Keep currentPage within bounds when exams are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Row selection handler
  const toggleSelectAll = () => {
    if (selectedExamIds.size === pagedExams.length) {
      setSelectedExamIds(new Set());
    } else {
      setSelectedExamIds(new Set(pagedExams.map((e) => e.id)));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedExamIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectExamRow = (exam: EnrichedExamRow) => {
    if (selectedExam?.id === exam.id && showDetailsPanel) {
      return;
    }
    setSelectedExam(exam);
    setShowDetailsPanel(true);
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setEditingExam(null);
    setFormTitle('');
    setFormShortName('');
    setFormSubtitle('');
    setFormSlug('');
    setFormCategory(categories[0] || 'State Govt');
    setFormDescription('');
    setFormIsActive(true);
    setFormIconName('');
    setFormError('');
    setIsModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (exam: EnrichedExamRow) => {
    setEditingExam(exam);
    setFormTitle(exam.title);
    setFormShortName(exam.shortName || exam.title.split(' ')[0]);
    setFormSubtitle(exam.subtitle || '');
    setFormSlug(exam.slug);
    setFormCategory(exam.category || 'State Govt');
    setFormDescription(exam.description || '');
    setFormIsActive(exam.isActive);
    setFormIconName(exam.iconName || '');
    setFormError('');
    setIsModalOpen(true);
  };

  // Save Exam (Create / Edit)
  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!formTitle.trim()) {
      setFormError('Exam title is required.');
      return;
    }
    try {
      setIsSaving(true);
      setFormError('');
      const slug =
        formSlug.trim() ||
        formTitle
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      if (!slug) throw new Error('Enter an English URL slug for this exam.');
      const input = {
        title: formTitle.trim(),
        slug,
        shortName: formShortName.trim(),
        subtitle: formSubtitle.trim(),
        category: formCategory,
        description: formDescription.trim(),
        orderIndex: editingExam?.orderIndex ?? exams.length + 1,
        isActive: formIsActive,
        iconName: formIconName.trim() || 'Shield',
      };
      const saved = editingExam
        ? await api.updateExam(editingExam.id, input)
        : await api.createExam(input);
      if (!saved?.id) throw new Error('Exam save was not confirmed.');
      applySavedExam(saved);
      await loadData();
      setIsModalOpen(false);
      setActionSuccessMessage('Exam saved in the backend.');
    } catch (err) {
      setFormError(getErrorMessage(err, 'Failed to save exam'));
    } finally {
      setIsSaving(false);
    }
  };

  // Archive / Delete Exam
  const handleArchiveExam = async (exam: EnrichedExamRow) => {
    if (!confirm('Archive "' + exam.title + '"?')) return;
    try {
      const saved = await api.updateExam(exam.id, { isActive: false });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Exam archived.');
    } catch (err) {
      alert(getErrorMessage(err, 'Archive failed'));
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (
      !window.confirm(
        'Permanently delete this exam? Linked content will block deletion; Archive preserves history.'
      )
    )
      return;
    try {
      await api.deleteExam(examId);
      setExams((prev) => prev.filter((e) => e.id !== examId));
      setSelectedExam((prev) => (prev?.id === examId ? null : prev));
      if (selectedExam?.id === examId) setShowDetailsPanel(false);
      setSelectedExamIds((prev) => {
        const next = new Set(prev);
        next.delete(examId);
        return next;
      });
      // Cache cleanup is best-effort and cannot turn a confirmed deletion into a failure.
      for (const [key, readCache] of [
        [EXAM_LOGO_CACHE_KEY, getExamLogoCache],
        [EXAM_OVERRIDES_CACHE_KEY, getExamOverridesCache],
      ] as const) {
        try {
          const cache = readCache();
          delete cache[examId];
          localStorage.setItem(key, JSON.stringify(cache));
        } catch (error) {
          console.warn('Exam deleted; optional browser cache cleanup failed.', error);
        }
      }
      setCurrentPage(1);
      setActionSuccessMessage('Exam deleted in the backend.');
    } catch (err) {
      alert(getErrorMessage(err, 'Delete failed; archive linked exams instead.'));
    }
  };

  // Duplicate Exam
  const handleDuplicateExam = async (exam: EnrichedExamRow) => {
    try {
      const saved = await api.createExam({
        ...exam,
        title: exam.title + ' (Copy)',
        slug: exam.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        isActive: false,
      });
      applySavedExam(saved);
      await loadData();
      setActionSuccessMessage('Draft exam created.');
    } catch (err) {
      alert(getErrorMessage(err, 'Duplicate failed'));
    }
  };

  // Add Category Handler
  const handleAddCategory = async () => {
    if (!newCategoryInput.trim()) return;
    try {
      const saved = await api.createExamCategory(newCategoryInput.trim(), categories.length);
      setCategories((prev) => [...new Set([...prev, saved.name])]);
      if (saved.id) setCategoryIds((prev) => ({ ...prev, [saved.name]: saved.id }));
      setNewCategoryInput('');
      setActionSuccessMessage('Category saved.');
    } catch (err) {
      alert(getErrorMessage(err, 'Category save failed'));
    }
  };

  const handleDeleteCategory = async (catName: string) => {
    if (!window.confirm(`Delete category "${catName}"?`)) return;
    try {
      await api.deleteExamCategory(catName);
      setCategories((prev) => prev.filter((c) => c !== catName));
      await api.getExamCategories();
      setActionSuccessMessage(`Category "${catName}" deleted.`);
    } catch (err) {
      alert(getErrorMessage(err, 'Category delete failed'));
    }
  };

  return {
    exams,
    setExams,
    dbTests,
    isLoading,
    isSaving,
    loadError,
    selectedExam,
    setSelectedExam,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    selectedExamIds,
    openActionMenuId,
    setOpenActionMenuId,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    setAppliedFilters,
    setCurrentPage,
    pageSize,
    setPageSize,
    actionSuccessMessage,
    setActionSuccessMessage,
    categories,
    setCategories,
    kpiLoadFailed,
    categoryIds,
    isCategoryModalOpen,
    setIsCategoryModalOpen,
    newCategoryInput,
    setNewCategoryInput,
    isModalOpen,
    setIsModalOpen,
    editingExam,
    formTitle,
    setFormTitle,
    formShortName,
    setFormShortName,
    formSubtitle,
    setFormSubtitle,
    formSlug,
    setFormSlug,
    formCategory,
    setFormCategory,
    formDescription,
    setFormDescription,
    formIsActive,
    setFormIsActive,
    formError,
    setFormError,
    formIconName,
    setFormIconName,
    isUploadingLogo,
    setIsUploadingLogo,
    handleUploadImageFile,
    handleQuickUploadExamLogo,
    settingsTitle,
    setSettingsTitle,
    settingsCategory,
    setSettingsCategory,
    settingsStatus,
    setSettingsStatus,
    isSavingSettings,
    handleToggleExamStatus,
    handleSaveDrawerSettings,
    loadData,
    handleApplyFilter,
    handleResetFilter,
    totalItems,
    paginationRange,
    totalPages,
    pageStart,
    pagedExams,
    toggleSelectAll,
    toggleSelectRow,
    handleSelectExamRow,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveExam,
    handleArchiveExam,
    handleDeleteExam,
    handleDuplicateExam,
    handleAddCategory,
    handleDeleteCategory,
  };
}

export type AdminExamsState = ReturnType<typeof useAdminExams>;
