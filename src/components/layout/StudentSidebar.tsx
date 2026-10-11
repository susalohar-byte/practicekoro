import { BrandLogo } from '@/components/common/BrandLogo';
import { usePlatformBrand } from '@/context/MaintenanceContext';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { cn, isStudentNavActive } from '@/lib/utils';
import {
  Home,
  FileText,
  Zap,
  Radio,
  BarChart3,
  User,
  Bookmark,
  Trophy,
  HelpCircle,
  Settings as SettingsIcon,
  PanelLeftClose,
  X,
  LogOut,
  Crown,
  ChevronRight,
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

// 1. LEARN: the core study loop
const primaryNavItems: NavItem[] = [
  { label: 'Home', path: '/dashboard', icon: Home },
  { label: 'Test Series', path: '/test-series', icon: FileText },
  { label: 'Practice', path: '/practice', icon: Zap },
  { label: 'Live Tests', path: '/live-test', icon: Radio },
  { label: 'Results', path: '/results', icon: BarChart3 },
];

// 2. YOUR SPACE: personal tools
const secondaryNavItems: NavItem[] = [
  { label: 'Saved Questions', path: '/saved-questions', icon: Bookmark },
  { label: 'Rank', path: '/rank', icon: Trophy },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Help & Support', path: '/support', icon: HelpCircle },
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
  const navigate = useNavigate();
  const { appName } = usePlatformBrand();
  const { user, isPro, isAdmin, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    }
    navigate('/login');
  };

  const avatarSrc = user?.avatarUrl || '/images/student_avatar_hd.png';

  const renderItem = (item: NavItem) => {
    const Icon = item.icon;
    const active = isStudentNavActive(location.pathname, item.label);
    return (
      <Link
        key={item.label}
        to={item.path}
        onClick={onClose}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] transition-colors duration-150',
          isCollapsed && 'lg:justify-center lg:px-0',
          active
            ? 'bg-white text-[#1E2A8A] font-bold shadow-[0_6px_16px_rgba(5,10,40,0.25)]'
            : 'text-white/70 hover:text-white hover:bg-white/10 font-semibold'
        )}
      >
        <Icon
          className={cn(
            'w-[18px] h-[18px] shrink-0',
            active ? 'text-[#3142D6] stroke-[2.4]' : 'stroke-[2]'
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
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col select-none text-white transition-[width,transform] duration-300 ease-in-out',
          'bg-gradient-to-b from-[#121A4D] via-[#1A237A] to-[#24309A]',
          'lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 shrink-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'w-72',
          isCollapsed ? 'lg:w-[78px]' : 'lg:w-[248px]'
        )}
      >
        {/* Decorative glow */}
        <div
          className="pointer-events-none absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#4F7BFF]/20 blur-3xl"
          aria-hidden="true"
        />

        {/* Brand */}
        <div
          className={cn(
            'relative h-16 flex items-center shrink-0 px-4',
            isCollapsed ? 'lg:justify-center lg:px-2' : 'justify-between'
          )}
        >
          <Link to="/dashboard" onClick={onClose} className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shrink-0 overflow-hidden shadow-md">
              <BrandLogo fallback="/logo-circle.png" className="w-full h-full object-cover" />
            </div>
            <div className={cn('min-w-0', isCollapsed && 'lg:hidden')}>
              <p className="font-black text-[16px] tracking-tight leading-none">
                {appName === 'PracticeKoro' ? (
                  <>
                    Practice<span className="text-[#8FB3FF]">Koro</span>
                  </>
                ) : (
                  appName
                )}
              </p>
              <p className="text-[10.5px] text-white/55 font-semibold mt-1 leading-none">
                Smart Exam Prep
              </p>
            </div>
          </Link>

          <div className={cn('flex items-center', isCollapsed && 'lg:hidden')}>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden lg:flex p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav
          className="relative flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-3 pt-2 pb-4 no-scrollbar"
          aria-label="Student navigation"
        >
          <p
            className={cn(
              'px-3 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white/40',
              isCollapsed && 'lg:hidden'
            )}
          >
            Learn
          </p>
          <div className="space-y-1">{primaryNavItems.map(renderItem)}</div>

          {isCollapsed && <div className="hidden lg:block w-8 h-px bg-white/15 mx-auto my-4" />}
          <p
            className={cn(
              'px-3 pt-5 pb-2 text-[10.5px] font-extrabold uppercase tracking-[0.12em] text-white/40',
              isCollapsed && 'lg:hidden'
            )}
          >
            Your space
          </p>
          <div className="space-y-1">
            {secondaryNavItems.map(renderItem)}
            {isAdmin && (
              <Link
                to="/admin"
                onClick={onClose}
                className={cn(
                  'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-bold text-amber-200 hover:bg-white/10 transition-colors',
                  isCollapsed && 'lg:justify-center lg:px-0'
                )}
              >
                <ShieldAlert className="w-[18px] h-[18px] shrink-0" />
                <span className={cn('truncate', isCollapsed && 'lg:hidden')}>Admin Control</span>
                <Tooltip show={isCollapsed}>Admin Control Panel</Tooltip>
              </Link>
            )}
          </div>

          {/* Plan card */}
          <div className="pt-6">
            {isCollapsed ? (
              <Link
                to="/subscription"
                onClick={onClose}
                className="group relative hidden lg:flex mx-auto w-11 h-11 rounded-xl bg-white/10 hover:bg-white/15 items-center justify-center text-amber-300 transition-colors"
                aria-label={isPro ? 'Pro Pass active' : 'Upgrade to Pro Pass'}
              >
                <Crown className="w-5 h-5 fill-amber-300" />
                <Tooltip show>{isPro ? 'Pro Pass active' : 'Upgrade to Pro Pass'}</Tooltip>
              </Link>
            ) : null}
            <Link
              to="/subscription"
              onClick={onClose}
              className={cn(
                'group relative block rounded-2xl p-4 overflow-hidden border border-white/10',
                'bg-gradient-to-br from-white/[0.14] to-white/[0.04] hover:from-white/[0.18] transition-colors',
                isCollapsed && 'lg:hidden'
              )}
            >
              <Crown
                className="absolute -right-3 -bottom-4 w-20 h-20 text-white/[0.06] pointer-events-none"
                aria-hidden="true"
              />
              <div className="flex items-center gap-1.5 text-amber-300 text-[11px] font-black tracking-wide">
                <Crown className="w-4 h-4 fill-amber-300" />
                <span>{isPro ? 'PRO PASS ACTIVE' : 'PRO PASS'}</span>
              </div>
              <p className="mt-1.5 text-[12px] text-white/75 font-medium leading-snug">
                {isPro
                  ? 'Every mock, solution and rank report is unlocked.'
                  : 'Unlock every mock test, detailed solutions and rank analysis.'}
              </p>
              <span
                className={cn(
                  'mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[12px] font-extrabold',
                  isPro ? 'bg-white/15 text-white' : 'bg-amber-400 text-[#121A4D]'
                )}
              >
                {isPro ? 'View benefits' : 'Upgrade now'}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            </Link>
          </div>
        </nav>

        {/* Account */}
        <div className="relative shrink-0 border-t border-white/10 p-3">
          <div
            className={cn(
              'flex items-center gap-2 rounded-xl p-1.5',
              isCollapsed ? 'lg:justify-center' : 'justify-between'
            )}
          >
            <Link
              to="/profile"
              onClick={onClose}
              className="group relative flex items-center gap-2.5 min-w-0 flex-1"
            >
              <img
                src={avatarSrc}
                alt=""
                className={cn(
                  'w-9 h-9 rounded-full object-cover shrink-0 border-2',
                  isPro ? 'border-amber-300' : 'border-white/30'
                )}
                onError={(e) => {
                  e.currentTarget.src = '/images/student_avatar_hd.png';
                }}
              />
              <div className={cn('min-w-0', isCollapsed && 'lg:hidden')}>
                <p className="text-[13px] font-bold truncate">{user?.fullName || 'Student'}</p>
                <p
                  className={cn(
                    'text-[11px] font-semibold truncate',
                    isPro ? 'text-amber-300' : 'text-white/55'
                  )}
                >
                  {isPro ? 'Pro member' : 'Free plan'}
                </p>
              </div>
              <Tooltip show={isCollapsed}>{user?.fullName || 'Profile'}</Tooltip>
            </Link>

            <div className={cn('flex items-center gap-0.5 shrink-0', isCollapsed && 'lg:hidden')}>
              <Link
                to="/settings"
                onClick={onClose}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                title="Settings"
                aria-label="Settings"
              >
                <SettingsIcon className="w-4 h-4" />
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1.5 rounded-lg text-white/60 hover:text-rose-300 hover:bg-white/10 transition-colors cursor-pointer"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
