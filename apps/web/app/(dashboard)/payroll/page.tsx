'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import FormField from '@/components/shared/FormField';

interface PayrollPeriod {
  id: string;
  name: string;
  month: number;
  year: number;
  status: string;
  startDate: string;
  endDate: string;
  payDate?: string | null;
  notes?: string | null;
  _count?: { records: number };
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

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

const emptyForm = () => ({
  name: '',
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  startDate: '',
  endDate: '',
  payDate: '',
  notes: '',
});

export default function PayrollPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();

  const [periods, setPeriods] = useState<PayrollPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<PayrollPeriod | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const loadPeriods = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<PayrollPeriod[]>('/payroll/periods');
      setPeriods(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat periode gaji');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPeriods();
  }, []);

  const filteredPeriods = filter
    ? periods.filter(p => p.status === filter)
    : periods;

  const openCreateModal = () => {
    setEditingPeriod(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEditModal = (period: PayrollPeriod, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPeriod(period);
    setForm({
      name: period.name,
      month: String(period.month),
      year: String(period.year),
      startDate: period.startDate ? period.startDate.split('T')[0] : '',
      endDate: period.endDate ? period.endDate.split('T')[0] : '',
      payDate: period.payDate ? period.payDate.split('T')[0] : '',
      notes: period.notes || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      alert('Nama, tanggal mulai, dan tanggal akhir wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        month: parseInt(form.month, 10),
        year: parseInt(form.year, 10),
        startDate: form.startDate,
        endDate: form.endDate,
        payDate: form.payDate || null,
        notes: form.notes || null,
      };
      if (editingPeriod) {
        await fetchAPI(`/payroll/periods/${editingPeriod.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Periode gaji berhasil diperbarui');
      } else {
        await fetchAPI('/payroll/periods', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Periode gaji berhasil dibuat');
      }
      setModalOpen(false);
      loadPeriods();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan periode');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('payroll')}</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola periode penggajian dan proses slip gaji karyawan</p>
        </div>
        {isAdmin && (
          <button
            onClick={openCreateModal}
            className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            <span>+ Periode Baru</span>
          </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="mb-4">
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Semua Status</option>
            <option value="draft">Draft</option>
            <option value="processing">Processing</option>
            <option value="finalized">Finalized</option>
            <option value="paid">Paid</option>
          </select>
        </div>

        <DataTable
          headers={['Nama Periode', 'Bulan/Tahun', 'Tanggal Bayar', 'Karyawan', 'Status', 'Aksi']}
          rows={filteredPeriods}
          loading={loading}
          onRowClick={row => router.push(`/payroll/${row.id}`)}
          columns={[
            row => row.name,
            row => `${MONTH_NAMES[row.month - 1] || row.month} ${row.year}`,
            row => (row.payDate ? formatDate(row.payDate) : '-'),
            row => String(row._count?.records ?? 0),
            row => <PeriodStatusBadge status={row.status} />,
            row => (
              isAdmin ? (
                <button
                  onClick={e => openEditModal(row, e)}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  {t('edit')}
                </button>
              ) : null
            ),
          ]}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPeriod ? 'Edit Periode Gaji' : 'Buat Periode Baru'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Periode"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Gaji Januari 2026"
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input
              label="Bulan (1-12)"
              type="number"
              min={1}
              max={12}
              value={form.month}
              onChange={e => setForm({ ...form, month: e.target.value })}
            />
            <FormField.Input
              label="Tahun"
              type="number"
              value={form.year}
              onChange={e => setForm({ ...form, year: e.target.value })}
            />
          </div>
          <FormField.Input
            label="Tanggal Mulai"
            type="date"
            value={form.startDate}
            onChange={e => setForm({ ...form, startDate: e.target.value })}
          />
          <FormField.Input
            label="Tanggal Akhir"
            type="date"
            value={form.endDate}
            onChange={e => setForm({ ...form, endDate: e.target.value })}
          />
          <FormField.Input
            label="Tanggal Bayar"
            type="date"
            value={form.payDate}
            onChange={e => setForm({ ...form, payDate: e.target.value })}
          />
          <FormField.Textarea
            label="Catatan"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : t('save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
