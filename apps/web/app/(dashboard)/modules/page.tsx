'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useModules, SystemModule } from '@/hooks/useModules';
import { fetchAPI } from '@/lib/api';
import { MODULE_PERMISSIONS, UserRole } from '@hive-hrm/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
  'credit-card': Lucide.CreditCard,
  'shield': Lucide.Shield,
  'settings': Lucide.Settings,
  'building-2': Lucide.Building2,
};

export default function ModulesPage() {
  const { user } = useAuth();
  const { modules, loading, refreshModules } = useModules();
  const [localModules, setLocalModules] = useState<SystemModule[]>([]);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    setLocalModules(modules);
  }, [modules]);

  const toggleModule = (key: string) => {
    setLocalModules((prev) =>
      prev.map((m) => (m.key === key && !m.isCore ? { ...m, isEnabled: !m.isEnabled } : m)),
    );
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetchAPI('/core/modules', {
        method: 'PUT',
        body: JSON.stringify({
          modules: localModules
            .filter((m) => !m.isCore)
            .map((m) => ({ key: m.key, isEnabled: m.isEnabled })),
        }),
      });
      await refreshModules();
      alert('Konfigurasi modul berhasil disimpan.');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan konfigurasi modul');
    } finally {
      setSaving(false);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Konfigurasi modul hanya untuk Super Admin.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Pusat Kontrol Modul Aplikasi</h1>
          <p className="text-xs text-slate-400 mt-1">Aktifkan atau nonaktifkan modul platform secara modular. Modul inti tidak dapat dinonaktifkan.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">
          {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {localModules.map((mod) => {
          const Icon = ICON_MAP[mod.icon || ''] || Lucide.LayoutGrid;
          const roles = MODULE_PERMISSIONS[mod.key] as UserRole[] | undefined;

          return (
            <div key={mod.key} className="p-6 bg-white border border-slate-150 rounded-2xl shadow-sm hover:shadow-md transition flex flex-col justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-slate-800">{mod.name}</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{mod.description}</p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-slate-50 pt-3 mt-1 select-none">
                <span className={`text-xs font-semibold ${mod.isEnabled ? 'text-green-600' : 'text-slate-500'}`}>
                  {mod.isEnabled ? 'Modul Aktif' : 'Modul Nonaktif'}
                </span>
                {mod.isCore ? (
                  <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-lg">
                    Modul Inti Sistem
                  </span>
                ) : (
                  <button
                    onClick={() => toggleModule(mod.key)}
                    className={`relative w-10 h-6 rounded-full transition cursor-pointer ${mod.isEnabled ? 'bg-primary' : 'bg-slate-300'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition ${mod.isEnabled ? 'left-5' : 'left-1'}`} />
                  </button>
                )}
              </div>
              {roles && (
                <div className="flex flex-wrap gap-1">
                  {roles.map((r) => (
                    <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold">{r}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
