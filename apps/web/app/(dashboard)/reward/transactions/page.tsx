'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';

export default function RewardTransactionsPage() {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const txsData = await fetchAPI<any[]>('/reward/transactions');
        setTransactions(txsData);
      } catch (err) {
        console.error('Failed to load reward transactions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filtered = transactions.filter((tx) => {
    const matchType = filterType === '' || tx.type === filterType;
    const matchSearch =
      search === '' ||
      tx.description.toLowerCase().includes(search.toLowerCase()) ||
      (tx.message && tx.message.toLowerCase().includes(search.toLowerCase()));
    return matchType && matchSearch;
  });

  const totalDebit = filtered.filter((t) => t.type === 'debit').reduce((s, t) => s + t.points, 0);
  const totalCredit = filtered.filter((t) => t.type === 'credit').reduce((s, t) => s + t.points, 0);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Riwayat Transaksi Poin</h1>
          <p className="text-xs text-slate-400 mt-1">Lihat seluruh aktivitas pemberian dan penukaran poin reward Anda.</p>
        </div>
        <Link
          href="/reward"
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
        >
          Kembali ke Reward
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</span>
          <p className="text-xl font-bold text-slate-800 font-mono mt-1">{filtered.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poin Diberikan</span>
          <p className="text-xl font-bold text-blue-600 font-mono mt-1">-{totalDebit}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Poin Diterima</span>
          <p className="text-xl font-bold text-green-600 font-mono mt-1">+{totalCredit}</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari deskripsi atau pesan..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15"
            />
          </div>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Semua Tipe</option>
            <option value="debit">Poin Keluar</option>
            <option value="credit">Poin Masuk</option>
          </select>
        </div>

        <DataTable
          headers={['Tanggal', 'Deskripsi', 'Pesan', 'Tipe', 'Poin']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => <span className="text-xs text-slate-600">{formatDate(row.date)}</span>,
            (row) => <span className="text-xs font-semibold text-slate-800">{row.description}</span>,
            (row) => (
              <span className="text-xs text-slate-500 italic truncate max-w-[200px] block">
                {row.message || '-'}
              </span>
            ),
            (row) => <Badge status={row.type === 'debit' ? 'pending' : 'approved'} />,
            (row) => (
              <span className={`text-xs font-bold font-mono ${row.type === 'debit' ? 'text-blue-600' : 'text-green-600'}`}>
                {row.type === 'debit' ? '-' : '+'}{row.points}
              </span>
            ),
          ]}
          emptyText="Belum ada transaksi poin reward."
        />
      </div>
    </div>
  );
}
