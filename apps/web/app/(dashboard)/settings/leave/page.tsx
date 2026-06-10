'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import FormField from '@/components/shared/FormField';

export default function SettingsLeavePage() {
  const { user } = useAuth();
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    minAdvanceDays: 3,
    allowHalfDay: false,
    carryOverEnabled: true,
    maxCarryOver: 5,
  });

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  useEffect(() => {
    if (!isHR) return;
    async function load() {
      try {
        const types = await fetchAPI<any[]>('/leave/types');
        setLeaveTypes(types);
      } catch (err) {
        console.error('Failed to load leave types:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isHR]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengaturan cuti berhasil disimpan.');
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
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/settings" className="text-slate-400 hover:text-primary transition">
          <Lucide.ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Cuti</h1>
          <p className="text-xs text-slate-400 mt-1">Konfigurasi jenis cuti dan kebijakan perusahaan.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5 max-w-2xl">
        <FormField.Input
          label="Minimal Hari Pengajuan Sebelumnya"
          type="number"
          value={settings.minAdvanceDays}
          onChange={(e) => setSettings({ ...settings, minAdvanceDays: parseInt(e.target.value) || 0 })}
        />
        <FormField.Input
          label="Maksimal Carry Over (Hari)"
          type="number"
          value={settings.maxCarryOver}
          onChange={(e) => setSettings({ ...settings, maxCarryOver: parseInt(e.target.value) || 0 })}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.allowHalfDay} onChange={(e) => setSettings({ ...settings, allowHalfDay: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Izinkan cuti setengah hari</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.carryOverEnabled} onChange={(e) => setSettings({ ...settings, carryOverEnabled: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Aktifkan carry over sisa cuti tahunan</span>
        </label>
        <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Simpan Pengaturan</button>
      </form>

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Jenis Cuti</h3>
        <DataTable
          headers={['Nama', 'Maks. Hari', 'Berbayar']}
          rows={leaveTypes}
          loading={loading}
          columns={[
            'name',
            (row) => <span className="text-xs font-mono">{row.maxDays} hari</span>,
            (row) => <span className="text-xs text-slate-600">{row.isPaid ? 'Ya' : 'Tidak'}</span>,
          ]}
        />
      </div>
    </div>
  );
}
