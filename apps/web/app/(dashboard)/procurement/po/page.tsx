'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';

export default function ProcurementPOPage() {
  const { user } = useAuth();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const canAction =
    user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'FINANCE';

  const loadPOs = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/procurement/po');
      setPos(data);
    } catch (err) {
      console.error('Failed to load PO list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOs();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Apakah Anda yakin ingin ${action === 'approve' ? 'menyetujui' : 'menolak'} PO ini?`)) return;
    try {
      await fetchAPI(`/procurement/po/${id}/action`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
      alert(`PO berhasil ${action === 'approve' ? 'disetujui' : 'ditolak'}`);
      loadPOs();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses PO');
    }
  };

  const filtered = pos.filter((po) => {
    const matchStatus = filterStatus === '' || po.status === filterStatus;
    const matchSearch =
      search === '' ||
      po.itemName.toLowerCase().includes(search.toLowerCase()) ||
      po.poNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Purchase Order</h1>
        <p className="text-xs text-slate-400 mt-1">Kelola seluruh purchase order procurement perusahaan.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari PO atau nama barang..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>

        <DataTable
          headers={['No. PO', 'Barang', 'Qty', 'Total', 'Pemohon', 'Tanggal', 'Status']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => <span className="text-xs font-mono font-bold text-slate-700">{row.poNumber}</span>,
            (row) => <span className="text-xs font-semibold text-slate-800">{row.itemName}</span>,
            (row) => <span className="text-xs text-slate-600">{row.quantity}</span>,
            (row) => <span className="text-xs font-bold text-primary font-mono">{formatRupiah(row.totalPrice)}</span>,
            (row) => <span className="text-xs text-slate-500">{row.requester}</span>,
            (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
            (row) => <Badge status={row.status} />,
          ]}
          actions={
            canAction
              ? (row) =>
                  row.status === 'pending' ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleAction(row.id, 'approve')}
                        className="px-2.5 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => handleAction(row.id, 'reject')}
                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-[10px] font-bold cursor-pointer"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : null
              : undefined
          }
          emptyText="Belum ada purchase order."
        />
      </div>
    </div>
  );
}
