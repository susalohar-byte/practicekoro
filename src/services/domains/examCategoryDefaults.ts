import type { ExamCategory } from '@/types';

/**
 * The standard exam categories. Real configuration used in every build (legacy
 * category names are normalized to these), kept apart from the demo engine's
 * localStore so production builds do not have to bundle the demo data.
 */
export const STANDARD_EXAM_CATEGORIES: readonly ExamCategory[] = [
  { id: 'cat_wb_police', name: 'WB Police (WBP / KP)', orderIndex: 1, isActive: true },
  { id: 'cat_wbpsc', name: 'WBPSC (Clerkship / WBCS)', orderIndex: 2, isActive: true },
  { id: 'cat_teaching', name: 'Teaching (TET / SLST)', orderIndex: 3, isActive: true },
  { id: 'cat_ssc', name: 'SSC & Central Govt.', orderIndex: 4, isActive: true },
  { id: 'cat_railways', name: 'Railways (RRB)', orderIndex: 5, isActive: true },
];
