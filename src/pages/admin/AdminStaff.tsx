import { withAdminSkeleton } from '@/components/admin/AdminSkeleton';
import React from 'react';
import { Check, X } from 'lucide-react';
import { StaffActivityLog } from './staff/StaffActivityLog';
import { StaffHeader } from './staff/StaffHeader';
import { StaffStatCards } from './staff/StaffStatCards';
import { StaffMainTabs } from './staff/StaffMainTabs';
import { StaffRoleCards } from './staff/StaffRoleCards';
import { StaffUsersTablePanel } from './staff/StaffUsersTablePanel';
import { StaffCreateAdminPanel } from './staff/StaffCreateAdminPanel';
import { useAdminStaff } from './staff/useAdminStaff';
export type {
  SystemAdminRole,
  AdminUserStatus,
  AdminUserRecord,
  SystemRoleCardData,
} from './staff/staffUtils';

// ============================================================================
// MAIN COMPONENT: ADMIN STAFF & ROLES
// ============================================================================

export const AdminStaff: React.FC = () => {
  const st = useAdminStaff();
  const { pageLoading, toastMessage, toastError, activeMainTab, isSidePanelOpen } = st;
  return withAdminSkeleton(
    pageLoading,
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          role={toastError ? 'alert' : 'status'}
          className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-in slide-in-from-bottom-2 duration-200"
        >
          {toastError ? (
            <X className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      <StaffHeader st={st} />

      <StaffStatCards st={st} />

      <StaffMainTabs st={st} />

      {/* ==================================================================== */}
      {/* 4. FIVE SYSTEM ROLE CARDS (Shown on Roles & Permissions)             */}
      {/* ==================================================================== */}
      {activeMainTab === 'Roles & Permissions' && <StaffRoleCards st={st} />}

      {/* ==================================================================== */}
      {/* 5. MAIN CONTENT SPLIT (TABLE 8 COLS, CREATE SIDE PANEL 4 COLS)       */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <StaffUsersTablePanel st={st} />

        {/* RIGHT COLUMN: CREATE NEW ADMIN DOCKED SIDE PANEL */}
        {isSidePanelOpen && <StaffCreateAdminPanel st={st} />}
      </div>

      {/* ==================================================================== */}
      {/* 7. ACTIVITY LOG TAB (When active)                                    */}
      {/* ==================================================================== */}
      {activeMainTab === 'Activity Log' && <StaffActivityLog />}
    </div>,
    { label: 'Loading staff…', variant: 'cards' }
  );
};
