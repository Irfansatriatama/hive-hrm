'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FormField from '@/components/shared/FormField';

export default function SettingsProcurementPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    approvalThreshold: 5000000,
    requireFinanceApproval: true,
    autoNotifyRequester: true,
    maxMonthlyBudget: 100000000,
  });

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengaturan procurement berhasil disimpan.');
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
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Procurement</h1>
          <p className="text-xs text-slate-400 mt-1">Atur batas approval dan kebijakan pengadaan.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <FormField.Input
          label="Batas Approval Manager (Rp)"
          type="number"
          value={settings.approvalThreshold}
          onChange={(e) => setSettings({ ...settings, approvalThreshold: parseInt(e.target.value) || 0 })}
        />
        <FormField.Input
          label="Budget Bulanan Maksimum (Rp)"
          type="number"
          value={settings.maxMonthlyBudget}
          onChange={(e) => setSettings({ ...settings, maxMonthlyBudget: parseInt(e.target.value) || 0 })}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.requireFinanceApproval} onChange={(e) => setSettings({ ...settings, requireFinanceApproval: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Wajib approval Finance untuk PO di atas batas</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.autoNotifyRequester} onChange={(e) => setSettings({ ...settings, autoNotifyRequester: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Notifikasi otomatis ke pemohon PO</span>
        </label>
        <button type="submit" className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer">
          Simpan Pengaturan
        </button>
      </form>
    </div>
  );
}
