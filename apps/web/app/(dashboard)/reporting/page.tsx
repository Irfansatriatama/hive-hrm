'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { usePermission } from '@/hooks/usePermission';

type ReportType =
  | 'hr_attendance'
  | 'hr_leaves'
  | 'payroll_rekap'
  | 'perf_hashtags'
  | 'assets_borrowed'
  | 'proc_po';

interface ReportListItem {
  id: ReportType;
  category: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ReportPreview {
  title: string;
  headers: string[];
  columns: string[];
  rows: Record<string, string | number>[];
  badgeColumns: string[];
}

const REPORT_LIST: ReportListItem[] = [
  { id: 'hr_attendance', category: 'Laporan HR', name: 'Rekap Kehadiran Karyawan', icon: Lucide.Clock },
  { id: 'hr_leaves', category: 'Laporan HR', name: 'Rekap Status Cuti', icon: Lucide.Calendar },
  { id: 'payroll_rekap', category: 'Laporan Gaji', name: 'Rekapitulasi Gaji Departemen', icon: Lucide.Banknote },
  { id: 'perf_hashtags', category: 'Laporan Kinerja', name: 'Rekap Hashtag Nilai Perusahaan', icon: Lucide.Award },
  { id: 'assets_borrowed', category: 'Laporan Aset', name: 'Aset yang Sedang Dipinjam', icon: Lucide.Package },
  { id: 'proc_po', category: 'Laporan Procurement', name: 'Rekapitulasi Purchase Order', icon: Lucide.ShoppingCart },
];

const REPORT_TITLES: Record<ReportType, string> = {
  hr_attendance: 'Laporan Rekapitulasi Kehadiran',
  hr_leaves: 'Laporan Status dan Rekapitulasi Cuti',
  payroll_rekap: 'Laporan Gaji per Departemen',
  perf_hashtags: 'Laporan Nilai Perusahaan (#Hashtag)',
  assets_borrowed: 'Laporan Peminjaman Aset',
  proc_po: 'Laporan Rekapitulasi Purchase Order',
};

export default function ReportingPage() {
  const { hasAccess, isLoading: authLoading } = usePermission();
  const canView = hasAccess('reporting');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];

  const [selectedReport, setSelectedReport] = useState<ReportType>('hr_attendance');
  const [filterStart, setFilterStart] = useState(thirtyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(todayStr);
  const [filterDept, setFilterDept] = useState('');
  const [filterEmp, setFilterEmp] = useState('');

  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [preview, setPreview] = useState<ReportPreview | null>(null);
  const [loading, setLoading] = useState(true);

  const loadPreview = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: selectedReport });
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', filterEnd);
      if (filterDept) params.set('departmentId', filterDept);
      if (filterEmp) params.set('employeeId', filterEmp);

      const data = await fetchAPI<ReportPreview>(`/reporting/preview?${params.toString()}`);
      setPreview(data);
    } catch (err) {
      console.error('Failed to load report preview:', err);
      setPreview({
        title: REPORT_TITLES[selectedReport],
        headers: [],
        columns: [],
        rows: [],
        badgeColumns: [],
      });
    } finally {
      setLoading(false);
    }
  }, [canView, selectedReport, filterStart, filterEnd, filterDept, filterEmp]);

  useEffect(() => {
    if (!authLoading && canView) {
      async function loadDropdowns() {
        try {
          const [depts, empsRes] = await Promise.all([
            fetchAPI<any[]>('/employees/departments'),
            fetchAPI<{ employees: any[] }>('/employees?limit=1000'),
          ]);
          setDepartments(depts);
          setEmployees(empsRes.employees || []);
        } catch (err) {
          console.error('Failed to load reporting dropdowns:', err);
        }
      }
      loadDropdowns();
    }
  }, [authLoading, canView]);

  useEffect(() => {
    if (!authLoading && canView) {
      loadPreview();
    }
  }, [authLoading, canView, loadPreview]);

  const getCellValue = (row: Record<string, string | number>, column: string) => {
    const value = row[column];
    if (preview?.badgeColumns.includes(column)) {
      return <Badge status={String(value)} />;
    }
    return value ?? '-';
  };

  const getExportRows = () => {
    if (!preview) return [];
    return preview.rows.map((row) => {
      const entry: Record<string, string> = {};
      preview.headers.forEach((header, idx) => {
        const col = preview.columns[idx];
        entry[header] = String(row[col] ?? '');
      });
      return entry;
    });
  };

  const handleExportCSV = () => {
    if (!preview || preview.rows.length === 0) {
      alert('Tidak ada data untuk diekspor');
      return;
    }

    const simplified = getExportRows();
    const csvContent = [
      preview.headers,
      ...simplified.map((row) => preview.headers.map((h) => row[h] ?? '')),
    ]
      .map((line) =>
        line.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','),
      )
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${selectedReport}_Report_${filterStart}_to_${filterEnd}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPDF = async () => {
    if (!preview) return;

    let company: any = {};
    try {
      company = await fetchAPI('/core/company');
    } catch {
      company = {};
    }

    const tableRows = preview.rows
      .map((row) => {
        const cells = preview.columns
          .map((col) => {
            const val = String(row[col] ?? '');
            return `<td style="padding: 8px; border-bottom: 1px solid #ddd;">${val}</td>`;
          })
          .join('');
        return `<tr>${cells}</tr>`;
      })
      .join('');

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>${preview.title}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background: #f5f5f5; text-align: left; padding: 8px; border-bottom: 2px solid #ddd; }
            .header { border-bottom: 3px double #333; padding-bottom: 15px; margin-bottom: 20px; }
            .header h1 { margin: 0; font-size: 20px; }
            .header p { margin: 5px 0 0 0; font-size: 11px; color: #666; }
            .footer { margin-top: 40px; font-size: 10px; color: #888; text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${company.name || 'PT. Nusantara Digital Inovasi'}</h1>
            <p>${company.address || ''} &bull; NPWP: ${company.npwp || ''}</p>
            <h2 style="margin-top: 15px; font-size: 16px; border-top: 1px dashed #ddd; padding-top: 10px;">${preview.title}</h2>
            <p>Periode: ${formatDate(filterStart, { day: 'numeric', month: 'short', year: 'numeric' })} - ${formatDate(filterEnd, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${preview.headers.map((h) => `<th>${h}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="footer">
            Dokumen ini digenerate secara otomatis oleh sistem HIVE HRM pada tanggal ${new Date().toLocaleString('id-ID')}
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!authLoading && !canView) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Pusat laporan hanya untuk Admin, Manager, dan Finance.</p>
      </div>
    );
  }

  let currentCategory = '';
  const reportTitle = preview?.title || REPORT_TITLES[selectedReport];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm md:col-span-3">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-3 border-b border-slate-100 select-none">
          Pilih Laporan
        </h3>
        <div className="space-y-1 mt-3 select-none">
          {REPORT_LIST.map((rep) => {
            const showCategory = rep.category !== currentCategory;
            if (showCategory) currentCategory = rep.category;
            const isActive = selectedReport === rep.id;
            const Icon = rep.icon;

            return (
              <React.Fragment key={rep.id}>
                {showCategory && (
                  <div className="font-bold text-[10px] text-slate-400 uppercase tracking-wider mt-4 px-2 first:mt-0">
                    {rep.category}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedReport(rep.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 text-primary font-bold border-l-[3px] border-primary'
                      : 'text-slate-600 hover:bg-slate-50 border-l-[3px] border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>{rep.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="md:col-span-9 space-y-6 flex flex-col">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Preview: {reportTitle}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white shadow-sm cursor-pointer"
              >
                <Lucide.Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Ekspor CSV</span>
              </button>
              <button
                type="button"
                onClick={handlePrintPDF}
                className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 bg-white shadow-sm cursor-pointer"
              >
                <Lucide.Printer className="w-3.5 h-3.5 text-slate-500" />
                <span>Cetak PDF</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
                Tanggal Mulai
              </label>
              <input
                type="date"
                value={filterStart}
                onChange={(e) => setFilterStart(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
                Tanggal Selesai
              </label>
              <input
                type="date"
                value={filterEnd}
                onChange={(e) => setFilterEnd(e.target.value)}
                className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
                Departemen
              </label>
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
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 select-none">
                Karyawan
              </label>
              <select
                value={filterEmp}
                onChange={(e) => setFilterEmp(e.target.value)}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="">Semua Karyawan</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>{e.full_name || e.fullName}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-1">
          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : !preview || preview.rows.length === 0 ? (
              <div className="px-6 py-8 text-center text-slate-400 text-xs select-none">
                Tidak ada data laporan untuk parameter tanggal ini
              </div>
            ) : (
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    {preview.headers.map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {preview.rows.map((row, rowIdx) => (
                    <tr key={rowIdx} className="table-row-hover border-b border-slate-100 transition">
                      {preview.columns.map((col) => (
                        <td key={col} className="px-6 py-4 font-medium">
                          {getCellValue(row, col)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
