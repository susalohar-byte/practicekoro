import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import {
  enrichSubject,
  subjectSummary,
  validateSubjectInput,
  type SubjectReportingData,
} from '@/utils/adminSubjectModel';
import { api } from '@/services/api';
import type { Subject, Chapter, MockTest } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import type { EnrichedSubjectRow } from './subjectsUtils';
import { CANONICAL_SUBJECTS_PRESET } from './subjectsPreset';
import { useSubjectImportOrder } from './useSubjectImportOrder';

export function useAdminSubjects() {
  // Data States
  const [subjectsList, setSubjectsList] = useState<EnrichedSubjectRow[]>(
    isSupabaseConfigured ? [] : CANONICAL_SUBJECTS_PRESET
  );
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [tests, setTests] = useState<MockTest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [report, setReport] = useState<SubjectReportingData>({
    questions: null,
    attempts: null,
    warnings: [],
  });
  const mutationLock = useRef(false);
  const uploadLock = useRef(false);
  const requestId = useRef(0);
  const [isSaving, setIsSaving] = useState(false);

  // Selected Subject & Side Panel (Neutral initial state - nothing selected by default)
  const [selectedSubject, setSelectedSubject] = useState<EnrichedSubjectRow | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState<boolean>(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'topics' | 'topic_tests'>('overview');

  // Row selection checkboxes (Neutral initial state)
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<Set<string>>(new Set());

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

  // Create / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<EnrichedSubjectRow | null>(null);
  const [formName, setFormName] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [formCategory, setFormCategory] = useState<string>('General');
  const [formDescription, setFormDescription] = useState('');
  const [formIconName, setFormIconName] = useState('');
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formError, setFormError] = useState('');

  // Import Modal & Order Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen && !isImportModalOpen && !isOrderModalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isModalOpen, isImportModalOpen, isOrderModalOpen]);

  const loadData = useCallback(async () => {
    const token = ++requestId.current;
    setIsLoading(true);
    setLoadError('');
    try {
      const [rows, chs, ts, metrics] = await Promise.all([
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
        api.getAllAdminTests(),
        api.getSubjectReportingData(),
      ]);
      if (token !== requestId.current) return false;
      const mapped = rows.map((r) => enrichSubject(r, chs, ts, metrics));
      setChapters(chs);
      setTests(ts);
      setReport(metrics);
      setSubjectsList(mapped);
      setSelectedSubject((prev) => (prev ? mapped.find((r) => r.id === prev.id) || null : null));
      setSelectedSubjectIds(
        (prev) => new Set([...prev].filter((id) => mapped.some((r) => r.id === id)))
      );
      return true;
    } catch (err) {
      if (token === requestId.current) {
        setLoadError(getErrorMessage(err, 'Subjects could not be loaded.'));
        setSubjectsList([]);
        setSelectedSubject(null);
        setShowDetailsPanel(false);
      }
      return false;
    } finally {
      if (token === requestId.current) setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    void loadData();
    const requests = requestId;
    return () => {
      requests.current++;
    };
  }, [loadData]);
  const summary = useMemo(
    () => subjectSummary(subjectsList, chapters, tests, report),
    [subjectsList, chapters, tests, report]
  );
  const nextOrder = () => subjectsList.reduce((max, s) => Math.max(max, s.orderIndex), 0) + 1;
  const addSavedRow = (saved: Subject) => {
    if (!saved?.id || !saved.name) throw new Error('The backend did not return a saved subject.');
    const row = enrichSubject(saved, chapters, tests, report);
    setSubjectsList((prev) =>
      [...prev.filter((s) => s.id !== row.id), row].sort(
        (a, b) => a.orderIndex - b.orderIndex || a.id.localeCompare(b.id)
      )
    );
    setSelectedSubject((prev) => (prev?.id === row.id ? row : prev));
    return row;
  };
  // Auto-dismiss notification
  useEffect(() => {
    if (!actionSuccessMessage) return;
    const timer = setTimeout(() => setActionSuccessMessage(null), 4000);
    return () => clearTimeout(timer);
  }, [actionSuccessMessage]);

  // Filter handlers
  const handleApplyFilter = () => {
    setAppliedFilters({
      search: searchTerm,
      category: selectedCategory,
      status: selectedStatus,
    });
    setCurrentPage(1);
    setSelectedSubjectIds(new Set());
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
    setSelectedSubjectIds(new Set());
  };

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return subjectsList.filter((s) => {
      const q = appliedFilters.search.toLowerCase().trim();
      if (q) {
        const matchName = s.name.toLowerCase().includes(q);
        const matchCat = s.category.toLowerCase().includes(q);
        const matchDesc = (s.description || '').toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }

      if (appliedFilters.category !== 'all') {
        if (s.category.toLowerCase() !== appliedFilters.category.toLowerCase()) return false;
      }

      if (appliedFilters.status !== 'all') {
        if (appliedFilters.status === 'published' && (!s.isActive || s.statusLabel === 'Draft'))
          return false;
        if (appliedFilters.status === 'draft' && s.isActive && s.statusLabel === 'Published')
          return false;
      }

      return true;
    });
  }, [subjectsList, appliedFilters]);

  // Pagination calculation
  const totalItems = filteredSubjects.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedSubjects = filteredSubjects.slice(startIndex, endIndex);

  // Keep currentPage within bounds when subjects are filtered or deleted
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Row selection
  const toggleSelectAll = () => {
    if (pagedSubjects.length > 0 && pagedSubjects.every((s) => selectedSubjectIds.has(s.id))) {
      setSelectedSubjectIds(
        (prev) => new Set([...prev].filter((id) => !pagedSubjects.some((s) => s.id === id)))
      );
    } else {
      setSelectedSubjectIds((prev) => new Set([...prev, ...pagedSubjects.map((s) => s.id)]));
    }
  };

  const toggleSelectRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedSubjectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectSubjectRow = (sub: EnrichedSubjectRow) => {
    setSelectedSubject(sub);
    setDetailsTab('overview');
    setShowDetailsPanel(true);
  };

  // Create / Edit modal handlers
  const handleOpenCreateModal = () => {
    if (mutationLock.current || uploadLock.current || isLoading) return;
    setEditingSubject(null);
    setFormName('');
    setFormSlug('');
    setSlugTouched(false);
    setFormCategory('General');
    setFormDescription('');
    setFormIconName('');
    setFormIsActive(true);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (sub: EnrichedSubjectRow) => {
    if (mutationLock.current || uploadLock.current || isLoading) return;
    setEditingSubject(sub);
    setFormName(sub.name);
    setFormSlug(sub.slug);
    setFormCategory(sub.category);
    setFormDescription(sub.description || '');
    setFormIconName(sub.iconName || '');
    setFormIsActive(sub.isActive);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mutationLock.current || uploadLock.current || isLoading) return;
    try {
      const slug =
        formSlug.trim() ||
        formName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      const input = {
        name: formName.trim(),
        slug,
        category: formCategory,
        description: formDescription.trim(),
        isActive: formIsActive,
        iconName: formIconName.trim(),
        orderIndex: editingSubject?.orderIndex ?? nextOrder(),
      };
      validateSubjectInput(input);
      if (
        subjectsList.some(
          (s) =>
            s.id !== editingSubject?.id &&
            (s.examId || '') === (editingSubject?.examId || '') &&
            s.slug.toLowerCase().trim() === slug
        )
      )
        throw new Error('This URL slug is already used in the same exam/global subject scope.');
      mutationLock.current = true;
      setIsSaving(true);
      setFormError('');
      setActionError('');
      const saved = editingSubject
        ? await api.updateSubject(editingSubject.id, input)
        : await api.createSubject({ ...input, iconName: input.iconName || 'BookOpen' });
      if (editingSubject && saved?.id !== editingSubject.id)
        throw new Error('The backend did not confirm the selected subject.');
      const row = addSavedRow(saved);
      if (!editingSubject) {
        setSelectedSubject(row);
        setShowDetailsPanel(true);
        setDetailsTab('overview');
      }
      setActionSuccessMessage(
        `Subject "${row.name}" ${editingSubject ? 'updated' : 'created'} successfully.`
      );
      setIsModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err, 'Subject save failed.'));
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };
  const handleDeleteSubject = async (id: string) => {
    if (mutationLock.current || uploadLock.current) return;
    mutationLock.current = true;
    setIsSaving(true);
    setActionError('');
    try {
      const confirmed = await api.deleteSubject(id);
      if (confirmed !== true) throw new Error('Deletion was not confirmed.');
      setSubjectsList((prev) => prev.filter((s) => s.id !== id));
      setSelectedSubjectIds((prev) => new Set([...prev].filter((i) => i !== id)));
      setOpenActionMenuId(null);
      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
        setShowDetailsPanel(false);
      }
      setActionSuccessMessage('Subject deleted successfully.');
    } catch (err) {
      setActionError(
        getErrorMessage(err, 'Subject deletion failed. Linked content must be preserved.')
      );
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };
  const handleDuplicateSubject = async (sub: EnrichedSubjectRow) => {
    if (mutationLock.current || uploadLock.current) return;
    mutationLock.current = true;
    setIsSaving(true);
    setActionError('');
    try {
      const saved = await api.createSubject({
        name: sub.name + ' (Copy)',
        slug: sub.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        category: sub.category,
        description: sub.description,
        iconName: sub.iconName,
        examId: sub.examId,
        orderIndex: nextOrder(),
        isActive: false,
      });
      addSavedRow(saved);
      setActionSuccessMessage('Draft subject created. Existing topics/tests were not copied.');
    } catch (err) {
      setActionError(getErrorMessage(err, 'Subject duplication failed.'));
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };
  const importOrder = useSubjectImportOrder({
    mutationLock,
    subjectsList,
    nextOrder,
    addSavedRow,
    setIsSaving,
    setIsOrderModalOpen,
    setActionSuccessMessage,
  });

  return {
    ...importOrder,
    subjectsList,
    setSubjectsList,
    chapters,
    setChapters,
    tests,
    setTests,
    isLoading,
    setIsLoading,
    loadError,
    setLoadError,
    actionError,
    setActionError,
    report,
    setReport,
    mutationLock,
    uploadLock,
    requestId,
    isSaving,
    setIsSaving,
    selectedSubject,
    setSelectedSubject,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    selectedSubjectIds,
    setSelectedSubjectIds,
    openActionMenuId,
    setOpenActionMenuId,
    searchTerm,
    setSearchTerm,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    appliedFilters,
    setAppliedFilters,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    actionSuccessMessage,
    setActionSuccessMessage,
    isModalOpen,
    setIsModalOpen,
    editingSubject,
    setEditingSubject,
    formName,
    setFormName,
    formSlug,
    setFormSlug,
    slugTouched,
    setSlugTouched,
    formCategory,
    setFormCategory,
    formDescription,
    setFormDescription,
    formIconName,
    setFormIconName,
    isUploadingIcon,
    setIsUploadingIcon,
    formIsActive,
    setFormIsActive,
    formError,
    setFormError,
    isImportModalOpen,
    setIsImportModalOpen,
    isOrderModalOpen,
    setIsOrderModalOpen,
    loadData,
    summary,
    nextOrder,
    addSavedRow,
    handleApplyFilter,
    handleResetFilter,
    filteredSubjects,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pagedSubjects,
    toggleSelectAll,
    toggleSelectRow,
    handleSelectSubjectRow,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveSubject,
    handleDeleteSubject,
    handleDuplicateSubject,
  };
}

export type AdminSubjectsState = ReturnType<typeof useAdminSubjects>;
