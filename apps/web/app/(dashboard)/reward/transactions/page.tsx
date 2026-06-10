'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { isHRRole, usePermission } from '@/hooks/usePermission';

interface LedgerRow {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  points: number;
  senderReceiverName: string;
  hashtag: string;
  date: string;
  balanceAfter?: number | null;
}

export default function RewardTransactionsPage() {
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [transactions, setTransactions] = useState<LedgerRow[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterStart, setFilterStart] = useState(thirtyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(todayStr);
  const [filterEmp, setFilterEmp] = useState('');
  const [filterType, setFilterType] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', filterEnd);
      if (filterEmp) params.set('employeeId', filterEmp);
      if (filterType) params.set('type', filterType);

      const [txsData, empsRes] = await Promise.all([
        fetchAPI<LedgerRow[]>(`/reward/ledger?${params.toString()}`),
        fetchAPI<{ employees: any[] }>('/employees?limit=1000'),
      ]);

      setTransactions(txsData);
      setEmployees(empsRes.employees || []);
    } catch (err) {
      console.error('Failed to load reward ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isHR) loadData();
  }, [authLoading, isHR, filterStart, filterEnd, filterEmp, filterType]);

  const handleExportCSV = () => {
    const csvContent = [
      ['Karyawan', 'Tipe', 'Poin', 'DariUntuk', 'Hashtag', 'Tanggal', 'SaldoAkhir'],
      ...transactions.map((tx) => [
        tx.employeeName,
        tx.type === 'received' ? 'DITERIMA' : 'DITUKAR',
        tx.points,
        tx.senderReceiverName || '',
        tx.hashtag || '',
        new Date(tx.date).toISOString().split('T')[0],
        tx.balanceAfter ?? '',
      ]),
    ]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HIVE_Reward_Points_Ledger_${filterStart}_to_${filterEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat melihat buku besar transaksi poin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Buku Besar Transaksi Poin (Ledger)</h1>
          <p className="text-xs text-slate-400 mt-1">Lacak seluruh mutasi poin masuk/keluar karyawan untuk keperluan audit internal.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm bg-white cursor-pointer"
        >
          <Lucide.Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mulai</label>
          <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Selesai</label>
          <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Karyawan</label>
          <select value={filterEmp} onChange={(e) => setFilterEmp(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
            <option value="">Semua Karyawan</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.full_name || e.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipe Transaksi</label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
            <option value="">Semua Tipe</option>
            <option value="received">Diterima / Hadiah</option>
            <option value="redeemed">Ditukar / Claim</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-xs">Tidak ada transaksi poin tercatat.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Karyawan</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Tipe</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nilai Poin</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Dari/Untuk</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Hashtag</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Saldo Akhir</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((row) => (
                  <tr key={row.id} className="table-row-hover border-b border-slate-100 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">{row.employeeName}</td>
                    <td className="px-6 py-4">
                      {row.type === 'received' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-50 text-green-700 border border-green-100">DITERIMA</span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-50 text-red-700 border border-red-100">DITUKAR</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold">
                      {row.type === 'received' ? (
                        <span className="text-green-650 font-bold font-mono">+{row.points} Pts</span>
                      ) : (
                        <span className="text-red-500 font-bold font-mono">-{row.points} Pts</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{row.senderReceiverName || '-'}</td>
                    <td className="px-6 py-4 text-slate-500 font-medium">{row.hashtag || '-'}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{formatDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4 font-bold text-slate-700 font-mono">{row.balanceAfter ?? '-'} Pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
