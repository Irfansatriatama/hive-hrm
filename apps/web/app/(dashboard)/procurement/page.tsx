'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import { BarChart } from '@/components/shared/ChartWrapper';

interface DashboardData {
  totalPrCount: number;
  activePoCount: number;
  thisMonthValue: number;
  pendingApprovalCount: number;
  recentActivities: any[];
  monthlyTrend: { labels: string[]; values: number[] };
}

export default function ProcurementPage() {
  const { lang } = useI18n();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<DashboardData>('/procurement/dashboard');
      setDashboard(data);
    } catch (err) {
      console.error('Failed to load procurement dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const dict =
    lang === 'id'
      ? {
          title: 'Pusat Pengadaan & Purchase Request (PR)',
          subtitle:
            'Lacak pengajuan belanja barang kantor, pantau alur approval purchase order (PO), dan evaluasi pengeluaran bulanan.',
          card_total_pr: 'Total PR Bulan Ini',
          card_active_po: 'PO Aktif / Berjalan',
          card_total_value: 'Nilai Belanja Bulan Ini',
          card_pending: 'Menunggu Approval',
          lbl_recent_activity: 'Aktivitas Pengadaan Terbaru',
          lbl_chart: 'Tren Nilai Pengadaan Bulanan (12 Bulan Terakhir)',
          btn_po_list: 'Lihat Daftar PO & Ajukan Baru',
          tbl_no: 'No PO',
          tbl_total: 'Total',
          tbl_status: 'Status',
          empty: 'Belum ada aktivitas pengadaan tercatat',
        }
      : {
          title: 'Procurement & Purchase Request Dashboard',
          subtitle:
            'Track inventory purchase requests (PR), inspect purchase order (PO) approval flows, and review monthly expenses.',
          card_total_pr: 'Total PR This Month',
          card_active_po: 'Active / Running POs',
          card_total_value: 'Expense Value This Month',
          card_pending: 'Awaiting Approval',
          lbl_recent_activity: 'Recent Purchase Activities',
          lbl_chart: 'Monthly Procurement Expense Trend (Last 12 Months)',
          btn_po_list: 'View PO Registry & Submit PR',
          tbl_no: 'PO / PR ID',
          tbl_total: 'Total',
          tbl_status: 'Status',
          empty: 'No procurement activity recorded yet',
        };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const recent = dashboard?.recentActivities || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lucide.FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{dict.card_total_pr}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{dashboard?.totalPrCount ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Lucide.ShoppingBag className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{dict.card_active_po}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{dashboard?.activePoCount ?? 0}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Lucide.Banknote className="w-6 h-6" />
          </div>
          <div className="min-w-0 font-semibold">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{dict.card_total_value}</p>
            <h3 className="text-base font-bold text-slate-800 mt-1.5 font-mono">
              {formatRupiah(dashboard?.thisMonthValue ?? 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Lucide.Clock className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{dict.card_pending}</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{dashboard?.pendingApprovalCount ?? 0}</h3>
          </div>
        </div>
      </div>

      <div className="flex justify-end select-none">
        <Link
          href="/procurement/po"
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition"
        >
          <Lucide.ArrowRightCircle className="w-4 h-4" />
          <span>{dict.btn_po_list}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">
            {dict.lbl_chart}
          </h2>
          <div className="h-80 relative w-full">
            {dashboard?.monthlyTrend ? (
              <BarChart
                labels={dashboard.monthlyTrend.labels}
                datasets={[
                  {
                    label: lang === 'id' ? 'Total Belanja (IDR)' : 'Total Expense (IDR)',
                    data: dashboard.monthlyTrend.values,
                  },
                ]}
                height={300}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-slate-400">{dict.empty}</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 overflow-hidden select-none">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">
            {dict.lbl_recent_activity}
          </h2>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                  <th className="px-4 py-2">{dict.tbl_no}</th>
                  <th className="px-4 py-2">{dict.tbl_total}</th>
                  <th className="px-4 py-2 text-right">{dict.tbl_status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-400">
                      {dict.empty}
                    </td>
                  </tr>
                ) : (
                  recent.slice(0, 4).map((p) => (
                    <tr key={p.id} className="table-row-hover border-b border-slate-50 transition">
                      <td className="px-4 py-3 font-bold font-mono text-slate-800">{p.poNumber}</td>
                      <td className="px-4 py-3 font-mono text-slate-500">{formatRupiah(p.totalAmount)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
