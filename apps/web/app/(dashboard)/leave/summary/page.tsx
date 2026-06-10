'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import TableActionMenu from '@/components/shared/TableActionMenu';
import { usePermission, isHRRole } from '@/hooks/usePermission';

export default function LeaveSummaryPage() {
  const { t } = useI18n();
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const { userRole, isLoading: authLoading } = usePermission();
  const [loading, setLoading] = useState(true);

  // Filter States
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  const [filterStart, setFilterStart] = useState(ninetyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(thirtyDaysAhead);
  const [filterDept, setFilterDept] = useState('');
  const [filterEmp, setFilterEmp] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const isHR = isHRRole(userRole);

  const loadData = async () => {
    setLoading(true);
    try {
      const [types, depts, emps] = await Promise.all([
        fetchAPI<any[]>('/leave/types'),
        isHRRole(userRole) ? fetchAPI<any[]>('/employees/departments') : Promise.resolve([]),
        isHRRole(userRole) ? fetchAPI<any[]>('/employees') : Promise.resolve([]),
      ]);

      setLeaveTypes(types);
      setDepartments(depts);
      setEmployees(emps);

      const endpoint = isHRRole(userRole)
        ? '/leave/requests'
        : '/leave/requests/my';
        
      const reqsData = await fetchAPI<any[]>(endpoint);
      setRequests(reqsData);
    } catch (err) {
      console.error('Failed to load leave summary records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadData();
    }
  }, [authLoading, userRole]);

  const handleCancel = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengajuan cuti pending ini?')) return;
    try {
      await fetchAPI(`/leave/requests/${id}`, {
        method: 'DELETE',
      });
      alert('Pengajuan berhasil dibatalkan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pengajuan');
    }
  };

  // Filter calculation logic
  const filtered = requests.filter((r) => {
    const matchDept = filterDept === '' || r.employee?.departmentId === filterDept;
    const matchEmp = filterEmp === '' || r.employeeId === filterEmp;
    const matchType = filterType === '' || r.leaveTypeId === filterType;
    const matchStatus = filterStatus === '' || r.status.toLowerCase() === filterStatus.toLowerCase();

    const rowStart = new Date(r.startDate);
    const rangeStart = filterStart ? new Date(filterStart) : null;
    const rangeEnd = filterEnd ? new Date(filterEnd) : null;

    let matchDate = true;
    if (rangeStart && rowStart < rangeStart) matchDate = false;
    if (rangeEnd && rowStart > rangeEnd) matchDate = false;

    return matchDept && matchEmp && matchType && matchStatus && matchDate;
  });

  const totalRequests = filtered.length;
  const totalApproved = filtered.filter(l => l.status === 'APPROVED').length;
  const totalRejected = filtered.filter(l => l.status === 'REJECTED').length;
  const totalPending = filtered.filter(l => l.status === 'PENDING').length;

  const handleExport = () => {
    const csvContent = [
      ['Karyawan', 'Tipe Cuti', 'Mulai', 'Selesai', 'Durasi', 'Status', 'Alasan'],
      ...filtered.map(r => [
        r.employee?.fullName || 'Saya',
        r.leaveType?.name || '',
        r.startDate.split('T')[0],
        r.endDate.split('T')[0],
        `${r.totalDays} Hari`,
        r.status,
        r.reason || ''
      ])
    ]
      .map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HIVE_Leave_Summary_${filterStart}_to_${filterEnd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rekapitulasi Cuti Karyawan</h1>
          <p className="text-xs text-slate-400 mt-1">Lacak seluruh riwayat pengajuan cuti, status persetujuan, dan ekspor database laporan</p>
        </div>
        <button
          onClick={handleExport}
          className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm bg-white cursor-pointer select-none"
        >
          <Lucide.Download className="w-3.5 h-3.5 text-slate-500" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 select-none">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Mulai</label>
          <input
            type="date"
            value={filterStart}
            onChange={(e) => setFilterStart(e.target.value)}
            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Selesai</label>
          <input
            type="date"
            value={filterEnd}
            onChange={(e) => setFilterEnd(e.target.value)}
            className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Departemen</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            disabled={!isHR}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Karyawan</label>
          <select
            value={filterEmp}
            onChange={(e) => setFilterEmp(e.target.value)}
            disabled={!isHR}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">Semua Karyawan</option>
            {employees.map((e) => (
              <option key={e.id} value={e.id}>{e.fullName}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Tipe Cuti</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Semua Tipe Cuti</option>
            {leaveTypes.map((lt) => (
              <option key={lt.id} value={lt.id}>{lt.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 select-none">
        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lucide.FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total Pengajuan</p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">{totalRequests} <span className="text-[10px] text-slate-400 font-normal">Kali</span></h4>
          </div>
        </div>
        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Lucide.CheckCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Disetujui</p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">{totalApproved} <span className="text-[10px] text-slate-400 font-normal">Kali</span></h4>
          </div>
        </div>
        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
            <Lucide.XCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Ditolak</p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">{totalRejected} <span className="text-[10px] text-slate-400 font-normal">Kali</span></h4>
          </div>
        </div>
        <div className="bg-white p-4.5 rounded-xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lucide.Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Menunggu</p>
            <h4 className="text-lg font-bold text-slate-800 mt-0.5 font-mono">{totalPending} <span className="text-[10px] text-slate-400 font-normal">Antrian</span></h4>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 select-none">
              <Lucide.History className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Data Cuti</h3>
              <p className="text-xs text-slate-400 mt-1">Belum ada pengajuan cuti yang cocok dengan filter aktif.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                  <th className="px-6 py-3.5 uppercase tracking-wider">Nama Karyawan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Tipe Cuti</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Mulai</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Selesai</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Durasi</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Alasan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-800">
                      {row.employee?.fullName || 'Saya'}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-650">
                      {row.leaveType?.name || row.leaveTypeId}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {formatDate(row.startDate)}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">
                      {formatDate(row.endDate)}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-600 font-mono">
                      {row.totalDays} Hari
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={row.status.toLowerCase()} />
                    </td>
                    <td className="px-6 py-3.5 text-slate-400 max-w-xs truncate" title={row.reason || ''}>
                      {row.reason || '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium">
                      <TableActionMenu
                        items={
                          row.status === 'PENDING' && !isHR
                            ? [{ label: 'Tarik Kembali', onClick: () => handleCancel(row.id), variant: 'danger' }]
                            : []
                        }
                      />
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
