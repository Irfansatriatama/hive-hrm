'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';
import { isHRRole, usePermission } from '@/hooks/usePermission';

const WEEKDAYS = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const DEFAULT_SETTINGS = {
  check_in_limit: '08:00',
  check_out_limit: '17:00',
  late_tolerance: 15,
  early_checkout_tolerance: 10,
  overtime_start_delay: 30,
  overtime_calculation_method: 'hourly',
  working_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  fingerprint_integration: false,
};

export default function AttendanceSettingsPage() {
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !isHR) return;
    async function loadSettings() {
      try {
        const data = await fetchAPI<typeof DEFAULT_SETTINGS>('/attendance/settings');
        setSettings({ ...DEFAULT_SETTINGS, ...data });
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [authLoading, isHR]);

  const toggleWorkingDay = (day: string) => {
    setSettings((prev) => {
      const days = prev.working_days.includes(day)
        ? prev.working_days.filter((d) => d !== day)
        : [...prev.working_days, day];
      return { ...prev, working_days: days };
    });
  };

  const handleSave = async () => {
    if (settings.working_days.length === 0) {
      alert('Mohon pilih minimal satu hari kerja operasional!');
      return;
    }
    try {
      await fetchAPI('/attendance/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      alert('Pengaturan absensi berhasil diperbarui');
    } catch (err: any) {
      alert('Gagal menyimpan pengaturan: ' + (err.message || 'Unknown error'));
    }
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-450 mt-1">
          Anda tidak memiliki izin untuk mengedit pengaturan kehadiran global.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
            Pengaturan Kehadiran
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi jam masuk/pulang, hari kerja operasional, lembur, dan integrasi absensi
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition select-none cursor-pointer disabled:opacity-50"
        >
          Simpan Pengaturan
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Jam Kerja & Toleransi */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider select-none">
              <Lucide.Clock className="w-4 h-4 text-primary" />
              <span>Jam Kerja & Toleransi</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Input
                label="Jam Masuk Standar"
                id="set-checkin"
                type="time"
                required
                value={settings.check_in_limit}
                onChange={(e) => setSettings({ ...settings, check_in_limit: e.target.value })}
              />
              <FormField.Input
                label="Jam Pulang Standar"
                id="set-checkout"
                type="time"
                required
                value={settings.check_out_limit}
                onChange={(e) => setSettings({ ...settings, check_out_limit: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Input
                label="Toleransi Terlambat (menit)"
                id="set-late"
                type="number"
                required
                value={settings.late_tolerance}
                onChange={(e) =>
                  setSettings({ ...settings, late_tolerance: parseInt(e.target.value) || 0 })
                }
              />
              <FormField.Input
                label="Toleransi Pulang Cepat (menit)"
                id="set-early"
                type="number"
                required
                value={settings.early_checkout_tolerance}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    early_checkout_tolerance: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
          </div>

          {/* Hari Kerja & Lembur */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-5">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider select-none">
              <Lucide.Calendar className="w-4 h-4 text-primary" />
              <span>Hari Kerja & Lembur</span>
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider select-none">
                Hari Kerja Mingguan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1">
                {WEEKDAYS.map((day) => (
                  <label
                    key={day}
                    className="flex items-center gap-2 px-3 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer text-xs select-none"
                  >
                    <input
                      type="checkbox"
                      name="workday-days"
                      value={day}
                      checked={settings.working_days.includes(day)}
                      onChange={() => toggleWorkingDay(day)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4.5 h-4.5"
                    />
                    <span>{day}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="border-slate-100" />

            <div className="grid grid-cols-2 gap-4">
              <FormField.Input
                label="Batas Mulai Lembur (menit)"
                id="set-ot-delay"
                type="number"
                required
                value={settings.overtime_start_delay}
                onChange={(e) =>
                  setSettings({ ...settings, overtime_start_delay: parseInt(e.target.value) || 0 })
                }
              />
              <FormField.Select
                label="Perhitungan Lembur"
                id="set-ot-method"
                value={settings.overtime_calculation_method}
                onChange={(e) =>
                  setSettings({ ...settings, overtime_calculation_method: e.target.value })
                }
                options={[
                  { value: 'hourly', label: 'Per Jam Penuh' },
                  { value: 'half_hourly', label: 'Per Setengah Jam' },
                ]}
              />
            </div>
          </div>

          {/* Integrasi Fingerprint */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4 md:col-span-2">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider select-none">
              <Lucide.Cpu className="w-4 h-4 text-primary" />
              <span>Integrasi Perangkat Keras (Simulasi)</span>
            </h3>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Integrasi Mesin Fingerprint ADMS
                </h4>
                <p className="text-[11px] text-slate-400">
                  Aktifkan sinkronisasi otomatis harian antara data offline fingerprint log mesin
                  kantor dengan server lokal HIVE.
                </p>
              </div>
              <div className="shrink-0 select-none">
                <FormField.Toggle
                  id="set-fingerprint"
                  checked={settings.fingerprint_integration}
                  onChange={(e) =>
                    setSettings({ ...settings, fingerprint_integration: e.target.checked })
                  }
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
