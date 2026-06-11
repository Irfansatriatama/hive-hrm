'use client';

import React, { useState, useEffect, useRef } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Badge from '@/components/shared/Badge';

const MONTHS = [
  { v: 1, l: 'Januari' },
  { v: 2, l: 'Februari' },
  { v: 3, l: 'Maret' },
  { v: 4, l: 'April' },
  { v: 5, l: 'Mei' },
  { v: 6, l: 'Juni' },
  { v: 7, l: 'Juli' },
  { v: 8, l: 'Agustus' },
  { v: 9, l: 'September' },
  { v: 10, l: 'Oktober' },
  { v: 11, l: 'November' },
  { v: 12, l: 'Desember' },
];

function formatTime(iso?: string | null): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

function formatDuration(row: any): string {
  if (row.workHours) {
    const hrs = Math.floor(row.workHours);
    const mins = Math.round((row.workHours - hrs) * 60);
    return `${hrs}h ${mins}m`;
  }
  if (row.checkIn && row.checkOut) {
    const diff = (new Date(row.checkOut).getTime() - new Date(row.checkIn).getTime()) / (1000 * 60);
    const hrs = Math.floor(diff / 60);
    const mins = Math.round(diff % 60);
    return `${hrs}h ${mins}m`;
  }
  return '-';
}

export default function AttendancePage() {
  const now = new Date();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [runningTimer, setRunningTimer] = useState('00:00:00');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentYear = now.getFullYear();
  const yearOptions = [currentYear, currentYear - 1, currentYear - 2];

  const loadStatusAndHistory = async () => {
    setLoading(true);
    try {
      const [status, historyData] = await Promise.all([
        fetchAPI('/attendance/today'),
        fetchAPI<any[]>(`/attendance/history?month=${filterMonth}&year=${filterYear}`),
      ]);
      setTodayRecord(status);
      setHistory(historyData);
    } catch (err) {
      console.error('Failed to load attendance details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatusAndHistory();
  }, [filterMonth, filterYear]);

  useEffect(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
      const checkInDate = new Date(todayRecord.checkIn);

      const updateTimer = () => {
        const diffMs = Date.now() - checkInDate.getTime();
        if (diffMs < 0) {
          setRunningTimer('00:00:00');
          return;
        }
        const hrs = Math.floor(diffMs / 3600000);
        const mins = Math.floor((diffMs % 3600000) / 60000);
        const secs = Math.floor((diffMs % 60000) / 1000);
        setRunningTimer(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
        );
      };

      updateTimer();
      timerRef.current = setInterval(updateTimer, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [todayRecord]);

  const handleCheckIn = async () => {
    try {
      let gpsData: { latitude?: number; longitude?: number } = {};
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          gpsData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          // GPS ditolak atau tidak tersedia — lanjut tanpa koordinat
        }
      }

      const result = await fetchAPI<any>('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ ...gpsData }),
      });
      const timeStr = result?.checkIn
        ? formatTime(result.checkIn)
        : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      const status = result?.status || 'On Time';
      alert(`Absen Masuk Berhasil pada ${timeStr} (${status})`);
      loadStatusAndHistory();
    } catch (err: any) {
      alert(err.message || 'Gagal check-in');
    }
  };

  const handleCheckOut = async () => {
    try {
      let gpsData: { latitude?: number; longitude?: number } = {};
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
          });
          gpsData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        } catch {
          // GPS ditolak atau tidak tersedia — lanjut tanpa koordinat
        }
      }

      const result = await fetchAPI<any>('/attendance/check-out', {
        method: 'POST',
        body: JSON.stringify({ ...gpsData }),
      });
      const timeStr = result?.checkOut
        ? formatTime(result.checkOut)
        : new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
      const duration = formatDuration(result);
      alert(`Absen Keluar Berhasil pada ${timeStr}. Durasi Kerja: ${duration}`);
      loadStatusAndHistory();
    } catch (err: any) {
      alert(err.message || 'Gagal check-out');
    }
  };

  const renderActionButton = () => {
    if (!todayRecord) {
      return (
        <button
          onClick={handleCheckIn}
          className="w-48 h-48 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-lg shadow-xl shadow-emerald-500/10 active:scale-[0.97] focus:outline-none transition-all flex flex-col items-center justify-center gap-2 border-[6px] border-emerald-50 relative group cursor-pointer"
        >
          <div className="absolute inset-0 rounded-full border border-emerald-400 group-hover:scale-105 transition duration-300" />
          <Lucide.LogIn className="w-8 h-8" />
          <span>Check In</span>
        </button>
      );
    }

    if (todayRecord.checkIn && !todayRecord.checkOut) {
      return (
        <button
          onClick={handleCheckOut}
          className="w-48 h-48 rounded-full bg-amber-600 hover:bg-amber-700 text-white font-bold text-lg shadow-xl shadow-amber-500/10 active:scale-[0.97] focus:outline-none transition-all flex flex-col items-center justify-center gap-2 border-[6px] border-amber-50 relative group cursor-pointer"
        >
          <div className="absolute inset-0 rounded-full border border-amber-400 group-hover:scale-105 transition duration-300" />
          <Lucide.LogOut className="w-8 h-8" />
          <span>Check Out</span>
        </button>
      );
    }

    return (
      <button
        disabled
        className="w-48 h-48 rounded-full bg-slate-100 border-[6px] border-slate-50 text-slate-400 font-bold text-lg flex flex-col items-center justify-center gap-2 select-none"
      >
        <Lucide.CheckCircle2 className="w-8 h-8 text-slate-300" />
        <span>Selesai</span>
      </button>
    );
  };

  const renderStatusSummary = () => {
    if (!todayRecord) {
      return (
        <div className="text-center md:text-left select-none">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Status Hari Ini
          </p>
          <h3 className="text-xl font-bold text-slate-700 mt-1">Belum Melakukan Absen Masuk</h3>
        </div>
      );
    }

    if (todayRecord.checkIn && !todayRecord.checkOut) {
      return (
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
            Status Hari Ini
          </p>
          <h3 className="text-xl font-bold text-slate-700 mt-1 flex items-center justify-center md:justify-start gap-2 select-none">
            Terabsen Masuk pada{' '}
            <span className="font-mono text-primary font-extrabold">
              {formatTime(todayRecord.checkIn)}
            </span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Durasi berjalan:{' '}
            <span className="font-mono font-bold text-slate-600">{runningTimer}</span>
          </p>
        </div>
      );
    }

    return (
      <div className="text-center md:text-left select-none">
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">
          Status Hari Ini
        </p>
        <h3 className="text-xl font-bold text-green-600 mt-1">Absensi Hari Ini Lengkap</h3>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Masuk: {formatTime(todayRecord.checkIn)} | Keluar: {formatTime(todayRecord.checkOut)} (
          {formatDuration(todayRecord)})
        </p>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 flex flex-col items-center justify-center min-h-[400px] gap-6">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {renderActionButton()}
            {renderStatusSummary()}
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Riwayat Absensi Saya
          </h2>
          <div className="flex items-center gap-2">
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
            >
              {MONTHS.map((m) => (
                <option key={m.v} value={m.v}>
                  {m.l}
                </option>
              ))}
            </select>
            <select
              value={filterYear}
              onChange={(e) => setFilterYear(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
            >
              {yearOptions.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="px-6 py-8 text-center text-slate-400 select-none text-xs">
              Tidak ada riwayat absensi pada bulan/tahun ini.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Hari
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Masuk
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Keluar
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Durasi
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Lokasi
                  </th>
                  <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                {history.map((row) => {
                  const dateObj = new Date(row.date);
                  const dayLabel = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
                  return (
                    <tr key={row.id} className="table-row-hover border-b border-slate-100 transition">
                      <td className="px-6 py-3.5 font-semibold text-slate-700 font-mono">
                        {formatDate(row.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 capitalize">{dayLabel}</td>
                      <td className="px-6 py-3.5 font-bold text-slate-700 font-mono">
                        {formatTime(row.checkIn)}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-700 font-mono">
                        {formatTime(row.checkOut)}
                      </td>
                      <td className="px-6 py-3.5 font-bold text-slate-500 font-mono">
                        {formatDuration(row)}
                      </td>
                      <td className="px-6 py-3.5">
                        {row.latitude != null && row.longitude != null ? (
                          <a
                            href={`https://maps.google.com/?q=${row.latitude},${row.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex flex-col gap-0.5 group"
                            title="Buka di Google Maps"
                          >
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 w-fit">
                              GPS
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-primary transition">
                              {Number(row.latitude).toFixed(5)}, {Number(row.longitude).toFixed(5)}
                            </span>
                          </a>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-500 border border-slate-100">
                            Manual
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge status={row.status?.toLowerCase()} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
