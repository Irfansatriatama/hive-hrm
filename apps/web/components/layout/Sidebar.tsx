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
  'banknote': Lucide.Banknote,
  'clipboard-check': Lucide.ClipboardCheck,
  'receipt': Lucide.Receipt,
  'calendar-range': Lucide.CalendarRange,
  'bar-chart': Lucide.BarChart,
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

interface MenuSection {
  key: string;
  items: MenuItem[];
}

const MENU_SECTIONS: MenuSection[] = [
  {
    key: 'sidebar_main',
    items: [
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
        key: 'approval',
        path: '/approval',
        icon: 'check-square',
        sub: [
          { key: 'approval_rules', path: '/approval/rules' },
          { key: 'approval_settings', path: '/approval/settings' },
        ],
      },
    ],
  },
  {
    key: 'sidebar_operations',
    items: [
      { key: 'shift', path: '/shift', icon: 'calendar-days' },
      { key: 'org_chart', path: '/org-chart', icon: 'sitemap' },
      { key: 'announcement', path: '/announcement', icon: 'megaphone' },
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
        key: 'payroll',
        path: '/payroll',
        icon: 'banknote',
        sub: [
          { key: 'payroll_periods', path: '/payroll' },
          { key: 'payroll_my_payslips', path: '/payroll/my-payslips' },
        ],
      },
      {
        key: 'onboarding',
        path: '/onboarding',
        icon: 'clipboard-check',
        sub: [
          { key: 'onboarding_assignments', path: '/onboarding' },
          { key: 'onboarding_my', path: '/onboarding/my' },
        ],
      },
      {
        key: 'expense',
        path: '/expense',
        icon: 'receipt',
      },
      {
        key: 'resources',
        path: '/resources',
        icon: 'calendar-range',
      },
      {
        key: 'polls',
        path: '/polls',
        icon: 'bar-chart',
      },
    ],
  },
  {
    key: 'sidebar_resources',
    items: [
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
    ],
  },
  {
    key: 'sidebar_reports',
    items: [
      { key: 'reporting', path: '/reporting', icon: 'bar-chart-2' },
    ],
  },
  {
    key: 'sidebar_admin',
    items: [
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
    ],
  },
];

function findActiveContext(pathname: string) {
  for (const section of MENU_SECTIONS) {
    for (const item of section.items) {
      if (pathname.startsWith(item.path)) {
        return {
          sectionKey: section.key,
          subKey: item.sub ? item.key : null,
        };
      }
    }
  }
  return { sectionKey: 'sidebar_main', subKey: null };
}

export default function Sidebar() {
  const { isCollapsed, toggleCollapse, closeMobile } = useLayout();
  const { t } = useI18n();
  const { user } = useAuth();
  const { hasAccess } = usePermission();
  const { isModuleEnabled } = useModules();
  const pathname = usePathname();
  const [openSection, setOpenSection] = useState<string | null>('sidebar_main');
  const [openSub, setOpenSub] = useState<string | null>(null);

  useEffect(() => {
    const { sectionKey, subKey } = findActiveContext(pathname);
    setOpenSection(sectionKey);
    setOpenSub(subKey);
  }, [pathname]);

  const toggleSection = (key: string) => {
    setOpenSection(prev => {
      if (prev === key) return null;
      setOpenSub(null);
      return key;
    });
  };

  const toggleSubmenu = (key: string, sectionKey: string) => {
    setOpenSection(sectionKey);
    setOpenSub(prev => (prev === key ? null : key));
  };

  const isItemVisible = (item: MenuItem) => {
    const moduleKey = menuKeyToModuleKey(item.key);
    return isModuleEnabled(moduleKey) && hasAccess(moduleKey);
  };

  const getVisibleItems = (items: MenuItem[]) => items.filter(isItemVisible);

  const renderMenuItem = (item: MenuItem, sectionKey: string) => {
    const isParentActive = pathname.startsWith(item.path);
    const activeClass = isParentActive
      ? 'bg-slate-800 text-white font-medium border-l-[3px] border-primary'
      : 'hover:bg-slate-800/50 text-slate-400 hover:text-slate-200';

    const hasSub = item.sub && item.sub.length > 0;
    const isSubOpen = openSub === item.key;
    const MenuIcon = IconMap[item.icon] || Lucide.HelpCircle;

    return (
      <div key={item.key} className="space-y-1">
        {hasSub ? (
          <button
            onClick={() => toggleSubmenu(item.key, sectionKey)}
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

        {!isCollapsed && hasSub && isSubOpen && (
          <div className="pl-7 pr-1 space-y-1 py-0.5 border-l border-slate-800 ml-5 transition-all duration-300">
            {item.sub?.map(subItem => {
              const isSubActive = pathname === subItem.path;
              const subActiveText = isSubActive
                ? 'text-primary font-semibold'
                : 'text-slate-500 hover:text-slate-300';
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
      <div className={`h-14 flex items-center ${isCollapsed ? 'justify-center' : 'px-5'} gap-3 border-b border-slate-800 shrink-0 select-none`}>
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-lg shrink-0">H</div>
        {!isCollapsed && (
          <span className="font-bold text-white tracking-wide text-sm">
            HIVE <span className="text-blue-500 font-semibold">HRM</span>
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {isCollapsed ? (
          <div className="space-y-1.5">
            {MENU_SECTIONS.flatMap(section => getVisibleItems(section.items)).map(item =>
              renderMenuItem(item, findActiveContext(pathname).sectionKey)
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {MENU_SECTIONS.map(section => {
              const visibleItems = getVisibleItems(section.items);
              if (visibleItems.length === 0) return null;

              const isSectionOpen = openSection === section.key;
              const hasActiveItem = visibleItems.some(item => pathname.startsWith(item.path));

              return (
                <div key={section.key} className="space-y-1">
                  <button
                    onClick={() => toggleSection(section.key)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors duration-150 group ${
                      hasActiveItem ? 'text-slate-300' : 'text-slate-500 hover:text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {t(section.key)}
                    </span>
                    <Lucide.ChevronDown
                      className={`w-3 h-3 transition-transform duration-200 shrink-0 ${isSectionOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isSectionOpen && (
                    <div className="space-y-1 pl-0.5">
                      {visibleItems.map(item => renderMenuItem(item, section.key))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
              <span>{t('collapse_sidebar')}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
