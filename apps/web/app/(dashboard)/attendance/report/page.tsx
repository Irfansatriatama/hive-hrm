'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { isHRRole, usePermission } from '@/hooks/usePermission';

const STATUS_OPTIONS = [
  { value: '', label: 'Semua Status' },
  { value: 'On Time', label: 'On Time' },
  { value: 'Late', label: 'Late / Terlambat' },
  { value: 'Absent', label: 'Absent / Alpa' },
  { value: 'Leave', label: 'Cuti / Libur' },
];

const BULK_STATUS_OPTIONS = [
  { value: 'On Time', label: 'Set On Time' },
  { value: 'Late', label: 'Set Late / Terlambat' },
  { value: 'Absent', label: 'Set Absent / Alpa' },
  { value: 'Leave', label: 'Set Leave / Cuti' },
];

function normalizeStatus(status: string): string {
  const map: Record<string, string> = {
    hadir: 'On Time',
    'on time': 'On Time',
    on_time: 'On Time',
    late: 'Late',
    terlambat: 'Late',
    absent: 'Absent',
    alpha: 'Absent',
    leave: 'Leave',
    cuti: 'Leave',
  };
  return map[status?.toLowerCase()] || status;
}

function formatTime(iso?: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(row: any): string {
  if (row.workHours) {
    const hrs = Math.floor(row.workHours);
    const mins = Math.round((row.workHours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  }
  if (row.checkIn && row.checkOut) {
    const diff = (new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime()) / (1000 * 60);
    const hrs = Math.floor(diff / 60);
    const mins = Math.round(diff % 60);
    return `${hrs}h ${mins}m`;
  }
  return '-';
}

export default function AttendanceReportPage() {
  const { t } = useI18n();
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [logs, setLogs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkStatus, setBulkStatus] = useState('On Time');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const [filterDept, setFilterDept] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [filterStart, setFilterStart] = useState(thirtyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(today);
  const [filterStatus, setFilterStatus] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportData, depts, empsRes] = await Promise.all([
        fetchAPI<any[]>('/attendance/report'),
        fetchAPI<any[]>('/employees/departments'),
        fetchAPI<{ employees: any[] }>('/employees?limit=1000'),
      ]);
      setLogs(reportData);
      setDepartments(depts);
      setEmployees(empsRes.employees || []);
    } catch (err) {
      console.error('Failed to load attendance report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isHR) {
      loadData();
    }
  }, [authLoading, isHR]);

  const filtered = logs.filter((row) => {
    const matchDept = filterDept === '' || row.employee?.departmentId === filterDept;
    const matchEmp = filterEmp === '' || row.employeeId === filterEmp;
    const matchStatus =
      filterStatus === '' || normalizeStatus(row.status) === normalizeStatus(filterStatus);

    const rowDate = new Date(row.date);
    const startDate = filterStart ? new Date(filterStart) : null;
    const endDate = filterEnd ? new Date(filterEnd) : null;

    let matchDate = true;
    if (startDate && rowDate < startDate) matchDate = false;
    if (endDate) {
      const end = new Date(filterEnd);
      end.setHours(23, 59, 59, 999);
      if (rowDate > end) matchDate = false;
    }

    return matchDept && matchEmp && matchStatus && matchDate;
  });

  const totalPresent = filtered.filter(
    (a) => ['On Time', 'Late'].includes(normalizeStatus(a.status))
  ).length;
  const totalLate = filtered.filter((a) => normalizeStatus(a.status) === 'Late').length;
  const totalAbsent = filtered.filter((a) => normalizeStatus(a.status) === 'Absent').length;

  let totalMins = 0;
  let countedMins = 0;
  filtered.forEach((a) => {
    if (a.checkIn && a.checkOut) {
      const mins =
        (new Date(a.checkOut).getTime() - new Date(a.checkIn).getTime()) / (1000 * 60);
      if (mins > 0) {
        totalMins += mins;
        countedMins++;
      }
    }
  });
  const avgHrs = countedMins > 0 ? (totalMins / countedMins / 60).toFixed(1) : '0.0';

  const clearSelection = () => setSelectedIds([]);

  const handleFilterChange = () => {
    clearSelection();
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filtered.map((r) => r.id));
    } else {
      clearSelection();
    }
  };

  const applyBulkStatus = async () => {
    if (selectedIds.length === 0) return;
    try {
      const result = await fetchAPI<{ count: number }>('/attendance/report/bulk-status', {
        method: 'PUT',
        body: JSON.stringify({ ids: selectedIds, status: bulkStatus }),
      });
      alert(`Ubah status massal berhasil! ${result.count} baris diperbarui.`);
      clearSelection();
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status massal');
    }
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Karyawan', 'Departemen', 'Tanggal', 'Masuk', 'Keluar', 'Durasi', 'Status', 'Keterangan'],
      ...filtered.map((a) => [
        a.employee?.fullName || '-',
        a.employee?.department?.name || '-',
        new Date(a.date).toISOString().split('T')[0],
        a.checkIn ? formatTime(a.checkIn) : '',
        a.checkOut ? formatTime(a.checkOut) : '',
        formatDuration(a),
        normalizeStatus(a.status),
        a.notes || '',
      ]),
    ]
      .map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HIVE_Attendance_Report_${filterStart}_to_${filterEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-450 mt-1">
          Anda tidak memiliki izin untuk melihat laporan kehadiran global.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
            Laporan Kehadiran Karyawan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lacak absensi masuk/keluar, keterlambatan, lembur, dan ekspor database logs
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm bg-white cursor-pointer"
        >
          <Lucide.Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
            Departemen
          </label>
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              handleFilterChange();
            }}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
            Karyawan
          </label>
          <select
            value={filterEmp}
            onChange={(e) => {
              setFilterEmp(e.target.value);
              handleFilterChange();
            }}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Semua Karyawan</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.full_name || e.fullName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
            Mulai
          </label>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => {
              setFilterStart(e.target.value);
              handleFilterChange();
            }}
            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
            Selesai
          </label>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => {
              setFilterEnd(e.target.value);
              handleFilterChange();
            }}
            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
            Status
          </label>
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value);
              handleFilterChange();
            }}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Lucide.Check className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Total Hadir
            </p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
              {totalPresent}{' '}
              <span className="text-[10px] text-slate-400 font-normal">Entri</span>
            </h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
            <Lucide.Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Keterlambatan
            </p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
              {totalLate}{' '}
              <span className="text-[10px] text-slate-400 font-normal">Kali</span>
            </h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Lucide.XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Tidak Hadir
            </p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
              {totalAbsent}{' '}
              <span className="text-[10px] text-slate-400 font-normal">Alpa</span>
            </h4>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lucide.Hourglass className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Rata-rata Kerja
            </p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">
              {avgHrs}{' '}
              <span className="text-[10px] text-slate-400 font-normal">Jam/Hari</span>
            </h4>
          </div>
        </div>
      </div>

      {/* Bulk Action bar */}
      {selectedIds.length > 0 && (
        <div className="bg-slate-800 text-white p-4 rounded-xl flex items-center justify-between gap-4 select-none animate-fade-in">
          <span className="text-xs font-semibold">
            <span className="font-mono font-bold text-blue-400">{selectedIds.length}</span> baris
            dipilih
          </span>
          <div className="flex items-center gap-2">
            <select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded bg-slate-700 border border-slate-600 text-white text-xs"
            >
              {BULK_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <button
              onClick={applyBulkStatus}
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark rounded text-xs font-bold transition cursor-pointer"
            >
              Ubah Status
            </button>
            <button
              onClick={clearSelection}
              className="px-2 py-1.5 border border-slate-600 text-slate-300 hover:text-white rounded text-xs transition cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="sr-only">{t('loading')}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="px-6 py-10 text-center text-slate-400 select-none text-xs">
              Tidak ada data absensi cocok.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3.5 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={(e) => toggleSelectAll(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4.5 h-4.5"
                    />
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Karyawan
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Dept
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Durasi
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Keterangan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((row) => (
                  <tr
                    key={row.id}
                    className={`table-row-hover border-b border-slate-100 transition ${
                      selectedIds.includes(row.id) ? 'bg-primary/5' : ''
                    }`}
                  >
                    <td className="px-6 py-3.5" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelectRow(row.id)}
                        className="row-checkbox rounded border-slate-300 text-primary focus:ring-primary w-4.5 h-4.5"
                      />
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {row.employee?.fullName || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">
                      {row.employee?.department?.name || '-'}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {formatDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-700">
                      {formatTime(row.checkIn)}
                    </td>
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-700">
                      {formatTime(row.checkOut)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {formatDuration(row)}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={normalizeStatus(row.status).toLowerCase()} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 truncate max-w-xs">
                      {row.notes || '-'}
                    </td>
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
