'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

type TabId = 'categories' | 'locations' | 'rules';

const DEFAULT_RULES = {
  max_duration_days: 30,
  approval_levels_count: 1,
  allow_external_use: true,
};

export default function SettingsAssetsPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('categories');
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [loading, setLoading] = useState(true);

  const [catModal, setCatModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [locModal, setLocModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'location'; id: string; name: string } | null>(null);

  const [catForm, setCatForm] = useState({ name: '', description: '' });
  const [locForm, setLocForm] = useState({ name: '', address: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, locData, rulesData] = await Promise.all([
        fetchAPI<any[]>('/core/assets/categories'),
        fetchAPI<any[]>('/core/assets/locations'),
        fetchAPI<typeof DEFAULT_RULES>('/core/assets/settings/rules'),
      ]);
      setCategories(catData);
      setLocations(locData);
      setRules({ ...DEFAULT_RULES, ...rulesData });
    } catch (err) {
      console.error('Failed to load asset settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadData();
  }, [isHR]);

  const openCatModal = (item?: any) => {
    if (item) {
      setCatForm({ name: item.name, description: item.description || '' });
    } else {
      setCatForm({ name: '', description: '' });
    }
    setCatModal({ open: true, item: item || null });
  };

  const saveCategory = async () => {
    if (!catForm.name.trim()) {
      alert('Nama kategori wajib diisi!');
      return;
    }
    try {
      if (catModal.item) {
        await fetchAPI(`/core/assets/categories/${catModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(catForm),
        });
      } else {
        await fetchAPI('/core/assets/categories', {
          method: 'POST',
          body: JSON.stringify(catForm),
        });
      }
      setCatModal({ open: false, item: null });
      alert('Kategori aset berhasil disimpan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    }
  };

  const openLocModal = (item?: any) => {
    if (item) {
      setLocForm({ name: item.name, address: item.address || '' });
    } else {
      setLocForm({ name: '', address: '' });
    }
    setLocModal({ open: true, item: item || null });
  };

  const saveLocation = async () => {
    if (!locForm.name.trim() || !locForm.address.trim()) {
      alert('Nama lokasi dan alamat lengkap wajib diisi!');
      return;
    }
    try {
      if (locModal.item) {
        await fetchAPI(`/core/assets/locations/${locModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(locForm),
        });
      } else {
        await fetchAPI('/core/assets/locations', {
          method: 'POST',
          body: JSON.stringify(locForm),
        });
      }
      setLocModal({ open: false, item: null });
      alert('Lokasi inventori berhasil disimpan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan lokasi');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await fetchAPI(`/core/assets/categories/${deleteTarget.id}`, { method: 'DELETE' });
      } else {
        await fetchAPI(`/core/assets/locations/${deleteTarget.id}`, { method: 'DELETE' });
      }
      setDeleteTarget(null);
      alert(deleteTarget.type === 'category' ? 'Kategori aset berhasil dihapus' : 'Lokasi inventori berhasil dihapus');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const saveRules = async () => {
    try {
      await fetchAPI('/core/assets/settings/rules', {
        method: 'PUT',
        body: JSON.stringify(rules),
      });
      alert('Konfigurasi regulasi peminjaman aset berhasil disimpan');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan aturan');
    }
  };

  const tabs = [
    { id: 'categories' as TabId, label: 'Kategori Aset', icon: Lucide.Package },
    { id: 'locations' as TabId, label: 'Lokasi Gudang', icon: Lucide.MapPin },
    { id: 'rules' as TabId, label: 'Aturan Pinjam', icon: Lucide.FileCheck },
  ];

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat mengakses konfigurasi aset.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/settings" className="hover:text-slate-600 font-medium">
          Pengaturan
        </Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">Aset</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Konfigurasi Manajemen Aset</h1>
          <p className="text-xs text-slate-400 mt-1">
            Atur klasifikasi kategori aset barang kantor, lokasi inventori, dan regulasi batas peminjaman.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-2xl border-x border-t border-slate-100 shadow-sm flex select-none overflow-x-auto">
        {tabs.map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border-x border-b border-slate-100 shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'categories' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openCatModal()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Kategori</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider w-24">ID</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Kategori</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Deskripsi Tipe Barang</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categories.map((c) => (
                    <tr key={c.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{c.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-sm truncate">{c.description || '-'}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Edit', onClick: () => openCatModal(c), variant: 'primary' },
                            { label: 'Hapus', onClick: () => setDeleteTarget({ type: 'category', id: c.id, name: c.name }), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'locations' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openLocModal()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Lokasi</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider w-24">ID</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Lokasi / Gudang</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Detail Alamat Penyimpanan</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {locations.map((l) => (
                    <tr key={l.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{l.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{l.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-sm truncate">{l.address}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Edit', onClick: () => openLocModal(l), variant: 'primary' },
                            { label: 'Hapus', onClick: () => setDeleteTarget({ type: 'location', id: l.id, name: l.name }), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="max-w-md space-y-5 select-none">
            <FormField.Input
              label="Maksimal Durasi Pinjam (Hari)"
              type="number"
              required
              value={rules.max_duration_days}
              onChange={(e) => setRules({ ...rules, max_duration_days: parseInt(e.target.value, 10) || 30 })}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Tingkat Approval
              </label>
              <select
                value={rules.approval_levels_count}
                onChange={(e) => setRules({ ...rules, approval_levels_count: parseInt(e.target.value, 10) || 1 })}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value={1}>1 Tingkat - Persetujuan Langsung Atasan (Manager)</option>
                <option value={2}>2 Tingkat - Persetujuan Atasan + Verifikasi HR Admin</option>
              </select>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rules.allow_external_use}
                onChange={(e) => setRules({ ...rules, allow_external_use: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-slate-700">Izinkan Penggunaan di Luar Kantor (WFH)</span>
            </label>
            <div className="flex justify-end pt-3">
              <button
                onClick={saveRules}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
              >
                Simpan Parameter Aturan
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={catModal.open}
        onClose={() => setCatModal({ open: false, item: null })}
        title={catModal.item ? 'Edit Kategori Aset' : 'Tambah Kategori Aset Baru'}
        size="md"
        footer={
          <>
            <button onClick={() => setCatModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">
              Batal
            </button>
            <button onClick={saveCategory} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">
              Simpan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Kategori Aset" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
          <FormField.Textarea label="Deskripsi" rows={2} value={catForm.description} onChange={(e) => setCatForm({ ...catForm, description: e.target.value })} />
        </div>
      </Modal>

      <Modal
        isOpen={locModal.open}
        onClose={() => setLocModal({ open: false, item: null })}
        title={locModal.item ? 'Edit Lokasi Gudang' : 'Tambah Lokasi Baru'}
        size="md"
        footer={
          <>
            <button onClick={() => setLocModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">
              Batal
            </button>
            <button onClick={saveLocation} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">
              Simpan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Lokasi Gudang" required value={locForm.name} onChange={(e) => setLocForm({ ...locForm, name: e.target.value })} />
          <FormField.Textarea label="Detail Alamat Lengkap" required rows={2} value={locForm.address} onChange={(e) => setLocForm({ ...locForm, address: e.target.value })} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'category' ? 'Hapus Kategori Aset' : 'Hapus Lokasi Inventori'}
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
