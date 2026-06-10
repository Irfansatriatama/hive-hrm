'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';
import Avatar from '@/components/shared/Avatar';

export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: 'Laptop', brand: '', serialNumber: '', condition: 'Baik' });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsData, empData] = await Promise.all([
        fetchAPI<any[]>('/core/assets'),
        isAdmin ? fetchAPI<{ employees: any[] }>('/employees?limit=1000') : Promise.resolve({ employees: [] }),
      ]);
      setAssets(assetsData);
      setEmployees(empData.employees || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/core/assets', { method: 'POST', body: JSON.stringify(form) });
      alert('Aset berhasil ditambahkan!');
      setForm({ name: '', category: 'Laptop', brand: '', serialNumber: '', condition: 'Baik' });
      setShowForm(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambah aset');
    }
  };

  const handleAssign = async (assetId: string) => {
    const empId = prompt('Masukkan ID karyawan untuk penugasan aset:');
    if (!empId) return;
    try {
      await fetchAPI(`/core/assets/${assetId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ employeeId: empId }),
      });
      alert('Aset berhasil ditugaskan!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menugaskan aset');
    }
  };

  const handleReturn = async (assetId: string) => {
    if (!confirm('Kembalikan aset ini ke inventori?')) return;
    try {
      await fetchAPI(`/core/assets/${assetId}/return`, { method: 'POST' });
      alert('Aset berhasil dikembalikan!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengembalikan aset');
    }
  };

  const filtered = assets.filter(
    (a) =>
      search === '' ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.assetCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Manajemen Aset</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola inventori aset perusahaan dan penugasan ke karyawan.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5">
            <Lucide.Plus className="w-4 h-4" /> Tambah Aset
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField.Input label="Nama Aset" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormField.Select
            label="Kategori"
            options={[
              { value: 'Laptop', label: 'Laptop' },
              { value: 'Monitor', label: 'Monitor' },
              { value: 'Mobile Device', label: 'Mobile Device' },
              { value: 'Furniture', label: 'Furniture' },
            ]}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <FormField.Input label="Merek" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <FormField.Input label="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} />
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Simpan Aset</button>
          </div>
        </form>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari aset..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <DataTable
          headers={['Kode', 'Nama', 'Kategori', 'Kondisi', 'Pengguna', 'Status']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => <span className="text-xs font-mono font-bold">{row.assetCode}</span>,
            'name',
            'category',
            'condition',
            (row) =>
              row.employee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={row.employee.fullName} size="sm" />
                  <span className="text-xs text-slate-600">{row.employee.fullName}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">-</span>
              ),
            (row) => <Badge status={row.status === 'In Use' ? 'active' : 'pending'} />,
          ]}
          actions={
            isAdmin
              ? (row) => (
                  <div className="flex justify-end gap-1">
                    {row.status === 'Available' ? (
                      <button onClick={() => handleAssign(row.id)} className="px-2 py-1 bg-primary text-white rounded text-[10px] font-bold cursor-pointer">Assign</button>
                    ) : (
                      <button onClick={() => handleReturn(row.id)} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-[10px] font-bold cursor-pointer">Return</button>
                    )}
                  </div>
                )
              : undefined
          }
          emptyText="Belum ada aset terdaftar."
        />
      </div>
    </div>
  );
}
