'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';
import Modal from '@/components/shared/Modal';

type TabId = 'feed' | 'manage';

interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  target: string;
  pinned?: boolean;
  isPinned?: boolean;
  status?: string;
  publish_date?: string;
  publishDate?: string;
  expire_date?: string | null;
  expireDate?: string | null;
  author?: string;
  createdBy?: string;
  isRead?: boolean;
}

interface DepartmentItem {
  id: string;
  name: string;
}

const emptyForm = () => ({
  title: '',
  content: '',
  target: 'all',
  pinned: false,
  publish_date: new Date().toISOString().split('T')[0],
  expire_date: '',
});

function formatShortDate(value?: string | null) {
  if (!value) return '-';
  return formatDate(value, { day: 'numeric', month: 'short', year: 'numeric' });
}

function getPublishDate(ann: AnnouncementItem) {
  return ann.publish_date || ann.publishDate || '';
}

function getExpireDate(ann: AnnouncementItem) {
  return ann.expire_date ?? ann.expireDate ?? '';
}

function isPinned(ann: AnnouncementItem) {
  return ann.pinned ?? ann.isPinned ?? false;
}

export default function AnnouncementPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('feed');
  const [feedItems, setFeedItems] = useState<AnnouncementItem[]>([]);
  const [manageItems, setManageItems] = useState<AnnouncementItem[]>([]);
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [detailModal, setDetailModal] = useState<AnnouncementItem | null>(null);
  const [formModal, setFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm());

  const isHR =
    user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN' || user?.role === 'MANAGER';

  const loadFeed = useCallback(async () => {
    const data = await fetchAPI<AnnouncementItem[]>('/core/announcements/feed');
    setFeedItems(data);
  }, []);

  const loadManage = useCallback(async () => {
    const data = await fetchAPI<AnnouncementItem[]>('/core/announcements/manage');
    setManageItems(data);
  }, []);

  const loadDepartments = useCallback(async () => {
    try {
      const data = await fetchAPI<DepartmentItem[]>('/employees/departments');
      setDepartments(data);
    } catch {
      setDepartments([]);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await loadFeed();
      if (isHR) {
        await Promise.all([loadManage(), loadDepartments()]);
      }
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  }, [isHR, loadFeed, loadManage, loadDepartments]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openDetail = async (ann: AnnouncementItem) => {
    setDetailModal(ann);
    if (!ann.isRead) {
      try {
        await fetchAPI(`/core/announcements/${ann.id}/read`, { method: 'POST' });
        setFeedItems((prev) =>
          prev.map((item) => (item.id === ann.id ? { ...item, isRead: true } : item)),
        );
      } catch (err) {
        console.error('Failed to mark announcement as read:', err);
      }
    }
  };

  const openCreateModal = () => {
    setEditingId(null);
    setForm(emptyForm());
    setFormModal(true);
  };

  const openEditModal = (ann: AnnouncementItem) => {
    setEditingId(ann.id);
    setForm({
      title: ann.title,
      content: ann.content,
      target: ann.target || 'all',
      pinned: isPinned(ann),
      publish_date: getPublishDate(ann)
        ? new Date(getPublishDate(ann)).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      expire_date: getExpireDate(ann)
        ? new Date(getExpireDate(ann) as string).toISOString().split('T')[0]
        : '',
    });
    setFormModal(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim() || !form.publish_date || saving) {
      alert('Judul, konten memo, dan tanggal rilis wajib diisi!');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title.trim(),
        content: form.content.trim(),
        target: form.target,
        pinned: form.pinned,
        isPinned: form.pinned,
        publishDate: form.publish_date,
        publish_date: form.publish_date,
        expireDate: form.expire_date || null,
        expire_date: form.expire_date || null,
        status: 'published',
      };

      if (editingId) {
        await fetchAPI(`/core/announcements/${editingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Pengumuman internal berhasil diperbarui');
      } else {
        await fetchAPI('/core/announcements', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Pengumuman internal baru berhasil diterbitkan');
      }

      setFormModal(false);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengumuman');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (ann: AnnouncementItem) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus memo "${ann.title}" secara permanen dari papan pengumuman?`,
      )
    ) {
      return;
    }

    try {
      await fetchAPI(`/core/announcements/${ann.id}/delete`, { method: 'POST' });
      alert('Pengumuman berhasil dihapus');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus pengumuman');
    }
  };

  const getTargetLabel = (target: string) => {
    if (target === 'all') return 'Seluruh Karyawan';
    const dept = departments.find((d) => d.id === target);
    return dept ? `Divisi: ${dept.name}` : target;
  };

  const renderFeed = () => {
    if (feedItems.length === 0) {
      return (
        <div className="text-center py-16 text-slate-400 select-none">
          <Lucide.Megaphone className="w-12 h-12 mx-auto mb-3 text-slate-200" />
          <h3 className="font-bold text-slate-700 text-sm">Tidak Ada Pengumuman</h3>
          <p className="text-xs text-slate-400 mt-1">
            Belum ada memo internal atau pengumuman dipasang untuk divisi Anda.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {feedItems.map((ann) => (
          <div
            key={ann.id}
            onClick={() => openDetail(ann)}
            className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition flex flex-col justify-between gap-4 cursor-pointer select-none relative overflow-hidden"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {isPinned(ann) && (
                    <span className="bg-red-50 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase border border-red-100 flex items-center gap-1 shrink-0">
                      <Lucide.Pin className="w-3 h-3 text-red-500" />
                      Penting
                    </span>
                  )}
                  {ann.isRead ? (
                    <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded uppercase">
                      Sudah Dibaca
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded uppercase animate-pulse">
                      Baru
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {formatShortDate(getPublishDate(ann))}
                </span>
              </div>

              <h3 className="font-bold text-slate-800 text-sm leading-snug">{ann.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{ann.content}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 flex items-center justify-between text-[10px] text-slate-400">
              <span>
                Diposting oleh: <strong>{ann.author || ann.createdBy || 'HR Admin'}</strong>
              </span>
              <span className="text-primary hover:underline font-bold flex items-center gap-1">
                Baca Selengkapnya &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderManage = () => (
    <div className="space-y-4">
      <div className="flex justify-end select-none">
        <button
          onClick={openCreateModal}
          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          <span>Buat Pengumuman Baru</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 select-none">
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Judul</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Target Pemirsa
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Tgl Rilis
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Tgl Expired
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Label</th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {manageItems.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400">
                  Belum ada pengumuman terdaftar.
                </td>
              </tr>
            ) : (
              manageItems.map((ann) => (
                <tr key={ann.id} className="table-row-hover border-b border-slate-100 transition">
                  <td className="px-6 py-4 font-bold text-slate-800">{ann.title}</td>
                  <td className="px-6 py-4 text-slate-500 font-semibold">
                    {getTargetLabel(ann.target)}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {formatShortDate(getPublishDate(ann))}
                  </td>
                  <td className="px-6 py-4 font-mono text-slate-400">
                    {getExpireDate(ann) ? formatShortDate(getExpireDate(ann)) : 'Tanpa batas'}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={isPinned(ann) ? 'Penting' : 'draft'} />
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(ann)}
                      className="text-primary hover:underline text-xs font-bold cursor-pointer"
                    >
                      Edit
                    </button>
                    <span className="text-slate-200">|</span>
                    <button
                      onClick={() => handleDelete(ann)}
                      className="text-red-500 hover:underline text-xs font-bold cursor-pointer"
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
            Papan Pengumuman (Announcements)
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lacak kebijakan internal terbaru, undangan townhall, dan informasi korporasi resmi
          </p>
        </div>
      </div>

      {isHR && (
        <div className="bg-white rounded-t-2xl border-x border-t border-slate-100 shadow-sm flex select-none overflow-x-auto">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'feed'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lucide.Rss className="w-4 h-4 shrink-0" />
            <span>Pengumuman Karyawan</span>
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'manage'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Lucide.Settings className="w-4 h-4 shrink-0" />
            <span>Kelola Pengumuman (Admin)</span>
          </button>
        </div>
      )}

      <div
        className={`${
          isHR
            ? 'bg-white rounded-b-2xl border-x border-b border-slate-100 p-6'
            : 'bg-white rounded-2xl border border-slate-100 p-6'
        } shadow-sm`}
      >
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'feed' || !isHR ? (
          renderFeed()
        ) : (
          renderManage()
        )}
      </div>

      <Modal
        isOpen={!!detailModal}
        onClose={() => setDetailModal(null)}
        title={detailModal?.title || ''}
        size="lg"
        footer={
          <button
            onClick={() => setDetailModal(null)}
            className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg shadow transition cursor-pointer"
          >
            Tutup
          </button>
        }
      >
        {detailModal && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-[10px] text-slate-400 select-none pb-2 border-b border-dashed border-slate-100">
              <span>
                Penulis: <strong>{detailModal.author || detailModal.createdBy || 'HR Admin'}</strong>
              </span>
              <span className="font-mono">Rilis: {formatDate(getPublishDate(detailModal))}</span>
            </div>
            <div className="text-xs text-slate-600 leading-relaxed space-y-2 whitespace-pre-line">
              {detailModal.content}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={formModal}
        onClose={() => setFormModal(false)}
        title={editingId ? `Edit Pengumuman: ${form.title}` : 'Buat Pengumuman Internal Baru'}
        size="lg"
        footer={
          <>
            <button
              onClick={() => setFormModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Pengumuman'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input
            label="Judul Pengumuman"
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <FormField.Textarea
            label="Konten Pengumuman (Memo Internal)"
            required
            rows={4}
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField.Select
              label="Target Pemirsa"
              options={[
                { value: 'all', label: 'Seluruh Karyawan (All)' },
                ...departments.map((d) => ({ value: d.id, label: `Divisi: ${d.name}` })),
              ]}
              value={form.target}
              onChange={(e) => setForm({ ...form, target: e.target.value })}
            />
            <div className="flex items-center pt-5 select-none">
              <FormField.Toggle
                label="Sematkan di Atas (Pin on Top)"
                checked={form.pinned}
                onChange={(e) => setForm({ ...form, pinned: e.target.checked })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField.Input
              label="Tanggal Publish Rilis"
              type="date"
              required
              value={form.publish_date}
              onChange={(e) => setForm({ ...form, publish_date: e.target.value })}
            />
            <FormField.Input
              label="Tanggal Expired (Lahir)"
              type="date"
              value={form.expire_date}
              onChange={(e) => setForm({ ...form, expire_date: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
