'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';

const DEFAULT_CONFIG = {
  timezone: 'Asia/Jakarta',
  date_format: 'DD/MM/YYYY',
  currency: 'IDR',
  retirement_age: 56,
  session_timeout: 120,
  enforce_complex_pwd: true,
};

export default function SettingsOthersPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isHR) return;
    async function load() {
      try {
        const data = await fetchAPI<typeof DEFAULT_CONFIG>('/settings/global-preferences');
        setConfig({ ...DEFAULT_CONFIG, ...data });
      } catch (err) {
        console.error('Failed to load global preferences:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isHR]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetchAPI('/settings/global-preferences', {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      alert('Konfigurasi umum sistem berhasil disimpan');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat mengakses konfigurasi umum.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/settings" className="hover:text-slate-600 font-medium">Pengaturan</Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">Umum</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Pengaturan Umum & Kebijakan Portal</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola parameter internasionalisasi, usia batas kerja karyawan, regulasi keamanan sandi, dan masa kedaluwarsa sesi.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="max-w-xl space-y-5 select-none">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                Zona Waktu Perusahaan
              </label>
              <select
                value={config.timezone}
                onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
                className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs bg-white"
              >
                <option value="Asia/Jakarta">Waktu Indonesia Barat (WIB) - Asia/Jakarta (GMT+7)</option>
                <option value="Asia/Makassar">Waktu Indonesia Tengah (WITA) - Asia/Makassar (GMT+8)</option>
                <option value="Asia/Jayapura">Waktu Indonesia Timur (WIT) - Asia/Jayapura (GMT+9)</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Format Tampilan Tanggal
                </label>
                <select
                  value={config.date_format}
                  onChange={(e) => setConfig({ ...config, date_format: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (Contoh: 31/12/2026)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (Contoh: 12/31/2026)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (Contoh: 2026-12-31)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Mata Uang Acuan
                </label>
                <select
                  value={config.currency}
                  onChange={(e) => setConfig({ ...config, currency: e.target.value })}
                  className="block w-full px-3 py-2.5 border border-slate-200 rounded-lg text-xs bg-white font-mono"
                >
                  <option value="IDR">Rupiah Indonesia - IDR (Rp)</option>
                  <option value="USD">Dolar Amerika Serikat - USD ($)</option>
                  <option value="EUR">Euro Eropa - EUR (€)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Input
                label="Batas Usia Pensiun (Tahun)"
                type="number"
                required
                value={config.retirement_age}
                onChange={(e) => setConfig({ ...config, retirement_age: parseInt(e.target.value, 10) || 56 })}
              />
              <FormField.Input
                label="Batas Durasi Sesi Login (Menit)"
                type="number"
                required
                value={config.session_timeout}
                onChange={(e) => setConfig({ ...config, session_timeout: parseInt(e.target.value, 10) || 120 })}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-2">
              <input
                type="checkbox"
                checked={config.enforce_complex_pwd}
                onChange={(e) => setConfig({ ...config, enforce_complex_pwd: e.target.checked })}
                className="rounded border-slate-300 text-primary focus:ring-primary"
              />
              <span className="text-xs text-slate-700">Kebijakan Sandi Kompleks (Kapital + Angka)</span>
            </label>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Pengaturan Umum'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
