'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  maxAmount?: number | null;
  requireReceipt: boolean;
}

interface ClaimItem {
  id?: string;
  categoryId: string;
  description: string;
  amount: string | number;
  expenseDate: string;
  notes: string;
  receiptUrl?: string;
  category?: ExpenseCategory;
}

interface ExpenseClaim {
  id: string;
  claimNumber: string;
  title: string;
  description?: string | null;
  totalAmount: number;
  currency: string;
  status: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedReason?: string | null;
  paidAt?: string | null;
  createdAt: string;
  employee: { id: string; fullName: string; employeeNumber: string; department?: { name: string } | null };
  items: ClaimItem[];
  _count?: { items: number };
}

const emptyItem = (): ClaimItem => ({
  categoryId: '',
  description: '',
  amount: '',
  expenseDate: new Date().toISOString().slice(0, 10),
  notes: '',
});

export default function ExpensePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'FINANCE';
  const canApprove = isAdmin;
  const canMarkPaid = user?.role === 'SUPER_ADMIN' || user?.role === 'FINANCE';

  const [claims, setClaims] = useState<ExpenseClaim[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [claimForm, setClaimForm] = useState({ title: '', description: '' });
  const [items, setItems] = useState<ClaimItem[]>([emptyItem()]);
  const [saving, setSaving] = useState(false);

  const [detailClaim, setDetailClaim] = useState<ExpenseClaim | null>(null);
  const [approveTarget, setApproveTarget] = useState<ExpenseClaim | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ExpenseClaim | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [paidTarget, setPaidTarget] = useState<ExpenseClaim | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimsData, catsData] = await Promise.all([
        fetchAPI<ExpenseClaim[]>('/expense/claims'),
        fetchAPI<ExpenseCategory[]>('/expense/categories'),
      ]);
      setClaims(claimsData);
      setCategories(catsData.filter(c => c.requireReceipt !== undefined));
    } catch (err: any) {
      alert(err.message || 'Gagal memuat data klaim');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredClaims = claims.filter(c => {
    if (statusFilter && c.status !== statusFilter) return false;
    if (employeeFilter && c.employee.id !== employeeFilter) return false;
    return true;
  });

  const employeeOptions = Array.from(
    new Map(claims.map(c => [c.employee.id, c.employee])).values(),
  );

  const resetCreate = () => {
    setCreateStep(1);
    setClaimForm({ title: '', description: '' });
    setItems([emptyItem()]);
  };

  const openCreate = () => {
    resetCreate();
    setCreateOpen(true);
  };

  const totalItemsAmount = items.reduce((sum, item) => {
    const amt = parseInt(item.amount, 10);
    return sum + (isNaN(amt) ? 0 : amt);
  }, 0);

  const handleCreateSubmit = async (submitAfter: boolean) => {
    if (!claimForm.title.trim()) {
      alert('Judul klaim wajib diisi');
      return;
    }
    const validItems = items.filter(i => i.description.trim() && i.amount);
    if (validItems.length === 0) {
      alert('Minimal satu item pengeluaran wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const claim = await fetchAPI<ExpenseClaim>('/expense/claims', {
        method: 'POST',
        body: JSON.stringify({
          title: claimForm.title,
          description: claimForm.description || null,
        }),
      });

      for (const item of validItems) {
        await fetchAPI(`/expense/claims/${claim.id}/items`, {
          method: 'POST',
          body: JSON.stringify({
            categoryId: item.categoryId || null,
            description: item.description,
            amount: parseInt(item.amount, 10),
            expenseDate: item.expenseDate,
            notes: item.notes || null,
            receiptUrl: item.receiptUrl || null,
          }),
        });
      }

      if (submitAfter) {
        await fetchAPI(`/expense/claims/${claim.id}/submit`, { method: 'POST' });
        alert('Klaim berhasil diajukan');
      } else {
        alert('Klaim draft berhasil disimpan');
      }

      setCreateOpen(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan klaim');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await fetchAPI(`/expense/claims/${approveTarget.id}/approve`, { method: 'POST' });
      alert('Klaim berhasil disetujui');
      setApproveTarget(null);
      setDetailClaim(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui klaim');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await fetchAPI(`/expense/claims/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      alert('Klaim ditolak');
      setRejectTarget(null);
      setRejectReason('');
      setDetailClaim(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak klaim');
    }
  };

  const handleMarkPaid = async () => {
    if (!paidTarget) return;
    try {
      await fetchAPI(`/expense/claims/${paidTarget.id}/paid`, { method: 'POST' });
      alert('Klaim ditandai sebagai dibayar');
      setPaidTarget(null);
      setDetailClaim(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menandai klaim sebagai dibayar');
    }
  };

  const openDetail = async (claim: ExpenseClaim) => {
    try {
      const detail = await fetchAPI<ExpenseClaim>(`/expense/claims/${claim.id}`);
      setDetailClaim(detail);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat detail klaim');
    }
  };

  const tableHeaders = isAdmin
    ? ['No. Klaim', 'Karyawan', 'Judul', 'Total', 'Tanggal', 'Status', 'Aksi']
    : ['No. Klaim', 'Judul', 'Total', 'Tanggal', 'Status', 'Aksi'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">{t('expense')}</h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAdmin ? 'Kelola klaim pengeluaran karyawan' : 'Ajukan dan lacak klaim pengeluaran Anda'}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          Buat Klaim
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="flex flex-wrap gap-3">
          <FormField.Select
            label="Filter Status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Semua Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'submitted', label: 'Diajukan' },
              { value: 'approved', label: 'Disetujui' },
              { value: 'rejected', label: 'Ditolak' },
              { value: 'paid', label: 'Dibayar' },
            ]}
          />
          {isAdmin && employeeOptions.length > 0 && (
            <FormField.Select
              label="Filter Karyawan"
              value={employeeFilter}
              onChange={e => setEmployeeFilter(e.target.value)}
              options={[
                { value: '', label: 'Semua Karyawan' },
                ...employeeOptions.map(emp => ({
                  value: emp.id,
                  label: emp.fullName,
                })),
              ]}
            />
          )}
        </div>

        <DataTable
          headers={tableHeaders}
          rows={filteredClaims}
          loading={loading}
          onRowClick={row => openDetail(row)}
          columns={[
            row => row.claimNumber,
            ...(isAdmin ? [row => row.employee.fullName] : []),
            row => row.title,
            row => formatRupiah(row.totalAmount),
            row => formatDate(row.submittedAt || row.createdAt),
            row => (
              <Badge status={row.status === 'submitted' ? 'pending' : row.status} />
            ),
            row => (
              <button
                onClick={e => { e.stopPropagation(); openDetail(row); }}
                className="text-xs font-bold text-primary hover:underline"
              >
                Detail
              </button>
            ),
          ]}
        />
      </div>

      {/* Create Claim — Multi-step Modal */}
      <Modal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        title={`Buat Klaim — Langkah ${createStep}/3`}
        size="lg"
      >
        {createStep === 1 && (
          <div className="space-y-4">
            <FormField.Input
              label="Judul Klaim"
              value={claimForm.title}
              onChange={e => setClaimForm({ ...claimForm, title: e.target.value })}
              placeholder="Contoh: Perjalanan Dinas Jakarta"
            />
            <FormField.Textarea
              label="Deskripsi"
              value={claimForm.description}
              onChange={e => setClaimForm({ ...claimForm, description: e.target.value })}
              placeholder="Keterangan tambahan (opsional)"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCreateOpen(false)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (!claimForm.title.trim()) {
                    alert('Judul klaim wajib diisi');
                    return;
                  }
                  setCreateStep(2);
                }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold"
              >
                Lanjut
              </button>
            </div>
          </div>
        )}

        {createStep === 2 && (
          <div className="space-y-4">
            {items.map((item, idx) => (
              <div key={idx} className="p-4 border border-slate-100 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-600">Item #{idx + 1}</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                      className="text-xs text-red-500 font-bold"
                    >
                      Hapus
                    </button>
                  )}
                </div>
                <FormField.Select
                  label="Kategori"
                  value={item.categoryId}
                  onChange={e => {
                    const next = [...items];
                    next[idx] = { ...next[idx], categoryId: e.target.value };
                    setItems(next);
                  }}
                  options={[
                    { value: '', label: '— Pilih Kategori —' },
                    ...categories.map(c => ({ value: c.id, label: c.name })),
                  ]}
                />
                <FormField.Input
                  label="Deskripsi"
                  value={item.description}
                  onChange={e => {
                    const next = [...items];
                    next[idx] = { ...next[idx], description: e.target.value };
                    setItems(next);
                  }}
                />
                <div className="grid grid-cols-2 gap-3">
                  <FormField.Input
                    label="Jumlah (Rp)"
                    type="number"
                    value={item.amount}
                    onChange={e => {
                      const next = [...items];
                      next[idx] = { ...next[idx], amount: e.target.value };
                      setItems(next);
                    }}
                  />
                  <FormField.Input
                    label="Tanggal Pengeluaran"
                    type="date"
                    value={item.expenseDate}
                    onChange={e => {
                      const next = [...items];
                      next[idx] = { ...next[idx], expenseDate: e.target.value };
                      setItems(next);
                    }}
                  />
                </div>
                <FormField.Input
                  label="URL Bukti/Struk (opsional)"
                  value={item.receiptUrl || ''}
                  onChange={e => {
                    const next = [...items];
                    next[idx] = { ...next[idx], receiptUrl: e.target.value };
                    setItems(next);
                  }}
                  placeholder="https://..."
                />
                <FormField.Input
                  label="Catatan"
                  value={item.notes}
                  onChange={e => {
                    const next = [...items];
                    next[idx] = { ...next[idx], notes: e.target.value };
                    setItems(next);
                  }}
                />
              </div>
            ))}
            <button
              onClick={() => setItems([...items, emptyItem()])}
              className="text-xs font-bold text-primary flex items-center gap-1"
            >
              <Lucide.Plus className="w-3.5 h-3.5" />
              Tambah Item
            </button>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCreateStep(1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
              >
                Kembali
              </button>
              <button
                onClick={() => setCreateStep(3)}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {createStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl space-y-2">
              <h3 className="text-sm font-bold text-slate-800">{claimForm.title}</h3>
              {claimForm.description && (
                <p className="text-xs text-slate-500">{claimForm.description}</p>
              )}
            </div>
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-bold text-slate-600">Deskripsi</th>
                    <th className="text-left p-3 font-bold text-slate-600">Tanggal</th>
                    <th className="text-right p-3 font-bold text-slate-600">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {items.filter(i => i.description && i.amount).map((item, idx) => (
                    <tr key={idx} className="border-t border-slate-100">
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">{formatDate(item.expenseDate)}</td>
                      <td className="p-3 text-right font-medium">
                        {formatRupiah(parseInt(item.amount, 10) || 0)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={2} className="p-3 font-bold text-slate-700">Total</td>
                    <td className="p-3 text-right font-bold text-primary">{formatRupiah(totalItemsAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            <div className="flex justify-between pt-2">
              <button
                onClick={() => setCreateStep(2)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
              >
                Kembali
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCreateSubmit(false)}
                  disabled={saving}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 disabled:opacity-50"
                >
                  Simpan Draft
                </button>
                <button
                  onClick={() => handleCreateSubmit(true)}
                  disabled={saving}
                  className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : t('expense_submit')}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailClaim}
        onClose={() => setDetailClaim(null)}
        title={detailClaim ? `Klaim ${detailClaim.claimNumber}` : ''}
        size="lg"
      >
        {detailClaim && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-800">{detailClaim.title}</h3>
                {isAdmin && (
                  <p className="text-xs text-slate-500 mt-0.5">{detailClaim.employee.fullName}</p>
                )}
                {detailClaim.description && (
                  <p className="text-xs text-slate-400 mt-1">{detailClaim.description}</p>
                )}
              </div>
              <Badge status={detailClaim.status === 'submitted' ? 'pending' : detailClaim.status} />
            </div>

            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-3 font-bold text-slate-600">Kategori</th>
                    <th className="text-left p-3 font-bold text-slate-600">Deskripsi</th>
                    <th className="text-left p-3 font-bold text-slate-600">Tanggal</th>
                    <th className="text-right p-3 font-bold text-slate-600">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {detailClaim.items.map(item => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="p-3">{item.category?.name || '-'}</td>
                      <td className="p-3">{item.description}</td>
                      <td className="p-3">{formatDate(item.expenseDate)}</td>
                      <td className="p-3 text-right">{formatRupiah(Number(item.amount))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t border-slate-200 bg-slate-50">
                  <tr>
                    <td colSpan={3} className="p-3 font-bold">Total</td>
                    <td className="p-3 text-right font-bold text-primary">
                      {formatRupiah(detailClaim.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs text-slate-600">
              <p className="font-bold text-slate-700">Riwayat Status</p>
              <p>Dibuat: {formatDate(detailClaim.createdAt)}</p>
              {detailClaim.submittedAt && <p>Diajukan: {formatDate(detailClaim.submittedAt)}</p>}
              {detailClaim.approvedAt && detailClaim.status === 'approved' && (
                <p>Disetujui: {formatDate(detailClaim.approvedAt)}</p>
              )}
              {detailClaim.approvedAt && detailClaim.status === 'rejected' && (
                <>
                  <p>Ditolak: {formatDate(detailClaim.approvedAt)}</p>
                  {detailClaim.rejectedReason && (
                    <p className="text-red-600">Alasan: {detailClaim.rejectedReason}</p>
                  )}
                </>
              )}
              {detailClaim.paidAt && <p>Dibayar: {formatDate(detailClaim.paidAt)}</p>}
            </div>

            <div className="flex flex-wrap gap-2 justify-end">
              {canApprove && detailClaim.status === 'submitted' && (
                <>
                  <button
                    onClick={() => setApproveTarget(detailClaim)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold"
                  >
                    {t('expense_approve')}
                  </button>
                  <button
                    onClick={() => { setRejectTarget(detailClaim); setRejectReason(''); }}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
                  >
                    {t('expense_reject')}
                  </button>
                </>
              )}
              {canMarkPaid && detailClaim.status === 'approved' && (
                <button
                  onClick={() => setPaidTarget(detailClaim)}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold"
                >
                  Tandai Dibayar
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title={t('expense_approve')}
        message={`Setujui klaim "${approveTarget?.claimNumber}" senilai ${formatRupiah(approveTarget?.totalAmount || 0)}?`}
        onConfirm={handleApprove}
        confirmText={t('expense_approve')}
        type="success"
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
        title={t('expense_reject')}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Tolak klaim &quot;{rejectTarget?.claimNumber}&quot;?
          </p>
          <FormField.Textarea
            label="Alasan Penolakan"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => { setRejectTarget(null); setRejectReason(''); }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
            >
              Batal
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
            >
              {t('expense_reject')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!paidTarget}
        onClose={() => setPaidTarget(null)}
        title="Tandai Dibayar"
        message={`Tandai klaim "${paidTarget?.claimNumber}" sebagai sudah dibayar?`}
        onConfirm={handleMarkPaid}
        confirmText="Konfirmasi"
        type="success"
      />
    </div>
  );
}
