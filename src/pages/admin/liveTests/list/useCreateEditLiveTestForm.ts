import React, { useState, useEffect, useMemo } from 'react';
import { api } from '@/services/api';
import { isoToLocalDateTimeParts, localDateTimeToIso } from '@/services/domains/admin.liveTests';
import type { Exam, LiveTest } from '@/types';
import { PRESET_LOGOS, getDefaultStartDate } from './liveTestsUtils';
import { toast } from './useAdminLiveTests';

export interface CreateEditLiveTestModalProps {
  isOpen: boolean;
  initialData: LiveTest | null;
  exams: Exam[];
  onClose: () => void;
  onSave: (test: LiveTest) => Promise<void>;
}

export function useCreateEditLiveTestForm({
  initialData,
  exams,
  onClose,
  onSave,
}: CreateEditLiveTestModalProps) {
  const [title, setTitle] = useState(initialData?.title || '');
  const [examId, setExamId] = useState(initialData?.examId || '');
  const [logo, setLogo] = useState(
    initialData?.logo || initialData?.examLogo || PRESET_LOGOS[0].url
  );
  // Date/time inputs are in the admin's local timezone (IST); stored as UTC ISO.
  const initialStartParts = initialData?.startAt
    ? isoToLocalDateTimeParts(initialData.startAt)
    : null;
  const [startDate, setStartDate] = useState(initialStartParts?.date ?? getDefaultStartDate());
  const [startTime, setStartTime] = useState(initialStartParts?.time ?? '10:00');
  const [durationMinutes, setDurationMinutes] = useState(initialData?.durationMinutes || 60);
  const [totalQuestions, setTotalQuestions] = useState(initialData?.totalQuestions || 100);
  const [totalMarks, setTotalMarks] = useState(initialData?.totalMarks || 100);
  const [negativeMarking, setNegativeMarking] = useState(initialData?.negativeMarking ?? 0.25);
  const [status, setStatus] = useState<string>(initialData?.status || 'upcoming');
  const [rankingEnabled, setRankingEnabled] = useState(
    initialData?.rankingEnabled !== undefined ? initialData.rankingEnabled : true
  );
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Keyboard shortcut: ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isSubmitting]);

  // Prevent background scrolling when dialog is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Auto-suggest title & default logo when an exam is selected
  const handleExamChange = (newExamId: string) => {
    setExamId(newExamId);
    const selected = exams.find((ex) => ex.id === newExamId);
    if (selected) {
      if (!title.trim() || title.includes('Live Test')) {
        setTitle(`${selected.title} Live Test 01`);
      }
      const text = `${selected.title} ${selected.slug || ''}`.toLowerCase();
      let matchedLogo = PRESET_LOGOS[0].url;
      if (text.includes('kolkata') || text.includes('kp')) {
        matchedLogo = '/images/exams/logo_kp.png';
      } else if (
        text.includes('psc') ||
        text.includes('clerkship') ||
        text.includes('miscellaneous')
      ) {
        matchedLogo = '/images/exams/logo_wbpsc.png';
      } else if (text.includes('rail') || text.includes('rrb') || text.includes('alp')) {
        matchedLogo = '/images/exams/logo_railway.png';
      } else if (text.includes('ssc')) {
        matchedLogo = '/images/exams/logo_ssc.png';
      } else if (text.includes('tet') || text.includes('primary')) {
        matchedLogo = '/images/exams/logo_wbtet.png';
      } else if (text.includes('wbp') || text.includes('police')) {
        matchedLogo = '/images/exams/logo_wbp.png';
      }

      if (!logo || logo === PRESET_LOGOS[0].url) {
        setLogo(matchedLogo);
      }
    }
  };

  const scheduleSummary = useMemo(() => {
    try {
      const iso = localDateTimeToIso(startDate, startTime);
      const start = new Date(iso);
      const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
      return `${start.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })} · ${start.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })} – ${end.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })}`;
    } catch {
      return `${startDate} at ${startTime}`;
    }
  }, [startDate, startTime, durationMinutes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!initialData && !examId) {
      toast.error('Select the exam for this Live Test');
      return;
    }

    try {
      setIsSubmitting(true);
      const startIso = localDateTimeToIso(startDate, startTime);
      const endIso = new Date(
        new Date(startIso).getTime() + durationMinutes * 60 * 1000
      ).toISOString();

      let result: LiveTest;
      if (initialData) {
        // Keep an explicit earlier registration deadline; otherwise it follows the start time
        // (it defaulted to the start time on create and must never be after the start).
        const prevDeadline = initialData.registrationDeadline
          ? new Date(initialData.registrationDeadline).getTime()
          : NaN;
        const keepDeadline =
          !isNaN(prevDeadline) &&
          prevDeadline !== new Date(initialData.startAt).getTime() &&
          prevDeadline <= new Date(startIso).getTime();
        result = await api.updateLiveTest(initialData.id, {
          registrationDeadline: keepDeadline ? initialData.registrationDeadline : startIso,
          title,
          logo,
          examLogo: logo,
          startAt: startIso,
          scheduledStartTime: startIso,
          scheduledEndTime: endIso,
          durationMinutes: Number(durationMinutes),
          totalQuestions: Number(totalQuestions),
          totalMarks: Number(totalMarks),
          negativeMarking: Number(negativeMarking),
          rankingEnabled,
          status: status as any,
        });
      } else {
        // Creates the Live Test's own paper (hidden Full Mock) and a Draft event for it.
        result = await api.createLiveTestWithPaper({
          examId,
          title,
          startAt: startIso,
          durationMinutes: Number(durationMinutes),
          totalQuestions: Number(totalQuestions),
          totalMarks: Number(totalMarks),
          negativeMarking: Number(negativeMarking),
          rankingEnabled,
          logo,
        });
      }

      await onSave(result);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save Live Test');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    title,
    setTitle,
    examId,
    logo,
    setLogo,
    startDate,
    setStartDate,
    startTime,
    setStartTime,
    durationMinutes,
    setDurationMinutes,
    totalQuestions,
    setTotalQuestions,
    totalMarks,
    setTotalMarks,
    negativeMarking,
    setNegativeMarking,
    status,
    setStatus,
    rankingEnabled,
    setRankingEnabled,
    isUploadingLogo,
    setIsUploadingLogo,
    isSubmitting,
    handleExamChange,
    scheduleSummary,
    handleSubmit,
  };
}
