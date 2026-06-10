'use client';

import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { LayoutProvider, useLayout } from '@/lib/layout-context';
import { ModulesProvider } from '@/lib/modules-context';
import { PermissionsProvider } from '@/lib/permissions-context';

function AppShellContent({ children }: { children: React.ReactNode }) {
  const { isCollapsed, isMobileOpen, closeMobile } = useLayout();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-base font-sans text-slate-800">
      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div
          onClick={closeMobile}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-25 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="sidebar"
        className={`bg-sidebar text-slate-300 flex flex-col shrink-0 h-screen transition-all duration-300 border-r border-slate-800 z-30 fixed md:relative 
          ${isCollapsed ? 'w-16' : 'w-64'} 
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <Sidebar />
      </aside>

      {/* Main Wrapper */}
      <div
        id="main-wrapper"
        className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300"
      >
        {/* Topbar Header */}
        <header
          id="topbar"
          className="h-14 bg-white border-b border-border flex items-center justify-between px-6 z-20 shrink-0 shadow-sm"
        >
          <Topbar />
        </header>

        {/* Content Area */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto p-6 bg-base relative focus:outline-none"
        >
          {children}
        </main>
      </div>

      {/* Portals for global dialogs/toasts if needed */}
      <div id="modal-container" className="relative z-50" />
      <div id="toast-container" className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none" />
    </div>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LayoutProvider>
      <PermissionsProvider>
        <ModulesProvider>
          <AppShellContent>{children}</AppShellContent>
        </ModulesProvider>
      </PermissionsProvider>
    </LayoutProvider>
  );
}
