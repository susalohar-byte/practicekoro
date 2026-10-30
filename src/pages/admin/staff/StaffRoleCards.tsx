import { Crown, FileText, Headphones, CreditCard, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminStaffState } from './useAdminStaff';

export interface StaffRoleCardsProps {
  st: AdminStaffState;
}

export function StaffRoleCards({ st }: StaffRoleCardsProps) {
  const { systemRoles, filterRole, setFilterRole, showToast, setCurrentPage } = st;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {systemRoles.map((role) => {
        const isSelected = filterRole === role.title;
        const getIcon = () => {
          switch (role.title) {
            case 'Super Admin':
              return <Crown className="w-4 h-4" />;
            case 'Content Manager':
              return <FileText className="w-4 h-4" />;
            case 'Support Manager':
              return <Headphones className="w-4 h-4" />;
            case 'Finance Manager':
              return <CreditCard className="w-4 h-4" />;
            case 'Analyst':
              return <BarChart2 className="w-4 h-4" />;
          }
        };

        return (
          <div
            key={role.title}
            onClick={() => {
              if (filterRole === role.title) {
                setFilterRole('All Roles');
                showToast('Showing all roles');
              } else {
                setFilterRole(role.title);
                showToast(`Filtered by ${role.title}`);
              }
              setCurrentPage(1);
            }}
            className={cn(
              'bg-white rounded-2xl border p-4 shadow-2xs hover:shadow-xs transition-all cursor-pointer space-y-3',
              isSelected
                ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/10'
                : 'border-slate-100'
            )}
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                  role.iconBg,
                  role.iconColor
                )}
              >
                {getIcon()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-slate-900 text-xs truncate">{role.title}</h3>
                  {isSelected && (
                    <span className="text-[9px] font-semibold text-blue-600 bg-blue-100 px-1 py-0.2 rounded shrink-0">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">{role.description}</p>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-50">
              <span className="font-bold text-slate-800 text-[11px]">
                {role.adminsCount}{' '}
                <span className="font-normal text-slate-400">
                  {role.adminsCount === 1 ? 'admin' : 'admins'}
                </span>
              </span>
              <span className="font-bold text-slate-800 text-[11px]">
                {role.permissionsPercentage}%{' '}
                <span className="font-normal text-slate-400">permissions</span>
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
