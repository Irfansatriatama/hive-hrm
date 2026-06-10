'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';

export default function AttendanceSettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<any>({
    workStart: '08:00',
    workEnd: '17:00',
    gracePeriod: 15,
    officeLat: -6.2088,
    officeLng: 106.8456,
    radius: 100,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await fetchAPI('/attendance/settings');
        setSettings(data);
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchAPI('/attendance/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      alert('Pengaturan Kehadiran berhasil disimpan');
    } catch (err: any) {
      alert('Gagal menyimpan pengaturan: ' + err.message);
    }
  };

  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-450 mt-1">Anda tidak memiliki izin untuk mengedit pengaturan kehadiran global.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
      <div className="border-b border-slate-100 pb-5 mb-5 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Kehadiran</h1>
        <p className="text-xs text-slate-400 mt-1">Konfigurasikan jam kerja standard, toleransi keterlambatan, dan batas geofence GPS.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField.Input
              label="Jam Masuk Kerja (Baseline)"
              type="text"
              required
              value={settings.workStart}
              onChange={e => setSettings({ ...settings, workStart: e.target.value })}
            />
            <FormField.Input
              label="Jam Pulang Kerja"
              type="text"
              required
              value={settings.workEnd}
              onChange={e => setSettings({ ...settings, workEnd: e.target.value })}
            />
            <FormField.Input
              label="Toleransi Keterlambatan (Menit)"
              type="number"
              required
              value={settings.gracePeriod}
              onChange={e => setSettings({ ...settings, gracePeriod: parseInt(e.target.value) || 0 })}
            />
            <FormField.Input
              label="Radius Toleransi GPS (Meter)"
              type="number"
              required
              value={settings.radius}
              onChange={e => setSettings({ ...settings, radius: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">Koordinat Kantor (GPS Geofence)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField.Input
                label="Latitude"
                type="number"
                step="any"
                required
                value={settings.officeLat}
                onChange={e => setSettings({ ...settings, officeLat: parseFloat(e.target.value) || 0 })}
              />
              <FormField.Input
                label="Longitude"
                type="number"
                step="any"
                required
                value={settings.officeLng}
                onChange={e => setSettings({ ...settings, officeLng: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer select-none"
            >
              Simpan Pengaturan
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
