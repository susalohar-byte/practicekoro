import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminTopics } from './topics/useAdminTopics';
import { TopicsHeader } from './topics/TopicsHeader';
import { TopicStatCards } from './topics/TopicStatCards';
import { TopicBulkActionBar } from './topics/TopicBulkActionBar';
import { TopicFilterBar } from './topics/TopicFilterBar';
import { TopicsTablePanel } from './topics/TopicsTablePanel';
import { TopicDetailsPanel } from './topics/TopicDetailsPanel';
import { TopicFormModal } from './topics/TopicFormModal';
import { TopicOrderModal } from './topics/TopicOrderModal';
import { TopicImportModal } from './topics/TopicImportModal';
export type { EnrichedTopicRow, SubjectGroup } from './topics/topicsUtils';
export { TopicIconBadge } from './topics/TopicIconBadge';

export const AdminTopics: React.FC = () => {
  const tp = useAdminTopics();
  const { pageLoading } = tp;
  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-4 pb-12 animate-in fade-in duration-300">
      <TopicsHeader tp={tp} />

      <TopicStatCards tp={tp} />

      <TopicBulkActionBar tp={tp} />

      <TopicFilterBar tp={tp} />

      {/* 4. Split-Screen Layout: Accordion Table on Left + Topic Details on Right */}
      <div className="flex flex-col lg:flex-row items-start gap-4">
        <TopicsTablePanel tp={tp} />

        {/* Right Column: Topic Details Card (matching screenshot) */}
        <TopicDetailsPanel tp={tp} />
      </div>

      <TopicFormModal tp={tp} />

      <TopicOrderModal tp={tp} />

      <TopicImportModal tp={tp} />
    </div>,
    { label: 'Loading topics…', variant: 'table' }
  );
};

export default AdminTopics;
