'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function RewardHashtagPage() {
  const { t } = useI18n();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  // Filters
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterStart, setFilterStart] = useState(thirtyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(todayStr);
  const [filterDept, setFilterDept] = useState('');
  const [filterHashtag, setFilterHashtag] = useState('');

  useEffect(() => {
    setIsClient(true);
    async function loadData() {
      setLoading(true);
      try {
        const [txsData, deptsData, empsData] = await Promise.all([
          fetchAPI<any[]>('/reward/transactions'),
          fetchAPI<any[]>('/employees/departments'),
          fetchAPI<any[]>('/employees'),
        ]);

        // Attach sender/recipient details to transactions for analytics mapping
        const enriched = txsData.map(tx => {
          // If transaction is "received", find recipient employee
          // In the database audit logs we wrote: recipientId = targetId, senderEmployeeId = details.senderName
          // In reward.service.ts getTransactions, it parses l.details.hashtag and message.
          // Let's check how getTransactions returns it.
          // It returns: { id, date, description, points, type, message }
          // Wait! The backend getTransactions returns:
          // description: isSender ? `Apresiasi kepada ${l.targetName} (${details.hashtag})` : `Menerima apresiasi dari rekan kerja (${details.hashtag})`
          // Let's see: we can parse descriptions or we can look for specific fields.
          // Wait! In order to get clean sender and recipient names, let's parse description or adapt getTransactions to return details like hashtag, senderName, recipientName, etc.
          // Let's check getTransactions in reward.service.ts:
          // Description contains "${l.targetName}" and details.hashtag.
          // Let's add details.hashtag, details.senderName, details.recipientName etc. to the backend getTransactions output so that we can easily render it in the table!
          return {
            ...tx,
            senderName: tx.type === 'debit' ? 'Saya' : 'Rekan Kerja',
            recipientName: tx.type === 'debit' ? 'Rekan Kerja' : 'Saya',
            hashtag: tx.description.match(/\((#[A-Za-z0-9_]+)\)/)?.[1] || '#General',
          };
        });

        setTransactions(enriched);
        setDepartments(deptsData);
      } catch (err) {
        console.error('Failed to load hashtag reports:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filter calculations
  const filtered = transactions.filter((tx) => {
    // Only appreciation points, skip claim penukaran
    if (tx.description.includes('Penukaran') || tx.description.includes('Penukaran hadiah')) return false;

    const matchHashtag = filterHashtag === '' || tx.hashtag.toLowerCase() === filterHashtag.toLowerCase();
    
    const txDate = new Date(tx.date);
    const rangeStart = filterStart ? new Date(filterStart) : null;
    const rangeEnd = filterEnd ? new Date(filterEnd) : null;

    let matchDate = true;
    if (rangeStart && txDate < rangeStart) matchDate = false;
    if (rangeEnd && txDate > rangeEnd) matchDate = false;

    return matchHashtag && matchDate;
  });

  const totalPointsGiven = filtered.reduce((sum, tx) => sum + tx.points, 0);

  // Top Hashtag calculations
  const htCounts: Record<string, number> = {};
  filtered.forEach((tx) => {
    if (tx.hashtag) {
      htCounts[tx.hashtag] = (htCounts[tx.hashtag] || 0) + 1;
    }
  });

  let topHt = '-';
  let maxHtCount = 0;
  Object.keys(htCounts).forEach((tag) => {
    if (htCounts[tag] > maxHtCount) {
      maxHtCount = htCounts[tag];
      topHt = tag;
    }
  });

  // Top Receiver calculations
  const receiverCounts: Record<string, number> = {};
  filtered.forEach((tx) => {
    // Receiver is recipient name
    const name = tx.recipientName;
    receiverCounts[name] = (receiverCounts[name] || 0) + tx.points;
  });

  let topReceiver = '-';
  let maxReceiverPoints = 0;
  Object.keys(receiverCounts).forEach((name) => {
    if (receiverCounts[name] > maxReceiverPoints) {
      maxReceiverPoints = receiverCounts[name];
      topReceiver = name;
    }
  });

  // Prepare chart data
  const hashtagChartData = Object.keys(htCounts)
    .map((tag) => ({ name: tag, count: htCounts[tag] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const receiverChartData = Object.keys(receiverCounts)
    .map((name) => ({ name, points: receiverCounts[name] }))
    .sort((a, b) => b.points - a.points)
    .slice(0, 10);

  const hashtags = [
    '#Collab',
    '#Integrity',
    '#Innovation',
    '#Professional',
    '#Respect',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none animate-fade-in">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Laporan Poin & Nilai Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">Lacak visualisasi penerapan nilai perusahaan (#hashtags) dan pemberian poin apresiasi karyawan.</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 select-none">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Mulai</label>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Selesai</label>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Departemen</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Hashtag</label>
          <select
            value={filterHashtag}
            onChange={(e) => setFilterHashtag(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
          >
            <option value="">Semua Hashtag</option>
            {hashtags.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
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
            <h3 className="text-xl font-bold text-slate-800 mt-1 truncate max-w-[180px]" title={topReceiver}>
              {topReceiver}
            </h3>
          </div>
        </div>
      </div>

      {/* Charts */}
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

      {/* Detail Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 select-none">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Detail Pembagian Poin Karyawan</h2>
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-slate-400">Tidak ada transaksi poin cocok.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                  <th className="px-6 py-3.5 uppercase tracking-wider">Pemberi</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Penerima</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Nilai Poin</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Hashtag</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Pesan Apresiasi</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-800">{row.senderName}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{row.recipientName}</td>
                    <td className="px-6 py-3.5 font-bold text-primary font-mono">+{row.points} Pts</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-650">{row.hashtag}</td>
                    <td className="px-6 py-3.5 text-slate-500 max-w-sm truncate" title={row.message}>{row.message}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-400">{formatDate(row.date)}</td>
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
