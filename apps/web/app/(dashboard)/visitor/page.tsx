'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import { isHRRole, usePermission } from '@/hooks/usePermission';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface VisitorRow {
  id: string;
  badgeNumber?: string;
  visitorName: string;
  company?: string;
  idType?: string;
  idNumber?: string;
  phone?: string;
  email?: string;
  purpose: string;
  hostEmployeeId?: string;
  hostName?: string;
  vehicleNumber?: string;
  checkIn: string;
  checkOut?: string | null;
  status: string;
}

interface EmployeeOption {
  id: string;
  fullName?: string;
  full_name?: string;
  employeeNumber?: string;
}

const ID_TYPE_OPTIONS = [
  { value: 'KTP', label: 'KTP' },
  { value: 'SIM', label: 'SIM' },
  { value: 'Paspor', label: 'Paspor' },
];

const EMPTY_FORM = {
  visitorName: '',
  company: '',
  vehicleNumber: '',
  idType: 'KTP',
  idNumber: '',
  phone: '',
  email: '',
  hostEmployeeId: '',
  purpose: '',
};

function formatTime(iso?: string | null) {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

function isSameDay(dateIso: string, dayStr: string) {
  return dateIso.startsWith(dayStr);
}

export default function VisitorPage() {
  const { userRole, isLoading: authLoading } = usePermission();
  const isHR = isHRRole(userRole);

  const [visitors, setVisitors] = useState<VisitorRow[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [badgeTarget, setBadgeTarget] = useState<VisitorRow | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const loadData = async () => {
    setLoading(true);
    try {
      const [visitorData, empsRes] = await Promise.all([
        fetchAPI<VisitorRow[]>('/core/visitors'),
        fetchAPI<{ employees: EmployeeOption[] }>('/employees?limit=1000'),
      ]);
      setVisitors(visitorData);
      setEmployees(empsRes.employees || []);
    } catch (err) {
      console.error('Failed to load visitors:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!authLoading && isHR) {
      loadData();
    }
  }, [authLoading, isHR]);

  const todayVisits = useMemo(
    () => visitors.filter((v) => isSameDay(v.checkIn, todayStr)),
    [visitors, todayStr],
  );
  const activeInside = useMemo(
    () => visitors.filter((v) => v.status === 'checked_in'),
    [visitors],
  );
  const monthlyVisits = useMemo(
    () => visitors.filter((v) => v.checkIn.startsWith(currentMonthStr)),
    [visitors, currentMonthStr],
  );

  const weeklyChartData = useMemo(() => {
    const days: { label: string; count: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({
        label: d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' }),
        count: visitors.filter((v) => isSameDay(v.checkIn, dateStr)).length,
      });
    }
    return days;
  }, [visitors]);

  const handleCheckIn = async () => {
    if (!form.visitorName.trim() || !form.company.trim() || !form.idNumber.trim() || !form.phone.trim() || !form.purpose.trim()) {
      alert('Mohon lengkapi data wajib tamu!');
      return;
    }

    setSubmitting(true);
    try {
      const created = await fetchAPI<VisitorRow>('/core/visitors', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      alert('Tamu berhasil check-in dan masuk sistem');
      setForm(EMPTY_FORM);
      await loadData();
      setBadgeTarget(created);
    } catch (err: any) {
      alert(err.message || 'Gagal check-in tamu');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async (id: string) => {
    try {
      await fetchAPI(`/core/visitors/${id}/check-out`, { method: 'POST' });
      alert('Tamu berhasil check-out');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal check-out tamu');
    }
  };

  const handleExportLedger = () => {
    const csvContent = [
      ['Badge ID', 'Nama Tamu', 'Instansi', 'Host', 'Check In', 'Check Out', 'Status'],
      ...visitors.map((v) => [
        v.badgeNumber || '',
        v.visitorName,
        v.company || '',
        v.hostName || v.hostEmployeeId || '',
        new Date(v.checkIn).toISOString(),
        v.checkOut ? new Date(v.checkOut).toISOString() : '',
        v.status,
      ]),
    ]
      .map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'riwayat_kunjungan_tamu.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Manajemen tamu hanya untuk HR Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Sistem Registrasi Tamu & Visitor</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola check-in walk-in, cetak kartu ID tamu secara digital, dan verifikasi riwayat kunjungan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Lucide.Users className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tamu Masuk Hari Ini</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{todayVisits.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
            <Lucide.UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Masih di Dalam Kantor</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{activeInside.length}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition select-none">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Lucide.Calendar className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Kunjungan Bulan Ini</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">{monthlyVisits.length}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">
            Pendaftaran Tamu (Walk-In)
          </h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleCheckIn();
            }}
            className="space-y-4"
          >
            <FormField.Input
              label="Nama Tamu"
              required
              placeholder="Contoh: Andi Wijaya"
              value={form.visitorName}
              onChange={(e) => setForm({ ...form, visitorName: e.target.value })}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField.Input
                label="Instansi / Perusahaan"
                required
                placeholder="Contoh: PT. Mitra Jaya"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
              <FormField.Input
                label="Nomor Kendaraan"
                placeholder="Contoh: B 1234 ABC"
                value={form.vehicleNumber}
                onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Select
                label="Jenis ID"
                value={form.idType}
                onChange={(e) => setForm({ ...form, idType: e.target.value })}
                options={ID_TYPE_OPTIONS}
              />
              <FormField.Input
                label="Nomor ID"
                required
                placeholder="3201..."
                value={form.idNumber}
                onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField.Input
                label="Nomor Telepon"
                required
                placeholder="0812..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
              <FormField.Input
                label="Alamat Email"
                type="email"
                placeholder="andi@mitra.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>

            <FormField.Select
              label="Karyawan Temuan (Host)"
              value={form.hostEmployeeId}
              onChange={(e) => setForm({ ...form, hostEmployeeId: e.target.value })}
              options={[
                { value: '', label: 'Pilih Host' },
                ...employees.map((e) => ({
                  value: e.id,
                  label: `${e.fullName || e.full_name} (${e.employeeNumber || e.id})`,
                })),
              ]}
            />

            <FormField.Textarea
              label="Tujuan Pertemuan"
              required
              rows={2}
              placeholder="Ketik tujuan pertemuan..."
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
            />

            <div className="pt-2 select-none">
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-lg shadow transition flex items-center justify-center gap-1.5 text-xs cursor-pointer disabled:opacity-50"
              >
                <Lucide.UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Memproses...' : 'Check In Tamu'}</span>
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 overflow-hidden">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">
            Tamu Hari Ini
          </h2>

          <div className="overflow-x-auto flex-1">
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none text-[9px] text-slate-500 uppercase font-bold tracking-wider">
                    <th className="px-4 py-3">Badge ID</th>
                    <th className="px-4 py-3">Nama Tamu</th>
                    <th className="px-4 py-3">Instansi / Perusahaan</th>
                    <th className="px-4 py-3">Tujuan Pertemuan</th>
                    <th className="px-4 py-3">Karyawan Temuan (Host)</th>
                    <th className="px-4 py-3">Jam Masuk</th>
                    <th className="px-4 py-3">Jam Keluar</th>
                    <th className="px-4 py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {todayVisits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-6 text-center text-slate-400 select-none text-xs">
                        Belum ada tamu terdaftar hari ini
                      </td>
                    </tr>
                  ) : (
                    todayVisits.map((v) => (
                      <tr key={v.id} className="table-row-hover border-b border-slate-100 transition text-xs text-slate-700">
                        <td className="px-4 py-3 font-bold text-slate-800 font-mono">{v.badgeNumber || '-'}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{v.visitorName}</td>
                        <td className="px-4 py-3 font-semibold text-slate-500">{v.company || '-'}</td>
                        <td className="px-4 py-3 text-slate-500 max-w-[150px] truncate" title={v.purpose}>{v.purpose}</td>
                        <td className="px-4 py-3 font-semibold text-slate-600">{v.hostName || '-'}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{formatTime(v.checkIn)}</td>
                        <td className="px-4 py-3 font-mono text-slate-500">{formatTime(v.checkOut)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {v.status === 'checked_in' && (
                              <button
                                onClick={() => handleCheckOut(v.id)}
                                className="px-2.5 py-1.5 border border-red-200 hover:bg-red-50 text-red-600 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                              >
                                <Lucide.LogOut className="w-3 h-3" />
                                Check Out
                              </button>
                            )}
                            <button
                              onClick={() => setBadgeTarget(v)}
                              className="px-2.5 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-1"
                            >
                              <Lucide.BadgeCheck className="w-3 h-3" />
                              Cetak Badge
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 select-none">
        <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Riwayat Kunjungan</h2>
            <button
              onClick={handleExportLedger}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lucide.Download className="w-3.5 h-3.5" />
              <span>Ekspor CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  <th className="px-6 py-3.5">Badge ID</th>
                  <th className="px-6 py-3.5">Nama Tamu</th>
                  <th className="px-6 py-3.5">Instansi / Perusahaan</th>
                  <th className="px-6 py-3.5">Karyawan Temuan (Host)</th>
                  <th className="px-6 py-3.5">Check In</th>
                  <th className="px-6 py-3.5">Check Out</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {visitors.slice(0, 10).map((v) => (
                  <tr key={v.id} className="table-row-hover border-b border-slate-100 transition">
                    <td className="px-6 py-3.5 font-bold font-mono text-slate-800">{v.badgeNumber || '-'}</td>
                    <td className="px-6 py-3.5 font-bold text-slate-800">{v.visitorName}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-500">{v.company || '-'}</td>
                    <td className="px-6 py-3.5 font-semibold text-slate-600">{v.hostName || '-'}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">{formatDate(v.checkIn)}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-500">{v.checkOut ? formatDate(v.checkOut) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Tren Kunjungan 7 Hari Terakhir</h2>
          <div className="h-64 relative w-full">
            {isClient && !loading ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="label" fontSize={10} stroke="#94A3B8" />
                  <YAxis fontSize={10} stroke="#94A3B8" allowDecimals={false} />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={24} name="Jumlah Kunjungan" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!badgeTarget}
        onClose={() => setBadgeTarget(null)}
        title="Kartu Tamu HIVE"
        size="sm"
        footer={
          <>
            <button
              onClick={() => setBadgeTarget(null)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
            >
              Cetak Print
            </button>
          </>
        }
      >
        {badgeTarget && (
          <div className="p-6 border-2 border-slate-900 border-dashed rounded-2xl w-full max-w-sm mx-auto select-none bg-slate-50 text-slate-800 shadow relative overflow-hidden flex flex-col justify-between gap-5 text-center">
            <div className="flex items-center justify-center gap-2 border-b border-slate-200 pb-3.5">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center font-bold text-white shadow-md">H</div>
              <span className="font-bold text-xs uppercase tracking-widest text-slate-800">HIVE Visitor Badge</span>
            </div>

            <div className="space-y-3">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block">Kartu Tamu HIVE</span>
              <h1 className="text-5xl font-black text-primary font-mono tracking-wide">{badgeTarget.badgeNumber || '-'}</h1>

              <div className="pt-2">
                <h3 className="text-sm font-bold text-slate-900 truncate">{badgeTarget.visitorName}</h3>
                <p className="text-[10px] text-slate-500 font-semibold truncate uppercase">{badgeTarget.company || '-'}</p>
              </div>
            </div>

            <div className="bg-slate-200/50 p-3 rounded-xl border border-slate-200/50 text-[10px] space-y-1 text-slate-600 font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase tracking-wider text-[8px]">MEETING WITH</span>
                <span className="truncate max-w-[120px] font-bold text-slate-800">{badgeTarget.hostName || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase tracking-wider text-[8px]">CHECK IN TIME</span>
                <span className="font-mono font-bold">{formatTime(badgeTarget.checkIn)}</span>
              </div>
            </div>

            <div className="text-[8px] text-slate-400 leading-none">
              Harap kalungkan kartu tanda pengenal ini selama berada di lingkungan kantor.
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
