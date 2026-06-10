'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';
import TableActionMenu from '@/components/shared/TableActionMenu';
import { isHRRole, usePermission } from '@/hooks/usePermission';

export default function RewardApprovalPage() {
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const todayStr = new Date().toISOString().split('T')[0];
  const [filterStart, setFilterStart] = useState(thirtyDaysAgo);
  const [filterEnd, setFilterEnd] = useState(todayStr);
  const [filterStatus, setFilterStatus] = useState('pending');

  const [rejectModal, setRejectModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [rejectNotes, setRejectNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStart) params.set('startDate', filterStart);
      if (filterEnd) params.set('endDate', filterEnd);
      if (filterStatus) params.set('status', filterStatus);

      const data = await fetchAPI<any[]>(`/reward/redemptions?${params.toString()}`);
      setRedemptions(data);
    } catch (err) {
      console.error('Failed to load reward approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && isHR) loadData();
  }, [authLoading, isHR, filterStart, filterEnd, filterStatus]);

  const approveRedemption = async (id: string) => {
    try {
      await fetchAPI(`/reward/redemptions/${id}/approve`, { method: 'POST' });
      alert('Klaim reward berhasil disetujui!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui klaim');
    }
  };

  const rejectRedemption = async () => {
    try {
      await fetchAPI(`/reward/redemptions/${rejectModal.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ notes: rejectNotes }),
      });
      setRejectModal({ open: false, id: '' });
      setRejectNotes('');
      alert('Klaim reward ditolak.');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak klaim');
    }
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat melihat persetujuan penukaran reward.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Persetujuan Klaim Hadiah</h1>
          <p className="text-xs text-slate-400 mt-1">Verifikasi penukaran poin apresiasi karyawan dengan inventaris barang fisik/benefit.</p>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mulai</label>
          <input type="date" value={filterStart} onChange={(e) => setFilterStart(e.target.value)} className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Selesai</label>
          <input type="date" value={filterEnd} onChange={(e) => setFilterEnd(e.target.value)} className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs" />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Status Klaim</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white">
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved / Disetujui</option>
            <option value="rejected">Rejected / Ditolak</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : redemptions.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 text-xs">Tidak ada klaim penukaran pending.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none">
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Karyawan</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Item Hadiah</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Biaya Poin</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Tanggal Klaim</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {redemptions.map((row) => (
                  <tr key={row.id} className="table-row-hover border-b border-slate-100 transition">
                    <td className="px-6 py-4 font-bold text-slate-800">{row.employee?.fullName || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-600">{row.rewardCatalog?.name || '-'}</td>
                    <td className="px-6 py-4 font-bold text-primary font-mono">{row.points} Pts</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{formatDate(row.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                    <td className="px-6 py-4"><Badge status={row.status} /></td>
                    <td className="px-6 py-4 text-right font-medium">
                      <TableActionMenu
                        items={
                          row.status === 'pending'
                            ? [
                                { label: 'Setujui', onClick: () => approveRedemption(row.id), variant: 'primary' },
                                { label: 'Tolak', onClick: () => setRejectModal({ open: true, id: row.id }), variant: 'danger' },
                              ]
                            : []
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Modal
        isOpen={rejectModal.open}
        onClose={() => setRejectModal({ open: false, id: '' })}
        title="Tolak Klaim Reward"
        size="md"
        footer={
          <>
            <button onClick={() => setRejectModal({ open: false, id: '' })} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={rejectRedemption} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Tolak Klaim</button>
          </>
        }
      >
        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alasan Penolakan (opsional)</label>
        <textarea
          value={rejectNotes}
          onChange={(e) => setRejectNotes(e.target.value)}
          rows={3}
          className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs mt-2"
          placeholder="Tuliskan alasan penolakan..."
        />
      </Modal>
    </div>
  );
}
