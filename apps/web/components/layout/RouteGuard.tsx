'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission } from '@/hooks/usePermission';
import { useModules } from '@/hooks/useModules';
import { getModuleKeyFromPath } from '@/lib/modules';

export default function RouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { isLoading: authLoading } = useAuth();
  const { hasAccess } = usePermission();
  const { isModuleEnabled, loading: modulesLoading } = useModules();

  if (authLoading || modulesLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memuat...</span>
        </div>
      </div>
    );
  }

  const moduleKey = getModuleKeyFromPath(pathname);

  if (!isModuleEnabled(moduleKey)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lucide.Lock className="w-16 h-16 text-slate-400" />
        <h2 className="text-2xl font-bold text-slate-800">Modul Dinonaktifkan</h2>
        <p className="text-slate-500 text-center max-w-md">
          Modul ini saat ini sedang dinonaktifkan oleh administrator sistem.
        </p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold shadow"
        >
          Kembali ke Dasbor
        </Link>
      </div>
    );
  }

  if (!hasAccess(moduleKey)) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <Lucide.ShieldAlert className="w-16 h-16 text-red-500" />
        <h2 className="text-2xl font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-slate-500">Peran Anda tidak memiliki wewenang untuk melihat halaman ini.</p>
        <Link
          href="/dashboard"
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-sm font-semibold shadow"
        >
          Kembali ke Dasbor
        </Link>
      </div>
    );
  }

  return <>{children}</>;
}
