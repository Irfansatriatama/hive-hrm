'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useLayout } from '@/lib/layout-context';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useModules } from '@/hooks/useModules';
import { menuKeyToModuleKey } from '@/lib/modules';

// Static icon mapper to keep bundle size small and type-safe
const IconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'layout-dashboard': Lucide.LayoutDashboard,
  'users': Lucide.Users,
  'clock': Lucide.Clock,
  'calendar': Lucide.Calendar,
  'award': Lucide.Award,
  'check-square': Lucide.CheckSquare,
  'calendar-days': Lucide.CalendarDays,
  'sitemap': Lucide.Network,
  'megaphone': Lucide.Megaphone,
  'package': Lucide.Package,
  'folder-open': Lucide.FolderOpen,
  'user-check': Lucide.UserCheck,
  'shopping-cart': Lucide.ShoppingCart,
  'bar-chart-2': Lucide.BarChart2,
  'building-2': Lucide.Building2,
  'credit-card': Lucide.CreditCard,
  'shield': Lucide.Shield,
  'layout-grid': Lucide.LayoutGrid,
  'settings': Lucide.Settings,
};

interface SubMenuItem {
  key: string;
  path: string;
}

interface MenuItem {
  key: string;
  path: string;
  icon: string;
  sub?: SubMenuItem[];
}

export default function Sidebar() {
  const { isCollapsed, toggleCollapse, closeMobile } = useLayout();
  const { t } = useI18n();
  const { user } = useAuth();
  const { hasAccess } = usePermission();
  const { isModuleEnabled } = useModules();
  const pathname = usePathname();
  const [openSubs, setOpenSubs] = useState<Record<string, boolean>>({});

  const menuItems: MenuItem[] = [
    { key: 'dashboard', path: '/dashboard', icon: 'layout-dashboard' },
    {
      key: 'employee',
      path: '/employee',
      icon: 'users',
      sub: [
        { key: 'employee_list', path: '/employee' },
        { key: 'employee_request', path: '/employee/request' },
        { key: 'employee_grouping', path: '/employee/grouping' },
      ],
    },
    {
      key: 'attendance',
      path: '/attendance',
      icon: 'clock',
      sub: [
        { key: 'attendance_report', path: '/attendance/report' },
        { key: 'attendance_settings', path: '/attendance/settings' },
      ],
    },
    {
      key: 'leave',
      path: '/leave',
      icon: 'calendar',
      sub: [
        { key: 'leave_apply', path: '/leave/apply' },
        { key: 'leave_summary', path: '/leave/summary' },
        { key: 'leave_balance', path: '/leave/balance' },
        { key: 'leave_calendar', path: '/leave/calendar' },
      ],
    },
    {
      key: 'reward',
      path: '/reward',
      icon: 'award',
      sub: [
        { key: 'reward_hashtag', path: '/reward/hashtag' },
        { key: 'reward_manage', path: '/reward/manage' },
        { key: 'reward_approval', path: '/reward/approval' },
        { key: 'reward_transactions', path: '/reward/transactions' },
      ],
    },
    {
      key: 'approval',
      path: '/approval',
      icon: 'check-square',
      sub: [
        { key: 'approval_rules', path: '/approval/rules' },
        { key: 'approval_settings', path: '/approval/settings' },
      ],
    },
    { key: 'shift', path: '/shift', icon: 'calendar-days' },
    { key: 'org_chart', path: '/org-chart', icon: 'sitemap' },
    { key: 'announcement', path: '/announcement', icon: 'megaphone' },
    { key: 'assets', path: '/assets', icon: 'package' },
    { key: 'documents', path: '/documents', icon: 'folder-open' },
    { key: 'visitor', path: '/visitor', icon: 'user-check' },
    {
      key: 'procurement',
      path: '/procurement',
      icon: 'shopping-cart',
      sub: [
        { key: 'procurement_po', path: '/procurement/po' },
        { key: 'procurement_report', path: '/procurement/report' },
      ],
    },
    { key: 'reporting', path: '/reporting', icon: 'bar-chart-2' },
    { key: 'company', path: '/company', icon: 'building-2' },
    { key: 'billing', path: '/billing', icon: 'credit-card' },
    { key: 'user_access', path: '/user-access', icon: 'shield' },
    { key: 'modules', path: '/modules', icon: 'layout-grid' },
    {
      key: 'settings',
      path: '/settings',
      icon: 'settings',
      sub: [
        { key: 'settings_hiring', path: '/settings/hiring' },
        { key: 'settings_procurement', path: '/settings/procurement' },
        { key: 'settings_custom_form', path: '/settings/custom-form' },
        { key: 'settings_leave', path: '/settings/leave' },
        { key: 'settings_assets', path: '/settings/assets' },
        { key: 'settings_others', path: '/settings/others' },
      ],
    },
  ];

  // Sync expanded submenus from localStorage on mount
  useEffect(() => {
    const initialOpenSubs: Record<string, boolean> = {};
    menuItems.forEach(item => {
      if (item.sub) {
        const stored = localStorage.getItem(`hive_sub_open_${item.key}`) === 'true';
        // Auto-expand if current route is a subroute of this menu
        const isCurrentRouteSub = pathname.startsWith(item.path);
        initialOpenSubs[item.key] = stored || isCurrentRouteSub;
      }
    });
    setOpenSubs(initialOpenSubs);
  }, [pathname]);

  const toggleSubmenu = (key: string) => {
    const next = !openSubs[key];
    setOpenSubs(prev => ({ ...prev, [key]: next }));
    localStorage.setItem(`hive_sub_open_${key}`, String(next));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AD';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const userInitials = getInitials(user?.name);
  const userName = user?.name || 'Standard Karyawan';
  const userRoleName = (user?.role || 'employee').toUpperCase().replace('_', ' ');

  return (
    <div className="flex flex-col h-full bg-sidebar text-slate-300">
      {/* Header Logo */}
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'px-5'} gap-3 border-b border-slate-800 shrink-0 select-none`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shrink-0">H</div>
        {!isCollapsed && (
          <span className="font-bold text-white tracking-wide text-sm">
            HIVE <span className="text-blue-500 font-semibold">HRM</span>
          </span>
        )}
      </div>

      {/* Navigation list */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5 scrollbar-thin">
        {menuItems.map(item => {
          const moduleKey = menuKeyToModuleKey(item.key);
          if (!isModuleEnabled(moduleKey)) return null;
          if (!hasAccess(moduleKey)) return null;

          const isParentActive = pathname.startsWith(item.path);
          const activeClass = isParentActive
            ? 'bg-slate-800 text-white font-medium border-l-[3px] border-primary'
            : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200';

          const hasSub = item.sub && item.sub.length > 0;
          const isSubOpen = openSubs[item.key] || false;
          const MenuIcon = IconMap[item.icon] || Lucide.HelpCircle;

          return (
            <div key={item.key} className="space-y-1">
              {hasSub ? (
                <button
                  onClick={() => toggleSubmenu(item.key)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-150 text-sm group ${activeClass}`}
                  title={isCollapsed ? t(item.key) : ''}
                >
                  <div className="flex items-center gap-3">
                    <MenuIcon className="w-4 h-4 shrink-0" />
                    {!isCollapsed && <span className="truncate">{t(item.key)}</span>}
                  </div>
                  {!isCollapsed && (
                    <Lucide.ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${isSubOpen ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
              ) : (
                <Link
                  href={item.path}
                  onClick={closeMobile}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 text-sm group ${activeClass}`}
                  title={isCollapsed ? t(item.key) : ''}
                >
                  <MenuIcon className="w-4 h-4 shrink-0" />
                  {!isCollapsed && <span className="truncate">{t(item.key)}</span>}
                </Link>
              )}

              {/* Render Submenu */}
              {!isCollapsed && hasSub && isSubOpen && (
                <div className="pl-7 pr-1 space-y-1 py-0.5 border-l border-slate-800 ml-5 transition-all duration-300">
                  {item.sub?.map(subItem => {
                    const isSubActive = pathname === subItem.path;
                    const subActiveText = isSubActive ? 'text-primary font-semibold' : 'text-slate-500 hover:text-slate-300';
                    return (
                      <Link
                        key={subItem.key}
                        href={subItem.path}
                        onClick={closeMobile}
                        className={`block py-1.5 text-xs transition duration-150 truncate ${subActiveText}`}
                      >
                        {t(subItem.key)}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer User card & collapse trigger */}
      <div className="p-3 border-t border-slate-800 bg-[#151B27] shrink-0">
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow"
              title={`${userName} (${userRoleName})`}
            >
              {userInitials}
            </div>
            <button
              onClick={toggleCollapse}
              className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center border border-slate-800 cursor-pointer"
            >
              <Lucide.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shrink-0 shadow">
                {userInitials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-200 truncate leading-none mb-1">{userName}</p>
                <p className="text-[10px] text-slate-500 truncate leading-none uppercase tracking-wider font-bold">
                  {userRoleName}
                </p>
              </div>
            </div>
            <button
              onClick={toggleCollapse}
              className="w-full h-8 px-3 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-2 border border-slate-800 text-xs font-semibold cursor-pointer"
            >
              <Lucide.ChevronLeft className="w-4 h-4" />
              <span>Collapse Sidebar</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
