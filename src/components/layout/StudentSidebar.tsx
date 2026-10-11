import { BrandLogo } from '@/components/common/BrandLogo';
import { usePlatformBrand } from '@/context/MaintenanceContext';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn, isStudentNavActive } from '@/lib/utils';
import {
  Home,
  BookOpen,
  ClipboardList,
  GraduationCap,
  Bookmark,
  BarChart3,
  Trophy,
  FileText,
  User,
  HelpCircle,
  Settings as SettingsIcon,
  PanelLeftClose,
  X,
  Crown,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface StudentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

// Exactly ordered as requested in the design spec:
// Home -> Practice -> Test Series -> My Exams -> Saved Questions -> Results -> Rank -> Notes -> Profile
const primaryNavItems: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Practice', path: '/practice', icon: BookOpen },
  { label: 'Test Series', path: '/test-series', icon: ClipboardList },
  { label: 'My Exams', path: '/test-series', icon: GraduationCap },
  { label: 'Saved Questions', path: '/saved-questions', icon: Bookmark },
  { label: 'Results', path: '/results', icon: BarChart3 },
  { label: 'Rank', path: '/rank', icon: Trophy },
  { label: 'Notes', path: '/practice?tab=mistakes', icon: FileText },
  { label: 'Profile', path: '/profile', icon: User },
];

const Tooltip: React.FC<{ show: boolean; children: React.ReactNode }> = ({ show, children }) =>
  show ? (
    <span className="hidden lg:group-hover:flex absolute left-full ml-3 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl z-50 pointer-events-none items-center border border-slate-700">
      {children}
    </span>
  ) : null;

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  isOpen,
  onClose,
  isCollapsed,
  onToggleCollapse,
}) => {
  const location = useLocation();
  const { appName } = usePlatformBrand();
  const { isPro, isAdmin } = useAuth();

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isStudentNavActive(location.pathname + location.search, item.label);
    return (
      <Link
        key={item.label}
        to={item.path}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-[13.5px] transition-all duration-150',
          isCollapsed && 'lg:justify-center lg:px-0',
          active
            ? 'bg-[#EAF2FF] dark:bg-blue-950/50 text-[#026BFC] dark:text-blue-400 font-bold'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-semibold'
        )}
      >
        <Icon
          className={cn(
            'w-[19px] h-[19px] shrink-0 transition-transform duration-150 group-hover:scale-105',
            active
              ? 'text-[#026BFC] dark:text-blue-400 stroke-[2.3]'
              : 'text-slate-500 dark:text-slate-400 stroke-[1.9]'
          )}
        />
        <span className={cn('truncate', isCollapsed && 'lg:hidden')}>{item.label}</span>
        <Tooltip show={isCollapsed}>{item.label}</Tooltip>
      </Link>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col select-none transition-[width,transform] duration-300 ease-in-out',
          'bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'w-72',
          isCollapsed ? 'lg:w-[78px]' : 'lg:w-[240px]'
        )}
      >
        {/* Brand / Logo */}
        <div
          className={cn(
            'relative h-16 flex items-center shrink-0 px-4 border-b border-transparent',
            isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between'
          )}
        >
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-transparent flex items-center justify-center shrink-0 overflow-hidden">
              <BrandLogo fallback="/logo-circle.png" className="w-full h-full object-contain" />
            </div>
            <div className={cn('min-w-0', isCollapsed && 'lg:hidden')}>
              <p className="font-black text-[17px] tracking-tight text-[#0B1B3F] dark:text-white leading-none">
                {appName === 'PracticeKoro' ? (
                  <>
                    Practice<span className="text-[#026BFC]">Koro</span>
                  </>
                ) : (
                  appName
                )}
              </p>
            </div>
          </Link>

          <div className={cn('flex items-center', isCollapsed && 'lg:hidden')}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Primary Navigation Items */}
        <nav
          className="relative flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-3 py-2 space-y-1 no-scrollbar"
          aria-label="Student navigation"
        >
          {primaryNavItems.map(renderItem)}
        </nav>

        {/* Lower Sidebar Area: Subscription card, Help & Support, Settings */}
        <div className="shrink-0 p-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
          {/* PracticeKoro Premium Card */}
          {isCollapsed ? (
            <Link
              to="/subscription"
              onClick={onClose}
              className="group relative hidden lg:flex mx-auto w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 text-purple-600 items-center justify-center transition-colors"
              aria-label="PracticeKoro Premium"
            >
              <Crown className="w-5 h-5 text-amber-500 fill-amber-400" />
              <Tooltip show>PracticeKoro Premium</Tooltip>
            </Link>
          ) : (
            <div className="rounded-2xl p-3.5 bg-[#F5F3FF] dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/40 relative overflow-hidden">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-5 rounded-md bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center shrink-0">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
                </span>
                <span className="text-[12px] font-black text-slate-900 dark:text-white tracking-tight">
                  PracticeKoro Premium
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium leading-snug mb-3">
                {isPro
                  ? 'All mock tests and series unlocked!'
                  : 'Unlock all test series, mock tests and more!'}
              </p>
              <Link
                to="/subscription"
                onClick={onClose}
                className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#8B5CF6] hover:opacity-95 text-white text-[12px] font-extrabold flex items-center justify-center gap-1.5 shadow-sm transition-opacity"
              >
                <span>{isPro ? 'Manage Plan' : 'Upgrade Now'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          {/* Lower navigation items */}
          <div className="space-y-0.5">
            <Link
              to="/support"
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2 text-[13px] transition-colors',
                isCollapsed && 'lg:justify-center lg:px-0',
                isStudentNavActive(location.pathname, 'Help & Support')
                  ? 'bg-[#EAF2FF] dark:bg-blue-950/50 text-[#026BFC] font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              )}
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
              <span className={cn('truncate', isCollapsed && 'lg:hidden')}>Help & Support</span>
              <Tooltip show={isCollapsed}>Help & Support</Tooltip>
            </Link>

            <Link
              to="/settings"
              onClick={onClose}
              className={cn(
                'group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2 text-[13px] transition-colors',
                isCollapsed && 'lg:justify-center lg:px-0',
                isStudentNavActive(location.pathname, 'Settings')
                  ? 'bg-[#EAF2FF] dark:bg-blue-950/50 text-[#026BFC] font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 font-medium'
              )}
            >
              <SettingsIcon className="w-[18px] h-[18px] shrink-0 text-slate-500 dark:text-slate-400" />
              <span className={cn('truncate', isCollapsed && 'lg:hidden')}>Settings</span>
              <Tooltip show={isCollapsed}>Settings</Tooltip>
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3.5 rounded-xl px-3.5 py-2 text-[13px] text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 font-bold transition-colors',
                  isCollapsed && 'lg:justify-center lg:px-0'
                )}
              >
                <ShieldAlert className="w-[18px] h-[18px] shrink-0 text-amber-600" />
                <span className={cn('truncate', isCollapsed && 'lg:hidden')}>Admin Control</span>
                <Tooltip show={isCollapsed}>Admin Control</Tooltip>
              </Link>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
