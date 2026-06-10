'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import DataTable from '@/components/shared/DataTable';
import Pagination from '@/components/shared/Pagination';

export default function AttendanceReportPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const itemsPerPage = 10;

  const loadReport = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(
        `/attendance/report?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
          search
        )}&startDate=${startDate}&endDate=${endDate}`
      );
      setLogs(data.logs);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load attendance report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN') {
      loadReport();
    }
  }, [currentPage, search, startDate, endDate, user]);

  const handleExportCSV = () => {
    const headers = ['Nama Karyawan', 'ID Karyawan', 'Tanggal', 'Jam Masuk', 'Jam Keluar', 'Jam Kerja', 'Status'];
    const csvRows = [headers.join(',')];
    
    logs.forEach(log => {
      const checkInStr = log.checkIn ? new Date(log.checkIn).toLocaleTimeString('id-ID') : '-';
      const checkOutStr = log.checkOut ? new Date(log.checkOut).toLocaleTimeString('id-ID') : '-';
      const row = [
        `"${log.employee.fullName}"`,
        log.employeeId,
        new Date(log.date).toISOString().split('T')[0],
        checkInStr,
        checkOutStr,
        log.workHours || 0,
        log.status,
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  // If user is regular employee, block view
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-450 mt-1">Anda tidak memiliki izin untuk melihat laporan kehadiran global.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Laporan Kehadiran</h1>
          <p className="text-xs text-slate-400 mt-1">Pantau dan verifikasi log kehadiran seluruh staf perusahaan.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
        >
          <Lucide.Download className="w-3.5 h-3.5" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 pointer-events-none">
            <Lucide.Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari karyawan..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
          />
        </div>

        {/* Date start */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 select-none">Mulai</span>
          <input
            type="date"
            value={startDate}
            onChange={e => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
          />
        </div>

        {/* Date end */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 select-none">Akhir</span>
          <input
            type="date"
            value={endDate}
            onChange={e => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
          />
        </div>
      </div>

      {/* Main logs table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center flex-1 py-20 select-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-semibold">{t('loading')}</span>
            </div>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center flex-1 py-20 select-none text-slate-450 text-xs">
            Tidak ada laporan log kehadiran cocok
          </div>
        ) : (
          <div className="overflow-x-auto flex-1">
            <DataTable
              headers={['Karyawan', 'Tanggal', 'Check In', 'Check Out', 'Jam Kerja', 'Lokasi', 'Status']}
              rows={logs}
              columns={[
                (row: any) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={row.employee.fullName} size="sm" />
                    <div>
                      <p className="font-bold text-slate-800">{row.employee.fullName}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.employeeId}</p>
                    </div>
                  </div>
                ),
                (row: any) =>
                  new Date(row.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }),
                (row: any) =>
                  row.checkIn
                    ? new Date(row.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '--:--',
                (row: any) =>
                  row.checkOut
                    ? new Date(row.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '--:--',
                (row: any) => (row.workHours ? `${row.workHours} Jam` : '-'),
                (row: any) => row.location || 'Head Office',
                (row: any) => <Badge status={row.status.toLowerCase()} />,
              ]}
            />
          </div>
        )}

        {total > itemsPerPage && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              totalItems={total}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
