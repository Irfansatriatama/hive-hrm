import React from 'react';
import AppShell from '@/components/layout/AppShell';
import RouteGuard from '@/components/layout/RouteGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppShell>
      <RouteGuard>{children}</RouteGuard>
    </AppShell>
  );
}
