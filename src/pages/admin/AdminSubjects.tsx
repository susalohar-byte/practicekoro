import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminSubjects } from './subjects/useAdminSubjects';
import { SubjectsHeader } from './subjects/SubjectsHeader';
import { SubjectStatCards } from './subjects/SubjectStatCards';
import { SubjectFilterToolbar } from './subjects/SubjectFilterToolbar';
import { SubjectTablePanel } from './subjects/SubjectTablePanel';
import { SubjectDetailsDrawer } from './subjects/SubjectDetailsDrawer';
import { SubjectImportModal } from './subjects/SubjectImportModal';
import { SubjectOrderModal } from './subjects/SubjectOrderModal';
import { SubjectEditorModal } from './subjects/SubjectEditorModal';
export type { EnrichedSubjectRow } from './subjects/subjectsUtils';
export { SubjectIconBadge } from './subjects/SubjectIconBadge';

export const AdminSubjects: React.FC = () => {
  const sb = useAdminSubjects();
  const { isLoading } = sb;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-4 max-w-[1600px] mx-auto p-4 sm:p-6 animate-in fade-in-50 duration-200">
      <SubjectsHeader sb={sb} />

      <SubjectStatCards sb={sb} />

      <SubjectFilterToolbar sb={sb} />

      {/* 4. Main Split-Screen Container: Table on Left + Subject Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <SubjectTablePanel sb={sb} />

        <SubjectDetailsDrawer sb={sb} />
      </div>

      <SubjectImportModal sb={sb} />

      <SubjectOrderModal sb={sb} />

      <SubjectEditorModal sb={sb} />
    </div>,
    { label: 'Loading complete subject records…', variant: 'table' }
  );
};
