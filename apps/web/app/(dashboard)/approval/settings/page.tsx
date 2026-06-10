'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';

export default function ApprovalSettingsPage() {
  const { t } = useI18n();
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings states
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [autoDelegation, setAutoDelegation] = useState(false);
  const [reminderHours, setReminderHours] = useState(24);
  const [deadlineHours, setDeadlineHours] = useState(48);

  // Keep track of original state for audit logs
  const [originalSettings, setOriginalSettings] = useState<any>(null);

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      try {
        const me = await fetchAPI('/auth/me');
        setUserRole(me?.role || 'EMPLOYEE');

        const data = await fetchAPI<any>('/approval/settings');
        setOriginalSettings(data);
        setEmailNotifications(data.email_notifications);
        setAutoDelegation(data.auto_delegation_enabled);
        setReminderHours(data.auto_reminder_hours);
        setDeadlineHours(data.global_deadline_hours);
      } catch (err) {
        console.error('Failed to load approval settings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newSettings = {
        email_notifications: emailNotifications,
        auto_delegation_enabled: autoDelegation,
        auto_reminder_hours: reminderHours,
        global_deadline_hours: deadlineHours,
      };

      await fetchAPI('/approval/settings', {
        method: 'POST',
        body: JSON.stringify({
          before: originalSettings,
          after: newSettings,
        }),
      });

      alert('Pengaturan alur persetujuan berhasil diperbarui!');
      setOriginalSettings(newSettings);
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  if (!isHR && !loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Akses Ditolak</h3>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin dan Super Admin yang dapat mengakses pengaturan alur persetujuan.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none animate-fade-in">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengaturan Alur Persetujuan</h1>
          <p className="text-xs text-slate-400 mt-1">Konfigurasi notifikasi approval, reminder, eskalasi otomatis, dan batas waktu penyelesaian.</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer select-none disabled:opacity-50"
        >
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 animate-scale-up">
          <h3 className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center gap-2 uppercase tracking-wider select-none">
            <Lucide.Settings className="w-4 h-4 text-primary" />
            <span>Global Approval Parameters</span>
          </h3>

          <div className="space-y-4">
            {/* Email Notification Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl select-none">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Kirim Notifikasi Email</h4>
                <p className="text-[11px] text-slate-400">Simulasikan pengiriman email pemberitahuan ke kotak masuk approver setiap ada pengajuan baru.</p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setEmailNotifications(prev => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    emailNotifications ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      emailNotifications ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Auto Delegation Toggle */}
            <div className="flex items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200/60 rounded-xl select-none">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Delegasi Alur Otomatis</h4>
                <p className="text-[11px] text-slate-400">Jika approver utama sedang mengambil cuti resmi, otomatis limpahkan wewenang ke approver cadangan/atasan langsung.</p>
              </div>
              <div className="shrink-0">
                <button
                  type="button"
                  onClick={() => setAutoDelegation(prev => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoDelegation ? 'bg-primary' : 'bg-slate-200'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoDelegation ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Duration inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Pengingat Otomatis (Reminder Jam)
                </label>
                <input
                  type="number"
                  value={reminderHours}
                  onChange={(e) => setReminderHours(parseInt(e.target.value) || 24)}
                  min={1}
                  required
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Batas Waktu Global (Jam)
                </label>
                <input
                  type="number"
                  value={deadlineHours}
                  onChange={(e) => setDeadlineHours(parseInt(e.target.value) || 48)}
                  min={1}
                  required
                  className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-white"
                />
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
