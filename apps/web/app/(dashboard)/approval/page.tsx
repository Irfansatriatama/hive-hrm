'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';
import { usePermission, isHRRole } from '@/hooks/usePermission';

export default function ApprovalPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<'mine' | 'my_requests' | 'all'>('mine');
  const [inbox, setInbox] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const { userRole, isLoading: authLoading } = usePermission();
  const [loading, setLoading] = useState(true);

  // Reject Modal State
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectItem, setRejectItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadApprovalContext = async () => {
    setLoading(true);
    try {
      const role = userRole;

      // Fetch pending approvals for inbox
      const inboxData = await fetchAPI<any[]>('/approval/inbox');
      setInbox(inboxData);

      // Fetch personal requests from leave and profile modules
      const [myLeaves, myProfiles] = await Promise.all([
        fetchAPI<any[]>('/leave/requests/my'),
        fetchAPI<any[]>('/employees/requests/my'),
      ]);

      // Normalize personal requests
      const leavesNormalized = myLeaves.map((l) => ({
        id: l.id,
        summary: `Cuti ${l.leaveType?.name || 'Cuti'} (${l.totalDays} Hari)`,
        type: 'leave',
        date_submitted: l.createdAt,
        status: l.status,
        progress: l.status === 'PENDING' ? 'Menunggu Persetujuan' : 'Selesai',
      }));

      const profilesNormalized = myProfiles.map((p) => ({
        id: p.id,
        summary: p.summary,
        type: 'profile_update',
        date_submitted: p.createdAt,
        status: p.status,
        progress: p.status === 'PENDING' ? 'Menunggu Persetujuan' : 'Selesai',
      }));

      setMyRequests([...leavesNormalized, ...profilesNormalized]);
    } catch (err) {
      console.error('Failed to load approval inbox context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      loadApprovalContext();
    }
  }, [authLoading, userRole]);

  const handleApprove = async (item: any) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui pengajuan ini?')) return;
    try {
      await fetchAPI('/approval/action', {
        method: 'POST',
        body: JSON.stringify({
          type: item.type,
          id: item.id,
          action: 'approve',
        }),
      });
      alert('Pengajuan berhasil disetujui');
      loadApprovalContext();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pengajuan');
    }
  };

  const openRejectModal = (item: any) => {
    setRejectItem(item);
    setRejectReason('');
    setIsRejectOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectItem || !rejectReason.trim() || saving) return;

    setSaving(true);
    try {
      await fetchAPI('/approval/action', {
        method: 'POST',
        body: JSON.stringify({
          type: rejectItem.type,
          id: rejectItem.id,
          action: 'reject',
          reason: rejectReason, // the backend logs this in the AuditLog
        }),
      });
      alert('Pengajuan berhasil ditolak');
      setIsRejectOpen(false);
      loadApprovalContext();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak pengajuan');
    } finally {
      setSaving(false);
    }
  };

  const handleRecall = async (item: any) => {
    if (!confirm('Apakah Anda yakin ingin membatalkan pengajuan ini?')) return;
    try {
      const endpoint = item.type === 'leave' 
        ? `/leave/requests/${item.id}` 
        : `/employees/requests/${item.id}`;

      await fetchAPI(endpoint, {
        method: 'DELETE',
      });
      alert('Pengajuan berhasil ditarik kembali');
      loadApprovalContext();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan pengajuan');
    }
  };

  const isHR = isHRRole(userRole);
  const isManager = userRole === 'MANAGER';
  const hasInboxAccess = isHR || isManager;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none animate-fade-in">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Persetujuan Terpusat</h1>
          <p className="text-xs text-slate-400 mt-1">Verifikasi cuti, lembur, klaim finansial, dan update data profil di satu inbox terpadu</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-100 shadow-sm flex select-none">
        {hasInboxAccess && (
          <button
            onClick={() => setActiveTab('mine')}
            className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'mine' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lucide.Inbox className="w-4 h-4" />
            <span>Perlu Saya Approve</span>
          </button>
        )}
        <button
          onClick={() => setActiveTab('my_requests')}
          className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'my_requests' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Lucide.FileText className="w-4 h-4" />
          <span>Pengajuan Saya</span>
        </button>
        {isHR && (
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'all' ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lucide.Globe className="w-4 h-4" />
            <span>Semua Pengajuan (HR)</span>
          </button>
        )}
      </div>

      {/* Tab Body */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-100 shadow-sm p-5">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'mine' && hasInboxAccess ? (
          inbox.length === 0 ? (
            <div className="text-center py-16 text-slate-400 select-none">
              <Lucide.CheckSquare className="w-12 h-12 mx-auto mb-3 text-slate-200" />
              <h3 className="font-bold text-slate-700 text-sm">Semua Persetujuan Selesai</h3>
              <p className="text-xs text-slate-400 mt-1">Tidak ada pengajuan baru dalam antrean persetujuan Anda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {inbox.map((item) => (
                <div key={item.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 relative flex flex-col justify-between select-none">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">{item.id}</span>
                      <span className="text-[10px] font-bold text-slate-400 font-mono">{formatDate(item.date_submitted)}</span>
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm leading-snug">{item.summary}</h3>
                    <p className="text-xs text-slate-500 font-medium">{item.requester_name} &bull; Pengaju</p>
                    
                    {item.reason && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 italic mt-2">
                        &ldquo;{item.reason}&rdquo;
                      </div>
                    )}
                  </div>
                  
                  <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-3 mt-4">
                    <button
                      onClick={() => openRejectModal(item)}
                      className="px-3 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Lucide.X className="w-3.5 h-3.5 text-red-500" />
                      <span>Tolak</span>
                    </button>
                    <button
                      onClick={() => handleApprove(item)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <Lucide.Check className="w-3.5 h-3.5 text-white" />
                      <span>Setujui</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : activeTab === 'my_requests' ? (
          myRequests.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Belum ada pengajuan dibuat.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                    <th className="px-6 py-3.5 uppercase tracking-wider">Perihal</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider">Tipe</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider">Diajukan</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {myRequests.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-800">{row.summary}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-500 capitalize">{row.type.replace('_', ' ')}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{formatDate(row.date_submitted)}</td>
                      <td className="px-6 py-3.5">
                        <Badge status={row.status.toLowerCase()} />
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium">
                        {row.status === 'PENDING' ? (
                          <button
                            onClick={() => handleRecall(row)}
                            className="text-red-500 hover:underline cursor-pointer"
                          >
                            Tarik Kembali
                          </button>
                        ) : (
                          '-'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // Admin/HR Full Log View
          inbox.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Tidak ada pengajuan tercatat.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                    <th className="px-6 py-3.5 uppercase tracking-wider">Diajukan Oleh</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider">Perihal</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider">Diajukan</th>
                    <th className="px-6 py-3.5 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {inbox.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-3.5 font-bold text-slate-800">{row.requester_name}</td>
                      <td className="px-6 py-3.5 text-slate-650">{row.summary}</td>
                      <td className="px-6 py-3.5 font-mono text-slate-500">{formatDate(row.date_submitted)}</td>
                      <td className="px-6 py-3.5">
                        <Badge status={row.status.toLowerCase()} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Reject Reason Modal */}
      {isRejectOpen && rejectItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Masukkan Alasan Penolakan</h3>
              <button
                onClick={() => setIsRejectOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRejectSubmit}>
              <div className="p-5 space-y-4">
                <p className="text-xs text-slate-500">Silakan masukkan alasan penolakan pengajuan untuk diinformasikan kembali kepada pemohon.</p>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Alasan Penolakan
                  </label>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                    placeholder="Alasan penolakan..."
                    rows={3}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition resize-none"
                  />
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsRejectOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving || !rejectReason.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition cursor-pointer"
                >
                  {saving ? 'Memproses...' : 'Tolak Pengajuan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
