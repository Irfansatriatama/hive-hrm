'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface PayrollItem {
  id: string;
  name: string;
  type: string;
  category: string;
  amount: number;
}

interface PayrollRecord {
  id: string;
  basicSalary: number;
  grossSalary: number;
  totalDeduct: number;
  netSalary: number;
  status: string;
  employee: {
    fullName: string;
    department?: { name: string } | null;
    position?: { name: string } | null;
  };
  items: PayrollItem[];
}

function PeriodStatusBadge({ status }: { status: string }) {
  const norm = status.toLowerCase();
  const styles: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-700',
    processing: 'bg-blue-100 text-blue-800',
    finalized: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
  };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${styles[norm] || styles.draft}`}>
      {status}
    </span>
  );
}

export default function PayrollDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const { user } = useAuth();

  const [records, setRecords] = useState<PayrollRecord[]>([]);
  const [periodName, setPeriodName] = useState('');
  const [periodStatus, setPeriodStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null);
  const [confirmProcess, setConfirmProcess] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<PayrollRecord[]>(`/payroll/periods/${id}/records`);
      setRecords(data);
      if (data.length > 0 && (data[0] as any).period) {
        setPeriodName((data[0] as any).period.name);
        setPeriodStatus((data[0] as any).period.status);
      } else {
        const periods = await fetchAPI<any[]>('/payroll/periods');
        const period = periods.find(p => p.id === id);
        if (period) {
          setPeriodName(period.name);
          setPeriodStatus(period.status);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat data payroll');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadRecords();
  }, [id]);

  const handleProcess = async () => {
    try {
      await fetchAPI(`/payroll/periods/${id}/process`, { method: 'POST' });
      alert('Payroll berhasil diproses');
      setConfirmProcess(false);
      loadRecords();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses payroll');
    }
  };

  const handleFinalize = async () => {
    try {
      await fetchAPI(`/payroll/periods/${id}/finalize`, { method: 'POST' });
      alert('Payroll berhasil difinalisasi');
      setConfirmFinalize(false);
      loadRecords();
    } catch (err: any) {
      alert(err.message || 'Gagal finalisasi payroll');
    }
  };

  const totalGross = records.reduce((s, r) => s + r.grossSalary, 0);
  const totalDeduct = records.reduce((s, r) => s + r.totalDeduct, 0);
  const totalNet = records.reduce((s, r) => s + r.netSalary, 0);

  const getAllowance = (record: PayrollRecord) =>
    record.items.filter(i => i.type === 'earning' && i.category !== 'basic').reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/payroll" className="hover:text-slate-600 font-medium">{t('payroll')}</Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">{periodName || 'Detail Periode'}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">{periodName || 'Periode Gaji'}</h1>
            <p className="text-xs text-slate-400 mt-1">Detail slip gaji karyawan per periode</p>
          </div>
          {periodStatus && <PeriodStatusBadge status={periodStatus} />}
        </div>
        <div className="flex gap-2">
          {isHR && periodStatus === 'draft' && (
            <button
              onClick={() => setConfirmProcess(true)}
              className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.Play className="w-3.5 h-3.5" />
              {t('payroll_process')}
            </button>
          )}
          {isSuperAdmin && periodStatus === 'processing' && (
            <button
              onClick={() => setConfirmFinalize(true)}
              className="px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
            >
              <Lucide.CheckCircle className="w-3.5 h-3.5" />
              {t('payroll_finalize')}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <DataTable
          headers={['Karyawan', 'Dept', 'Jabatan', 'Gaji Pokok', 'Tunjangan', 'Potongan', 'Gaji Bersih', 'Status', 'Aksi']}
          rows={records}
          loading={loading}
          onRowClick={row => setSelectedRecord(row)}
          columns={[
            row => row.employee.fullName,
            row => row.employee.department?.name || '-',
            row => row.employee.position?.name || '-',
            row => formatRupiah(row.basicSalary),
            row => formatRupiah(getAllowance(row)),
            row => formatRupiah(row.totalDeduct),
            row => formatRupiah(row.netSalary),
            row => <Badge status={row.status} />,
            row => (
              <button
                onClick={e => { e.stopPropagation(); setSelectedRecord(row); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                {t('detail')}
              </button>
            ),
          ]}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Karyawan', value: String(records.length), icon: Lucide.Users },
          { label: 'Total Gaji Kotor', value: formatRupiah(totalGross), icon: Lucide.TrendingUp },
          { label: 'Total Potongan', value: formatRupiah(totalDeduct), icon: Lucide.MinusCircle },
          { label: 'Total Gaji Bersih', value: formatRupiah(totalNet), icon: Lucide.Banknote },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-bold text-slate-400 uppercase">{card.label}</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{card.value}</p>
            </div>
          );
        })}
      </div>

      <Modal
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title={`Slip Gaji — ${selectedRecord?.employee.fullName || ''}`}
        size="lg"
      >
        {selectedRecord && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-slate-400">Departemen:</span> <span className="font-bold">{selectedRecord.employee.department?.name || '-'}</span></div>
              <div><span className="text-slate-400">Jabatan:</span> <span className="font-bold">{selectedRecord.employee.position?.name || '-'}</span></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-xs font-bold text-green-700 mb-2 uppercase">Pendapatan</h4>
                <table className="w-full text-xs">
                  <tbody>
                    {selectedRecord.items.filter(i => i.type === 'earning').map(item => (
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
                    {selectedRecord.items.filter(i => i.type === 'deduction').map(item => (
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
              <span className="text-primary">{formatRupiah(selectedRecord.netSalary)}</span>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={confirmProcess}
        onClose={() => setConfirmProcess(false)}
        title={t('payroll_process')}
        message="Proses payroll akan membuat slip gaji untuk semua karyawan aktif. Lanjutkan?"
        onConfirm={handleProcess}
      />

      <ConfirmDialog
        isOpen={confirmFinalize}
        onClose={() => setConfirmFinalize(false)}
        title={t('payroll_finalize')}
        message="Finalisasi akan mengunci semua slip gaji periode ini. Lanjutkan?"
        onConfirm={handleFinalize}
      />
    </div>
  );
}
