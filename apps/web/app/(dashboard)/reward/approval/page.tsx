'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';

export default function RewardApprovalPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  useEffect(() => {
    if (!isHR) return;
    async function loadData() {
      setLoading(true);
      try {
        const txsData = await fetchAPI<any[]>('/reward/transactions');
        const redeems = txsData
          .filter((tx) => tx.description.includes('Penukaran'))
          .map((tx) => ({
            ...tx,
            status: 'approved',
            itemName: tx.description.replace('Penukaran hadiah: ', ''),
          }));
        setTransactions(redeems);
      } catch (err) {
        console.error('Failed to load reward approvals:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isHR]);

  const filtered = transactions.filter((tx) => {
    return filterStatus === '' || tx.status === filterStatus;
  });

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat melihat persetujuan penukaran reward.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Persetujuan Penukaran Reward</h1>
        <p className="text-xs text-slate-400 mt-1">Pantau dan kelola permintaan penukaran poin reward karyawan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Penukaran</span>
          <p className="text-xl font-bold text-slate-800 font-mono mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Poin Ditukar</span>
          <p className="text-xl font-bold text-primary font-mono mt-1">
            {filtered.reduce((s, t) => s + t.points, 0)} Pts
          </p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
        >
          <option value="">Semua Status</option>
          <option value="approved">Disetujui</option>
          <option value="pending">Menunggu</option>
        </select>

        <DataTable
          headers={['Tanggal', 'Item', 'Poin', 'Status', 'Keterangan']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => <span className="text-xs text-slate-600">{formatDate(row.date)}</span>,
            (row) => <span className="text-xs font-semibold text-slate-800">{row.itemName}</span>,
            (row) => <span className="text-xs font-bold text-primary font-mono">{row.points} Pts</span>,
            (row) => <Badge status={row.status} />,
            (row) => <span className="text-xs text-slate-500">{row.message || '-'}</span>,
          ]}
          emptyText="Belum ada permintaan penukaran reward."
        />
      </div>
    </div>
  );
}
