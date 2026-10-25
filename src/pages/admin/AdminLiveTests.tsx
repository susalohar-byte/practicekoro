import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { useAdminLiveTests } from './liveTests/list/useAdminLiveTests';
import { LiveTestsHeader } from './liveTests/list/LiveTestsHeader';
import { LiveTestsStatCards } from './liveTests/list/LiveTestsStatCards';
import { LiveTestsStatusTabs } from './liveTests/list/LiveTestsStatusTabs';
import { LiveTestsFilterToolbar } from './liveTests/list/LiveTestsFilterToolbar';
import { LiveTestsTablePanel } from './liveTests/list/LiveTestsTablePanel';
import { LiveTestDetailsPanel } from './liveTests/list/LiveTestDetailsPanel';
import { LiveTestEditModalHost } from './liveTests/list/LiveTestEditModalHost';
import { LiveTestMonitorModal } from './liveTests/list/LiveTestMonitorModal';
import { LiveTestConfirmDialogs } from './liveTests/list/LiveTestConfirmDialogs';
import { LiveTestsToast } from './liveTests/list/LiveTestsToast';

export const AdminLiveTests: React.FC = () => {
  const live = useAdminLiveTests();
  const { loading } = live;
  return withAdminSkeleton(
    loading,
    <div className="min-h-screen bg-slate-50/60 pb-16">
      <LiveTestsHeader live={live} />

      <div className="px-6 py-6 space-y-6">
        <LiveTestsStatCards live={live} />

        <LiveTestsStatusTabs live={live} />

        <LiveTestsFilterToolbar live={live} />

        {/* Main Content Layout: Table on Left + Details Panel on Right */}
        <div className="flex flex-col lg:flex-row items-start gap-4 w-full">
          <LiveTestsTablePanel live={live} />

          <LiveTestDetailsPanel live={live} />
        </div>
      </div>

      <LiveTestEditModalHost live={live} />

      <LiveTestMonitorModal live={live} />

      <LiveTestConfirmDialogs live={live} />

      <LiveTestsToast live={live} />
    </div>,
    { label: 'Loading live tests…', variant: 'table' }
  );
};
