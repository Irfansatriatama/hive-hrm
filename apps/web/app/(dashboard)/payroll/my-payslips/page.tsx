'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatRupiah, formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';

interface PayrollItem {
  id: string;
  name: string;
  type: string;
  amount: number;
}

interface PayslipRecord {
  id: string;
  grossSalary: number;
  totalDeduct: number;
  netSalary: number;
  status: string;
  period: {
    name: string;
    month: number;
    year: number;
    payDate?: string | null;
  };
  items: PayrollItem[];
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

export default function MyPayslipsPage() {
  const { t } = useI18n();
  const [payslips, setPayslips] = useState<PayslipRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PayslipRecord | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await fetchAPI<PayslipRecord[]>('/payroll/my-payslips');
        setPayslips(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat slip gaji');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5 h-24 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/payroll" className="hover:text-slate-600 font-medium">{t('payroll')}</Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">{t('payroll_my_payslips')}</span>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('payroll_my_payslips')}</h1>
        <p className="text-xs text-slate-400 mt-1">Riwayat slip gaji Anda</p>
      </div>

      {payslips.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
          <Lucide.Receipt className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Belum ada slip gaji tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payslips.map(slip => (
            <button
              key={slip.id}
              onClick={() => setSelected(slip)}
              className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 text-left hover:border-primary/30 hover:shadow-md transition cursor-pointer"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">{slip.period.name}</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {MONTH_NAMES[slip.period.month - 1]} {slip.period.year}
                  </p>
                </div>
                <Badge status={slip.status} />
              </div>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Gaji Kotor</span>
                  <span className="font-bold">{formatRupiah(slip.grossSalary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Potongan</span>
                  <span className="font-bold text-red-600">-{formatRupiah(slip.totalDeduct)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-50 pt-2 mt-2">
                  <span className="text-slate-600 font-bold">Gaji Bersih</span>
                  <span className="font-bold text-primary">{formatRupiah(slip.netSalary)}</span>
                </div>
              </div>
              {slip.period.payDate && (
                <p className="text-[10px] text-slate-400 mt-3">
                  Tanggal bayar: {formatDate(slip.period.payDate)}
                </p>
              )}
            </button>
          ))}
        </div>
      )}

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.period.name || 'Detail Slip Gaji'}
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-green-700 mb-2 uppercase">Pendapatan</h4>
                <table className="w-full text-xs">
                  <tbody>
                    {selected.items.filter(i => i.type === 'earning').map(item => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">{item.name}</td>
                        <td className="py-2 text-right font-bold">{formatRupiah(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <h4 className="text-xs font-bold text-red-700 mb-2 uppercase">Potongan</h4>
                <table className="w-full text-xs">
                  <tbody>
                    {selected.items.filter(i => i.type === 'deduction').map(item => (
                      <tr key={item.id} className="border-b border-slate-50">
                        <td className="py-2 text-slate-600">{item.name}</td>
                        <td className="py-2 text-right font-bold">{formatRupiah(item.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-4 flex justify-between text-sm font-bold">
              <span>Gaji Bersih</span>
              <span className="text-primary">{formatRupiah(selected.netSalary)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
