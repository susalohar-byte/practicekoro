import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, History, Settings, LogOut, Menu, Search } from 'lucide-react';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import { preloadRoute } from '@/utils/routePreload';
import type { AdminLayoutState } from './useAdminLayout';

export const AdminHeader: React.FC<{ layout: AdminLayoutState }> = ({ layout }) => {
  const {
    setSidebarOpen,
    handleSearchSubmit,
    searchQuery,
    setSearchQuery,
    isUserMenuOpen,
    setIsUserMenuOpen,
    user,
    adminRole,
    headerAvatarFailed,
    setHeaderAvatarFailed,
    userMenu,
    logout,
    navigate,
  } = layout;
  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#0A1024] border-b border-slate-200/90 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 gap-4 shadow-xs">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors shrink-0"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Central Search Bar */}
        <form onSubmit={handleSearchSubmit} className="w-full max-w-lg hidden sm:block">
          <div className="relative group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              id="admin-header-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, subjects, exams..."
              className="w-full bg-slate-100 dark:bg-slate-900 border border-transparent focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none transition-all shadow-2xs focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </form>
      </div>

      {/* Right Header: Notification Bell & Admin Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Notification Bell with red dot */}
        <Link
          to="/admin/notifications"
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] ring-2 ring-white dark:ring-[#0A1024]" />
        </Link>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2.5 pl-2 py-1 pr-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
            aria-expanded={isUserMenuOpen}
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#026BFC] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
              {user?.avatarUrl && !headerAvatarFailed ? (
                <img
                  src={user.avatarUrl}
                  alt={user?.fullName || 'Admin'}
                  className="w-full h-full object-cover rounded-full"
                  referrerPolicy="no-referrer"
                  onError={() => setHeaderAvatarFailed(true)}
                />
              ) : (
                <span>{user?.fullName?.charAt(0) || 'A'}</span>
              )}
            </div>
            <div className="text-left hidden md:block">
              <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                {user?.fullName || 'Admin'}
              </p>
              <p className="text-[10px] text-slate-400 leading-tight">
                {adminRole === 'content_writer'
                  ? 'Content Writer'
                  : adminRole === 'support_agent'
                    ? 'Support Team'
                    : 'Super Admin'}
              </p>
            </div>
          </button>

          {userMenu.mounted && (
            <div
              className={cn(
                'absolute right-0 mt-1.5 w-52 rounded-xl bg-white dark:bg-[#0E1738] border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs font-medium',
                userMenu.closing
                  ? 'pk-animate-out pk-exit-up'
                  : 'animate-in fade-in slide-in-from-top-2 duration-150'
              )}
            >
              <div className="flex items-center gap-2.5 px-3 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                <div className="w-8 h-8 rounded-full overflow-hidden bg-[#026BFC] text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs">
                  {user?.avatarUrl && !headerAvatarFailed ? (
                    <img
                      src={user.avatarUrl}
                      alt={user?.fullName || 'Admin'}
                      className="w-full h-full object-cover rounded-full"
                      referrerPolicy="no-referrer"
                      onError={() => setHeaderAvatarFailed(true)}
                    />
                  ) : (
                    <span>{user?.fullName?.charAt(0) || 'A'}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {user?.fullName || 'Admin'}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {user?.email || 'admin@practicekoro.online'}
                  </p>
                </div>
              </div>
              <Link
                to="/admin/settings"
                onClick={() => setIsUserMenuOpen(false)}
                onPointerEnter={() => preloadRoute('/admin/settings')}
                onFocus={() => preloadRoute('/admin/settings')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Platform Settings</span>
              </Link>
              <Link
                to="/admin/audit-logs"
                onClick={() => setIsUserMenuOpen(false)}
                onPointerEnter={() => preloadRoute('/admin/audit-logs')}
                onFocus={() => preloadRoute('/admin/audit-logs')}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
              >
                <History className="w-4 h-4 text-slate-400" />
                <span>Audit Logs</span>
              </Link>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <div className="flex items-center justify-between px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300">
                <span>Theme</span>
                <ThemeToggle className="h-7 w-7 rounded-lg border border-slate-200 dark:border-slate-800" />
              </div>
              <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
