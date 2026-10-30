import { Plus } from 'lucide-react';
import type { AdminStaffState } from './useAdminStaff';

export interface StaffHeaderProps {
  st: AdminStaffState;
}

export function StaffHeader({ st }: StaffHeaderProps) {
  const { setIsSidePanelOpen } = st;
  return (
    <>
      {/* ==================================================================== */}
      {/* 1. HEADER & TOP CONTROLS                                             */}
      {/* ==================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admins & Roles</h1>
          <p className="text-xs text-slate-500 font-normal mt-1 max-w-2xl">
            Manage admin users, assign roles and control permissions across the platform.
          </p>
        </div>

        <div className="shrink-0 self-start flex items-center gap-2">
          <button
            onClick={() => setIsSidePanelOpen(true)}
            className="bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin</span>
          </button>
        </div>
      </div>
    </>
  );
}
