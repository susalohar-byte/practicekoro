import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { isSupabaseConfigured } from '@/lib/supabase';
import { runConfirmedBatch } from '@/services/domains/admin.mutations';
import { useSearchParams } from 'react-router-dom';
import { api } from '@/services/api';
import type { Subject } from '@/types';
import { getErrorMessage } from '@/lib/errors';
import { CANONICAL_TOPICS_PRESET, COLOR_PALETTE } from './topicsUtils';
import type { EnrichedTopicRow, SubjectGroup } from './topicsUtils';

// All state, data loading and handlers for the admin Topics page.
export function useAdminTopics() {
  const [pageLoading, setPageLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [topicsList, setTopicsList] = useState<EnrichedTopicRow[]>(
    isSupabaseConfigured ? [] : CANONICAL_TOPICS_PRESET
  );
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState<string>(
    searchParams.get('subject') || 'all'
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'published' | 'draft'>(
    'all'
  );

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Collapsed Subject Groups state (all open by default)
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  // Active Selected Topic for the Right-hand Details Panel (Neutral initial state)
  const [selectedTopic, setSelectedTopic] = useState<EnrichedTopicRow | null>(null);
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  const [detailsTab, setDetailsTab] = useState<'overview' | 'tests' | 'questions' | 'settings'>(
    'overview'
  );

  // Row selection checkboxes
  const [selectedTopicIds, setSelectedTopicIds] = useState<Set<string>>(new Set());

  // Action Menu dropdown state
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Form State for Create / Edit Topic
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subjectId: '',
    orderIndex: 1,
    statusLabel: 'Published' as 'Published' | 'Draft',
    description: '',
    iconName: '',
  });
  const [isUploadingTopicIcon, setIsUploadingTopicIcon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Action Notice Toast
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);

  useEffect(() => {
    if (!actionNotice) return;
    const timer = setTimeout(() => {
      setActionNotice(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [actionNotice]);

  // Reorder list modal state
  const [orderList, setOrderList] = useState<EnrichedTopicRow[]>([]);
  const [orderSubjectId, setOrderSubjectId] = useState<string>('');

  // Load Data and merge with database
  const loadData = useCallback(async () => {
    setPageLoading(true);
    try {
      const [subs, rows] = await Promise.all([
        api.getAllAdminSubjects(),
        api.getAllAdminChapters(),
      ]);
      setSubjectsList(subs);
      const mapped: EnrichedTopicRow[] = rows.map((r) => ({
        ...r,
        subjectName: subs.find((s) => s.id === r.subjectId)?.name || 'Unavailable',
        totalTests: r.testsCount || 0,
        totalQuestions: 0,
        statusLabel: r.isActive ? 'Published' : 'Draft',
        iconName: r.iconName || 'Layers',
        totalAttempts: 0,
        avgScoreFormatted: 'Unavailable',
        descriptionBengali: r.description || '',
        subjectTopicsCount: rows.filter((c) => c.subjectId === r.subjectId).length,
        subjectTotalTestsCount: 0,
        subjectTotalQuestionsCount: 0,
        createdByName: 'Unavailable',
        createdAtFormatted: 'Unavailable',
        updatedAtFormatted: 'Unavailable',
      }));
      setTopicsList(mapped);
      setSelectedTopic((prev) => (prev ? mapped.find((r) => r.id === prev.id) || null : null));
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: getErrorMessage(err, 'Topics could not be loaded.'),
      });
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 1. Group all topics under real Subjects from subjectsList
  const allSubjectGroups = useMemo<SubjectGroup[]>(() => {
    const groups: SubjectGroup[] = subjectsList.map((sub, idx) => {
      const matchingTopics = topicsList
        .filter((t) => t.subjectId === sub.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);

      return {
        id: sub.id,
        name: sub.name,
        topicsCount: matchingTopics.length,
        iconName: sub.iconName || 'BookOpen',
        colorScheme: COLOR_PALETTE[idx % COLOR_PALETTE.length],
        topics: matchingTopics,
      };
    });

    // Check for any legacy/unassigned topics not mapped to any known subject
    const knownSubjectIds = new Set(subjectsList.map((s) => s.id));
    const orphanTopics = topicsList
      .filter((t) => !knownSubjectIds.has(t.subjectId))
      .sort((a, b) => a.orderIndex - b.orderIndex);

    if (orphanTopics.length > 0) {
      groups.push({
        id: '__unassigned__',
        name: 'Other Topics (Unassigned)',
        topicsCount: orphanTopics.length,
        iconName: 'HelpCircle',
        colorScheme: 'amber',
        topics: orphanTopics,
      });
    }

    return groups;
  }, [subjectsList, topicsList]);

  // 2. Filter Subject Groups by search query, selected subject, and status
  const filteredSubjectGroups = useMemo<SubjectGroup[]>(() => {
    const query = searchTerm.toLowerCase().trim();

    return allSubjectGroups
      .map((group) => {
        // If a specific subject is filtered, only keep that subject
        if (selectedSubjectFilter !== 'all' && group.id !== selectedSubjectFilter) {
          return null;
        }

        // Filter the topics of this subject
        const matchingTopics = group.topics.filter((topic) => {
          // Status filter
          if (selectedStatusFilter === 'published' && topic.statusLabel !== 'Published')
            return false;
          if (selectedStatusFilter === 'draft' && topic.statusLabel !== 'Draft') return false;

          // Search on topic name, slug, description
          if (!query) return true;
          return (
            topic.name.toLowerCase().includes(query) ||
            topic.slug.toLowerCase().includes(query) ||
            (topic.descriptionBengali && topic.descriptionBengali.toLowerCase().includes(query))
          );
        });

        // Does the parent subject name itself match the search query?
        const subjectMatchesQuery = Boolean(query && group.name.toLowerCase().includes(query));

        // When a search is typed:
        // keep group if subject matches OR any topics match
        if (query) {
          if (!subjectMatchesQuery && matchingTopics.length === 0) {
            return null;
          }
        } else if (selectedStatusFilter !== 'all') {
          // When status filter is active, only show subjects with matching topics
          if (matchingTopics.length === 0) {
            return null;
          }
        }

        return {
          ...group,
          topics: matchingTopics,
          topicsCount: matchingTopics.length,
        };
      })
      .filter((g): g is SubjectGroup => g !== null);
  }, [allSubjectGroups, searchTerm, selectedSubjectFilter, selectedStatusFilter]);

  // Flat list of all currently visible filtered topics
  const allFilteredTopics = useMemo(() => {
    return filteredSubjectGroups.flatMap((g) => g.topics);
  }, [filteredSubjectGroups]);

  // Pagination over Subject Groups so subjects are never cut across pages
  const totalItems = filteredSubjectGroups.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  // Keep currentPage within bounds
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Paged Subject Groups for current page
  const pagedSubjectGroups = useMemo(() => {
    return filteredSubjectGroups.slice(startIndex, endIndex);
  }, [filteredSubjectGroups, startIndex, endIndex]);

  // Toggle Collapse of a Subject Group by group.id or group.name
  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  // Row selection
  const toggleSelectRow = (topicId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTopicIds.size > 0) {
      setSelectedTopicIds(new Set());
    } else {
      setSelectedTopicIds(new Set(allFilteredTopics.map((t) => t.id)));
    }
  };

  // Select Topic to view in Details Panel
  const handleSelectTopicRow = (topic: EnrichedTopicRow) => {
    setSelectedTopic(topic);
    setShowDetailsPanel(true);
  };

  // Filter Buttons
  const handleApplyFilter = () => {
    setCurrentPage(1);
  };

  const handleResetFilter = () => {
    setSearchTerm('');
    setSelectedSubjectFilter('all');
    setSelectedStatusFilter('all');
    setCurrentPage(1);
    setSearchParams({});
  };

  // Create Modal Handlers with targetSubjectId pre-fill
  const handleOpenCreateModal = (targetSubjectId?: string) => {
    const selectedSubId =
      targetSubjectId ||
      (selectedSubjectFilter !== 'all' && subjectsList.some((s) => s.id === selectedSubjectFilter)
        ? selectedSubjectFilter
        : subjectsList[0]?.id || '');

    const currentSubTopics = topicsList.filter((t) => t.subjectId === selectedSubId);

    setFormData({
      name: '',
      slug: '',
      subjectId: selectedSubId,
      orderIndex: currentSubTopics.length + 1,
      statusLabel: 'Published',
      description: '',
      iconName: '',
    });
    setFormError('');
    setIsCreateModalOpen(true);
  };

  // Edit Modal Handlers
  const handleOpenEditModal = (t: EnrichedTopicRow) => {
    setFormData({
      name: t.name,
      slug: t.slug,
      subjectId: t.subjectId,
      orderIndex: t.orderIndex,
      statusLabel: t.statusLabel,
      description: t.descriptionBengali || '',
      iconName: t.iconName || '',
    });
    setFormError('');
    setSelectedTopic(t);
    setIsEditModalOpen(true);
  };

  // Save Topic (Create / Update)
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    try {
      setIsSubmitting(true);
      setFormError('');
      const input = {
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        subjectId: formData.subjectId,
        orderIndex: formData.orderIndex,
        isActive: formData.statusLabel === 'Published',
        iconName: formData.iconName.trim(),
        description: formData.description.trim(),
      };
      if (!input.name || !input.slug || !input.subjectId)
        throw new Error('Name, slug and subject are required.');
      if (isEditModalOpen && selectedTopic) await api.updateChapter(selectedTopic.id, input);
      else await api.createChapter(input);
      await loadData();
      setIsEditModalOpen(false);
      setIsCreateModalOpen(false);
      setActionNotice({ type: 'success', message: 'Topic saved in the backend.' });
    } catch (err) {
      setFormError(getErrorMessage(err, 'Topic save failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Single Topic Status (Published <-> Draft)
  const handleToggleTopicStatus = async (topic: EnrichedTopicRow) => {
    try {
      const saved = await api.updateChapter(topic.id, { isActive: !topic.isActive });
      setTopicsList((prev) =>
        prev.map((t) =>
          t.id === saved.id
            ? { ...t, ...saved, statusLabel: saved.isActive ? 'Published' : 'Draft' }
            : t
        )
      );
      setSelectedTopic((prev) =>
        prev?.id === saved.id
          ? { ...prev, ...saved, statusLabel: saved.isActive ? 'Published' : 'Draft' }
          : prev
      );
      setActionNotice({ type: 'success', message: 'Topic status saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Save failed') });
    }
  };

  // Batch Operations
  const handleBatchPublish = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedTopicIds), (id) =>
      api.updateChapter(id, { isActive: true })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setTopicsList((prev) =>
      prev.map((s) =>
        changed.has(s.id) ? { ...s, ...changed.get(s.id), statusLabel: 'Published' } : s
      )
    );
    setSelectedTopic((prev) =>
      prev && changed.has(prev.id)
        ? { ...prev, ...changed.get(prev.id), statusLabel: 'Published' }
        : prev
    );
    setSelectedTopicIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDraft = async () => {
    const batch = await runConfirmedBatch(Array.from(selectedTopicIds), (id) =>
      api.updateChapter(id, { isActive: false })
    );
    const changed = new Map(batch.results.map((r) => [r.input, r.value]));
    setTopicsList((prev) =>
      prev.map((s) =>
        changed.has(s.id) ? { ...s, ...changed.get(s.id), statusLabel: 'Draft' } : s
      )
    );
    setSelectedTopic((prev) =>
      prev && changed.has(prev.id)
        ? { ...prev, ...changed.get(prev.id), statusLabel: 'Draft' }
        : prev
    );
    setSelectedTopicIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        batch.results.length +
        ' saved; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  const handleBatchDelete = async () => {
    if (!selectedTopicIds.size || !confirm('Delete selected topics?')) return;
    const batch = await runConfirmedBatch(Array.from(selectedTopicIds), (id) =>
      api.deleteChapter(id)
    );
    const gone = new Set(batch.results.map((r) => r.input));
    setTopicsList((prev) => prev.filter((t) => !gone.has(t.id)));
    setSelectedTopic((prev) => (prev && gone.has(prev.id) ? null : prev));
    setSelectedTopicIds(new Set(batch.failures.map((f) => f.input)));
    setActionNotice({
      type: batch.failures.length ? 'error' : 'success',
      message:
        gone.size +
        ' deleted; ' +
        batch.failures.length +
        ' failed.' +
        (batch.failures[0] ? ' ' + batch.failures[0].error : ''),
    });
  };

  // Delete Topic
  const handleDeleteTopic = async (id: string) => {
    if (!confirm('Delete this topic? Linked records may block deletion.')) return;
    try {
      await api.deleteChapter(id);
      setTopicsList((prev) => prev.filter((t) => t.id !== id));
      setSelectedTopic((prev) => (prev?.id === id ? null : prev));
      setActionNotice({ type: 'success', message: 'Topic deleted.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Delete failed') });
    }
  };

  // Duplicate Topic
  const handleDuplicateTopic = async (topic: EnrichedTopicRow) => {
    try {
      await api.createChapter({
        ...topic,
        name: topic.name + ' (Copy)',
        slug: topic.slug + '-copy-' + crypto.randomUUID().slice(0, 8),
        isActive: false,
      });
      await loadData();
      setActionNotice({ type: 'success', message: 'Draft topic created.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Duplicate failed') });
    }
  };

  // Open Reorder Modal
  const handleOpenOrderModal = () => {
    const targetSubId =
      selectedSubjectFilter !== 'all' && subjectsList.some((s) => s.id === selectedSubjectFilter)
        ? selectedSubjectFilter
        : subjectsList[0]?.id || '';
    setOrderSubjectId(targetSubId);
    // Only the chosen subject's topics are renumbered.
    const subTopics = topicsList
      .filter((t) => t.subjectId === targetSubId)
      .sort((a, b) => a.orderIndex - b.orderIndex);
    setOrderList(subTopics);
    setIsOrderModalOpen(true);
  };

  // Move topic in order list
  const moveTopicOrder = (index: number, direction: 'up' | 'down') => {
    const nextList = [...orderList];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= nextList.length) return;
    const temp = nextList[index];
    nextList[index] = nextList[targetIdx];
    nextList[targetIdx] = temp;
    setOrderList(nextList);
  };

  // Save new ordering
  const handleSaveOrder = async () => {
    setIsSubmitting(true);
    try {
      const batch = await runConfirmedBatch(orderList, (t) =>
        api.updateChapter(t.id, { orderIndex: orderList.findIndex((x) => x.id === t.id) + 1 })
      );
      await loadData();
      if (batch.failures.length)
        throw new Error(
          batch.results.length +
            ' saved; ' +
            batch.failures.length +
            ' failed: ' +
            batch.failures[0].error
        );
      setIsOrderModalOpen(false);
      setActionNotice({ type: 'success', message: 'Topic order saved.' });
    } catch (err) {
      setActionNotice({ type: 'error', message: getErrorMessage(err, 'Order save failed') });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    pageLoading,
    setPageLoading,
    searchParams,
    setSearchParams,
    topicsList,
    setTopicsList,
    subjectsList,
    setSubjectsList,
    searchTerm,
    setSearchTerm,
    selectedSubjectFilter,
    setSelectedSubjectFilter,
    selectedStatusFilter,
    setSelectedStatusFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    collapsedGroups,
    setCollapsedGroups,
    selectedTopic,
    setSelectedTopic,
    showDetailsPanel,
    setShowDetailsPanel,
    detailsTab,
    setDetailsTab,
    selectedTopicIds,
    setSelectedTopicIds,
    openActionMenuId,
    setOpenActionMenuId,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isEditModalOpen,
    setIsEditModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
    isOrderModalOpen,
    setIsOrderModalOpen,
    formData,
    setFormData,
    isUploadingTopicIcon,
    setIsUploadingTopicIcon,
    isSubmitting,
    setIsSubmitting,
    formError,
    setFormError,
    actionNotice,
    setActionNotice,
    orderList,
    setOrderList,
    orderSubjectId,
    setOrderSubjectId,
    loadData,
    allSubjectGroups,
    filteredSubjectGroups,
    allFilteredTopics,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    pagedSubjectGroups,
    toggleGroupCollapse,
    toggleSelectRow,
    toggleSelectAll,
    handleSelectTopicRow,
    handleApplyFilter,
    handleResetFilter,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleSaveTopic,
    handleToggleTopicStatus,
    handleBatchPublish,
    handleBatchDraft,
    handleBatchDelete,
    handleDeleteTopic,
    handleDuplicateTopic,
    handleOpenOrderModal,
    moveTopicOrder,
    handleSaveOrder,
  };
}

export type AdminTopicsState = ReturnType<typeof useAdminTopics>;
