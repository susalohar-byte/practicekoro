import { Users, Shield, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminStaffState } from './useAdminStaff';

export interface StaffMainTabsProps {
  st: AdminStaffState;
}

export function StaffMainTabs({ st }: StaffMainTabsProps) {
  const { activeMainTab, setActiveMainTab, stats } = st;
  return (
    <>
      {/* ==================================================================== */}
      {/* 3. THREE MAIN NAVIGATION TABS                                        */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-6">
          <button
            onClick={() => setActiveMainTab('Roles & Permissions')}
            className={cn(
              'pb-3 font-semibold text-xs flex items-center gap-2 relative transition-colors cursor-pointer',
              activeMainTab === 'Roles & Permissions'
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Shield className="w-4 h-4" />
            <span>Roles & Permissions</span>
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                activeMainTab === 'Roles & Permissions'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {stats.totalRoles}
            </span>
            {activeMainTab === 'Roles & Permissions' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('Admin Users')}
            className={cn(
              'pb-3 font-semibold text-xs flex items-center gap-2 relative transition-colors cursor-pointer',
              activeMainTab === 'Admin Users'
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Admin Users</span>
            <span
              className={cn(
                'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
                activeMainTab === 'Admin Users'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-500'
              )}
            >
              {stats.total}
            </span>
            {activeMainTab === 'Admin Users' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>

          <button
            onClick={() => setActiveMainTab('Activity Log')}
            className={cn(
              'pb-3 font-semibold text-xs flex items-center gap-2 relative transition-colors cursor-pointer',
              activeMainTab === 'Activity Log'
                ? 'text-[#2563EB]'
                : 'text-slate-500 hover:text-slate-800'
            )}
          >
            <Clock className="w-4 h-4" />
            <span>Activity Log</span>
            {activeMainTab === 'Activity Log' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#2563EB] rounded-full" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
