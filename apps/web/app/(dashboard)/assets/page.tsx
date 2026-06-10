'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

type TabId = 'inventory' | 'requests' | 'history';

const STATUS_LABELS: Record<string, string> = {
  available: 'Tersedia',
  in_use: 'Dipakai',
  in_repair: 'Dalam Servis',
  disposed: 'Dihapus',
};

function normalizeAssetStatus(status?: string): string {
  const map: Record<string, string> = {
    available: 'available',
    'in use': 'in_use',
    in_use: 'in_use',
    in_repair: 'in_repair',
    disposed: 'disposed',
  };
  return map[status?.toLowerCase() || ''] || status?.toLowerCase() || 'available';
}

function statusBadge(status?: string) {
  const normalized = normalizeAssetStatus(status);
  const label = STATUS_LABELS[normalized] || status || '-';
  const styles: Record<string, string> = {
    available: 'bg-green-50 text-green-700 border-green-100',
    in_use: 'bg-blue-50 text-blue-700 border-blue-100',
    in_repair: 'bg-amber-50 text-amber-700 border-amber-100',
    disposed: 'bg-red-50 text-red-700 border-red-100',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full font-bold border text-[10px] ${styles[normalized] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
      {label}
    </span>
  );
}

const EMPTY_ASSET_FORM = {
  name: '',
  category: '',
  serialNumber: '',
  brand: '',
  model: '',
  purchaseDate: '',
  purchasePrice: '',
  location: '',
  condition: 'good',
};

export default function AssetsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('inventory');
  const [assets, setAssets] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [assetModal, setAssetModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [assignModal, setAssignModal] = useState<{ open: boolean; assetId: string }>({ open: false, assetId: '' });
  const [requestModal, setRequestModal] = useState(false);
  const [returnTarget, setReturnTarget] = useState<string | null>(null);

  const [assetForm, setAssetForm] = useState(EMPTY_ASSET_FORM);
  const [assigneeId, setAssigneeId] = useState('');
  const [requestForm, setRequestForm] = useState({ assetName: '', duration: 5, reason: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [assetsData, requestsData, historyData, catData, locData, empData] = await Promise.all([
        fetchAPI<any[]>('/core/assets'),
        fetchAPI<any[]>('/core/assets/requests/list'),
        fetchAPI<any[]>('/core/assets/history/list'),
        fetchAPI<any[]>('/core/assets/categories'),
        fetchAPI<any[]>('/core/assets/locations'),
        isAdmin ? fetchAPI<{ employees: any[] }>('/employees?limit=1000') : Promise.resolve({ employees: [] }),
      ]);
      setAssets(assetsData);
      setRequests(requestsData);
      setHistory(historyData);
      setCategories(catData);
      setLocations(locData);
      setEmployees(empData.employees || []);
    } catch (err) {
      console.error('Failed to load assets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin]);

  const openAssetModal = (item?: any) => {
    if (item) {
      setAssetForm({
        name: item.name || '',
        category: item.category || '',
        serialNumber: item.serialNumber || '',
        brand: item.brand || '',
        model: item.model || '',
        purchaseDate: item.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
        purchasePrice: item.purchasePrice ? String(item.purchasePrice) : '',
        location: item.location || '',
        condition: item.condition || 'good',
      });
    } else {
      setAssetForm({
        ...EMPTY_ASSET_FORM,
        category: categories[0]?.name || '',
        location: '',
      });
    }
    setAssetModal({ open: true, item: item || null });
  };

  const saveAsset = async () => {
    if (!assetForm.name.trim() || !assetForm.serialNumber.trim()) {
      alert('Nama aset dan nomor serial wajib diisi!');
      return;
    }
    try {
      if (assetModal.item) {
        await fetchAPI(`/core/assets/${assetModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(assetForm),
        });
      } else {
        await fetchAPI('/core/assets', {
          method: 'POST',
          body: JSON.stringify(assetForm),
        });
      }
      setAssetModal({ open: false, item: null });
      alert(assetModal.item ? 'Aset berhasil diperbarui' : 'Aset baru berhasil diregistrasi');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan aset');
    }
  };

  const openAssignModal = (assetId: string) => {
    setAssigneeId(employees[0]?.id || '');
    setAssignModal({ open: true, assetId });
  };

  const handleAssign = async () => {
    if (!assigneeId) return;
    try {
      await fetchAPI(`/core/assets/${assignModal.assetId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ employeeId: assigneeId }),
      });
      setAssignModal({ open: false, assetId: '' });
      alert('Aset berhasil diserahterimakan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menugaskan aset');
    }
  };

  const handleReturn = async () => {
    if (!returnTarget) return;
    try {
      await fetchAPI(`/core/assets/${returnTarget}/return`, { method: 'POST' });
      setReturnTarget(null);
      alert('Aset berhasil dikembalikan ke inventori');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengembalikan aset');
    }
  };

  const openRequestModal = () => {
    const available = assets.filter((a) => normalizeAssetStatus(a.status) === 'available');
    if (available.length === 0) {
      alert('Saat ini tidak ada barang yang tersedia di inventori.');
      return;
    }
    setRequestForm({
      assetName: available[0].name,
      duration: 5,
      reason: '',
    });
    setRequestModal(true);
  };

  const submitRequest = async () => {
    if (!requestForm.reason.trim()) {
      alert('Mohon isi alasan peminjaman!');
      return;
    }
    try {
      await fetchAPI('/core/assets/requests', {
        method: 'POST',
        body: JSON.stringify(requestForm),
      });
      setRequestModal(false);
      alert('Pengajuan peminjaman aset berhasil dikirim');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pengajuan');
    }
  };

  const processRequest = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await fetchAPI(`/core/assets/requests/${id}/process`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      alert(`Permintaan peminjaman aset berhasil ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses permintaan');
    }
  };

  const availableAssets = assets.filter((a) => normalizeAssetStatus(a.status) === 'available');

  const tabs = [
    { id: 'inventory' as TabId, label: 'Daftar Aset', icon: Lucide.Laptop },
    { id: 'requests' as TabId, label: 'Permintaan Pinjaman', icon: Lucide.ClipboardList },
    { id: 'history' as TabId, label: 'Riwayat Pergerakan', icon: Lucide.History },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Manajemen Aset Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">
            Lacak inventori properti kantor, kelola pengembalian, status servis kerusakan, dan persetujuan pinjaman staff.
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
        ) : activeTab === 'inventory' ? (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex justify-end">
                <button
                  onClick={() => openAssetModal()}
                  className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  <span>Registrasi Aset</span>
                </button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Asset ID</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Aset</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Serial Number</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Kategori</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status Aset</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Dikuasai Oleh</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {assets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Belum ada aset terdaftar / diserahkan kepada Anda
                      </td>
                    </tr>
                  ) : (
                    assets.map((a) => {
                      const status = normalizeAssetStatus(a.status);
                      const holder = a.employee?.fullName || '-';
                      return (
                        <tr key={a.id} className="table-row-hover border-b border-slate-100 transition">
                          <td className="px-6 py-4 font-bold text-slate-800 font-mono">{a.assetCode}</td>
                          <td className="px-6 py-4 font-bold text-slate-800">{a.name}</td>
                          <td className="px-6 py-4 font-semibold font-mono text-slate-500">{a.serialNumber || '-'}</td>
                          <td className="px-6 py-4 font-semibold text-slate-500">{a.category}</td>
                          <td className="px-6 py-4 font-semibold">{statusBadge(a.status)}</td>
                          <td className="px-6 py-4 font-semibold text-slate-600">{holder}</td>
                          <td className="px-6 py-4 text-right font-medium">
                            {isAdmin ? (
                              <TableActionMenu
                                items={[
                                  { label: 'Edit', onClick: () => openAssetModal(a), variant: 'primary' },
                                  ...(status === 'available'
                                    ? [{ label: 'Serahkan', onClick: () => openAssignModal(a.id), variant: 'primary' as const }]
                                    : status === 'in_use'
                                      ? [{ label: 'Kembalikan', onClick: () => setReturnTarget(a.id), variant: 'warning' as const }]
                                      : []),
                                ]}
                              />
                            ) : (
                              <span className="text-xs text-slate-400">Device Assigned</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'requests' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={openRequestModal}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Ajukan Pinjam Aset</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Request ID</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Pemohon</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Barang Aset</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Alasan Peminjaman</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Durasi</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {requests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        Belum ada pengajuan peminjaman aset
                      </td>
                    </tr>
                  ) : (
                    requests.map((r) => (
                      <tr key={r.id} className="table-row-hover border-b border-slate-100 transition">
                        <td className="px-6 py-4 font-bold text-slate-800 font-mono">{r.requestCode}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{r.employee?.fullName || '-'}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{r.assetName}</td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate">{r.reason}</td>
                        <td className="px-6 py-4 font-bold text-slate-700 font-mono">{r.duration} Hari</td>
                        <td className="px-6 py-4">
                          <Badge status={r.status} />
                        </td>
                        <td className="px-6 py-4 text-right font-medium">
                          {isAdmin && r.status === 'pending' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => processRequest(r.id, 'approved')}
                                className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <Lucide.Check className="w-3 h-3" />
                                Setujui
                              </button>
                              <button
                                onClick={() => processRequest(r.id, 'rejected')}
                                className="px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <Lucide.X className="w-3 h-3" />
                                Tolak
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-300">-</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Asset ID</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Barang</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Aksi</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Penerima</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Kondisi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Belum ada riwayat pergerakan aset
                    </td>
                  </tr>
                ) : (
                  history.map((h) => (
                    <tr key={h.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-semibold text-slate-500 font-mono">
                        {formatDate(h.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{h.assetCode}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{h.assetName}</td>
                      <td className="px-6 py-4 font-semibold">
                        {h.action === 'checkout' ? (
                          <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded border border-blue-100 text-[10px] font-bold">
                            Checkout / Pinjam
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded border border-green-100 text-[10px] font-bold">
                            Checkin / Kembali
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600">
                        {h.employeeName} {h.employeeId ? `(${h.employeeId})` : ''}
                      </td>
                      <td className="px-6 py-4 font-semibold capitalize text-slate-500">{h.condition || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal
        isOpen={assetModal.open}
        onClose={() => setAssetModal({ open: false, item: null })}
        title={assetModal.item ? `Edit Aset: ${assetModal.item.name}` : 'Daftarkan Aset Barang Baru'}
        size="lg"
        footer={
          <>
            <button onClick={() => setAssetModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">
              Batal
            </button>
            <button onClick={saveAsset} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">
              Simpan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Barang / Aset" required value={assetForm.name} onChange={(e) => setAssetForm({ ...assetForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Select
              label="Kategori Aset"
              value={assetForm.category}
              onChange={(e) => setAssetForm({ ...assetForm, category: e.target.value })}
              options={categories.map((c) => ({ value: c.name, label: c.name }))}
            />
            <FormField.Input label="Nomor Serial (S/N)" required value={assetForm.serialNumber} onChange={(e) => setAssetForm({ ...assetForm, serialNumber: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Merk / Brand" value={assetForm.brand} onChange={(e) => setAssetForm({ ...assetForm, brand: e.target.value })} />
            <FormField.Input label="Tipe / Model" value={assetForm.model} onChange={(e) => setAssetForm({ ...assetForm, model: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Tanggal Pembelian" type="date" value={assetForm.purchaseDate} onChange={(e) => setAssetForm({ ...assetForm, purchaseDate: e.target.value })} />
            <FormField.Input label="Harga Pembelian (Rupiah)" type="number" value={assetForm.purchasePrice} onChange={(e) => setAssetForm({ ...assetForm, purchasePrice: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField.Select
              label="Lokasi Penyimpanan"
              value={assetForm.location}
              onChange={(e) => setAssetForm({ ...assetForm, location: e.target.value })}
              options={locations.map((l) => ({ value: l.name, label: l.name }))}
            />
            <FormField.Select
              label="Kondisi Aset"
              value={assetForm.condition}
              onChange={(e) => setAssetForm({ ...assetForm, condition: e.target.value })}
              options={[
                { value: 'good', label: 'Baik (Good)' },
                { value: 'fair', label: 'Cukup (Fair)' },
                { value: 'damaged', label: 'Rusak (Damaged)' },
              ]}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, assetId: '' })}
        title="Serahkan Penguasaan Aset Barang"
        size="sm"
        footer={
          <>
            <button onClick={() => setAssignModal({ open: false, assetId: '' })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">
              Batal
            </button>
            <button onClick={handleAssign} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">
              Serahkan
            </button>
          </>
        }
      >
        <FormField.Select
          label="Pilih Karyawan Penerima Aset"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
          options={employees.map((e) => ({
            value: e.id,
            label: `${e.full_name || e.fullName} (${e.id})`,
          }))}
        />
      </Modal>

      <Modal
        isOpen={requestModal}
        onClose={() => setRequestModal(false)}
        title="Ajukan Pinjam Aset"
        size="md"
        footer={
          <>
            <button onClick={() => setRequestModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">
              Batal
            </button>
            <button onClick={submitRequest} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">
              Kirim Pengajuan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Select
            label="Pilih Aset Barang"
            value={requestForm.assetName}
            onChange={(e) => setRequestForm({ ...requestForm, assetName: e.target.value })}
            options={availableAssets.map((a) => ({
              value: a.name,
              label: `${a.name} (ID: ${a.assetCode})`,
            }))}
          />
          <FormField.Input
            label="Durasi Peminjaman (Hari)"
            type="number"
            required
            value={requestForm.duration}
            onChange={(e) => setRequestForm({ ...requestForm, duration: parseInt(e.target.value, 10) || 1 })}
          />
          <FormField.Textarea
            label="Alasan Peminjaman"
            required
            rows={2}
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!returnTarget}
        onClose={() => setReturnTarget(null)}
        onConfirm={handleReturn}
        title="Konfirmasi Pengembalian Aset"
        message="Apakah Anda yakin barang inventori telah diterima kembali di gudang dalam kondisi layak?"
        confirmText="Diterima"
        type="primary"
      />
    </div>
  );
}
