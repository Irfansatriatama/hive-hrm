'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';
import Avatar from '@/components/shared/Avatar';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', category: 'HR', fileType: 'PDF', isPublic: false });

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/core/documents');
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/core/documents', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      alert('Dokumen berhasil diunggah!');
      setForm({ name: '', category: 'HR', fileType: 'PDF', isPublic: false });
      setShowForm(false);
      loadDocuments();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah dokumen');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '-';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${(bytes / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
  };

  const filtered = documents.filter(
    (d) =>
      search === '' ||
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Dokumen Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola dan akses dokumen HR, kebijakan, dan formulir perusahaan.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5">
          <Lucide.Upload className="w-4 h-4" /> Upload Dokumen
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField.Input label="Nama Dokumen" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <FormField.Select
            label="Kategori"
            options={[
              { value: 'HR', label: 'HR' },
              { value: 'Policy', label: 'Kebijakan' },
              { value: 'Contract', label: 'Kontrak' },
              { value: 'Form', label: 'Formulir' },
            ]}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <FormField.Select
            label="Tipe File"
            options={[
              { value: 'PDF', label: 'PDF' },
              { value: 'DOCX', label: 'Word' },
              { value: 'XLSX', label: 'Excel' },
            ]}
            value={form.fileType}
            onChange={(e) => setForm({ ...form, fileType: e.target.value })}
          />
          <label className="flex items-center gap-2 cursor-pointer sm:col-span-2">
            <input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} className="rounded" />
            <span className="text-xs text-slate-700">Dokumen publik (dapat diakses semua karyawan)</span>
          </label>
          <div className="sm:col-span-2">
            <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer">Upload</button>
          </div>
        </form>
      )}

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari dokumen..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <DataTable
          headers={['Nama', 'Kategori', 'Tipe', 'Ukuran', 'Pemilik', 'Tanggal', 'Akses']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => (
              <div className="flex items-center gap-2">
                <Lucide.FileText className="w-4 h-4 text-primary shrink-0" />
                <span className="text-xs font-semibold text-slate-800">{row.name}</span>
              </div>
            ),
            'category',
            'fileType',
            (row) => <span className="text-xs text-slate-500">{formatFileSize(row.fileSize)}</span>,
            (row) =>
              row.employee ? (
                <div className="flex items-center gap-2">
                  <Avatar name={row.employee.fullName} size="sm" />
                  <span className="text-xs">{row.employee.fullName}</span>
                </div>
              ) : (
                <span className="text-xs text-slate-400">Perusahaan</span>
              ),
            (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
            (row) => <Badge status={row.isPublic ? 'approved' : 'pending'} />,
          ]}
          actions={(row) => (
            <a href={row.fileUrl} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary font-bold hover:underline">
              Unduh
            </a>
          )}
          emptyText="Belum ada dokumen."
        />
      </div>
    </div>
  );
}
