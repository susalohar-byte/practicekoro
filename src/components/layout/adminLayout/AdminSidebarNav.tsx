import React from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { preloadRoute } from '@/utils/routePreload';
import type { AdminLayoutState } from './useAdminLayout';

export const AdminSidebarNav: React.FC<{ layout: AdminLayoutState }> = ({ layout }) => {
  const { navSections, isCollapsed, openGroups, location, toggleGroup, setSidebarOpen } = layout;
  return (
    <div className="flex-1 min-h-0 py-2 px-2.5 space-y-4 overflow-y-auto overscroll-contain scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
      {navSections.map((section, sIdx) => (
        <div key={section.title || `sec-${sIdx}`} className="space-y-1">
          {/* Section Header */}
          {section.title && !isCollapsed && (
            <div className="px-2.5 pt-2 pb-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400/80">
                {section.title}
              </p>
            </div>
          )}

          {section.items.map((item) => {
            const Icon = item.icon;
            const hasChildren = item.children && item.children.length > 0;
            const isGroupOpen = Boolean(openGroups[item.key]);

            // Active detection
            const isChildActive = hasChildren
              ? item.children!.some(
                  (sub) =>
                    location.pathname === sub.path ||
                    Boolean(sub.altPaths?.some((p) => location.pathname.startsWith(p)))
                )
              : false;

            const isDirectActive = item.path
              ? item.end
                ? location.pathname === item.path
                : location.pathname === item.path ||
                  Boolean(item.altPaths?.some((p) => location.pathname.startsWith(p)))
              : false;

            const isParentActive = isDirectActive || isChildActive;

            // Collapsed Rail View with Animated Floating Tooltips
            if (isCollapsed) {
              const targetPath = item.path || (hasChildren ? item.children![0].path : undefined);
              return (
                <div key={item.key} className="relative group flex justify-center py-0.5">
                  <NavLink
                    to={targetPath || '#'}
                    end={item.end}
                    title={item.label}
                    onPointerEnter={() => {
                      if (targetPath) preloadRoute(targetPath);
                    }}
                    onFocus={() => {
                      if (targetPath) preloadRoute(targetPath);
                    }}
                    className={cn(
                      'relative w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 group-hover:scale-105 active:scale-95',
                      isParentActive
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                        : 'text-slate-400 hover:text-white hover:bg-white/[0.08]'
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="w-4.5 h-4.5 transition-transform duration-200 group-hover:scale-110" />

                    {/* Subtle active pip indicator */}
                    {isParentActive && (
                      <span className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-4 rounded-r-full bg-white shadow-xs animate-in fade-in duration-200" />
                    )}
                  </NavLink>

                  {/* Animated Floating Tooltip on Hover */}
                  <div className="absolute left-[calc(100%+10px)] top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white text-xs font-semibold shadow-xl whitespace-nowrap opacity-0 -translate-x-1 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out flex items-center gap-1.5">
                    <span>{item.label}</span>
                    {hasChildren && (
                      <span className="text-[10px] text-blue-400 font-normal">
                        ({item.children?.length})
                      </span>
                    )}
                  </div>
                </div>
              );
            }

            // Normal Expanded Accordion Group View
            if (hasChildren) {
              return (
                <div key={item.key} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(item.key)}
                    className={cn(
                      'group w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none text-left',
                      isParentActive && !isGroupOpen
                        ? 'bg-blue-600/15 text-blue-300 font-bold border border-blue-500/25'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06] hover:translate-x-1'
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
                          isParentActive
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'text-slate-400 group-hover:text-blue-300 group-hover:scale-110'
                        )}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="truncate tracking-tight font-medium">{item.label}</span>
                    </div>

                    <ChevronDown
                      className={cn(
                        'w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ease-out shrink-0',
                        isGroupOpen && 'rotate-180 text-blue-400'
                      )}
                    />
                  </button>

                  {/* Smooth CSS Grid Accordion Collapse Animation */}
                  <div
                    className={cn(
                      'grid transition-[grid-template-rows,opacity] duration-250 ease-out',
                      isGroupOpen
                        ? 'grid-rows-[1fr] opacity-100'
                        : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                    )}
                  >
                    <div className="overflow-hidden">
                      <div className="pl-6 pr-1 py-1 space-y-0.5 border-l-2 border-slate-800 ml-4.5 my-0.5">
                        {item.children!.map((sub) => {
                          const isSubActive =
                            location.pathname === sub.path ||
                            Boolean(sub.altPaths?.some((p) => location.pathname.startsWith(p)));
                          const SubIcon = sub.icon;

                          return (
                            <NavLink
                              key={sub.path}
                              to={sub.path}
                              onClick={() => setSidebarOpen(false)}
                              onPointerEnter={() => preloadRoute(sub.path)}
                              onFocus={() => preloadRoute(sub.path)}
                              className={cn(
                                'group flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-all duration-150',
                                isSubActive
                                  ? 'bg-blue-600 text-white font-bold shadow-sm shadow-blue-500/25'
                                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/[0.05] hover:translate-x-1'
                              )}
                            >
                              {SubIcon ? (
                                <SubIcon
                                  className={cn(
                                    'w-3.5 h-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110',
                                    isSubActive
                                      ? 'text-white'
                                      : 'opacity-70 group-hover:opacity-100'
                                  )}
                                />
                              ) : (
                                <span
                                  className={cn(
                                    'w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-200',
                                    isSubActive
                                      ? 'bg-white shadow-[0_0_6px_#ffffff]'
                                      : 'bg-slate-500 group-hover:bg-blue-400 group-hover:scale-125'
                                  )}
                                />
                              )}
                              <span className="truncate">{sub.label}</span>
                            </NavLink>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Regular Single Nav Item
            return (
              <NavLink
                key={item.key}
                to={item.path!}
                end={item.end}
                onClick={() => setSidebarOpen(false)}
                onPointerEnter={() => preloadRoute(item.path!)}
                onFocus={() => preloadRoute(item.path!)}
                className={cn(
                  'group relative flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 select-none',
                  isDirectActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30 ring-1 ring-blue-400/30'
                    : 'text-slate-300 hover:text-white hover:bg-white/[0.06] hover:translate-x-1'
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
                      isDirectActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-blue-300 group-hover:scale-110'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                  </div>
                  <span className="truncate tracking-tight font-medium">{item.label}</span>
                </div>

                {item.badge ? (
                  <span className="px-1.5 py-0.5 rounded-full text-[9.5px] font-bold bg-white/20 text-white shrink-0">
                    {item.badge}
                  </span>
                ) : !isDirectActive ? (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-500/60 group-hover:text-slate-300 transition-all duration-150 shrink-0" />
                ) : null}
              </NavLink>
            );
          })}
        </div>
      ))}
    </div>
  );
};
