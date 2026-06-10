'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatRupiah } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

type TabId = 'limits' | 'categories' | 'vendors';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'limits', label: 'Limit Jabatan', icon: Lucide.DollarSign },
  { id: 'categories', label: 'Kategori Item', icon: Lucide.Grid3x3 },
  { id: 'vendors', label: 'Daftar Vendor', icon: Lucide.Truck },
];

export default function SettingsProcurementPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('limits');
  const [loading, setLoading] = useState(true);

  const [limits, setLimits] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  const [catModal, setCatModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [vendorModal, setVendorModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'category' | 'vendor'; id: string; name: string } | null>(null);

  const [catForm, setCatForm] = useState({ name: '', code: '', tax: '11' });
  const [vendorForm, setVendorForm] = useState({ name: '', npwp: '', contact: '', category: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [limitData, catData, vendorData] = await Promise.all([
        fetchAPI<any[]>('/settings/procurement/limits'),
        fetchAPI<any[]>('/settings/procurement/categories'),
        fetchAPI<any[]>('/settings/procurement/vendors'),
      ]);
      setLimits(limitData);
      setCategories(catData);
      setVendors(vendorData);
    } catch (err) {
      console.error('Failed to load procurement settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadData();
  }, [isHR]);

  const updateLimitVal = (idx: number, val: number) => {
    setLimits((prev) => prev.map((l, i) => (i === idx ? { ...l, limit: val } : l)));
  };

  const saveLimits = async () => {
    try {
      await fetchAPI('/settings/procurement/limits', {
        method: 'PUT',
        body: JSON.stringify({ limits }),
      });
      alert('Ambang batas limit belanja jabatan berhasil diperbarui');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan limit');
    }
  };

  const openCatModal = (item?: any) => {
    if (item) {
      setCatForm({ name: item.name, code: item.code, tax: String(item.tax) });
    } else {
      setCatForm({ name: '', code: '', tax: '11' });
    }
    setCatModal({ open: true, item: item || null });
  };

  const saveCategory = async () => {
    if (!catForm.name.trim() || !catForm.code.trim()) {
      alert('Nama kategori dan kode singkat wajib diisi!');
      return;
    }
    try {
      const payload = { name: catForm.name, code: catForm.code, tax: parseFloat(catForm.tax) || 0 };
      if (catModal.item) {
        await fetchAPI(`/settings/procurement/categories/${catModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Kategori pengadaan berhasil diperbarui');
      } else {
        await fetchAPI('/settings/procurement/categories', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Kategori pengadaan baru berhasil ditambahkan');
      }
      setCatModal({ open: false, item: null });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan kategori');
    }
  };

  const openVendorModal = (item?: any) => {
    if (item) {
      setVendorForm({
        name: item.name,
        npwp: item.npwp || '',
        contact: item.contact || '',
        category: item.category || '',
      });
    } else {
      setVendorForm({ name: '', npwp: '', contact: '', category: categories[0]?.name || '' });
    }
    setVendorModal({ open: true, item: item || null });
  };

  const saveVendor = async () => {
    if (!vendorForm.name.trim() || !vendorForm.npwp.trim() || !vendorForm.contact.trim()) {
      alert('Mohon lengkapi seluruh field!');
      return;
    }
    try {
      if (vendorModal.item) {
        await fetchAPI(`/settings/procurement/vendors/${vendorModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(vendorForm),
        });
        alert('Data vendor berhasil diperbarui');
      } else {
        await fetchAPI('/settings/procurement/vendors', {
          method: 'POST',
          body: JSON.stringify(vendorForm),
        });
        alert('Vendor baru berhasil didaftarkan');
      }
      setVendorModal({ open: false, item: null });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan vendor');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'category') {
        await fetchAPI(`/settings/procurement/categories/${deleteTarget.id}`, { method: 'DELETE' });
        alert('Kategori barang berhasil dihapus');
      } else {
        await fetchAPI(`/settings/procurement/vendors/${deleteTarget.id}`, { method: 'DELETE' });
        alert('Data vendor berhasil dihapus');
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
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
        <span className="text-slate-500">Procurement</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Konfigurasi Kebijakan Pengadaan PO</h1>
          <p className="text-xs text-slate-400 mt-1">
            Atur ambang batas pengeluaran (limit), kategori barang pengadaan, dan daftarkan vendor/supplier.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-2xl border-x border-t border-slate-100 shadow-sm flex overflow-x-auto select-none">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border-x border-b border-slate-100 shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'limits' ? (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider w-24">Grade Jabatan</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Deskripsi Jabatan</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Limit Maksimal PO</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Format Rupiah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {limits.map((l, idx) => (
                    <tr key={l.grade} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{l.grade}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{l.title}</td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={l.limit}
                          onChange={(e) => updateLimitVal(idx, parseFloat(e.target.value) || 0)}
                          className="w-44 px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
                        />
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono">{formatRupiah(l.limit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end">
              <button
                onClick={saveLimits}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
              >
                Simpan Limit Pengadaan
              </button>
            </div>
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
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Kode Singkat</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Pajak Default</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {categories.map((c) => (
                    <tr key={c.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{c.displayId || c.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{c.name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600 font-mono">{c.code}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{c.tax}% Tax / Pajak</td>
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
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openVendorModal()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Vendor</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Vendor</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">NPWP</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Kontak PIC</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Kategori Bidang</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {vendors.map((v) => (
                    <tr key={v.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{v.name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-600 font-mono">{v.npwp}</td>
                      <td className="px-6 py-4 text-slate-600 font-semibold">{v.contact}</td>
                      <td className="px-6 py-4 text-slate-500 font-semibold">{v.category}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Edit', onClick: () => openVendorModal(v), variant: 'primary' },
                            { label: 'Hapus', onClick: () => setDeleteTarget({ type: 'vendor', id: v.id, name: v.name }), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={catModal.open}
        onClose={() => setCatModal({ open: false, item: null })}
        title={catModal.item ? 'Edit Kategori Barang' : 'Tambah Kategori Baru'}
        footer={
          <>
            <button onClick={() => setCatModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={saveCategory} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Kategori Barang" required value={catForm.name} onChange={(e) => setCatForm({ ...catForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Kode Singkat (Short Code)" required placeholder="Contoh: ELK" value={catForm.code} onChange={(e) => setCatForm({ ...catForm, code: e.target.value })} />
            <FormField.Input label="Pajak Default (%)" type="number" required value={catForm.tax} onChange={(e) => setCatForm({ ...catForm, tax: e.target.value })} />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={vendorModal.open}
        onClose={() => setVendorModal({ open: false, item: null })}
        title={vendorModal.item ? `Edit Vendor: ${vendorModal.item.name}` : 'Daftarkan Vendor Baru'}
        footer={
          <>
            <button onClick={() => setVendorModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={saveVendor} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Vendor Resmi" required value={vendorForm.name} onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })} />
          <FormField.Input label="NPWP Badan Usaha" required value={vendorForm.npwp} onChange={(e) => setVendorForm({ ...vendorForm, npwp: e.target.value })} />
          <FormField.Input label="Kontak / Email PIC Vendor" required value={vendorForm.contact} onChange={(e) => setVendorForm({ ...vendorForm, contact: e.target.value })} />
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Kategori Bidang</label>
            <select
              value={vendorForm.category}
              onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
              className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="Lain-lain">Lain-lain / Miscellaneous</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'category' ? 'Hapus Kategori Barang' : 'Hapus Rekomendasi Vendor'}
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
