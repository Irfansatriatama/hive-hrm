'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import FormField from '@/components/shared/FormField';

const defaultCategories = ['Laptop', 'Monitor', 'Mobile Device', 'Furniture', 'Vehicle', 'Other'];

export default function SettingsAssetsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState({
    requireReturnOnExit: true,
    depreciationYears: 3,
    autoGenerateCode: true,
    notifyOnAssignment: true,
  });
  const [categories, setCategories] = useState(defaultCategories);
  const [newCategory, setNewCategory] = useState('');

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Pengaturan aset berhasil disimpan.');
  };

  const addCategory = () => {
    if (!newCategory.trim() || categories.includes(newCategory)) return;
    setCategories([...categories, newCategory]);
    setNewCategory('');
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
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Aset</h1>
          <p className="text-xs text-slate-400 mt-1">Atur kategori dan kebijakan penugasan aset.</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
        <FormField.Input
          label="Periode Depresiasi (Tahun)"
          type="number"
          value={settings.depreciationYears}
          onChange={(e) => setSettings({ ...settings, depreciationYears: parseInt(e.target.value) || 0 })}
        />
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.requireReturnOnExit} onChange={(e) => setSettings({ ...settings, requireReturnOnExit: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Wajib return aset saat karyawan resign</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.autoGenerateCode} onChange={(e) => setSettings({ ...settings, autoGenerateCode: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Auto-generate kode aset</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={settings.notifyOnAssignment} onChange={(e) => setSettings({ ...settings, notifyOnAssignment: e.target.checked })} className="rounded" />
          <span className="text-xs text-slate-700">Notifikasi saat aset ditugaskan</span>
        </label>

        <div className="border-t border-slate-100 pt-4">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Kategori Aset</h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((cat) => (
              <span key={cat} className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-[10px] font-bold">{cat}</span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Kategori baru..."
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs"
            />
            <button type="button" onClick={addCategory} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer">Tambah</button>
          </div>
        </div>

        <button type="submit" className="px-5 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Simpan Pengaturan</button>
      </form>
    </div>
  );
}
