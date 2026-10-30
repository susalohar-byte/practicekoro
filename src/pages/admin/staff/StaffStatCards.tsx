import { Users, Shield, UserCheck, UserX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminStaffState } from './useAdminStaff';

export interface StaffStatCardsProps {
  st: AdminStaffState;
}

export function StaffStatCards({ st }: StaffStatCardsProps) {
  const { stats } = st;
  return (
    <>
      {/* ==================================================================== */}
      {/* 2. FOUR SUMMARY METRICS CARDS                                       */}
      {/* ==================================================================== */}
      <div className="pk-stagger grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#EDE9FE] text-[#7C3AED] flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">{stats.total}</span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  stats.total === 0
                    ? 'text-slate-500 bg-slate-100'
                    : stats.inactive === 0
                      ? 'text-emerald-600 bg-emerald-50'
                      : 'text-blue-600 bg-blue-50'
                )}
              >
                {stats.total === 0
                  ? '0 Staff'
                  : stats.inactive === 0
                    ? 'All Active'
                    : `${stats.active} Active`}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {stats.active} active · {stats.inactive} inactive
            </span>
          </div>
        </div>

        {/* Card 2: Total Roles */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Total Roles</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {stats.totalRoles}
              </span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                {stats.assignedRolesCount} in use
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {stats.assignedRolesCount} of {stats.totalRoles} assigned
            </span>
          </div>
        </div>

        {/* Card 3: Active Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
            <UserCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Active Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">{stats.active}</span>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                Online
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              currently active
            </span>
          </div>
        </div>

        {/* Card 4: Inactive Admins */}
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-2xs flex items-center gap-3.5 hover:shadow-xs transition-shadow">
          <div className="w-11 h-11 rounded-xl bg-[#FEE2E2] text-[#DC2626] flex items-center justify-center shrink-0">
            <UserX className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-medium text-slate-500 block">Inactive Admins</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-xl font-bold text-slate-900 leading-tight">
                {stats.inactive}
              </span>
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded',
                  stats.inactive > 0 ? 'text-rose-600 bg-rose-50' : 'text-slate-500 bg-slate-100'
                )}
              >
                {stats.inactive > 0 ? `${stats.inactive} Suspended` : '0 Suspended'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 block mt-0.5 truncate">
              {stats.inactive > 0 ? 'deactivated accounts' : 'no inactive accounts'}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
