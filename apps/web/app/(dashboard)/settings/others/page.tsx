'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FormField from '@/components/shared/FormField';

export default function SettingsOthersPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    companyTimezone: 'Asia/Jakarta',
    dateFormat: 'DD/MM/YYYY',
    language: 'id',
    sessionTimeout: 30,
    enableAuditLog: true,
    maintenanceMode: false,
  });

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengaturan umum berhasil disimpan.');
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-slate-400 hover:text-primary transition">
          <Lucide.ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Lainnya</h1>
          <p className="text-xs text-slate-400 mt-1">Konfigurasi umum sistem dan preferensi perusahaan.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <FormField.Select
          label="Zona Waktu"
          options={[
            { value: 'Asia/Jakarta', label: 'WIB (Asia/Jakarta)' },
            { value: 'Asia/Makassar', label: 'WITA (Asia/Makassar)' },
            { value: 'Asia/Jayapura', label: 'WIT (Asia/Jayapura)' },
          ]}
          value={settings.companyTimezone}
          onChange={(e) => setSettings({ ...settings, companyTimezone: e.target.value })}
        />
        <FormField.Select
          label="Format Tanggal"
          options={[
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
          ]}
          value={settings.dateFormat}
          onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
        />
        <FormField.Select
          label="Bahasa Default"
          options={[
            { value: 'id', label: 'Bahasa Indonesia' },
            { value: 'en', label: 'English' },
          ]}
          value={settings.language}
          onChange={(e) => setSettings({ ...settings, language: e.target.value })}
        />
        <FormField.Input
          label="Session Timeout (Menit)"
          type="number"
          value={settings.sessionTimeout}
          onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) || 0 })}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.enableAuditLog} onChange={(e) => setSettings({ ...settings, enableAuditLog: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Aktifkan audit log untuk semua mutasi data</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Mode maintenance (batasi akses non-admin)</span>
        </label>
        <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Simpan Pengaturan</button>
      </form>
    </div>
  );
}
