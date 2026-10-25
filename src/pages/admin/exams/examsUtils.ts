import type { Exam } from '@/types';

export const STORAGE_KEY_CATEGORIES = 'practicekoro_exam_categories';
// Offline-only grouping buckets kept for the local demo categories.
export const LEGACY_FILTER_BUCKETS = new Set(['state govt', 'central govt', 'other']);
export const DEFAULT_EXAM_CATEGORIES = [
  'State Govt',
  'Central Govt',
  'Other',
  'WB Police (WBP / KP)',
  'WBPSC (Clerkship / WBCS)',
  'Teaching (TET / SLST)',
  'SSC & Central Govt.',
  'Railways (RRB)',
];

export const EXAM_LOGO_CACHE_KEY = 'practicekoro_exam_logos';

export function getExamLogoCache(): Record<string, string> {
  try {
    const raw = localStorage.getItem(EXAM_LOGO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveExamLogoCache(examId: string, logoUrl: string) {
  try {
    const cache = getExamLogoCache();
    if (logoUrl) cache[examId] = logoUrl;
    else delete cache[examId];
    localStorage.setItem(EXAM_LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable
  }
}

// Exam row data model with rich display fields
export interface EnrichedExamRow extends Exam {
  subtitle?: string;
  categoryLabel?: string;
  subjectsCount: number;
  /** Full Mock tests whose primary exam is this exam. */
  fullMockCount: number;
  totalTestsCount: number;
  enrollmentsCount: number;
  enrollmentsFormatted: string;
  statusLabel: 'Published' | 'Draft';
  shortName?: string;
  createdByName?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
  avgScoreFormatted?: string;
  completionRateFormatted?: string;
}

export const EXAM_OVERRIDES_CACHE_KEY = 'practicekoro_exam_overrides';

export function getExamOverridesCache(): Record<string, Partial<EnrichedExamRow>> {
  try {
    const raw = localStorage.getItem(EXAM_OVERRIDES_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveExamOverrideCache(examId: string, overrides: Partial<EnrichedExamRow>) {
  try {
    const cache = getExamOverridesCache();
    cache[examId] = { ...(cache[examId] || {}), ...overrides };
    localStorage.setItem(EXAM_OVERRIDES_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage unavailable
  }
}
