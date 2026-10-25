import { cn } from '@/lib/utils';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestsStatusTabsProps {
  live: AdminLiveTestsState;
}

export function LiveTestsStatusTabs({ live }: LiveTestsStatusTabsProps) {
  const { activeTab, setActiveTab, setCurrentPage, stats } = live;
  return (
    <>
      {/* Status Tabs Matching Reference */}
      <div className="border-b border-slate-200 bg-white px-2 rounded-t-xl">
        <div className="flex items-center gap-8 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('all');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'all'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            All Live Tests ({stats.total})
          </button>
          <button
            onClick={() => {
              setActiveTab('live');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'live'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Live Now ({stats.liveCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('scheduled');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'scheduled'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Scheduled ({stats.upcomingCount})
          </button>
          <button
            onClick={() => {
              setActiveTab('completed');
              setCurrentPage(1);
            }}
            className={cn(
              'py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            )}
          >
            Completed ({stats.endedCount})
          </button>
        </div>
      </div>
    </>
  );
}
