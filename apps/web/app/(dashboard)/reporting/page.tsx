'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { BarChart, DonutChart } from '@/components/shared/ChartWrapper';

export default function ReportingPage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [procReport, setProcReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const canView =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'HR_ADMIN' ||
    user?.role === 'MANAGER' ||
    user?.role === 'FINANCE';

  useEffect(() => {
    if (!canView) return;
    async function load() {
      setLoading(true);
      try {
        const [dash, proc] = await Promise.all([
          fetchAPI('/employees/dashboard-stats'),
          user?.role === 'FINANCE' || user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN'
            ? fetchAPI('/procurement/report').catch(() => null)
            : Promise.resolve(null),
        ]);
        setDashboard(dash);
        setProcReport(proc);
      } catch (err) {
        console.error('Failed to load reporting data:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [canView, user?.role]);

  if (!canView) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Pusat laporan hanya untuk Admin, Manager, dan Finance.</p>
      </div>
    );
  }

  const reportLinks = [
    { href: '/attendance/report', icon: Lucide.Clock, title: 'Laporan Kehadiran', desc: 'Rekap absensi karyawan' },
    { href: '/leave/summary', icon: Lucide.Calendar, title: 'Laporan Cuti', desc: 'Ringkasan pengajuan cuti' },
    { href: '/procurement/report', icon: Lucide.ShoppingCart, title: 'Laporan Procurement', desc: 'Anggaran dan PO' },
    { href: '/reward/hashtag', icon: Lucide.Award, title: 'Laporan Reward', desc: 'Analitik apresiasi poin' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pusat Laporan</h1>
        <p className="text-xs text-slate-400 mt-1">Akses cepat ke seluruh laporan dan analitik HR perusahaan.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Karyawan Aktif</span>
              <p className="text-xl font-bold text-slate-800 font-mono mt-1">{dashboard?.totalActive || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hadir Hari Ini</span>
              <p className="text-xl font-bold text-green-600 font-mono mt-1">{dashboard?.presentTodayCount || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sedang Cuti</span>
              <p className="text-xl font-bold text-purple-600 font-mono mt-1">{dashboard?.onLeaveCount || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Approval Pending</span>
              <p className="text-xl font-bold text-amber-600 font-mono mt-1">{dashboard?.pendingApprovalsCount || 0}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dashboard?.deptDistribution && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Distribusi Departemen</h3>
                <DonutChart labels={dashboard.deptDistribution.labels} data={dashboard.deptDistribution.counts} />
              </div>
            )}
            {dashboard?.attendanceTrend && (
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Tren Kehadiran 7 Hari</h3>
                <BarChart
                  labels={dashboard.attendanceTrend.labels}
                  datasets={[{ label: 'Kehadiran', data: dashboard.attendanceTrend.counts }]}
                  height={220}
                />
              </div>
            )}
          </div>

          {procReport && (
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Ringkasan Procurement</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">PO Disetujui</span>
                  <p className="text-sm font-bold text-green-600 font-mono">{procReport.approvedCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">PO Pending</span>
                  <p className="text-sm font-bold text-amber-600 font-mono">{procReport.pendingCount}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Budget Approved</span>
                  <p className="text-sm font-bold text-primary font-mono">{formatRupiah(procReport.totalApprovedBudget)}</p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Budget Pending</span>
                  <p className="text-sm font-bold text-slate-600 font-mono">{formatRupiah(procReport.totalPendingBudget)}</p>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {reportLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition">
                  <item.icon className="w-5 h-5" />
                </div>
                <h3 className="text-xs font-bold text-slate-800">{item.title}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{item.desc}</p>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
