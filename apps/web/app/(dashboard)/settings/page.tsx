'use client';

import React from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const settingsLinks = [
  { href: '/settings/hiring', icon: Lucide.UserPlus, title: 'Pengaturan Rekrutmen', desc: 'Konfigurasi alur hiring dan onboarding karyawan baru.' },
  { href: '/settings/procurement', icon: Lucide.ShoppingCart, title: 'Pengaturan Procurement', desc: 'Atur batas approval PO dan kebijakan pengadaan.' },
  { href: '/settings/custom-form', icon: Lucide.FileEdit, title: 'Custom Form', desc: 'Kelola formulir kustom untuk pengajuan internal.' },
  { href: '/settings/leave', icon: Lucide.Calendar, title: 'Pengaturan Cuti', desc: 'Konfigurasi jenis cuti, kuota, dan kebijakan cuti.' },
  { href: '/settings/assets', icon: Lucide.Package, title: 'Pengaturan Aset', desc: 'Atur kategori aset dan kebijakan penugasan.' },
  { href: '/settings/others', icon: Lucide.SlidersHorizontal, title: 'Pengaturan Lainnya', desc: 'Konfigurasi umum sistem dan preferensi perusahaan.' },
];

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
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pusat Pengaturan</h1>
        <p className="text-xs text-slate-400 mt-1">Kelola konfigurasi modul dan kebijakan HR perusahaan.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {settingsLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-primary/20 transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center mb-3 group-hover:bg-primary group-hover:text-white transition">
              <item.icon className="w-5 h-5" />
            </div>
            <h3 className="text-xs font-bold text-slate-800">{item.title}</h3>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
