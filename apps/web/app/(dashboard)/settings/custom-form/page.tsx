'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';

const defaultForms = [
  { id: 'F001', name: 'Form Perubahan Data Karyawan', module: 'employee', fields: 8, status: 'active' },
  { id: 'F002', name: 'Form Pengajuan Lembur', module: 'attendance', fields: 5, status: 'active' },
  { id: 'F003', name: 'Form Reimbursement', module: 'finance', fields: 6, status: 'inactive' },
];

export default function SettingsCustomFormPage() {
  const { user } = useAuth();
  const [forms, setForms] = useState(defaultForms);
  const [showAdd, setShowAdd] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', module: 'employee' });

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newForm.name.trim()) return;
    setForms([
      ...forms,
      { id: `F00${forms.length + 1}`, name: newForm.name, module: newForm.module, fields: 0, status: 'active' },
    ]);
    setNewForm({ name: '', module: 'employee' });
    setShowAdd(false);
    alert('Form kustom berhasil ditambahkan.');
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/settings" className="text-slate-400 hover:text-primary transition">
            <Lucide.ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Custom Form</h1>
            <p className="text-xs text-slate-400 mt-1">Kelola formulir kustom pengajuan internal.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
        >
          <Lucide.Plus className="w-4 h-4" /> Tambah Form
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField.Input label="Nama Form" required value={newForm.name} onChange={(e) => setNewForm({ ...newForm, name: e.target.value })} />
          <FormField.Select
            label="Modul"
            options={[
              { value: 'employee', label: 'Employee' },
              { value: 'attendance', label: 'Attendance' },
              { value: 'leave', label: 'Leave' },
              { value: 'finance', label: 'Finance' },
            ]}
            value={newForm.module}
            onChange={(e) => setNewForm({ ...newForm, module: e.target.value })}
          />
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Simpan</button>
          </div>
        </form>
      )}

      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <DataTable
          headers={['ID', 'Nama Form', 'Modul', 'Jumlah Field', 'Status']}
          rows={forms}
          columns={['id', 'name', 'module', 'fields', (row) => <Badge status={row.status} />]}
        />
      </div>
    </div>
  );
}
