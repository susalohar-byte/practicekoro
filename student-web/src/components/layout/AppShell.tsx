import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import {
  Home,
  PlayCircle,
  FileText,
  BarChart3,
  User,
  Radio,
  History,
  Bookmark,
  ListChecks,
  TrendingUp,
  Crown,
  LifeBuoy,
  Settings,
  Search,
  Bell,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/cn';
import { Avatar, LogoIcon, Wordmark } from '@/components/ui/Brand';
import { useIsPro, useProfile } from '@/hooks/queries';

type Item = { to: string; label: string; icon: ComponentType<{ className?: string }>; match?: string[] };

// Same five destinations as the app's bottom navigation, in the same order.
export const PRIMARY_NAV: Item[] = [
  { to: '/home', label: 'Home', icon: Home },
  { to: '/practice', label: 'Practice', icon: PlayCircle, match: ['/practice', '/topic-tests', '/topic/'] },
  { to: '/exams', label: 'Exams', icon: FileText, match: ['/exams', '/test/'] },
  { to: '/results', label: 'Results', icon: BarChart3, match: ['/results', '/result/', '/solutions/'] },
  { to: '/profile', label: 'Profile', icon: User, match: ['/profile'] },
];

// Screens the app reaches from Home and Profile, surfaced in the desktop sidebar.
const SECONDARY_NAV: Item[] = [
  { to: '/live-tests', label: 'Live Tests', icon: Radio },
  { to: '/pyq', label: 'Previous Year Questions', icon: History },
  { to: '/test-history', label: 'My Tests', icon: ListChecks },
  { to: '/progress', label: 'My Progress', icon: TrendingUp },
  { to: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
];

const ACCOUNT_NAV: Item[] = [
  { to: '/plans', label: 'Plans & Membership', icon: Crown },
  { to: '/help', label: 'Help & Support', icon: LifeBuoy },
  { to: '/settings', label: 'Settings', icon: Settings },
];

function isActive(pathname: string, item: Item): boolean {
  const keys = item.match ?? [item.to];
  return keys.some((k) => pathname === k || pathname.startsWith(k.endsWith('/') ? k : `${k}/`));
}

function SideLink({ item, compact }: { item: Item; compact?: boolean }) {
  const { pathname } = useLocation();
  const active = isActive(pathname, item);
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      title={compact ? item.label : undefined}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'group flex items-center gap-3 rounded-xl text-[14px] font-medium transition-colors',
        compact ? 'h-11 w-11 justify-center' : 'h-10 px-3',
        active ? 'bg-primary text-white shadow-[0_6px_16px_rgba(31,72,232,0.22)]' : 'text-ink-soft hover:bg-primary-soft hover:text-primary'
      )}
    >
      <Icon className="h-[19px] w-[19px] shrink-0" />
      {!compact && <span className="truncate">{item.label}</span>}
      {compact && <span className="sr-only">{item.label}</span>}
    </NavLink>
  );
}

function Sidebar() {
  const isPro = useIsPro();
  return (
    <>
      {/* Desktop: full sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-white xl:flex">
        <Link to="/home" className="flex h-16 items-center px-5" aria-label="PracticeKoro home">
          <Wordmark className="h-9" />
        </Link>
        <nav aria-label="Main" className="flex-1 overflow-y-auto px-3 pb-4">
          <div className="space-y-1">
            {PRIMARY_NAV.map((i) => (
              <SideLink key={i.to} item={i} />
            ))}
          </div>
          <p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-wider text-faint">Prepare</p>
          <div className="space-y-1">
            {SECONDARY_NAV.map((i) => (
              <SideLink key={i.to} item={i} />
            ))}
          </div>
          <p className="mb-2 mt-6 px-3 text-[11px] font-bold uppercase tracking-wider text-faint">Account</p>
          <div className="space-y-1">
            {ACCOUNT_NAV.map((i) => (
              <SideLink key={i.to} item={i} />
            ))}
          </div>
        </nav>
        {!isPro && (
          <div className="m-3 rounded-2xl bg-hero p-4 text-white">
            <p className="flex items-center gap-2 text-[14px] font-extrabold">
              <Crown className="h-4 w-4 text-gold-bright" /> Unlock PracticeKoro Pro
            </p>
            <p className="mt-1 text-[12px] text-indigo-100">All mock tests, PYQs and state rankings.</p>
            <Link to="/plans" className="mt-3 inline-flex h-8 items-center rounded-full bg-white px-3 text-[12px] font-bold text-primary">
              View Plans
            </Link>
          </div>
        )}
      </aside>

      {/* Tablet / small desktop: icon rail */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[76px] flex-col items-center border-r border-line bg-white py-3 md:flex xl:hidden">
        <Link to="/home" aria-label="PracticeKoro home" className="mb-4">
          <LogoIcon className="h-10 w-10" />
        </Link>
        <nav aria-label="Main" className="flex flex-1 flex-col items-center gap-1.5 overflow-y-auto">
          {PRIMARY_NAV.map((i) => (
            <SideLink key={i.to} item={i} compact />
          ))}
          <span className="my-2 h-px w-8 bg-line" aria-hidden />
          {SECONDARY_NAV.map((i) => (
            <SideLink key={i.to} item={i} compact />
          ))}
          <span className="my-2 h-px w-8 bg-line" aria-hidden />
          {ACCOUNT_NAV.map((i) => (
            <SideLink key={i.to} item={i} compact />
          ))}
        </nav>
      </aside>
    </>
  );
}

function TopBar() {
  const { data: profile } = useProfile();
  return (
    <header className="sticky top-0 z-20 border-b border-line/70 bg-page/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link to="/home" className="md:hidden" aria-label="PracticeKoro home">
          <Wordmark className="h-7" />
        </Link>
        <Link
          to="/search"
          className="ml-auto hidden h-10 w-full max-w-md items-center gap-2 rounded-card border border-line bg-white px-3.5 text-[14px] text-faint hover:border-primary/40 md:ml-0 md:flex"
        >
          <Search className="h-[18px] w-[18px] text-muted" />
          Search exams, subjects, topics
        </Link>
        <div className="ml-auto flex items-center gap-1.5">
          <Link to="/search" aria-label="Search" className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white md:hidden">
            <Search className="h-[22px] w-[22px]" />
          </Link>
          <Link to="/notifications" aria-label="Notifications" className="flex h-10 w-10 items-center justify-center rounded-full text-ink hover:bg-white">
            <Bell className="h-[22px] w-[22px]" />
          </Link>
          <Link to="/profile" aria-label="My profile" className="ml-1 rounded-full ring-2 ring-[#2563EB]/30 ring-offset-1">
            <Avatar url={profile?.avatarUrl} name={profile?.fullName} size={36} />
          </Link>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const { pathname } = useLocation();
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-3 bottom-3 z-30 flex h-[66px] items-center gap-1 rounded-[33px] border border-line bg-white p-1.5 shadow-[0_8px_24px_rgba(31,58,138,0.10)] md:hidden"
      style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
    >
      {PRIMARY_NAV.map((item) => {
        const active = isActive(pathname, item);
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex h-full min-w-0 flex-col items-center justify-center rounded-[28px] transition-all',
              active ? 'flex-[1.3] bg-primary text-white' : 'flex-1 text-muted'
            )}
          >
            <Icon className="h-[22px] w-[22px]" />
            <span className={cn('mt-0.5 truncate text-[11px]', active ? 'font-bold' : 'font-medium')}>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export function AppShell() {
  return (
    <div className="min-h-screen bg-page">
      <a href="#main" className="sr-only z-50 rounded bg-primary px-3 py-2 text-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>
      <Sidebar />
      <div className="md:pl-[76px] xl:pl-64">
        <TopBar />
        <main id="main" className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 md:pb-12 lg:px-8 lg:pt-7">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
