'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import Badge from '@/components/shared/Badge';

export default function AttendancePage() {
  const { t } = useI18n();
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [location, setLocation] = useState('Head Office (Simulated GPS)');

  const loadStatusAndHistory = async () => {
    setLoading(true);
    try {
      const [status, historyData] = await Promise.all([
        fetchAPI('/attendance/today'),
        fetchAPI<any[]>('/attendance/history'),
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
  }, []);

  const handleCheckIn = async () => {
    try {
      await fetchAPI('/attendance/check-in', {
        method: 'POST',
        body: JSON.stringify({ location, notes }),
      });
      alert('Check-in Berhasil!');
      setNotes('');
      loadStatusAndHistory();
    } catch (err: any) {
      alert(err.message || 'Gagal check-in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await fetchAPI('/attendance/check-out', {
        method: 'POST',
      });
      alert('Check-out Berhasil!');
      loadStatusAndHistory();
    } catch (err: any) {
      alert(err.message || 'Gagal check-out');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Console Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 flex flex-col gap-6 select-none">
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Absensi Kehadiran</h2>
          <p className="text-xs text-slate-400 mt-1">Catat kehadiran Anda hari ini berdasarkan shift kerja standard.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clock display */}
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Waktu Hari Ini</span>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 font-mono">
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </h3>
              <p className="text-[10px] text-slate-400 font-semibold mt-1">
                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Check in / Check out times */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-blue-500 tracking-wider">Jam Masuk</span>
                <p className="text-sm font-bold text-slate-700 font-mono mt-1">
                  {todayRecord?.checkIn
                    ? new Date(todayRecord.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
              <div className="p-3 bg-green-50/50 border border-green-100 rounded-lg text-center">
                <span className="text-[9px] uppercase font-bold text-green-500 tracking-wider">Jam Pulang</span>
                <p className="text-sm font-bold text-slate-700 font-mono mt-1">
                  {todayRecord?.checkOut
                    ? new Date(todayRecord.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                    : '--:--'}
                </p>
              </div>
            </div>

            {/* Form */}
            {!todayRecord && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Catatan Masuk (Opsional)</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Tulis catatan check-in Anda..."
                    className="block w-full px-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:border-primary transition resize-none"
                    rows={2}
                  />
                </div>
                <button
                  onClick={handleCheckIn}
                  className="w-full py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                >
                  Check In Masuk
                </button>
              </div>
            )}

            {todayRecord && !todayRecord.checkOut && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-center text-xs text-slate-500">
                  <p>Anda sudah check-in pada pukul <strong>{new Date(todayRecord.checkIn).toLocaleTimeString('id-ID')}</strong>.</p>
                  {todayRecord.notes && <p className="mt-1.5 italic">&ldquo;{todayRecord.notes}&rdquo;</p>}
                </div>
                <button
                  onClick={handleCheckOut}
                  className="w-full py-2.5 bg-green-600 hover:bg-green-750 text-white rounded-lg text-xs font-bold shadow transition cursor-pointer"
                >
                  Check Out Pulang
                </button>
              </div>
            )}

            {todayRecord?.checkOut && (
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-lg text-center space-y-2 text-xs text-slate-500">
                <Lucide.CheckCircle className="w-8 h-8 text-green-500 mx-auto" />
                <p className="font-bold text-slate-700">Absensi Hari Ini Lengkap</p>
                <p>Jam Kerja: <strong>{todayRecord.workHours} Jam</strong> &bull; Status: <Badge status={todayRecord.status.toLowerCase()} /></p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* History Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 select-none">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Log Kehadiran Bulan Ini</h2>
        </div>
        <div className="overflow-x-auto flex-1 min-h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20 select-none">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center h-full py-20 text-slate-400 text-xs">
              Belum ada riwayat kehadiran tercatat bulan ini
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                  <th className="px-6 py-3.5 uppercase tracking-wider">Tanggal</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Check In</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Check Out</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Jam Kerja</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {history.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-700">
                      {new Date(row.date).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5 font-mono">
                      {row.checkIn
                        ? new Date(row.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </td>
                    <td className="px-6 py-3.5 font-mono">
                      {row.checkOut
                        ? new Date(row.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                        : '--:--'}
                    </td>
                    <td className="px-6 py-3.5 font-mono font-bold text-slate-600">
                      {row.workHours ? `${row.workHours} Jam` : '-'}
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <Badge status={row.status.toLowerCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
