import { Plus } from 'lucide-react';
import type { AdminCutoffState } from './useAdminCutoff';

export interface CutoffHeaderProps {
  co: AdminCutoffState;
}

export function CutoffHeader({ co }: CutoffHeaderProps) {
  const { handleOpenCreateModal } = co;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. TOP HEADER & ACTION BUTTON                                       */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Cutoff</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            View and manage exam cutoffs from previous years. Helps students understand the expected
            cutoff and plan better.
          </p>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="bg-[#2563EB] hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors self-start shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Cutoff</span>
        </button>
      </div>
    </>
  );
}
