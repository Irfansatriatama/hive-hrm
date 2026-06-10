'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';

export default function RewardManagePage() {
  const { user } = useAuth();
  const [catalog, setCatalog] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', points: 100, category: 'voucher' });

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const loadCatalog = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/reward/catalog');
      setCatalog(data);
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadCatalog();
  }, [isHR]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem = {
      id: `CAT${String(catalog.length + 1).padStart(3, '0')}`,
      name: formData.name,
      points: formData.points,
      category: formData.category,
    };
    setCatalog([...catalog, newItem]);
    setFormData({ name: '', points: 100, category: 'voucher' });
    setShowForm(false);
    alert('Item katalog berhasil ditambahkan (simulasi lokal). Hubungi admin untuk persistensi backend.');
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat mengelola katalog reward.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kelola Katalog Reward</h1>
          <p className="text-xs text-slate-400 mt-1">Tambah dan kelola item penukaran poin reward karyawan.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer flex items-center gap-1.5"
        >
          <Lucide.Plus className="w-4 h-4" />
          Tambah Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 animate-fade-in">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Item Katalog Baru</h3>
          <form onSubmit={handleAddItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField.Input
              label="Nama Item"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <FormField.Input
              label="Poin Dibutuhkan"
              type="number"
              required
              min={10}
              value={formData.points}
              onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
            />
            <FormField.Select
              label="Kategori"
              required
              options={[
                { value: 'voucher', label: 'Voucher' },
                { value: 'merchandise', label: 'Merchandise' },
              ]}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            />
            <div className="sm:col-span-3 flex gap-2">
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">
                Simpan Item
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold cursor-pointer">
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <DataTable
          headers={['ID', 'Nama Item', 'Kategori', 'Poin', 'Status']}
          rows={catalog}
          loading={loading}
          columns={[
            'id',
            (row) => <span className="text-xs font-semibold text-slate-800">{row.name}</span>,
            (row) => <span className="text-xs text-slate-500 capitalize">{row.category}</span>,
            (row) => <span className="text-xs font-bold text-primary font-mono">{row.points} Pts</span>,
            () => <Badge status="active" />,
          ]}
          emptyText="Katalog reward kosong."
        />
      </div>
    </div>
  );
}
