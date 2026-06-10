'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FormField from '@/components/shared/FormField';

export default function SettingsHiringPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    probationDays: 90,
    autoGenerateId: true,
    requireDocuments: true,
    defaultEmploymentType: 'permanent',
    welcomeEmail: true,
  });

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengaturan rekrutmen berhasil disimpan.');
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
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Rekrutmen</h1>
          <p className="text-xs text-slate-400 mt-1">Konfigurasi alur hiring dan onboarding.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <FormField.Input
          label="Masa Probation (Hari)"
          type="number"
          value={settings.probationDays}
          onChange={(e) => setSettings({ ...settings, probationDays: parseInt(e.target.value) || 0 })}
        />
        <FormField.Select
          label="Tipe Kepegawaian Default"
          options={[
            { value: 'permanent', label: 'Tetap (Permanent)' },
            { value: 'contract', label: 'Kontrak' },
            { value: 'intern', label: 'Magang' },
          ]}
          value={settings.defaultEmploymentType}
          onChange={(e) => setSettings({ ...settings, defaultEmploymentType: e.target.value })}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.autoGenerateId} onChange={(e) => setSettings({ ...settings, autoGenerateId: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Auto-generate ID Karyawan</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.requireDocuments} onChange={(e) => setSettings({ ...settings, requireDocuments: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Wajib upload dokumen saat onboarding</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.welcomeEmail} onChange={(e) => setSettings({ ...settings, welcomeEmail: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Kirim email selamat datang otomatis</span>
        </label>
        <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer">
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
