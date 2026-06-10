'use5client';
'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';

export default function LeaveBalancePage() {
  const { t } = useI18n();
  const [balances, setBalances] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');
  
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState(2026);
  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState('');

  // Adjustment Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBalance, setActiveBalance] = useState<any>(null);
  const [adjQuota, setAdjQuota] = useState<number>(0);
  const [adjUsed, setAdjUsed] = useState<number>(0);
  const [adjReason, setAdjReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadBalancesAndFilters = async () => {
    setLoading(true);
    try {
      const me = await fetchAPI('/auth/me');
      setUserRole(me?.role || 'EMPLOYEE');

      const [balsData, deptsData, typesData] = await Promise.all([
        fetchAPI<any[]>('/leave/balances/all'),
        fetchAPI<any[]>('/employees/departments'),
        fetchAPI<any[]>('/leave/types')
      ]);

      setBalances(balsData);
      setDepartments(deptsData);
      setLeaveTypes(typesData);
    } catch (err) {
      console.error('Failed to load leave balances page:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBalancesAndFilters();
  }, []);

  const getFilteredData = () => {
    return balances.filter((b) => {
      const matchYear = b.year === filterYear;
      const matchDept = filterDept === '' || b.department_id === filterDept;
      const matchType = filterType === '' || b.leave_type_id === filterType;
      return matchYear && matchDept && matchType;
    });
  };

  const filtered = getFilteredData();

  const openAdjustModal = (bal: any) => {
    setActiveBalance(bal);
    setAdjQuota(bal.quota);
    setAdjUsed(bal.used);
    setAdjReason('');
    setIsModalOpen(true);
  };

  const saveAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBalance || !adjReason.trim() || saving) return;

    setSaving(true);
    try {
      await fetchAPI('/leave/balances/adjust', {
        method: 'POST',
        body: JSON.stringify({
          employeeId: activeBalance.employee_id,
          leaveTypeId: activeBalance.leave_type_id,
          quota: adjQuota,
          used: adjUsed,
          reason: adjReason,
        }),
      });

      alert('Saldo cuti berhasil disesuaikan secara manual!');
      setIsModalOpen(false);
      loadBalancesAndFilters();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah saldo cuti');
    } finally {
      setSaving(false);
    }
  };

  const triggerYearEndReset = async () => {
    if (!confirm(`PERINGATAN: Aksi ini akan mengatur ulang seluruh hari cuti terpakai (Used) menjadi 0, menyalin sisa saldo, dan menaikkan tahun buku menjadi ${filterYear + 1}. Apakah Anda yakin ingin melanjutkan?`)) {
      return;
    }
    
    setLoading(true);
    try {
      // For each filtered balance, trigger a reset
      const promises = filtered.map(b => 
        fetchAPI('/leave/balances/adjust', {
          method: 'POST',
          body: JSON.stringify({
            employeeId: b.employee_id,
            leaveTypeId: b.leave_type_id,
            quota: b.quota,
            used: 0,
            reason: 'Tutup buku akhir tahun / Year-end reset',
          })
        })
      );
      await Promise.all(promises);
      
      alert(`Tutup buku berhasil! Tahun saldo saat ini: ${filterYear + 1}`);
      setFilterYear(prev => prev + 1);
      loadBalancesAndFilters();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan reset akhir tahun');
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Nama Karyawan', 'Tipe Cuti', 'Jatah Kuota', 'Digunakan', 'Sisa Saldo', 'Tahun'],
      ...filtered.map(b => [
        b.employee_name,
        b.leave_type_name,
        b.quota === 99 || b.quota === 365 ? 'Tanpa Batas' : `${b.quota} Hari`,
        `${b.used} Hari`,
        b.quota === 99 || b.quota === 365 ? 'Unlimited' : `${b.remaining} Hari`,
        b.year
      ])
    ]
      .map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HIVE_Leave_Balances_${filterYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  if (!isHR && !loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Akses Ditolak</h3>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin dan Super Admin yang dapat mengakses dashboard manajemen saldo cuti.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kelola Saldo Cuti Karyawan</h1>
          <p className="text-xs text-slate-400 mt-1">Sesuaikan saldo kuota cuti karyawan secara manual dan kelola tutup buku akhir tahun</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={triggerYearEndReset}
            className="px-3 py-2 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
          >
            <Lucide.RefreshCw className="w-3.5 h-3.5 text-red-500" />
            <span>Reset Saldo Akhir Tahun</span>
          </button>
          
          <button
            onClick={exportData}
            className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm bg-white cursor-pointer"
          >
            <Lucide.Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4 select-none">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tahun</label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(parseInt(e.target.value))}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Departemen</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tipe Cuti</label>
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
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400 select-none">
              <Lucide.Inbox className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Data Saldo Cuti</h3>
              <p className="text-xs text-slate-400 mt-1">Gunakan filter di atas untuk menampilkan data saldo cuti karyawan.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                  <th className="px-6 py-3.5 uppercase tracking-wider">Nama Karyawan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Departemen</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Tipe Cuti</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Jatah Kuota</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Digunakan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Sisa Saldo</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Tahun</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filtered.map((row) => {
                  const isUnlimited = row.quota >= 99;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-800">{row.employee_name}</td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {departments.find((d) => d.id === row.department_id)?.name || '-'}
                      </td>
                      <td className="px-6 py-3.5 font-semibold text-slate-600">{row.leave_type_name}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-700 font-mono">
                        {isUnlimited ? 'Tanpa Batas' : `${row.quota} Hari`}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{row.used} Hari</td>
                      <td className="px-6 py-3.5 font-bold text-primary font-mono">
                        {isUnlimited ? 'Unlimited' : `${row.remaining} Hari`}
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-400">{row.year}</td>
                      <td className="px-6 py-3.5 text-right font-medium">
                        <button
                          onClick={() => openAdjustModal(row)}
                          className="text-primary hover:underline text-xs font-bold cursor-pointer"
                        >
                          Edit Saldo
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Adjust Balance Dialog */}
      {isModalOpen && activeBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Sesuaikan Saldo: {activeBalance.employee_name}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            </div>
            
            <form onSubmit={saveAdjustment}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Jatah Tahunan (Hari)
                    </label>
                    <input
                      type="number"
                      value={adjQuota}
                      onChange={(e) => setAdjQuota(parseInt(e.target.value) || 0)}
                      required
                      min={0}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Telah Digunakan (Hari)
                    </label>
                    <input
                      type="number"
                      value={adjUsed}
                      onChange={(e) => setAdjUsed(parseInt(e.target.value) || 0)}
                      required
                      min={0}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Alasan Penyesuaian Saldo
                  </label>
                  <textarea
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value)}
                    required
                    placeholder="Contoh: Penyesuaian jatah onboarding tengah tahun, cuti ekstra reward..."
                    rows={2}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition resize-none"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !adjReason.trim()}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
