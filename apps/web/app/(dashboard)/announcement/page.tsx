'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';

export default function AnnouncementPage() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: '', content: '', category: 'General', isPinned: false });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const loadAnnouncements = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/core/announcements');
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetchAPI('/core/announcements', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      alert('Pengumuman berhasil dipublikasikan!');
      setForm({ title: '', content: '', category: 'General', isPinned: false });
      setShowForm(false);
      loadAnnouncements();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat pengumuman');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengumuman Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">Informasi dan berita terbaru dari manajemen perusahaan.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5"
          >
            <Lucide.Plus className="w-4 h-4" /> Buat Pengumuman
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 animate-fade-in">
          <FormField.Input label="Judul" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <FormField.Textarea label="Konten" required rows={4} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
          <FormField.Select
            label="Kategori"
            options={[
              { value: 'General', label: 'General' },
              { value: 'HR', label: 'HR' },
              { value: 'Event', label: 'Event' },
              { value: 'Policy', label: 'Kebijakan' },
            ]}
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isPinned} onChange={(e) => setForm({ ...form, isPinned: e.target.checked })} className="rounded" />
            <span className="text-xs text-slate-700">Sematkan di atas (pinned)</span>
          </label>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50">
            {submitting ? 'Mempublikasikan...' : 'Publikasikan'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center">
          <Lucide.Megaphone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Belum ada pengumuman.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {announcements.map((ann) => (
            <div
              key={ann.id}
              className={`bg-white p-5 rounded-2xl border shadow-sm select-none ${
                ann.isPinned ? 'border-primary/30 ring-1 ring-primary/10' : 'border-slate-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-2">
                  {ann.isPinned && <Lucide.Pin className="w-4 h-4 text-primary" />}
                  <h3 className="text-sm font-bold text-slate-800">{ann.title}</h3>
                </div>
                <Badge status="active" />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{ann.content}</p>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                <span>{ann.category}</span>
                <span>·</span>
                <span>{ann.createdBy || 'HR Admin'}</span>
                <span>·</span>
                <span>{formatDate(ann.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
