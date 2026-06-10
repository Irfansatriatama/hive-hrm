'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';

export default function ShiftPage() {
  const { user } = useAuth();
  const [shifts, setShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', startTime: '08:00', endTime: '17:00', breakTime: 60, isDefault: false });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const loadShifts = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/core/shifts');
      setShifts(data);
    } catch (err) {
      console.error('Failed to load shifts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShifts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/core/shifts', { method: 'POST', body: JSON.stringify(form) });
      alert('Shift berhasil ditambahkan!');
      setForm({ name: '', startTime: '08:00', endTime: '17:00', breakTime: 60, isDefault: false });
      setShowForm(false);
      loadShifts();
    } catch (err: any) {
      alert(err.message || 'Gagal menambah shift');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Manajemen Shift</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola jadwal shift kerja karyawan perusahaan.</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5">
            <Lucide.Plus className="w-4 h-4" /> Tambah Shift
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField.Input label="Nama Shift" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormField.Input label="Jam Mulai" type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
          <FormField.Input label="Jam Selesai" type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} />
          <FormField.Input
            label="Istirahat (Menit)"
            type="number"
            value={form.breakTime}
            onChange={(e) => setForm({ ...form, breakTime: parseInt(e.target.value) || 0 })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="rounded" />
            <span className="text-xs text-slate-700">Shift default</span>
          </label>
          <div className="sm:col-span-2 lg:col-span-3">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Simpan Shift</button>
          </div>
        </form>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <DataTable
          headers={['Nama Shift', 'Jam Mulai', 'Jam Selesai', 'Istirahat', 'Default']}
          rows={shifts}
          loading={loading}
          columns={[
            (row) => <span className="text-xs font-bold text-slate-800">{row.name}</span>,
            (row) => <span className="text-xs font-mono text-slate-600">{row.startTime}</span>,
            (row) => <span className="text-xs font-mono text-slate-600">{row.endTime}</span>,
            (row) => <span className="text-xs text-slate-500">{row.breakTime || 0} menit</span>,
            (row) => (row.isDefault ? <Badge status="approved" /> : <span className="text-xs text-slate-400">-</span>),
          ]}
          emptyText="Belum ada shift terdaftar."
        />
      </div>
    </div>
  );
}
