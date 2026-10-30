import React from 'react';
import { Link } from 'react-router-dom';
import { History, Settings, LogOut, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AdminLayoutState } from './useAdminLayout';

export const SidebarUserMenu: React.FC<{ layout: AdminLayoutState }> = ({ layout }) => {
  const {
    sidebarUserRef,
    isSidebarUserOpen,
    setIsSidebarUserOpen,
    isCollapsed,
    user,
    adminRole,
    sidebarAvatarFailed,
    setSidebarAvatarFailed,
    sidebarUserMenu,
    logout,
    navigate,
  } = layout;
  return (
    <div
      ref={sidebarUserRef}
      className="relative p-2.5 border-t border-[#152146] bg-[#070B1A] shrink-0"
    >
      {/* User Profile Card Button */}
      <button
        type="button"
        onClick={() => setIsSidebarUserOpen(!isSidebarUserOpen)}
        className={cn(
          'group w-full flex items-center rounded-xl transition-all duration-150 text-left select-none cursor-pointer',
          'bg-[#0E1738] hover:bg-[#142048] border border-[#1A2A56] hover:border-slate-700/80',
          'active:scale-[0.98] focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500',
          isCollapsed ? 'justify-center p-2' : 'gap-3 p-2'
        )}
        title={
          isCollapsed
            ? `${user?.fullName || 'Susanta Lohar'} (${user?.email || 'admin@practicekoro.online'})`
            : undefined
        }
        aria-expanded={isSidebarUserOpen}
        aria-label="User profile menu"
      >
        {/* Avatar - Circular badge matching brand style */}
        <div className="relative shrink-0 w-8 h-8 rounded-full overflow-hidden bg-[#026BFC] text-white font-bold flex items-center justify-center text-xs shadow-sm ring-1 ring-white/10">
          {user?.avatarUrl && !sidebarAvatarFailed ? (
            <img
              src={user.avatarUrl}
              alt={user?.fullName || 'Susanta Lohar'}
              className="w-full h-full object-cover rounded-full"
              referrerPolicy="no-referrer"
              onError={() => setSidebarAvatarFailed(true)}
            />
          ) : (
            <span>{user?.fullName?.charAt(0) || 'S'}</span>
          )}
        </div>

        {!isCollapsed && (
          <>
            {/* Name & Email */}
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-semibold text-white text-sm">
                {user?.fullName || 'Susanta Lohar'}
              </span>
              <span className="truncate text-xs text-slate-400 font-normal">
                {user?.email || 'admin@practicekoro.online'}
              </span>
            </div>

            {/* Chevrons Up Down */}
            <ChevronsUpDown className="ml-auto w-4 h-4 text-slate-400 shrink-0 group-hover:text-slate-200 transition-colors" />
          </>
        )}
      </button>

      {/* Floating Dropdown Menu (Pop up upwards) */}
      {sidebarUserMenu.mounted && (
        <div
          className={cn(
            'absolute z-50 rounded-xl bg-[#0B132B] border border-[#1E2D5A] shadow-2xl p-1.5 text-xs font-medium',
            sidebarUserMenu.closing
              ? 'pk-animate-out pk-exit-down'
              : 'animate-in fade-in slide-in-from-bottom-2 duration-150',
            isCollapsed
              ? 'left-[calc(100%+8px)] bottom-2 w-64'
              : 'bottom-[calc(100%+8px)] left-2.5 right-2.5'
          )}
        >
          {/* Header inside popup */}
          <div className="flex items-center gap-2.5 p-2 border-b border-[#182650]/80 mb-1">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#026BFC] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm ring-1 ring-white/10">
              {user?.avatarUrl && !sidebarAvatarFailed ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.fullName || 'Susanta Lohar'}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={() => setSidebarAvatarFailed(true)}
                />
              ) : (
                <span>{user?.fullName?.charAt(0) || 'S'}</span>
              )}
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <span className="truncate font-semibold text-white text-xs">
                {user?.fullName || 'Susanta Lohar'}
              </span>
              <span className="truncate text-[10px] text-slate-400 font-normal">
                {user?.email || 'admin@practicekoro.online'}
              </span>
            </div>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 shrink-0">
              {adminRole === 'content_writer'
                ? 'Writer'
                : adminRole === 'support_agent'
                  ? 'Support'
                  : 'Super Admin'}
            </span>
          </div>

          {/* Menu items */}
          <div className="py-0.5 space-y-0.5">
            <Link
              to="/admin/settings"
              onClick={() => setIsSidebarUserOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Platform Settings</span>
            </Link>

            <Link
              to="/admin/audit-logs"
              onClick={() => setIsSidebarUserOpen(false)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.08] transition-colors"
            >
              <History className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>Audit Logs</span>
            </Link>
          </div>

          {/* Divider */}
          <div className="my-1 border-t border-[#182650]" />

          {/* Sign Out */}
          <button
            type="button"
            onClick={() => {
              setIsSidebarUserOpen(false);
              logout();
              navigate('/login');
            }}
            className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};
