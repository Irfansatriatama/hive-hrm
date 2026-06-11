'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import FormField from '@/components/shared/FormField';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

interface PayrollComponent {
  id: string;
  name: string;
  type: string;
  category: string;
  isDefault: boolean;
  isFixed: boolean;
  taxable: boolean;
  sortOrder: number;
}

const TYPE_OPTIONS = [
  { value: 'earning', label: 'Pendapatan (Earning)' },
  { value: 'deduction', label: 'Potongan (Deduction)' },
  { value: 'benefit', label: 'Benefit' },
];

const CATEGORY_OPTIONS = [
  { value: 'basic', label: 'Gaji Pokok' },
  { value: 'allowance', label: 'Tunjangan' },
  { value: 'overtime', label: 'Lembur' },
  { value: 'bpjs', label: 'BPJS' },
  { value: 'tax', label: 'Pajak' },
  { value: 'other', label: 'Lainnya' },
];

const emptyForm = () => ({
  name: '',
  type: 'earning',
  category: 'basic',
  isDefault: false,
  isFixed: true,
  taxable: true,
  sortOrder: '0',
});

export default function SettingsPayrollPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [components, setComponents] = useState<PayrollComponent[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PayrollComponent | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [deleteTarget, setDeleteTarget] = useState<PayrollComponent | null>(null);
  const [saving, setSaving] = useState(false);

  const loadComponents = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<PayrollComponent[]>('/payroll/components');
      setComponents(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat komponen gaji');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadComponents();
  }, [isHR]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  };

  const openEdit = (item: PayrollComponent) => {
    setEditing(item);
    setForm({
      name: item.name,
      type: item.type,
      category: item.category,
      isDefault: item.isDefault,
      isFixed: item.isFixed,
      taxable: item.taxable,
      sortOrder: String(item.sortOrder),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert('Nama komponen wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        type: form.type,
        category: form.category,
        isDefault: form.isDefault,
        isFixed: form.isFixed,
        taxable: form.taxable,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      if (editing) {
        await fetchAPI(`/payroll/components/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Komponen gaji berhasil diperbarui');
      } else {
        await fetchAPI('/payroll/components', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Komponen gaji berhasil ditambahkan');
      }
      setModalOpen(false);
      loadComponents();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan komponen');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchAPI(`/payroll/components/${deleteTarget.id}`, { method: 'DELETE' });
      alert('Komponen gaji berhasil dihapus');
      setDeleteTarget(null);
      loadComponents();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus komponen');
    }
  };

  if (!isHR) {
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
        <span className="text-slate-500">Komponen Gaji</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Komponen Gaji</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola komponen tunjangan, potongan, dan aturan kalkulasi gaji</p>
        </div>
        {isSuperAdmin && (
          <button
            onClick={openCreate}
            className="px-3 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            Tambah Komponen
          </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <DataTable
          headers={['Nama', 'Tipe', 'Kategori', 'Default', 'Fixed', 'Taxable', 'Urutan', 'Aksi']}
          rows={components}
          loading={loading}
          columns={[
            row => row.name,
            row => row.type,
            row => row.category,
            row => (row.isDefault ? 'Ya' : 'Tidak'),
            row => (row.isFixed ? 'Ya' : 'Tidak'),
            row => (row.taxable ? 'Ya' : 'Tidak'),
            row => String(row.sortOrder),
            row => (
              isSuperAdmin ? (
                <TableActionMenu
                  items={[
                    { label: 'Edit', onClick: () => openEdit(row) },
                    { label: 'Hapus', onClick: () => setDeleteTarget(row), variant: 'danger' },
                  ]}
                />
              ) : null
            ),
          ]}
        />
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Komponen Gaji' : 'Tambah Komponen Gaji'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Komponen"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <FormField.Select
            label="Tipe"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            options={TYPE_OPTIONS}
          />
          <FormField.Select
            label="Kategori"
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value })}
            options={CATEGORY_OPTIONS}
          />
          <FormField.Input
            label="Urutan"
            type="number"
            value={form.sortOrder}
            onChange={e => setForm({ ...form, sortOrder: e.target.value })}
          />
          <FormField.Toggle
            label="Default"
            checked={form.isDefault}
            onChange={e => setForm({ ...form, isDefault: e.target.checked })}
          />
          <FormField.Toggle
            label="Fixed Amount"
            checked={form.isFixed}
            onChange={e => setForm({ ...form, isFixed: e.target.checked })}
          />
          <FormField.Toggle
            label="Taxable"
            checked={form.taxable}
            onChange={e => setForm({ ...form, taxable: e.target.checked })}
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
        title="Hapus Komponen"
        message={`Yakin ingin menghapus komponen "${deleteTarget?.name}"?`}
        onConfirm={handleDelete}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
