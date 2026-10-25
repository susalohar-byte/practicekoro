// ============================================================================
// DATA MODELS & TYPES
// ============================================================================

export interface CutoffItem {
  id: number | string;
  exam: string;
  year: number;
  stage: string;
  category: string;
  categoryBadgeClass: string;
  cutoffMarks: number;
  totalPosts: string;
  addedOn?: string;
  addedBy?: string;
  source?: string;
  notes?: string;
  status?: CutoffRecordStatus;
}

export type CutoffRecordStatus = 'active' | 'draft' | 'archived';

export const CATEGORY_LABELS: Record<string, string> = {
  GEN: 'General',
  OBC_A: 'OBC-A',
  OBC_B: 'OBC-B',
};

/** DB category code (+ gender scope) → the label used by the table, filters and form. */
export function toDisplayCategory(category: string, gender?: string): string {
  const label = CATEGORY_LABELS[category] || category;
  return gender === 'FEMALE' ? `Female (${label})` : label;
}

/**
 * Form label → DB columns. "Female (…)" options are stored as gender FEMALE plus a valid
 * category code (the category CHECK only allows GEN/OBC_A/OBC_B/SC/ST/EWS/…).
 */
export function toDbCategoryGender(
  label: string,
  existingGender?: string
): { category: string; gender: 'ALL' | 'MALE' | 'FEMALE' } {
  const female = /^Female \((.+)\)$/.exec(label);
  const base = female ? female[1] : label;
  const category = base === 'General' ? 'GEN' : base.replace('-', '_');
  if (female) return { category, gender: 'FEMALE' };
  const gender = existingGender === 'MALE' ? 'MALE' : 'ALL';
  return { category, gender };
}

// Category badge class helper
export function getCategoryBadgeClass(cat: string): string {
  switch (cat) {
    case 'General':
      return 'bg-[#DBEAFE] text-[#1E40AF]';
    case 'OBC-A':
      return 'bg-[#DCFCE7] text-[#15803D]';
    case 'OBC-B':
      return 'bg-[#FEF3C7] text-[#B45309]';
    case 'SC':
      return 'bg-[#EDE9FE] text-[#6D28D9]';
    case 'ST':
      return 'bg-[#FFE4E6] text-[#BE123C]';
    case 'EWS':
      return 'bg-[#FEF9C3] text-[#A16207]';
    case 'Female (General)':
      return 'bg-[#E0E7FF] text-[#4338CA]';
    case 'Female (SC)':
      return 'bg-[#F3E8FF] text-[#7E22CE]';
    default:
      return 'bg-slate-100 text-slate-800';
  }
}

export interface RecentUpdateItem {
  id: number;
  exam: string;
  year: number;
  stage: string;
  addedOn: string;
  addedBy: string;
  type: string;
}
