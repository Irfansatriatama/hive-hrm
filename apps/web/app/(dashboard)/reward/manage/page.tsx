'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';
import { isHRRole, usePermission } from '@/hooks/usePermission';

type TabId = 'catalog' | 'hashtags' | 'settings';

const CATALOG_CATEGORIES = [
  'Voucher',
  'Merchandise',
  'Elektronik',
  'Benefit',
  'Hiburan',
  'Lainnya',
];

const DEFAULT_SETTINGS = {
  max_give_daily: 100,
  max_receive_monthly: 500,
  manager_multiplier: 1.5,
};

export default function RewardManagePage() {
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [activeTab, setActiveTab] = useState<TabId>('catalog');
  const [catalog, setCatalog] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const [catalogModal, setCatalogModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [hashtagModal, setHashtagModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'catalog' | 'hashtag'; id: string; name: string } | null>(null);

  const [catalogForm, setCatalogForm] = useState({
    name: '',
    description: '',
    points: 100,
    stock: 10,
    category: 'Voucher',
    status: 'active',
  });
  const [hashtagForm, setHashtagForm] = useState({
    tag: '',
    description: '',
    status: 'active',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [catData, htData, setData] = await Promise.all([
        fetchAPI<any[]>('/reward/catalog?all=true'),
        fetchAPI<any[]>('/reward/hashtags'),
        fetchAPI<typeof DEFAULT_SETTINGS>('/reward/settings'),
      ]);
      setCatalog(catData);
      setHashtags(htData);
      setSettings({ ...DEFAULT_SETTINGS, ...setData });
    } catch (err) {
      console.error('Failed to load reward manage data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isHR) loadData();
  }, [authLoading, isHR]);

  const openCatalogModal = (item?: any) => {
    if (item) {
      setCatalogForm({
        name: item.name,
        description: item.description,
        points: item.points,
        stock: item.stock,
        category: item.category,
        status: item.status,
      });
    } else {
      setCatalogForm({ name: '', description: '', points: 100, stock: 10, category: 'Voucher', status: 'active' });
    }
    setCatalogModal({ open: true, item: item || null });
  };

  const saveCatalogItem = async () => {
    if (!catalogForm.name.trim() || !catalogForm.description.trim() || catalogForm.points <= 0 || catalogForm.stock < 0) {
      alert('Mohon lengkapi seluruh field dengan data valid');
      return;
    }
    try {
      if (catalogModal.item) {
        await fetchAPI(`/reward/catalog/${catalogModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(catalogForm),
        });
      } else {
        await fetchAPI('/reward/catalog', {
          method: 'POST',
          body: JSON.stringify(catalogForm),
        });
      }
      setCatalogModal({ open: false, item: null });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan item katalog');
    }
  };

  const openHashtagModal = (item?: any) => {
    if (item) {
      setHashtagForm({ tag: item.tag, description: item.description, status: item.status });
    } else {
      setHashtagForm({ tag: '', description: '', status: 'active' });
    }
    setHashtagModal({ open: true, item: item || null });
  };

  const saveHashtag = async () => {
    if (!hashtagForm.tag.trim() || !hashtagForm.description.trim()) {
      alert('Hashtag dan deskripsi wajib diisi');
      return;
    }
    try {
      if (hashtagModal.item) {
        await fetchAPI(`/reward/hashtags/${hashtagModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(hashtagForm),
        });
      } else {
        await fetchAPI('/reward/hashtags', {
          method: 'POST',
          body: JSON.stringify(hashtagForm),
        });
      }
      setHashtagModal({ open: false, item: null });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan hashtag');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'catalog') {
        await fetchAPI(`/reward/catalog/${deleteTarget.id}`, { method: 'DELETE' });
      } else {
        await fetchAPI(`/reward/hashtags/${deleteTarget.id}`, { method: 'DELETE' });
      }
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus data');
    }
  };

  const saveSettings = async () => {
    try {
      await fetchAPI('/reward/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      alert('Aturan penilaian poin berhasil diperbarui');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    }
  };

  const tabs = [
    { id: 'catalog' as TabId, label: 'Katalog Reward', icon: Lucide.Gift },
    { id: 'hashtags' as TabId, label: 'Kelola Hashtag', icon: Lucide.Hash },
    { id: 'settings' as TabId, label: 'Aturan Poin', icon: Lucide.Settings },
  ];

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat mengelola katalog reward.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Pengaturan Reward & Gamifikasi</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola katalog hadiah penukaran poin, edit daftar nilai perusahaan, dan ubah aturan multiplier poin.</p>
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
        ) : activeTab === 'catalog' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openCatalogModal()} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Item Catalog</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Item</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Biaya Poin</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Stok</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {catalog.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">Belum ada item katalog reward terdaftar.</td></tr>
                  ) : catalog.map((r) => (
                    <tr key={r.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{r.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{r.description}</td>
                      <td className="px-6 py-4 font-bold text-primary font-mono">{r.points} Pts</td>
                      <td className="px-6 py-4 font-bold text-slate-700 font-mono">{r.stock} Unit</td>
                      <td className="px-6 py-4 capitalize font-medium text-slate-400">{r.category}</td>
                      <td className="px-6 py-4 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Edit', onClick: () => openCatalogModal(r), variant: 'primary' },
                            {
                              label: 'Hapus',
                              onClick: () => setDeleteTarget({ type: 'catalog', id: r.id, name: r.name }),
                              variant: 'danger',
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'hashtags' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openHashtagModal()} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Hashtag</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Hashtag</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Total Pemakaian</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {hashtags.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-400">Belum ada hashtag terdaftar.</td></tr>
                  ) : hashtags.map((h) => (
                    <tr key={h.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800">{h.tag}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-md truncate">{h.description}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 font-mono">{h.usageCount} Kali</td>
                      <td className="px-6 py-4"><Badge status={h.status} /></td>
                      <td className="px-6 py-4 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Edit', onClick: () => openHashtagModal(h), variant: 'primary' },
                            {
                              label: 'Hapus',
                              onClick: () => setDeleteTarget({ type: 'hashtag', id: h.id, name: h.tag }),
                              variant: 'danger',
                            },
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
          <div className="max-w-2xl space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField.Input label="Maksimal Pengiriman Harian (Poin)" id="setr-give-limit" type="number" required value={settings.max_give_daily} onChange={(e) => setSettings({ ...settings, max_give_daily: parseInt(e.target.value) || 0 })} />
              <FormField.Input label="Maksimal Penerimaan Bulanan (Poin)" id="setr-receive-limit" type="number" required value={settings.max_receive_monthly} onChange={(e) => setSettings({ ...settings, max_receive_monthly: parseInt(e.target.value) || 0 })} />
              <FormField.Input label="Pengali Nilai Poin Manager (Multiplier)" id="setr-multiplier" type="number" required value={settings.manager_multiplier} onChange={(e) => setSettings({ ...settings, manager_multiplier: parseFloat(e.target.value) || 1.5 })} />
            </div>
            <div className="flex justify-end pt-4">
              <button onClick={saveSettings} className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer">Simpan Aturan</button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={catalogModal.open}
        onClose={() => setCatalogModal({ open: false, item: null })}
        title={catalogModal.item ? `Edit Item: ${catalogModal.item.name}` : 'Tambah Item Reward Baru'}
        size="lg"
        footer={
          <>
            <button onClick={() => setCatalogModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={saveCatalogItem} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan Item</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Item" required value={catalogForm.name} onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })} />
          <FormField.Textarea label="Deskripsi Singkat" required rows={2} value={catalogForm.description} onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <FormField.Input label="Biaya Poin" type="number" required value={catalogForm.points} onChange={(e) => setCatalogForm({ ...catalogForm, points: parseInt(e.target.value) || 0 })} />
            <FormField.Input label="Stok Tersedia" type="number" required value={catalogForm.stock} onChange={(e) => setCatalogForm({ ...catalogForm, stock: parseInt(e.target.value) || 0 })} />
            <FormField.Select label="Kategori" value={catalogForm.category} onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })} options={CATALOG_CATEGORIES.map(c => ({ value: c, label: c }))} />
          </div>
          <FormField.Select label="Status Item" value={catalogForm.status} onChange={(e) => setCatalogForm({ ...catalogForm, status: e.target.value })} options={[{ value: 'active', label: 'Aktif / Tampilkan' }, { value: 'inactive', label: 'Nonaktif / Sembunyikan' }]} />
        </div>
      </Modal>

      <Modal
        isOpen={hashtagModal.open}
        onClose={() => setHashtagModal({ open: false, item: null })}
        title={hashtagModal.item ? `Edit Hashtag: ${hashtagModal.item.tag}` : 'Tambah Hashtag Nilai Perusahaan Baru'}
        size="md"
        footer={
          <>
            <button onClick={() => setHashtagModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={saveHashtag} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan Hashtag</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Hashtag Nilai Perusahaan" required placeholder="Contoh: #Jujur, #Bertumbuh" value={hashtagForm.tag} onChange={(e) => setHashtagForm({ ...hashtagForm, tag: e.target.value })} />
          <FormField.Textarea label="Deskripsi" required rows={2} value={hashtagForm.description} onChange={(e) => setHashtagForm({ ...hashtagForm, description: e.target.value })} />
          <FormField.Select label="Status Hashtag" value={hashtagForm.status} onChange={(e) => setHashtagForm({ ...hashtagForm, status: e.target.value })} options={[{ value: 'active', label: 'Aktif / Tampilkan' }, { value: 'inactive', label: 'Nonaktif / Sembunyikan' }]} />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={deleteTarget?.type === 'catalog' ? 'Hapus Item Catalog' : 'Hapus Hashtag'}
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"?`}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
