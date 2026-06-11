'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import { BarChart, DonutChart } from '@/components/shared/ChartWrapper';
import { formatDate } from '@/lib/utils';

interface DashboardData {
  totalActive: number;
  presentTodayCount: number;
  presentPercentage: number;
  pendingApprovalsCount: number;
  onLeaveCount: number;
  pendingApprovals: {
    requester_name: string;
    type: string;
    date_submitted: string;
    status: string;
  }[];
  birthdays: {
    employee_id: string;
    full_name: string;
    birth_date: string | null;
  }[];
  announcements: {
    id: string;
    title: string;
    content: string;
    pinned: boolean;
    author: string;
    publish_date: string;
  }[];
  deptDistribution: {
    labels: string[];
    counts: number[];
  };
  attendanceTrend: {
    labels: string[];
    counts: number[];
  };
}

export default function DashboardPage() {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch metrics from NestJS backend
  useEffect(() => {
    async function loadStats() {
      try {
        const stats = await fetchAPI<DashboardData>('/employees/dashboard-stats');
        setData(stats);
      } catch (err: any) {
        console.error('Failed to load dashboard metrics:', err);
        setError(err.message || 'Failed to fetch metrics from backend');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  // Greeting logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return t('greeting_morning');
    if (hour >= 12 && hour < 15) return t('greeting_noon');
    if (hour >= 15 && hour < 18) return t('greeting_afternoon');
    return t('greeting_evening');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Gagal Memuat Dasbor</h2>
        <p className="text-xs text-slate-500 mt-2">{error || 'Tidak dapat terhubung ke server backend API.'}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow hover:bg-primary-dark transition cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Greeting Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-xl font-bold text-slate-900 leading-tight">
            {getGreeting()}, {user?.name || 'Rekan'}
          </h1>
          <p className="text-xs text-slate-550 mt-1">
            PT. Nusantara Digital Inovasi &bull; {lang === 'id' ? 'Transformasi Digital untuk Indonesia' : 'Digital Transformation for Indonesia'}
          </p>
        </div>
        <div className="text-left md:text-right shrink-0">
          <p className="text-xs font-bold text-slate-700">{formatDate(new Date())}</p>
          <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-1">
            {lang === 'id' ? 'Hari Kerja Standar (08:00 - 17:00)' : 'Standard Working Hours (08:00 - 17:00)'}
          </p>
        </div>
      </div>

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Employees */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lucide.Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Karyawan Aktif' : 'Active Employees'}
            </p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{data.totalActive}</h3>
          </div>
        </div>

        {/* Present Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-11 h-11 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Lucide.CheckCircle className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Kehadiran Hari Ini' : 'Attendance Today'}
            </p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">
              {data.presentPercentage}%{' '}
              <span className="text-[10px] text-slate-400 font-normal">
                ({data.presentTodayCount}/{data.totalActive})
              </span>
            </h3>
          </div>
        </div>

        {/* Action Pending */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lucide.Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Approval Pending' : 'Pending Approvals'}
            </p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{data.pendingApprovalsCount}</h3>
          </div>
        </div>

        {/* On Leave Today */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Lucide.CalendarOff className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {lang === 'id' ? 'Cuti Hari Ini' : 'On Leave Today'}
            </p>
            <h3 className="text-xl font-bold text-slate-800 mt-1 font-mono">{data.onLeaveCount}</h3>
          </div>
        </div>
      </div>

      {/* Visual Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Attendance Trend Bar Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'id' ? 'Tren Kehadiran 5 Hari Kerja Terakhir' : 'Attendance Trend Last 5 Workdays'}
            </h2>
            <span className="text-[10px] text-slate-400 font-bold font-mono">
              {data.attendanceTrend.labels[0]} - {data.attendanceTrend.labels[data.attendanceTrend.labels.length - 1]}
            </span>
          </div>
          <div className="h-80 w-full">
            <BarChart
              labels={data.attendanceTrend.labels}
              datasets={[
                {
                  label: lang === 'id' ? 'Karyawan Hadir' : 'Employees Present',
                  data: data.attendanceTrend.counts,
                },
              ]}
              height={300}
            />
          </div>
        </div>

        {/* Dept Distribution Donut Chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-4 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            {lang === 'id' ? 'Distribusi Departemen' : 'Department Distribution'}
          </h2>
          <div className="h-80 w-full flex items-center justify-center">
            {data.deptDistribution.labels.length > 0 ? (
              <DonutChart
                labels={data.deptDistribution.labels}
                data={data.deptDistribution.counts}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400">{t('no_data')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Detailed Actionable Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Pending Approvals Table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-8 overflow-hidden flex flex-col">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'id' ? 'Persetujuan Menunggu Tindakan' : 'Approvals Requiring Action'}
            </h2>
            <Link href="/approval" className="text-xs text-primary font-bold hover:underline">
              {lang === 'id' ? 'Lihat Semua' : 'View All'}
            </Link>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'id' ? 'Karyawan' : 'Employee'}
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Tipe
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {lang === 'id' ? 'Diajukan' : 'Submitted'}
                  </th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {data.pendingApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-450 select-none">
                      {lang === 'id' ? 'Tidak ada pengajuan pending menunggu approval' : 'No pending approvals awaiting action'}
                    </td>
                  </tr>
                ) : (
                  data.pendingApprovals.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-700">{item.requester_name}</td>
                      <td className="px-6 py-3.5 text-slate-550 capitalize">{item.type}</td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono">{formatDate(item.date_submitted)}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Badge status={item.status} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Columns: Announcements & Birthdays */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Announcements */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {lang === 'id' ? 'Pengumuman Terbaru' : 'Recent Announcements'}
              </h2>
              <Link href="/announcement" className="text-xs text-primary font-bold hover:underline">
                {lang === 'id' ? 'Semua' : 'All'}
              </Link>
            </div>
            <div className="space-y-3">
              {data.announcements.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">{lang === 'id' ? 'Belum ada pengumuman' : 'No announcements available'}</p>
              ) : (
                data.announcements.map(ann => (
                  <Link
                    key={ann.id}
                    href="/announcement"
                    className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100/70 border border-slate-100/50 transition flex flex-col gap-1.5 cursor-pointer block"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 truncate leading-snug">
                        {ann.title}
                      </span>
                      {ann.pinned && (
                        <span className="bg-red-50 text-red-600 text-[8px] font-bold px-1.5 py-0.5 rounded uppercase border border-red-100 shrink-0">
                          Penting
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">
                      {ann.content}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-dashed border-slate-200 mt-1">
                      <span>Oleh: {ann.author}</span>
                      <span className="font-mono">{formatDate(ann.publish_date)}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Birthdays */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              {lang === 'id' ? 'Ulang Tahun Bulan Ini' : 'Birthdays This Month'}
            </h2>
            <div className="space-y-2.5">
              {data.birthdays.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  {lang === 'id' ? 'Tidak ada ulang tahun bulan ini' : 'No birthdays this month'}
                </p>
              ) : (
                data.birthdays.map(emp => (
                  <div key={emp.employee_id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition">
                    <Avatar name={emp.full_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{emp.full_name}</p>
                      <p className="text-[9px] text-slate-400 truncate">
                        {emp.employee_id} &bull; {emp.birth_date ? formatDate(emp.birth_date, { day: 'numeric', month: 'long' }) : '-'}
                      </p>
                    </div>
                    <Lucide.Cake className="w-4 h-4 text-pink-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">{lang === 'id' ? 'Aksi Cepat' : 'Quick Actions'}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            href="/employee"
            className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
              <Lucide.UserPlus className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'id' ? 'Tambah Karyawan' : 'Add Employee'}
            </span>
          </Link>
          <Link
            href="/attendance"
            className="p-3 bg-slate-50 hover:bg-green-50 border border-slate-200 hover:border-green-200 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center shrink-0 group-hover:bg-green-600 group-hover:text-white transition">
              <Lucide.CalendarCheck className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'id' ? 'Absensi Hari Ini' : 'Check In Today'}
            </span>
          </Link>
          <Link
            href="/announcement"
            className="p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-200 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-600 group-hover:text-white transition">
              <Lucide.Megaphone className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'id' ? 'Buat Pengumuman' : 'Announce Info'}
            </span>
          </Link>
          <Link
            href="/reporting"
            className="p-3 bg-slate-50 hover:bg-cyan-50 border border-slate-200 hover:border-cyan-200 rounded-xl transition flex items-center gap-3 group"
          >
            <div className="w-8 h-8 rounded-lg bg-cyan-100 text-cyan-600 flex items-center justify-center shrink-0 group-hover:bg-cyan-600 group-hover:text-white transition">
              <Lucide.FileText className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-slate-700">
              {lang === 'id' ? 'Lihat Laporan' : 'View Reports'}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
