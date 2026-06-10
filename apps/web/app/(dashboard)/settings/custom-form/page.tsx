'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

type FieldType = 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'file';

interface FormFieldDef {
  type: FieldType;
  label: string;
  placeholder?: string;
  required: boolean;
  help?: string;
  options?: string;
}

interface ActiveFormState {
  name: string;
  fields: FormFieldDef[];
}

const DEFAULT_ACTIVE_FORM: ActiveFormState = {
  name: 'Formulir Survei Kepuasan',
  fields: [
    { type: 'text', label: 'Nama Lengkap', placeholder: 'Ketik nama lengkap Anda...', required: true, help: 'Tulis nama resmi sesuai KTP' },
    { type: 'select', label: 'Divisi / Departemen', placeholder: '', required: true, help: 'Pilih divisi utama saat ini', options: 'Teknologi, HR, Finance, Marketing' },
    { type: 'textarea', label: 'Feedback / Kritik & Saran', placeholder: 'Tulis aspirasi Anda...', required: false, help: '' },
  ],
};

const FIELD_DEFAULTS: Record<string, Partial<FormFieldDef>> = {
  text: { label: 'Field Teks Pendek Baru', placeholder: '' },
  textarea: { label: 'Field Paragraf Baru', placeholder: '' },
  select: { label: 'Pilihan Dropdown Baru', options: 'Opsi 1, Opsi 2, Opsi 3' },
  file: { label: 'Unggah Berkas Baru', placeholder: '' },
  number: { label: 'Input Angka Baru', placeholder: '' },
  date: { label: 'Input Tanggal Baru', placeholder: '' },
  checkbox: { label: 'Opsi Checkbox Baru', placeholder: '' },
};

export default function SettingsCustomFormPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedForms, setSavedForms] = useState<any[]>([]);
  const [activeForm, setActiveForm] = useState<ActiveFormState>(DEFAULT_ACTIVE_FORM);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const loadForms = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/settings/custom-forms');
      setSavedForms(data);
    } catch (err) {
      console.error('Failed to load custom forms:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadForms();
  }, [isHR]);

  const addField = (type: FieldType) => {
    const defaults = FIELD_DEFAULTS[type] || { label: 'Input Baru' };
    setActiveForm((prev) => ({
      ...prev,
      fields: [
        ...prev.fields,
        {
          type,
          label: defaults.label || 'Input Baru',
          placeholder: defaults.placeholder || '',
          required: false,
          help: '',
          options: type === 'select' ? (defaults.options || 'Opsi 1, Opsi 2') : '',
        },
      ],
    }));
  };

  const removeField = (idx: number) => {
    setActiveForm((prev) => ({
      ...prev,
      fields: prev.fields.filter((_, i) => i !== idx),
    }));
  };

  const updateField = (idx: number, prop: keyof FormFieldDef, value: unknown) => {
    setActiveForm((prev) => ({
      ...prev,
      fields: prev.fields.map((f, i) => (i === idx ? { ...f, [prop]: value } : f)),
    }));
  };

  const saveForm = async () => {
    if (!activeForm.name.trim()) {
      alert('Nama formulir wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await fetchAPI('/settings/custom-forms', {
        method: 'POST',
        body: JSON.stringify({ name: activeForm.name, fields: activeForm.fields }),
      });
      alert('Formulir kustom berhasil disimpan & dipublikasikan');
      setActiveForm({
        name: 'Formulir Kustom Baru',
        fields: [{ type: 'text', label: 'Input Teks Pertama', placeholder: '', required: false, help: '' }],
      });
      loadForms();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan formulir');
    } finally {
      setSaving(false);
    }
  };

  const loadForm = async (id: string) => {
    try {
      const form = await fetchAPI<any>(`/settings/custom-forms/${id}`);
      setActiveForm({
        name: form.name,
        fields: (form.fields as FormFieldDef[]) || [],
      });
      alert(`Berhasil memuat formulir: ${form.name}`);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat formulir');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchAPI(`/settings/custom-forms/${deleteTarget.id}`, { method: 'DELETE' });
      alert('Formulir berhasil dihapus');
      setDeleteTarget(null);
      loadForms();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus formulir');
    }
  };

  const renderPreviewField = (fd: FormFieldDef, idx: number) => {
    const requiredMark = fd.required ? <span className="text-red-500"> *</span> : null;

    if (fd.type === 'textarea') {
      return (
        <FormField.Textarea
          key={idx}
          label={fd.label}
          placeholder={fd.placeholder}
          required={fd.required}
          rows={3}
        />
      );
    }
    if (fd.type === 'select') {
      const opts = (fd.options || '').split(',').map((o) => ({ value: o.trim(), label: o.trim() })).filter((o) => o.value);
      return (
        <FormField.Select
          key={idx}
          label={fd.label}
          required={fd.required}
          options={opts.length ? opts : [{ value: '', label: '—' }]}
          value=""
          onChange={() => {}}
        />
      );
    }
    if (fd.type === 'checkbox') {
      return (
        <label key={idx} className="flex items-center gap-2.5 py-1 select-none">
          <input type="checkbox" className="w-4 h-4 rounded border-slate-300 text-primary" readOnly />
          <span className="text-xs text-slate-700 font-semibold">{fd.label}{requiredMark}</span>
        </label>
      );
    }
    if (fd.type === 'file') {
      return (
        <div key={idx}>
          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
            {fd.label}{requiredMark}
          </label>
          <input type="file" className="block w-full text-xs text-slate-500" disabled />
        </div>
      );
    }

    return (
      <FormField.Input
        key={idx}
        label={fd.label}
        type={fd.type === 'number' || fd.type === 'date' ? fd.type : 'text'}
        placeholder={fd.placeholder}
        required={fd.required}
      />
    );
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
        <span className="text-slate-500">Form Builder</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Kustom Form Builder</h1>
          <p className="text-xs text-slate-400 mt-1">
            Rancang formulir dinamis secara interaktif untuk survei internal, audit lapangan, dan checklist HR.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none pb-4 border-b border-slate-100">
            <div className="w-full sm:max-w-xs">
              <FormField.Input
                label="Nama Formulir"
                required
                value={activeForm.name}
                onChange={(e) => setActiveForm({ ...activeForm, name: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-4 sm:pt-0">
              {(['text', 'textarea', 'select', 'file'] as FieldType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addField(type)}
                  className="px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-lg text-[10px] font-bold tracking-wide transition uppercase cursor-pointer"
                >
                  + {type === 'text' ? 'Short Text' : type === 'textarea' ? 'Paragraph' : type === 'select' ? 'Dropdown' : 'File Upload'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
            {activeForm.fields.map((fd, idx) => (
              <div key={idx} className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl relative space-y-3">
                <button
                  type="button"
                  onClick={() => removeField(idx)}
                  className="absolute top-3 right-3 text-red-500 hover:text-red-700 cursor-pointer"
                >
                  <Lucide.Trash2 className="w-4 h-4" />
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Tipe Field</label>
                    <select
                      value={fd.type}
                      onChange={(e) => updateField(idx, 'type', e.target.value)}
                      className="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="text">Short Text</option>
                      <option value="textarea">Paragraph Text</option>
                      <option value="number">Number</option>
                      <option value="date">Date Picker</option>
                      <option value="select">Dropdown List</option>
                      <option value="checkbox">Checkbox Option</option>
                      <option value="file">File Upload</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Wajib Diisi (Required)</label>
                    <select
                      value={fd.required ? 'true' : 'false'}
                      onChange={(e) => updateField(idx, 'required', e.target.value === 'true')}
                      className="block w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="true">Ya / Yes</option>
                      <option value="false">Tidak / No</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Label</label>
                    <input
                      type="text"
                      value={fd.label}
                      onChange={(e) => updateField(idx, 'label', e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Placeholder</label>
                    <input
                      type="text"
                      value={fd.placeholder || ''}
                      onChange={(e) => updateField(idx, 'placeholder', e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {fd.type === 'select' && (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Pilihan Dropdown (Pisahkan dengan Koma)
                    </label>
                    <input
                      type="text"
                      value={fd.options || ''}
                      placeholder="Contoh: Sangat Puas, Cukup, Kurang"
                      onChange={(e) => updateField(idx, 'options', e.target.value)}
                      className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Help Text / Sub-keterangan</label>
                  <input
                    type="text"
                    value={fd.help || ''}
                    onChange={(e) => updateField(idx, 'help', e.target.value)}
                    className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end select-none">
            <button
              onClick={saveForm}
              disabled={saving}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            >
              <Lucide.Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Menyimpan...' : 'Simpan & Publikasikan'}</span>
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">
            Pratinjau Realtime (Realtime Preview)
          </h2>
          <div className="bg-slate-50 border border-dashed border-slate-200 p-5 rounded-2xl space-y-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">
              {activeForm.name || 'Untitled Form'}
            </h3>
            <div className="space-y-4 pointer-events-none">
              {activeForm.fields.map((fd, idx) => (
                <div key={idx} className="space-y-1">
                  {renderPreviewField(fd, idx)}
                  {fd.help ? (
                    <p className="text-[10px] text-slate-400 font-semibold italic mt-0.5">{fd.help}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col gap-4">
        <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">
          Formulir Kustom Tersimpan
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  <th className="px-6 py-3.5">Nama Form</th>
                  <th className="px-6 py-3.5">Jumlah Field</th>
                  <th className="px-6 py-3.5">Tanggal Dibuat</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {savedForms.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-center text-slate-400 select-none">
                      Belum ada formulir kustom tersimpan
                    </td>
                  </tr>
                ) : (
                  savedForms.map((f) => (
                    <tr key={f.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-800">{f.name}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-800 font-mono">
                        {(f.fields || []).length} Inputs
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono">
                        {formatDate(f.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-bold select-none border border-green-100 text-[10px]">
                          Aktif / Active
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Load', onClick: () => loadForm(f.id), variant: 'primary' },
                            { label: 'Hapus', onClick: () => setDeleteTarget({ id: f.id, name: f.name }), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Formulir Kustom"
        message={`Apakah Anda yakin ingin menghapus formulir "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
