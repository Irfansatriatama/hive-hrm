'use client';

import React, { useState } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MODULE_PERMISSIONS, UserRole } from '@hive-hrm/types';

const MODULE_LIST = [
  { key: 'dashboard', label: 'Dashboard', icon: Lucide.LayoutDashboard },
  { key: 'employee', label: 'Employee', icon: Lucide.Users },
  { key: 'attendance', label: 'Attendance', icon: Lucide.Clock },
  { key: 'leave', label: 'Leave', icon: Lucide.Calendar },
  { key: 'reward', label: 'Reward', icon: Lucide.Award },
  { key: 'approval', label: 'Approval', icon: Lucide.CheckSquare },
  { key: 'shift', label: 'Shift', icon: Lucide.CalendarDays },
  { key: 'org-chart', label: 'Org Chart', icon: Lucide.Network },
  { key: 'announcement', label: 'Announcement', icon: Lucide.Megaphone },
  { key: 'assets', label: 'Assets', icon: Lucide.Package },
  { key: 'documents', label: 'Documents', icon: Lucide.FolderOpen },
  { key: 'visitor', label: 'Visitor', icon: Lucide.UserCheck },
  { key: 'procurement', label: 'Procurement', icon: Lucide.ShoppingCart },
  { key: 'reporting', label: 'Reporting', icon: Lucide.BarChart2 },
  { key: 'settings', label: 'Settings', icon: Lucide.Settings },
  { key: 'user-access', label: 'User Access', icon: Lucide.Shield },
];

export default function ModulesPage() {
  const { user } = useAuth();
  const [enabledModules, setEnabledModules] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    MODULE_LIST.forEach((m) => { initial[m.key] = true; });
    return initial;
  });

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const toggleModule = (key: string) => {
    setEnabledModules((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = () => {
    alert('Konfigurasi modul berhasil disimpan.');
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

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Modul</h1>
          <p className="text-xs text-slate-400 mt-1">Aktifkan atau nonaktifkan modul fitur HIVE HRM.</p>
        </div>
        <button onClick={handleSave} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">
          Simpan Konfigurasi
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {MODULE_LIST.map((mod) => {
          const roles = MODULE_PERMISSIONS[mod.key] as UserRole[] | undefined;
          return (
            <div
              key={mod.key}
              className={`bg-white p-4 rounded-xl border shadow-sm transition ${
                enabledModules[mod.key] ? 'border-slate-100' : 'border-slate-200 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    enabledModules[mod.key] ? 'bg-blue-50 text-primary' : 'bg-slate-100 text-slate-400'
                  }`}>
                    <mod.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800">{mod.label}</h3>
                    <p className="text-[9px] text-slate-400 font-mono">{mod.key}</p>
                  </div>
                </div>
                <button
                  onClick={() => toggleModule(mod.key)}
                  className={`relative w-10 h-5 rounded-full transition cursor-pointer ${
                    enabledModules[mod.key] ? 'bg-primary' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition ${
                      enabledModules[mod.key] ? 'left-5' : 'left-0.5'
                    }`}
                  />
                </button>
              </div>
              {roles && (
                <div className="flex flex-wrap gap-1">
                  {roles.map((r) => (
                    <span key={r} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[8px] font-bold">
                      {r}
                    </span>
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
