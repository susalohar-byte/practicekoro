import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { cn } from '@/lib/utils';
import { AdminSidebarNav } from './AdminSidebarNav';
import { SidebarUserMenu } from './SidebarUserMenu';
import type { AdminLayoutState } from './useAdminLayout';

export const AdminSidebar: React.FC<{ layout: AdminLayoutState }> = ({ layout }) => {
  const { sidebarOpen, setSidebarOpen, isCollapsed, handleToggleCollapse, appName } = layout;
  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 bg-[#0A1024] text-slate-100 border-r border-[#152146] flex flex-col justify-between shadow-2xl transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] select-none dark will-change-[width,transform] transform-gpu',
        'lg:sticky lg:top-0 lg:h-screen lg:overflow-visible lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        isCollapsed ? 'lg:w-[72px] w-64' : 'lg:w-[260px] w-64'
      )}
    >
      {/* Desktop Edge-Mounted Collapse / Expand Button */}
      <button
        type="button"
        onClick={handleToggleCollapse}
        className={cn(
          'hidden lg:flex absolute -right-3.5 top-5 z-50 w-7 h-7 rounded-full items-center justify-center cursor-pointer',
          'bg-[#0B132B] text-slate-300 hover:text-white',
          'border border-[#20315C] hover:border-blue-500/80',
          'shadow-[0_2px_8px_rgba(0,0,0,0.45)] hover:shadow-[0_2px_12px_rgba(2,107,252,0.4)]',
          'hover:bg-[#15234E] active:scale-90 transition-all duration-200 group focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500'
        )}
        title={isCollapsed ? 'Expand sidebar (Ctrl+B)' : 'Collapse sidebar (Ctrl+B)'}
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 text-blue-400" />
        ) : (
          <ChevronLeft className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5 text-slate-300 group-hover:text-white" />
        )}
      </button>

      {/* Top Header Logo */}
      <div className="h-16 flex items-center justify-between px-3.5 border-b border-[#152146]/80 shrink-0 bg-[#070B1A]">
        <Link
          to="/admin"
          className={cn(
            'group flex items-center gap-2.5 min-w-0 transition-opacity hover:opacity-95',
            isCollapsed && 'lg:justify-center lg:w-full'
          )}
          title={`${appName} Admin Dashboard`}
        >
          <div className="relative w-9 h-9 rounded-full bg-[#026BFC] flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-500/25 overflow-hidden">
            <BrandLogo
              fallback="/logo-circle.png"
              className="w-full h-full rounded-full object-cover"
            />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="font-bold text-base tracking-tight text-white leading-tight truncate block">
                {appName}
              </span>
              <span className="text-xs font-normal text-slate-400 block truncate">Admin Panel</span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        <button
          type="button"
          onClick={() => setSidebarOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List - Fluid scrolling & Micro-Interactions */}
      <AdminSidebarNav layout={layout} />

      {/* Bottom User Info Area (Shadcn NavUser Style) */}
      <SidebarUserMenu layout={layout} />
    </aside>
  );
};
