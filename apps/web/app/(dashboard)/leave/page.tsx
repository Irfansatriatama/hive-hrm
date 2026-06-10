'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';

export default function LeavePage() {
  const { t } = useI18n();
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBalances() {
      try {
        const data = await fetchAPI('/leave/balances');
        setBalances(data);
      } catch (err) {
        console.error('Failed to load leave balances:', err);
      } finally {
        setLoading(false);
      }
    }
    loadBalances();
  }, []);

  const totalQuota = balances.reduce((sum, b) => sum + b.quota, 0);
  const totalUsed = balances.reduce((sum, b) => sum + b.used, 0);
  const totalRemaining = balances.reduce((sum, b) => sum + b.remaining, 0);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('leave')}</h1>
          <p className="text-xs text-slate-400 mt-1">Ajukan cuti tahunan, cuti sakit, dan pantau riwayat perizinan Anda.</p>
        </div>
        <Link
          href="/leave/apply"
          className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition select-none"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          <span>Ajukan Cuti Baru</span>
        </Link>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex justify-center py-10 select-none">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Lucide.CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kuota Cuti Tahunan</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{totalQuota} Hari</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
              <Lucide.CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cuti Telah Diambil</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{totalUsed} Hari</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Lucide.CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-bold">Sisa Saldo Cuti</p>
              <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{totalRemaining} Hari</h3>
            </div>
          </div>
        </div>
      )}

      {/* Quotas list */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none">Detail Saldo Per Tipe Cuti</h3>
          <div className="space-y-3">
            {loading ? (
              <p className="text-xs text-slate-400">{t('loading')}</p>
            ) : (
              balances.map((b: any) => (
                <div key={b.id} className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <h4 className="font-bold text-slate-700">{b.name}</h4>
                    <p className="text-[9px] text-slate-400 mt-0.5">Maksimum {b.quota} Hari</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800 font-mono">{b.remaining} Hari Tersisa</p>
                    <p className="text-[9px] text-slate-405 font-mono mt-0.5">Digunakan: {b.used} Hari</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Shortcuts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between gap-6">
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none">Navigasi Modul</h3>
            <p className="text-xs text-slate-400">Pilih menu di bawah ini untuk melihat jadwal cuti global atau rekap log cuti.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 select-none">
            <Link
              href="/leave/summary"
              className="p-4 bg-slate-50 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
            >
              <Lucide.History className="w-6 h-6 text-slate-500 group-hover:text-primary transition" />
              <span className="text-xs font-bold text-slate-750">Rekap Cuti Saya</span>
            </Link>
            <Link
              href="/leave/calendar"
              className="p-4 bg-slate-50 border border-slate-200 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition flex flex-col items-center justify-center text-center gap-2 group cursor-pointer"
            >
              <Lucide.Calendar className="w-6 h-6 text-slate-500 group-hover:text-primary transition" />
              <span className="text-xs font-bold text-slate-750">Kalender Cuti</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
