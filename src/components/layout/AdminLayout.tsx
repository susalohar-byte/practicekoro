import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Settings, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RouteSkeleton } from './adminLayout/RouteSkeleton';
import { useAdminLayout } from './adminLayout/useAdminLayout';
import { AdminSidebar } from './adminLayout/AdminSidebar';
import { AdminHeader } from './adminLayout/AdminHeader';

export const AdminLayout: React.FC = () => {
  const layout = useAdminLayout();
  const { sidebarOpen, setSidebarOpen, isMaintenanceMode, contentRef } = layout;

  return (
    <div className="admin-scope min-h-screen flex bg-slate-50 dark:bg-[#030712] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* Mobile sidebar overlay with smooth fade */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 lg:hidden',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar - Precision Obsidian Blue UI with Micro-Animations */}
      <AdminSidebar layout={layout} />

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <AdminHeader layout={layout} />

        {/* Active Maintenance Notice Banner */}
        {isMaintenanceMode && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate sm:whitespace-normal">
                <strong>Maintenance Mode Active:</strong> Student portal is temporarily paused for
                updates. Only administrators have access.
              </span>
            </div>
            <Link
              to="/admin/settings"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-amber-500 text-white font-bold hover:bg-amber-600 transition-colors shrink-0"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Manage Settings</span>
            </Link>
          </div>
        )}

        {/* Content body with GPU-accelerated page transition */}
        <main className="flex-1 p-4 sm:p-6 lg:p-7 bg-slate-50 dark:bg-[#030712]">
          <div ref={contentRef} className="max-w-[1560px] mx-auto">
            <React.Suspense fallback={<RouteSkeleton contentRef={contentRef} />}>
              <Outlet />
            </React.Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};
