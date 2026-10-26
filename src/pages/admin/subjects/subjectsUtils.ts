import type { Subject } from '@/types';

// Enriched Subject model matching all fields in the reference screenshot
export interface EnrichedSubjectRow extends Subject {
  category: 'General' | 'Social Science' | 'Aptitude' | string;
  topicsCount: number;
  topicTestsCount: number;
  totalQuestionsCount: number;
  totalQuestionsFormatted: string;
  statusLabel: 'Published' | 'Draft';
  createdByName?: string;
  createdAtFormatted?: string;
  updatedAtFormatted?: string;
  avgScoreFormatted?: string;
  completionRateFormatted?: string;
  attemptsCount?: number | null;
}

/** Triggers a browser download of in-memory content (e.g. the import CSV template). */
export const download = (content: string, name: string, type: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
