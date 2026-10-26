import { Plus } from 'lucide-react';
import type { AdminLiveTestsState } from './useAdminLiveTests';

export interface LiveTestsHeaderProps {
  live: AdminLiveTestsState;
}

export function LiveTestsHeader({ live }: LiveTestsHeaderProps) {
  const { setIsCreateModalOpen, setEditingTest } = live;
  return (
    <>
      {/* Top Header Row */}
      <div className="px-6 py-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Live Test</h1>
            <p className="text-sm text-slate-500 mt-1">
              Create, schedule and manage live full mock tests for real-time participation.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => {
                setEditingTest(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create Live Test</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
