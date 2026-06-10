'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ProcurementReportPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);

  const canView =
    user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'FINANCE';

  useEffect(() => {
    setIsClient(true);
    if (!canView) return;
    async function loadReport() {
      setLoading(true);
      try {
        const data = await fetchAPI('/procurement/report');
        setReport(data);
      } catch (err) {
        console.error('Failed to load procurement report:', err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [canView]);

  if (!canView) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Laporan procurement hanya untuk Admin dan Finance.</p>
      </div>
    );
  }

  const chartData = report
    ? [
        { name: 'Disetujui', value: report.approvedCount, budget: report.totalApprovedBudget },
        { name: 'Pending', value: report.pendingCount, budget: report.totalPendingBudget },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Laporan Procurement</h1>
        <p className="text-xs text-slate-400 mt-1">Ringkasan anggaran dan status purchase order perusahaan.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PO Disetujui</span>
              <p className="text-xl font-bold text-green-600 font-mono mt-1">{report.approvedCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PO Pending</span>
              <p className="text-xl font-bold text-amber-600 font-mono mt-1">{report.pendingCount}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Disetujui</span>
              <p className="text-sm font-bold text-primary font-mono mt-1">{formatRupiah(report.totalApprovedBudget)}</p>
            </div>
            <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Budget Pending</span>
              <p className="text-sm font-bold text-slate-600 font-mono mt-1">{formatRupiah(report.totalPendingBudget)}</p>
            </div>
          </div>

          {isClient && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Distribusi PO</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E6EA" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">PO Disetujui Terbaru</h3>
            {report.recentApproved.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada PO yang disetujui.</p>
            ) : (
              <div className="space-y-3">
                {report.recentApproved.map((po: any) => (
                  <div key={po.id} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl bg-slate-50">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{po.itemName}</p>
                      <p className="text-[10px] text-slate-400">{po.poNumber} · {formatDate(po.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-primary font-mono">{formatRupiah(po.totalPrice)}</p>
                      <Badge status="approved" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
