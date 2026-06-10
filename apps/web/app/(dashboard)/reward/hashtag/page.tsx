'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { isHRRole, usePermission } from '@/hooks/usePermission';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface TxRow {
  id: string;
  senderName: string;
  recipientName: string;
  points: number;
  hashtag: string;
  message: string;
  date: string;
}

export default function RewardHashtagPage() {
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [transactions, setTransactions] = useState<TxRow[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterStart, setFilterStart] = useState(thirtyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(todayStr);
  const [filterDept, setFilterDept] = useState('');
  const [filterHashtag, setFilterHashtag] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', filterEnd);
      if (filterDept) params.set('departmentId', filterDept);
      if (filterHashtag) params.set('hashtag', filterHashtag);

      const [txsData, deptsData, htData] = await Promise.all([
        fetchAPI<TxRow[]>(`/reward/hashtag-report?${params.toString()}`),
        fetchAPI<any[]>('/employees/departments'),
        fetchAPI<any[]>('/reward/hashtags'),
      ]);

      setTransactions(txsData);
      setDepartments(deptsData);
      setHashtags(htData);
    } catch (err) {
      console.error('Failed to load hashtag reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isHR) {
      loadData();
    }
  }, [authLoading, isHR, filterStart, filterEnd, filterDept, filterHashtag]);

  const filtered = transactions;

  const totalPointsGiven = filtered.reduce((sum, tx) => sum + tx.points, 0);

  const { topHt, maxHtCount, topReceiver, maxReceiverPoints, hashtagChartData, receiverChartData } =
    useMemo(() => {
      const htCounts: Record<string, number> = {};
      filtered.forEach((tx) => {
        if (tx.hashtag) htCounts[tx.hashtag] = (htCounts[tx.hashtag] || 0) + 1;
      });

      let topHtVal = '-';
      let maxHt = 0;
      Object.keys(htCounts).forEach((tag) => {
        if (htCounts[tag] > maxHt) {
          maxHt = htCounts[tag];
          topHtVal = tag;
        }
      });

      const receiverCounts: Record<string, number> = {};
      filtered.forEach((tx) => {
        receiverCounts[tx.recipientName] = (receiverCounts[tx.recipientName] || 0) + tx.points;
      });

      let topRec = '-';
      let maxRec = 0;
      Object.keys(receiverCounts).forEach((name) => {
        if (receiverCounts[name] > maxRec) {
          maxRec = receiverCounts[name];
          topRec = name;
        }
      });

      return {
        topHt: topHtVal,
        maxHtCount: maxHt,
        topReceiver: topRec,
        maxReceiverPoints: maxRec,
        hashtagChartData: Object.keys(htCounts)
          .map((tag) => ({ name: tag, count: htCounts[tag] }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10),
        receiverChartData: Object.keys(receiverCounts)
          .map((name) => ({ name, points: receiverCounts[name] }))
          .sort((a, b) => b.points - a.points)
          .slice(0, 10),
      };
    }, [filtered]);

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat melihat laporan poin & nilai perusahaan.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Laporan Poin & Nilai Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">Lacak visualisasi penerapan nilai perusahaan (#hashtags) dan pemberian poin apresiasi karyawan.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mulai</label>
          <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Selesai</label>
          <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Departemen</label>
          <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Hashtag</label>
          <select value={filterHashtag} onChange={(e) => setFilterHashtag(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
            <option value="">Semua Hashtag</option>
            {hashtags.map((h) => (
              <option key={h.id} value={h.tag}>{h.tag}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lucide.Coins className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Poin Diberikan</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{totalPointsGiven} Pts</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Lucide.Hash className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hashtag Terpopuler</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">
              {topHt} <span className="text-xs text-slate-400 font-normal">({maxHtCount} kali)</span>
            </h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Lucide.Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Karyawan Terbaik</p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 truncate max-w-[180px]" title={topReceiver}>{topReceiver}</h3>
          </div>
        </div>
      </div>

      {isClient && !loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 select-none">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top 10 Hashtag Nilai Perusahaan</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hashtagChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" />
                  <YAxis fontSize={10} stroke="#94A3B8" />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Top Karyawan Penerima Poin</h2>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={receiverChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" fontSize={10} stroke="#94A3B8" />
                  <YAxis fontSize={10} stroke="#94A3B8" />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="points" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Detail Pembagian Poin Karyawan</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-6 text-center text-slate-400 text-xs">Tidak ada data transaksi poin cocok.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Pemberi</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Penerima</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nilai Poin</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Hashtag</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Pesan Apresiasi</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((row) => (
                  <tr key={row.id} className="table-row-hover border-b border-slate-100 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-800">{row.senderName}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{row.recipientName}</td>
                    <td className="px-6 py-3.5 font-bold text-primary font-mono">+{row.points} Pts</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-650">{row.hashtag}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-sm truncate" title={row.message}>{row.message}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-400">{formatDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
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
