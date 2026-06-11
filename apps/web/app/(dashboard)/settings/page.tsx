'use client';

import React from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const settingsTiles = [
  {
    href: '/settings/hiring',
    icon: Lucide.Briefcase,
    title: 'Rekrutmen & Lowongan',
    desc: 'Kelola pipa proses seleksi, sumber pelamar, dan formulir pendaftaran kandidat baru.',
    color: 'blue',
  },
  {
    href: '/settings/procurement',
    icon: Lucide.ShoppingCart,
    title: 'Kebijakan Pengadaan PO',
    desc: 'Atur ambang batas pengeluaran jabatan, daftar vendor/supplier terverifikasi, dan alur PO.',
    color: 'green',
  },
  {
    href: '/settings/custom-form',
    icon: Lucide.FileSpreadsheet,
    title: 'Kustom Form Builder',
    desc: 'Buat formulir survei mandiri dan checklist lapangan menggunakan drag-drop rancangan instan.',
    color: 'purple',
  },
  {
    href: '/settings/leave',
    icon: Lucide.CalendarDays,
    title: 'Aturan Cuti & Libur',
    desc: 'Atur kebijakan akrual jatah cuti, carry-over tahunan, dan tanggal larangan cuti (blackout).',
    color: 'amber',
  },
  {
    href: '/settings/assets',
    icon: Lucide.Package,
    title: 'Kategori & Aturan Aset',
    desc: 'Klasifikasi tipe aset barang perusahaan, lokasi penyimpanan fisik, dan batas pinjam.',
    color: 'cyan',
  },
  {
    href: '/settings/payroll',
    icon: Lucide.Banknote,
    title: 'Komponen Gaji',
    desc: 'Kelola komponen tunjangan, potongan, dan aturan kalkulasi gaji karyawan.',
    color: 'emerald',
  },
  {
    href: '/settings/others',
    icon: Lucide.SlidersHorizontal,
    title: 'Preferensi Umum & Sesi',
    desc: 'Setel zona waktu, standardisasi format tanggal/angka, dan masa kedaluwarsa sesi login.',
    color: 'indigo',
  },
];

const colorMap: Record<string, { bg: string; hover: string }> = {
  blue: { bg: 'bg-blue-50 text-blue-600 border-blue-100', hover: 'hover:border-blue-200' },
  green: { bg: 'bg-green-50 text-green-600 border-green-100', hover: 'hover:border-green-200' },
  purple: { bg: 'bg-purple-50 text-purple-600 border-purple-100', hover: 'hover:border-purple-200' },
  amber: { bg: 'bg-amber-50 text-amber-600 border-amber-100', hover: 'hover:border-amber-200' },
  cyan: { bg: 'bg-cyan-50 text-cyan-600 border-cyan-100', hover: 'hover:border-cyan-200' },
  indigo: { bg: 'bg-indigo-50 text-indigo-600 border-indigo-100', hover: 'hover:border-indigo-200' },
  emerald: { bg: 'bg-emerald-50 text-emerald-600 border-emerald-100', hover: 'hover:border-emerald-200' },
};

export default function SettingsPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10 select-none">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin yang dapat mengakses pengaturan sistem.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Pengaturan Sistem & Konfigurasi</h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi detail parameter kerja, alur rekrutmen, pengadaan, perizinan cuti, manajemen aset, dan kebijakan korporat.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {settingsTiles.map((tile) => {
          const Icon = tile.icon;
          const colors = colorMap[tile.color];
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition flex gap-5 group cursor-pointer ${colors.hover}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border transition ${colors.bg}`}>
                <Icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-primary transition">{tile.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{tile.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
