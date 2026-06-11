'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import FormField from '@/components/shared/FormField';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

interface ExpenseCategory {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  maxAmount?: number | null;
  requireReceipt: boolean;
  isActive: boolean;
}

const emptyForm = () => ({
  name: '',
  code: '',
  description: '',
  maxAmount: '',
  requireReceipt: true,
  isActive: true,
});

export default function SettingsExpensePage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const canManage = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'FINANCE';

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExpenseCategory | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<ExpenseCategory | null>(null);
  const [saving, setSaving] = useState(false);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<ExpenseCategory[]>('/expense/categories');
      setCategories(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat kategori pengeluaran');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canManage) loadCategories();
  }, [canManage]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item: ExpenseCategory) => {
    setEditing(item);
    setForm({
      name: item.name,
      code: item.code,
      description: item.description || '',
      maxAmount: item.maxAmount != null ? String(item.maxAmount) : '',
      requireReceipt: item.requireReceipt,
      isActive: item.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      alert('Nama dan kode wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        code: form.code.toUpperCase(),
        description: form.description || null,
        maxAmount: form.maxAmount ? parseInt(form.maxAmount, 10) : null,
        requireReceipt: form.requireReceipt,
        isActive: form.isActive,
      };
      if (editing) {
        await fetchAPI(`/expense/categories/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Kategori berhasil diperbarui');
      } else {
        await fetchAPI('/expense/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Kategori berhasil ditambahkan');
      }
      setModalOpen(false);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchAPI(`/expense/categories/${deleteTarget.id}`, { method: 'DELETE' });
      alert('Kategori berhasil dihapus');
      setDeleteTarget(null);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus kategori');
    }
  };

  if (!canManage) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/settings" className="hover:text-slate-600 font-medium">Pengaturan</Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">Kategori Pengeluaran</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Kategori Pengeluaran</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola kategori klaim, batas maksimum, dan aturan bukti struk</p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          Tambah Kategori
        </button>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <DataTable
          headers={['Nama', 'Kode', 'Max Amount', 'Butuh Struk', 'Status', 'Aksi']}
          rows={categories}
          loading={loading}
          columns={[
            row => row.name,
            row => row.code,
            row => (row.maxAmount != null ? formatRupiah(row.maxAmount) : '-'),
            row => (row.requireReceipt ? 'Ya' : 'Tidak'),
            row => (row.isActive ? 'Aktif' : 'Nonaktif'),
            row => (
              <TableActionMenu
                items={[
                  { label: 'Edit', onClick: () => openEdit(row) },
                  ...(isSuperAdmin
                    ? [{ label: 'Hapus', onClick: () => setDeleteTarget(row), variant: 'danger' as const }]
                    : []),
                ]}
              />
            ),
          ]}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kategori' : 'Tambah Kategori'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Kategori"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <FormField.Input
            label="Kode"
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="TRANS"
          />
          <FormField.Textarea
            label="Deskripsi"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
          <FormField.Input
            label="Batas Maksimum (Rp, opsional)"
            type="number"
            value={form.maxAmount}
            onChange={e => setForm({ ...form, maxAmount: e.target.value })}
          />
          <FormField.Toggle
            label="Wajib Bukti Struk"
            checked={form.requireReceipt}
            onChange={e => setForm({ ...form, requireReceipt: e.target.checked })}
          />
          <FormField.Toggle
            label="Aktif"
            checked={form.isActive}
            onChange={e => setForm({ ...form, isActive: e.target.checked })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus Kategori"
        message={`Yakin ingin menghapus kategori "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
