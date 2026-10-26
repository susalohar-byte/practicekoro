import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminTopicManage } from './topicManage/useAdminTopicManage';
import { TopicManageHeader } from './topicManage/TopicManageHeader';
import { TopicManageStatCards } from './topicManage/TopicManageStatCards';
import { TopicManageFilterBar } from './topicManage/TopicManageFilterBar';
import { TopicManageTable } from './topicManage/TopicManageTable';
import { TopicViewModal } from './topicManage/TopicViewModal';
import { TopicEditorModal } from './topicManage/TopicEditorModal';
import { SubjectEditorModal } from './topicManage/SubjectEditorModal';
import { ManageSubjectsModal } from './topicManage/ManageSubjectsModal';

export const AdminTopicManage: React.FC = () => {
  const tm = useAdminTopicManage();
  const { isLoading } = tm;
  return withAdminSkeleton(
    isLoading,
    <div className="space-y-5">
      <TopicManageHeader tm={tm} />

      <TopicManageStatCards tm={tm} />

      <TopicManageFilterBar tm={tm} />

      <TopicManageTable tm={tm} />

      {/* ══════════════════════════════════════════════
          M O D A L S
          ══════════════════════════════════════════════ */}

      <TopicViewModal tm={tm} />

      <TopicEditorModal tm={tm} />

      <SubjectEditorModal tm={tm} />

      <ManageSubjectsModal tm={tm} />
    </div>,
    { label: 'Loading topic manage…', variant: 'table' }
  );
};

export default AdminTopicManage;
