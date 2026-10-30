import type React from 'react';
import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { usePlatformBrand, useMaintenance } from '@/context/MaintenanceContext';
import { playPageEnter } from '@/lib/motion';
import { usePresence } from '@/hooks/usePresence';
import { preloadCoreAdminRoutes } from '@/utils/routePreload';
import { RAW_NAV_SECTIONS, type NavSection } from './adminNavConfig';

export function useAdminLayout() {
  const { user, logout, adminRole, hasPermission } = useAuth();
  const { appName } = usePlatformBrand();
  const { isMaintenanceMode } = useMaintenance();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('practicekoro_admin_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSidebarUserOpen, setIsSidebarUserOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [headerAvatarFailed, setHeaderAvatarFailed] = useState(false);
  const [sidebarAvatarFailed, setSidebarAvatarFailed] = useState(false);
  const sidebarUserRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const userMenu = usePresence(isUserMenuOpen);
  const sidebarUserMenu = usePresence(isSidebarUserOpen);

  // Page transition on route change (no remount, so page state is kept).
  // The new page starts at the top instead of the old page's scroll position.
  useEffect(() => {
    if (window.scrollY > 0) window.scrollTo({ top: 0 });
    playPageEnter(contentRef.current);
  }, [location.pathname]);

  // Idle prefetching for core routes to eliminate route chunk load latency
  useEffect(() => {
    preloadCoreAdminRoutes();
  }, []);

  useEffect(() => {
    setHeaderAvatarFailed(false);
    setSidebarAvatarFailed(false);
  }, [user?.avatarUrl]);

  // Close sidebar user menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarUserRef.current && !sidebarUserRef.current.contains(e.target as Node)) {
        setIsSidebarUserOpen(false);
      }
    };
    if (isSidebarUserOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSidebarUserOpen]);

  // Toggle collapsed state and persist in local storage
  const handleToggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('practicekoro_admin_sidebar_collapsed', String(next));
      } catch {
        // ignore storage errors
      }
      return next;
    });
  };

  // Keyboard shortcut (Cmd/Ctrl + B) to toggle sidebar on desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'b' || e.key === 'B')) {
        const target = e.target as HTMLElement | null;
        if (
          target &&
          (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        handleToggleCollapse();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter according to current admin's role permissions
  const navSections: NavSection[] = RAW_NAV_SECTIONS.map((sec) => ({
    ...sec,
    items: sec.items
      .filter((item) => !item.permission || hasPermission(item.permission))
      .map((item) => ({
        ...item,
        children: item.children?.filter((sub) => !sub.permission || hasPermission(sub.permission)),
      })),
  })).filter((sec) => sec.items.length > 0);

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    if (q.includes('question')) navigate('/admin/question-bank');
    else if (q.includes('exam')) navigate('/admin/exams');
    else if (q.includes('test') || q.includes('mock')) navigate('/admin/mock-tests');
    else if (q.includes('student')) navigate('/admin/students');
    else if (q.includes('plan')) navigate('/admin/subscription-plans');
    else if (q.includes('coupon')) navigate('/admin/coupons');
    else if (q.includes('rank') || q.includes('cutoff')) navigate('/admin/rankings');
    else if (q.includes('pay') || q.includes('revenue')) navigate('/admin/payments');
    else if (q.includes('setting')) navigate('/admin/settings');
    else navigate(`/admin/question-bank?search=${encodeURIComponent(q)}`);
  };

  return {
    user,
    logout,
    adminRole,
    appName,
    isMaintenanceMode,
    navigate,
    location,
    sidebarOpen,
    setSidebarOpen,
    isCollapsed,
    searchQuery,
    setSearchQuery,
    isUserMenuOpen,
    setIsUserMenuOpen,
    isSidebarUserOpen,
    setIsSidebarUserOpen,
    openGroups,
    headerAvatarFailed,
    setHeaderAvatarFailed,
    sidebarAvatarFailed,
    setSidebarAvatarFailed,
    sidebarUserRef,
    contentRef,
    userMenu,
    sidebarUserMenu,
    handleToggleCollapse,
    navSections,
    toggleGroup,
    handleSearchSubmit,
  };
}

export type AdminLayoutState = ReturnType<typeof useAdminLayout>;
