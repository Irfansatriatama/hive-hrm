'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import TableActionMenu from '@/components/shared/TableActionMenu';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';

export default function VisitorPage() {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({ visitorName: '', company: '', phone: '', purpose: '' });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/core/visitors');
      setVisitors(data);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisitors();
  }, []);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/core/visitors', { method: 'POST', body: JSON.stringify(form) });
      alert('Tamu berhasil check-in!');
      setForm({ visitorName: '', company: '', phone: '', purpose: '' });
      setShowForm(false);
      loadVisitors();
    } catch (err: any) {
      alert(err.message || 'Gagal check-in tamu');
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await fetchAPI(`/core/visitors/${id}/check-out`, { method: 'POST' });
      alert('Tamu berhasil check-out!');
      loadVisitors();
    } catch (err: any) {
      alert(err.message || 'Gagal check-out tamu');
    }
  };

  const filtered = visitors.filter((v) => filterStatus === '' || v.status === filterStatus);
  const activeCount = visitors.filter((v) => v.status === 'in').length;

  if (!isAdmin) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Manajemen tamu hanya untuk HR Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Buku Tamu</h1>
          <p className="text-xs text-slate-400 mt-1">Catat dan kelola kunjungan tamu ke kantor.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5">
          <Lucide.UserPlus className="w-4 h-4" /> Check-in Tamu
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tamu Aktif</span>
          <p className="text-xl font-bold text-green-600 font-mono mt-1">{activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Kunjungan</span>
          <p className="text-xl font-bold text-slate-800 font-mono mt-1">{visitors.length}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCheckIn} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField.Input label="Nama Tamu" required value={form.visitorName} onChange={(e) => setForm({ ...form, visitorName: e.target.value })} />
          <FormField.Input label="Perusahaan" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
          <FormField.Input label="No. Telepon" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <FormField.Input label="Tujuan Kunjungan" required value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} />
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Check-in</button>
          </div>
        </form>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
        >
          <option value="">Semua Status</option>
          <option value="in">Sedang Berkunjung</option>
          <option value="out">Sudah Keluar</option>
        </select>

        <DataTable
          headers={['Nama', 'Perusahaan', 'Tujuan', 'Check-in', 'Check-out', 'Status']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => <span className="text-xs font-bold text-slate-800">{row.visitorName}</span>,
            (row) => <span className="text-xs text-slate-500">{row.company || '-'}</span>,
            (row) => <span className="text-xs text-slate-600">{row.purpose}</span>,
            (row) => <span className="text-xs text-slate-500">{formatDate(row.checkIn)}</span>,
            (row) => <span className="text-xs text-slate-500">{row.checkOut ? formatDate(row.checkOut) : '-'}</span>,
            (row) => <Badge status={row.status === 'in' ? 'active' : 'inactive'} />,
          ]}
          actions={(row) => (
            <TableActionMenu
              items={
                row.status === 'in'
                  ? [{ label: 'Check-out', onClick: () => handleCheckOut(row.id) }]
                  : []
              }
            />
          )}
          emptyText="Belum ada catatan tamu."
        />
      </div>
    </div>
  );
}
