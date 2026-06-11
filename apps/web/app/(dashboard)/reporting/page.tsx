'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { useI18n } from '@/lib/i18n';
import { usePermission } from '@/hooks/usePermission';
import DataTable from '@/components/shared/DataTable';
import { BarChart, DonutChart } from '@/components/shared/ChartWrapper';

type ReportTab = 'attendance' | 'leave' | 'payroll' | 'headcount' | 'expense';

interface AttendanceReport {
  byDept: { dept: string; hadir: number; izin: number; alpha: number; telat: number; avgHours: number }[];
  topLate: { id: string; fullName: string; department: string; lateCount: number }[];
}

interface LeaveReport {
  byType: { type: string; totalDays: number }[];
  byDept: { dept: string; totalDays: number }[];
  total: number;
}

interface PayrollReport {
  totalGross: number;
  totalDeduct: number;
  totalNet: number;
  byDept: { dept: string; gross: number; deduct: number; net: number; count: number }[];
  employeeCount: number;
  source: 'period' | 'estimate';
}

interface HeadcountReport {
  byDept: { dept: string; count: number }[];
  byStatus: { status: string; count: number }[];
  byGender: { gender: string; count: number }[];
  joinTrend: { month: string; count: number }[];
  total: number;
}

interface ExpenseReport {
  byCategory: { category: string; totalAmount: number }[];
  totalAmount: number;
  claimCount: number;
}

interface PayrollPeriod {
  id: string;
  name: string;
  month: number;
  year: number;
}

const TABS: { key: ReportTab; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'attendance', icon: Lucide.Clock },
  { key: 'leave', icon: Lucide.Calendar },
  { key: 'payroll', icon: Lucide.Banknote },
  { key: 'headcount', icon: Lucide.Users },
  { key: 'expense', icon: Lucide.Receipt },
];

const MONTHS_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

const MONTHS_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export default function ReportingPage() {
  const { t, lang } = useI18n();
  const { hasAccess, isLoading: authLoading } = usePermission();
  const canView = hasAccess('reporting');

  const now = new Date();
  const [activeTab, setActiveTab] = useState<ReportTab>('attendance');
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [periodId, setPeriodId] = useState('');
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([]);

  const [attendanceData, setAttendanceData] = useState<AttendanceReport | null>(null);
  const [leaveData, setLeaveData] = useState<LeaveReport | null>(null);
  const [payrollData, setPayrollData] = useState<PayrollReport | null>(null);
  const [headcountData, setHeadcountData] = useState<HeadcountReport | null>(null);
  const [expenseData, setExpenseData] = useState<ExpenseReport | null>(null);
  const [loading, setLoading] = useState(true);

  const monthNames = lang === 'en' ? MONTHS_EN : MONTHS_ID;
  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);

  const handleExportCSV = (data: Record<string, string | number>[], filename: string) => {
    if (!data.length) {
      alert('Tidak ada data untuk diekspor');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map((row) => Object.values(row).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename + '.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const loadReport = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      switch (activeTab) {
        case 'attendance': {
          const data = await fetchAPI<AttendanceReport>(
            `/reporting/attendance?month=${month}&year=${year}`,
          );
          setAttendanceData(data);
          break;
        }
        case 'leave': {
          const data = await fetchAPI<LeaveReport>(
            `/reporting/leave?month=${month}&year=${year}`,
          );
          setLeaveData(data);
          break;
        }
        case 'payroll': {
          const params = periodId ? `?periodId=${periodId}` : '';
          const data = await fetchAPI<PayrollReport>(`/reporting/payroll${params}`);
          setPayrollData(data);
          break;
        }
        case 'headcount': {
          const data = await fetchAPI<HeadcountReport>('/reporting/headcount');
          setHeadcountData(data);
          break;
        }
        case 'expense': {
          const data = await fetchAPI<ExpenseReport>(
            `/reporting/expense?month=${month}&year=${year}`,
          );
          setExpenseData(data);
          break;
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  }, [canView, activeTab, month, year, periodId]);

  useEffect(() => {
    if (!authLoading && canView && activeTab === 'payroll') {
      fetchAPI<PayrollPeriod[]>('/payroll/periods')
        .then(setPayrollPeriods)
        .catch(() => setPayrollPeriods([]));
    }
  }, [authLoading, canView, activeTab]);

  useEffect(() => {
    if (!authLoading && canView) {
      loadReport();
    }
  }, [authLoading, canView, loadReport]);

  if (!authLoading && !canView) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">
          Pusat laporan hanya untuk Admin, Manager, dan Finance.
        </p>
      </div>
    );
  }

  const renderStatCard = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-lg font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );

  const renderFilters = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-wrap items-end gap-4">
      {activeTab !== 'headcount' && (
        <>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Bulan
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(parseInt(e.target.value, 10))}
              className="block px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
            >
              {monthNames.map((name, idx) => (
                <option key={idx} value={idx + 1}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Tahun
            </label>
            <select
              value={year}
              onChange={(e) => setYear(parseInt(e.target.value, 10))}
              className="block px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
            >
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </>
      )}
      {activeTab === 'payroll' && (
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Periode Gaji
          </label>
          <select
            value={periodId}
            onChange={(e) => setPeriodId(e.target.value)}
            className="block px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white min-w-[200px]"
          >
            <option value="">Estimasi (Gaji Pokok Aktif)</option>
            {payrollPeriods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.month}/{p.year})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const renderAttendanceTab = () => {
    if (!attendanceData) return null;
    const totalHadir = attendanceData.byDept.reduce((s, d) => s + d.hadir, 0);
    const totalAlpha = attendanceData.byDept.reduce((s, d) => s + d.alpha, 0);
    const totalTelat = attendanceData.byDept.reduce((s, d) => s + d.telat, 0);
    const avgHours =
      attendanceData.byDept.length > 0
        ? Math.round(
            (attendanceData.byDept.reduce((s, d) => s + d.avgHours, 0) /
              attendanceData.byDept.length) *
              10,
          ) / 10
        : 0;

    const tableRows = attendanceData.byDept.map((d) => ({
      dept: d.dept,
      hadir: d.hadir,
      izin: d.izin,
      alpha: d.alpha,
      telat: d.telat,
      avgHours: d.avgHours,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderStatCard('Hadir', totalHadir, <Lucide.CheckCircle className="w-5 h-5 text-green-600" />, 'bg-green-50')}
          {renderStatCard('Alpha', totalAlpha, <Lucide.XCircle className="w-5 h-5 text-red-600" />, 'bg-red-50')}
          {renderStatCard('Telat', totalTelat, <Lucide.Clock className="w-5 h-5 text-amber-600" />, 'bg-amber-50')}
          {renderStatCard('Rata-rata Jam', `${avgHours}j`, <Lucide.Timer className="w-5 h-5 text-blue-600" />, 'bg-blue-50')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Kehadiran per Departemen
            </h3>
            {attendanceData.byDept.length > 0 ? (
              <BarChart
                labels={attendanceData.byDept.map((d) => d.dept)}
                datasets={[
                  { label: 'Hadir', data: attendanceData.byDept.map((d) => d.hadir), backgroundColor: '#16A34A' },
                  { label: 'Alpha', data: attendanceData.byDept.map((d) => d.alpha), backgroundColor: '#DC2626' },
                  { label: 'Telat', data: attendanceData.byDept.map((d) => d.telat), backgroundColor: '#D97706' },
                ]}
                height={280}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Paling Sering Telat
            </h3>
            {attendanceData.topLate.length > 0 ? (
              <div className="space-y-3">
                {attendanceData.topLate.map((emp, idx) => (
                  <div key={emp.id} className="flex items-center justify-between py-2 border-b border-slate-50">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-50 text-amber-600 text-[10px] font-bold flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-xs font-bold text-slate-700">{emp.fullName}</p>
                        <p className="text-[10px] text-slate-400">{emp.department}</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-amber-600">{emp.lateCount}x</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan per Departemen</h3>
            <button
              type="button"
              onClick={() => handleExportCSV(tableRows, `attendance_${month}_${year}`)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.Download className="w-3.5 h-3.5" />
              {t('export_csv')}
            </button>
          </div>
          <DataTable
            headers={['Departemen', 'Hadir', 'Izin', 'Alpha', 'Telat', 'Rata-rata Jam']}
            rows={tableRows}
            columns={['dept', 'hadir', 'izin', 'alpha', 'telat', 'avgHours']}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  const renderLeaveTab = () => {
    if (!leaveData) return null;
    const tableRows = leaveData.byDept.map((d) => ({
      dept: d.dept,
      totalDays: d.totalDays,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderStatCard('Total Hari Cuti', leaveData.total, <Lucide.Calendar className="w-5 h-5 text-blue-600" />, 'bg-blue-50')}
          {renderStatCard('Tipe Cuti', leaveData.byType.length, <Lucide.List className="w-5 h-5 text-purple-600" />, 'bg-purple-50')}
          {renderStatCard('Departemen', leaveData.byDept.length, <Lucide.Building2 className="w-5 h-5 text-teal-600" />, 'bg-teal-50')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Cuti per Tipe
            </h3>
            {leaveData.byType.length > 0 ? (
              <DonutChart
                labels={leaveData.byType.map((t) => t.type)}
                data={leaveData.byType.map((t) => t.totalDays)}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Cuti per Departemen
            </h3>
            {leaveData.byDept.length > 0 ? (
              <BarChart
                labels={leaveData.byDept.map((d) => d.dept)}
                datasets={[
                  { label: 'Total Hari', data: leaveData.byDept.map((d) => d.totalDays) },
                ]}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan per Departemen</h3>
            <button
              type="button"
              onClick={() => handleExportCSV(tableRows, `leave_${month}_${year}`)}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.Download className="w-3.5 h-3.5" />
              {t('export_csv')}
            </button>
          </div>
          <DataTable
            headers={['Departemen', 'Total Hari Cuti']}
            rows={tableRows}
            columns={['dept', 'totalDays']}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  const renderPayrollTab = () => {
    if (!payrollData) return null;
    const tableRows = payrollData.byDept.map((d) => ({
      dept: d.dept,
      count: d.count,
      gross: d.gross,
      deduct: d.deduct,
      net: d.net,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {renderStatCard('Karyawan', payrollData.employeeCount, <Lucide.Users className="w-5 h-5 text-blue-600" />, 'bg-blue-50')}
          {renderStatCard('Gaji Kotor', formatRupiah(payrollData.totalGross), <Lucide.TrendingUp className="w-5 h-5 text-green-600" />, 'bg-green-50')}
          {renderStatCard('Potongan', formatRupiah(payrollData.totalDeduct), <Lucide.TrendingDown className="w-5 h-5 text-red-600" />, 'bg-red-50')}
          {renderStatCard('Gaji Bersih', formatRupiah(payrollData.totalNet), <Lucide.Banknote className="w-5 h-5 text-emerald-600" />, 'bg-emerald-50')}
        </div>

        {payrollData.source === 'estimate' && (
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700 flex items-center gap-2">
            <Lucide.Info className="w-4 h-4 shrink-0" />
            Data estimasi berdasarkan gaji pokok karyawan aktif. Pilih periode gaji untuk data aktual.
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
            Gaji Bersih per Departemen
          </h3>
          {payrollData.byDept.length > 0 ? (
            <BarChart
              labels={payrollData.byDept.map((d) => d.dept)}
              datasets={[
                { label: 'Gaji Bersih', data: payrollData.byDept.map((d) => d.net) },
              ]}
              height={280}
            />
          ) : (
            <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan per Departemen</h3>
            <button
              type="button"
              onClick={() =>
                handleExportCSV(
                  tableRows.map((r) => ({
                    ...r,
                    gross: formatRupiah(r.gross),
                    deduct: formatRupiah(r.deduct),
                    net: formatRupiah(r.net),
                  })),
                  `payroll_${periodId || 'estimate'}`,
                )
              }
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.Download className="w-3.5 h-3.5" />
              {t('export_csv')}
            </button>
          </div>
          <DataTable
            headers={['Departemen', 'Karyawan', 'Gaji Kotor', 'Potongan', 'Gaji Bersih']}
            rows={tableRows}
            columns={[
              'dept',
              'count',
              (row) => formatRupiah(row.gross),
              (row) => formatRupiah(row.deduct),
              (row) => formatRupiah(row.net),
            ]}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  const renderHeadcountTab = () => {
    if (!headcountData) return null;
    const tableRows = headcountData.byDept.map((d) => ({
      dept: d.dept,
      count: d.count,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderStatCard('Total Karyawan', headcountData.total, <Lucide.Users className="w-5 h-5 text-blue-600" />, 'bg-blue-50')}
          {renderStatCard('Departemen', headcountData.byDept.length, <Lucide.Building2 className="w-5 h-5 text-teal-600" />, 'bg-teal-50')}
          {renderStatCard('Status', headcountData.byStatus.length, <Lucide.Activity className="w-5 h-5 text-purple-600" />, 'bg-purple-50')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Headcount per Departemen
            </h3>
            {headcountData.byDept.length > 0 ? (
              <DonutChart
                labels={headcountData.byDept.map((d) => d.dept)}
                data={headcountData.byDept.map((d) => d.count)}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Tren Bergabung (12 Bulan)
            </h3>
            {headcountData.joinTrend.some((j) => j.count > 0) ? (
              <BarChart
                labels={headcountData.joinTrend.map((j) => j.month)}
                datasets={[
                  { label: 'Bergabung', data: headcountData.joinTrend.map((j) => j.count) },
                ]}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Per Status
            </h3>
            <DataTable
              headers={['Status', 'Jumlah']}
              rows={headcountData.byStatus}
              columns={['status', 'count']}
              loading={loading}
            />
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Per Gender
            </h3>
            <DataTable
              headers={['Gender', 'Jumlah']}
              rows={headcountData.byGender}
              columns={['gender', 'count']}
              loading={loading}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan per Departemen</h3>
            <button
              type="button"
              onClick={() => handleExportCSV(tableRows, 'headcount')}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.Download className="w-3.5 h-3.5" />
              {t('export_csv')}
            </button>
          </div>
          <DataTable
            headers={['Departemen', 'Jumlah']}
            rows={tableRows}
            columns={['dept', 'count']}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  const renderExpenseTab = () => {
    if (!expenseData) return null;
    const tableRows = expenseData.byCategory.map((c) => ({
      category: c.category,
      totalAmount: c.totalAmount,
    }));

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {renderStatCard('Total Klaim', expenseData.claimCount, <Lucide.FileText className="w-5 h-5 text-blue-600" />, 'bg-blue-50')}
          {renderStatCard('Total Nilai', formatRupiah(expenseData.totalAmount), <Lucide.Receipt className="w-5 h-5 text-green-600" />, 'bg-green-50')}
          {renderStatCard('Kategori', expenseData.byCategory.length, <Lucide.Tags className="w-5 h-5 text-purple-600" />, 'bg-purple-50')}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Pengeluaran per Kategori
            </h3>
            {expenseData.byCategory.length > 0 ? (
              <DonutChart
                labels={expenseData.byCategory.map((c) => c.category)}
                data={expenseData.byCategory.map((c) => c.totalAmount)}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4 border-b border-slate-100 pb-3">
              Nilai per Kategori
            </h3>
            {expenseData.byCategory.length > 0 ? (
              <BarChart
                labels={expenseData.byCategory.map((c) => c.category)}
                datasets={[
                  { label: 'Total (IDR)', data: expenseData.byCategory.map((c) => c.totalAmount) },
                ]}
                height={260}
              />
            ) : (
              <p className="text-xs text-slate-400 text-center py-10">{t('no_data')}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Ringkasan per Kategori</h3>
            <button
              type="button"
              onClick={() =>
                handleExportCSV(
                  tableRows.map((r) => ({
                    ...r,
                    totalAmount: formatRupiah(r.totalAmount),
                  })),
                  `expense_${month}_${year}`,
                )
              }
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.Download className="w-3.5 h-3.5" />
              {t('export_csv')}
            </button>
          </div>
          <DataTable
            headers={['Kategori', 'Total Nilai']}
            rows={tableRows}
            columns={['category', (row) => formatRupiah(row.totalAmount)]}
            loading={loading}
          />
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    switch (activeTab) {
      case 'attendance':
        return renderAttendanceTab();
      case 'leave':
        return renderLeaveTab();
      case 'payroll':
        return renderPayrollTab();
      case 'headcount':
        return renderHeadcountTab();
      case 'expense':
        return renderExpenseTab();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          {t('reporting')}
        </h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ key, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === key
                ? 'bg-primary text-white'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Icon className="w-4 h-4" />
            {t(`reporting_${key}`)}
          </button>
        ))}
      </div>

      {renderFilters()}
      {renderTabContent()}
    </div>
  );
}
