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

type TabId = 'types' | 'accrual' | 'blackout';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'types', label: 'Tipe Cuti', icon: Lucide.CalendarHeart },
  { id: 'accrual', label: 'Kebijakan Akrual', icon: Lucide.Clock },
  { id: 'blackout', label: 'Blackout Dates', icon: Lucide.CalendarOff },
];

export default function SettingsLeavePage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('types');
  const [loading, setLoading] = useState(true);

  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [blackouts, setBlackouts] = useState<any[]>([]);

  const [typeModal, setTypeModal] = useState<{ open: boolean; item: any | null }>({ open: false, item: null });
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleteBlackoutTarget, setDeleteBlackoutTarget] = useState<{ id: string; date: string } | null>(null);

  const [typeForm, setTypeForm] = useState({ name: '', maxDays: '12', payType: 'paid' });
  const [blackoutForm, setBlackoutForm] = useState({ date: '', description: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [typesData, blackoutsData] = await Promise.all([
        fetchAPI<any[]>('/settings/leave/types'),
        fetchAPI<any[]>('/settings/leave/blackouts'),
      ]);
      setLeaveTypes(typesData);
      setBlackouts(blackoutsData);
    } catch (err) {
      console.error('Failed to load leave settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadData();
  }, [isHR]);

  const openTypeModal = (item?: any) => {
    if (item) {
      setTypeForm({
        name: item.name,
        maxDays: String(item.maxDays),
        payType: item.payType || (item.isPaid ? 'paid' : 'unpaid'),
      });
    } else {
      setTypeForm({ name: '', maxDays: '12', payType: 'paid' });
    }
    setTypeModal({ open: true, item: item || null });
  };

  const saveType = async () => {
    if (!typeForm.name.trim() || parseInt(typeForm.maxDays, 10) < 0) {
      alert('Mohon isi nama cuti dan jatah limit dengan benar!');
      return;
    }
    try {
      const payload = {
        name: typeForm.name,
        maxDays: parseInt(typeForm.maxDays, 10) || 0,
        payType: typeForm.payType,
      };
      if (typeModal.item) {
        await fetchAPI(`/settings/leave/types/${typeModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Tipe cuti berhasil diperbarui');
      } else {
        await fetchAPI('/settings/leave/types', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Tipe cuti berhasil ditambahkan');
      }
      setTypeModal({ open: false, item: null });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan tipe cuti');
    }
  };

  const handleDeleteType = async () => {
    if (!deleteTypeTarget) return;
    try {
      await fetchAPI(`/settings/leave/types/${deleteTypeTarget.id}`, { method: 'DELETE' });
      alert('Tipe cuti berhasil dihapus');
      setDeleteTypeTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tipe cuti');
    }
  };

  const updateAccrual = (leaveTypeId: string, prop: string, value: unknown) => {
    setLeaveTypes((prev) =>
      prev.map((t) => (t.id === leaveTypeId ? { ...t, [prop]: value } : t)),
    );
  };

  const saveAccruals = async () => {
    try {
      await fetchAPI('/settings/leave/accruals', {
        method: 'PUT',
        body: JSON.stringify({
          rules: leaveTypes.map((t) => ({
            leaveTypeId: t.id,
            accrualType: t.accrualType || 'none',
            carryOver: !!t.carryOver,
            maxCarry: parseInt(String(t.maxCarry), 10) || 0,
          })),
        }),
      });
      alert('Konfigurasi akrual dan carry-over cuti berhasil diperbarui');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan akrual');
    }
  };

  const addBlackout = async () => {
    if (!blackoutForm.date || !blackoutForm.description.trim()) {
      alert('Tanggal dan alasan larangan wajib diisi!');
      return;
    }
    try {
      await fetchAPI('/settings/leave/blackouts', {
        method: 'POST',
        body: JSON.stringify(blackoutForm),
      });
      setBlackoutForm({ date: '', description: '' });
      alert('Tanggal blackout berhasil ditambahkan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan blackout');
    }
  };

  const handleDeleteBlackout = async () => {
    if (!deleteBlackoutTarget) return;
    try {
      await fetchAPI(`/settings/leave/blackouts/${deleteBlackoutTarget.id}`, { method: 'DELETE' });
      alert('Tanggal blackout berhasil dihapus');
      setDeleteBlackoutTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus blackout');
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
        <span className="text-slate-500">Cuti</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Konfigurasi Kebijakan Cuti & Libur</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola kuota tipe cuti, kebijakan akrual bulanan, carry-over tahunan, dan tanggal blackout.
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
        ) : activeTab === 'types' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openTypeModal()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Tipe Cuti</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider w-24">ID</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Cuti</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Jatah Kuota</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Tipe Pengupahan</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaveTypes.map((t) => (
                    <tr key={t.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{t.displayId}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{t.name}</td>
                      <td className="px-6 py-4 font-bold text-slate-700 font-mono">{t.maxDays} Hari</td>
                      <td className="px-6 py-4 font-semibold capitalize text-slate-500">
                        {(t.payType || (t.isPaid ? 'paid' : 'unpaid')) === 'paid' ? 'Dibayar (Paid)' : 'Tidak Dibayar (Unpaid)'}
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        <TableActionMenu
                          items={[
                            { label: 'Edit', onClick: () => openTypeModal(t), variant: 'primary' },
                            { label: 'Hapus', onClick: () => setDeleteTypeTarget({ id: t.id, name: t.name }), variant: 'danger' },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'accrual' ? (
          <div className="space-y-4 select-none">
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Nama Cuti</th>
                    <th className="px-6 py-3.5">Metode Akrual</th>
                    <th className="px-6 py-3.5 text-center">Boleh Carry Over?</th>
                    <th className="px-6 py-3.5">Maksimal Carry Over (Hari)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {leaveTypes.map((t) => (
                    <tr key={t.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-bold text-slate-800">{t.name}</td>
                      <td className="px-6 py-4">
                        <select
                          value={t.accrualType || 'none'}
                          onChange={(e) => updateAccrual(t.id, 'accrualType', e.target.value)}
                          className="block px-2 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                        >
                          <option value="none">Tanpa Akrual (Langsung 100%)</option>
                          <option value="monthly">Akrual Bulanan (1 Hari / Bulan)</option>
                          <option value="annual">Akrual Tahunan</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!t.carryOver}
                          onChange={(e) => updateAccrual(t.id, 'carryOver', e.target.checked)}
                          className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="number"
                          value={t.maxCarry || 0}
                          onChange={(e) => updateAccrual(t.id, 'maxCarry', parseInt(e.target.value, 10) || 0)}
                          className="w-20 px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={saveAccruals}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
              >
                Simpan Konfigurasi Akrual
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl md:col-span-4 flex flex-col gap-4 select-none">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">
                Tambah Larangan Cuti
              </h3>
              <FormField.Input
                label="Pilih Tanggal Larangan"
                type="date"
                required
                value={blackoutForm.date}
                onChange={(e) => setBlackoutForm({ ...blackoutForm, date: e.target.value })}
              />
              <FormField.Input
                label="Alasan / Keterangan"
                required
                placeholder="Contoh: Tutup Buku Akhir Tahun"
                value={blackoutForm.description}
                onChange={(e) => setBlackoutForm({ ...blackoutForm, description: e.target.value })}
              />
              <button
                onClick={addBlackout}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow text-xs transition cursor-pointer"
              >
                Daftarkan Tanggal Blackout
              </button>
            </div>

            <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 select-none">
                      <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider w-36">Tanggal Blackout</th>
                      <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Deskripsi Larangan Cuti</th>
                      <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {blackouts.map((b) => (
                      <tr key={b.id} className="table-row-hover border-b border-slate-100 transition">
                        <td className="px-6 py-4 font-bold text-slate-800 font-mono">{b.date}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600">{b.description}</td>
                        <td className="px-6 py-4 text-right font-medium">
                          <TableActionMenu
                            items={[
                              {
                                label: 'Hapus',
                                onClick: () => setDeleteBlackoutTarget({ id: b.id, date: b.date }),
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
          </div>
        )}
      </div>

      <Modal
        isOpen={typeModal.open}
        onClose={() => setTypeModal({ open: false, item: null })}
        title={typeModal.item ? 'Edit Konfigurasi Cuti' : 'Tambah Tipe Cuti Baru'}
        footer={
          <>
            <button onClick={() => setTypeModal({ open: false, item: null })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={saveType} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Tipe Cuti" required value={typeForm.name} onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Default Limit Jatah (Hari)" type="number" required value={typeForm.maxDays} onChange={(e) => setTypeForm({ ...typeForm, maxDays: e.target.value })} />
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Kebijakan Pengupahan</label>
              <select
                value={typeForm.payType}
                onChange={(e) => setTypeForm({ ...typeForm, payType: e.target.value })}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="paid">Dibayar (Paid Leave)</option>
                <option value="unpaid">Potong Gaji (Unpaid Leave)</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTypeTarget}
        onClose={() => setDeleteTypeTarget(null)}
        onConfirm={handleDeleteType}
        title="Hapus Tipe Cuti"
        message={`Apakah Anda yakin ingin menghapus tipe cuti "${deleteTypeTarget?.name}"?`}
        confirmText="Hapus"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteBlackoutTarget}
        onClose={() => setDeleteBlackoutTarget(null)}
        onConfirm={handleDeleteBlackout}
        title="Hapus Tanggal Blackout"
        message={`Apakah Anda yakin ingin menghapus tanggal larangan cuti ${deleteBlackoutTarget?.date}?`}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
