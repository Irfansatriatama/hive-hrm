'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';

interface EmployeeProfile {
  id: string;
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  birth_date: string | null;
  birth_place: string | null;
  religion: string | null;
  marital_status: string | null;
  blood_type: string | null;
  nationality: string | null;
  address: string | null;
  phone: string;
  email: string;
  status: string;
  employment_type: string;
  department_id: string | null;
  position_id: string | null;
  direct_manager_id: string | null;
  work_location: string;
  work_email: string;
  basic_salary: number;
  bank_name: string;
  bank_account: string;
  bank_account_name: string;
  tax_status: string;
  bpjs_kes: string;
  bpjs_tk: string;
  npwp: string;
  ktp: string;
  kk: string;
  join_date: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
  manager: { fullName: string; id: string } | null;
  attendances: any[];
  leave_requests: {
    id: string;
    leave_type_name: string;
    start_date: string;
    end_date: string;
    duration: number;
    reason: string | null;
    status: string;
  }[];
  assets: {
    id: string;
    name: string;
    serial_number: string | null;
    assigned_date: string | null;
  }[];
  documents: {
    id: string;
    name: string;
    size: string;
    folder: string;
  }[];
}

export default function EmployeeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useI18n();
  const { user } = useAuth();
  
  const id = params.id as string;
  
  // State
  const [emp, setEmp] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('personal');

  // Load employee profile
  useEffect(() => {
    async function loadProfile() {
      try {
        const data = await fetchAPI<EmployeeProfile>(`/employees/${id}`);
        setEmp(data);
      } catch (err: any) {
        setError(err.message || 'Karyawan tidak ditemukan');
      } finally {
        setLoading(false);
      }
    }
    if (id) loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full py-20 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-semibold">{t('loading')}</span>
        </div>
      </div>
    );
  }

  if (error || !emp) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.UserX className="w-12 h-12 text-slate-350 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Karyawan Tidak Ditemukan</h2>
        <p className="text-xs text-slate-450 mt-1">ID Karyawan &ldquo;{id}&rdquo; tidak terdaftar dalam database.</p>
        <Link
          href="/employee"
          className="mt-4 inline-block px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg shadow hover:bg-primary-dark transition"
        >
          Kembali ke Direktori
        </Link>
      </div>
    );
  }

  // Check payroll visibility permission
  const canViewPayroll =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'HR_ADMIN' ||
    user?.role === 'FINANCE' ||
    user?.email === emp.email;

  const tabs = [
    { id: 'personal', label: 'Info Pribadi', icon: Lucide.User },
    { id: 'job', label: 'Kepegawaian', icon: Lucide.Briefcase },
    { id: 'payroll', label: 'Penggajian', icon: Lucide.CreditCard },
    { id: 'leaves', label: 'Riwayat Cuti', icon: Lucide.Calendar },
    { id: 'assets', label: 'Aset', icon: Lucide.Package },
    { id: 'documents', label: 'Dokumen', icon: Lucide.File },
  ];

  return (
    <div className="space-y-6">
      {/* Banner Card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-4">
          <Avatar name={emp.full_name} size="lg" className="w-16 h-16 text-lg" />
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base font-bold text-slate-800 leading-none">{emp.full_name}</h1>
              <Badge status={emp.status.toLowerCase()} />
            </div>
            <p className="text-xs font-semibold text-slate-500">{emp.position?.name || '-'}</p>
            <p className="text-[10px] text-slate-400 font-medium">
              {emp.department?.name || '-'} &bull; Bergabung{' '}
              {emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold">
          {(user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN') && (
            <button
              onClick={() => router.push(`/employee?edit=${emp.id}`)}
              className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg transition flex items-center gap-1.5 cursor-pointer"
            >
              <Lucide.Edit className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>
          )}
          <Link
            href="/employee"
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-lg transition flex items-center gap-1"
          >
            <Lucide.ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </Link>
        </div>
      </div>

      {/* Tabs Header Navigation */}
      <div className="bg-white rounded-t-2xl border-x border-t border-slate-100 shadow-sm flex overflow-x-auto select-none scrollbar-none">
        {tabs.map(t => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-5 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-2 cursor-pointer shrink-0 ${
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tabs Content */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-100 shadow-sm p-6 min-h-[300px]">
        {activeTab === 'personal' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-700">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jenis Kelamin</span>
              <span className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                {emp.gender === 'male' ? 'Laki-laki' : 'Perempuan'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tempat & Tanggal Lahir</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                {emp.birth_place || '-'},{' '}
                {emp.birth_date
                  ? new Date(emp.birth_date).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })
                  : '-'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Agama / Golongan Darah</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                {emp.religion || '-'} / Gol. {emp.blood_type || 'O'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Pernikahan</span>
              <span className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                {emp.marital_status === 'single' ? 'Lajang' : emp.marital_status === 'married' ? 'Menikah' : emp.marital_status || '-'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Telepon</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">{emp.phone}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Pribadi</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.email}</span>
            </div>
            <div className="md:col-span-2">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Alamat Lengkap</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.address || '-'}</span>
            </div>
            <div className="border-t border-slate-100 md:col-span-2 lg:col-span-3 pt-4 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Kontak Darurat (Nama)</span>
                <span className="text-sm font-semibold text-slate-800 leading-relaxed">Ibu Aminah (Contoh)</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">No. HP Kontak Darurat</span>
                <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">081298765432</span>
              </div>
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hubungan</span>
                <span className="text-sm font-semibold text-slate-800 leading-relaxed">Orang Tua</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'job' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-700">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">ID Karyawan</span>
              <span className="text-sm font-semibold text-slate-800 font-mono leading-relaxed">{emp.id}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Departemen</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.department?.name || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Jabatan</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.position?.name || '-'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status & Tipe Pekerjaan</span>
              <span className="text-sm font-semibold text-slate-800 capitalize leading-relaxed">
                {emp.status} &bull; {emp.employment_type === 'permanent' ? 'Tetap' : emp.employment_type}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tanggal Bergabung</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                {emp.join_date ? new Date(emp.join_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Atasan Langsung (Manager)</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">
                {emp.manager ? `${emp.manager.fullName} (${emp.manager.id})` : 'Tidak ada (Direct Director)'}
              </span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Lokasi Kantor</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.work_location}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Kantor</span>
              <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.work_email}</span>
            </div>
          </div>
        )}

        {activeTab === 'payroll' && (
          <div>
            {!canViewPayroll ? (
              <div className="text-center py-12 text-slate-400 select-none">
                <Lucide.Lock className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                <p className="text-xs font-semibold">Anda tidak memiliki izin untuk melihat informasi penggajian karyawan ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-700">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gaji Pokok</span>
                  <span className="text-sm font-bold text-slate-800 leading-relaxed font-mono">
                    Rp {emp.basic_salary.toLocaleString('id-ID')}
                  </span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Bank Penerima</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.bank_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nomor Rekening</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">{emp.bank_account}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Nama Rekening</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.bank_account_name}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">Status Tanggungan (PTKP)</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed">{emp.tax_status}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">NPWP</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">{emp.npwp}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">BPJS Kesehatan</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">{emp.bpjs_kes}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">BPJS Ketenagakerjaan</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">{emp.bpjs_tk}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">NIK KTP</span>
                  <span className="text-sm font-semibold text-slate-800 leading-relaxed font-mono">{emp.ktp}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'leaves' && (
          <div>
            {emp.leave_requests.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Belum ada riwayat pengajuan cuti.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 select-none font-bold text-slate-500">
                      <th className="px-4 py-3 uppercase tracking-wider">Tipe Cuti</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Mulai</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Selesai</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Durasi</th>
                      <th className="px-4 py-3 uppercase tracking-wider">Alasan</th>
                      <th className="px-4 py-3 uppercase tracking-wider text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {emp.leave_requests.map(l => (
                      <tr key={l.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3 font-semibold text-slate-850">{l.leave_type_name}</td>
                        <td className="px-4 py-3 font-mono">{l.start_date}</td>
                        <td className="px-4 py-3 font-mono">{l.end_date}</td>
                        <td className="px-4 py-3 font-bold">{l.duration} hari</td>
                        <td className="px-4 py-3 text-slate-500">{l.reason || '-'}</td>
                        <td className="px-4 py-3 text-right">
                          <Badge status={l.status.toLowerCase()} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'assets' && (
          <div>
            {emp.assets.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Tidak ada aset perusahaan yang ditugaskan saat ini.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {emp.assets.map(ast => (
                  <div
                    key={ast.id}
                    className="p-4 border border-slate-100 rounded-xl bg-slate-50 flex items-start gap-3 shadow-xs select-none"
                  >
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Lucide.Monitor className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="font-bold text-slate-850 text-xs leading-none">{ast.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {ast.id} &bull; SN: {ast.serial_number || '-'}
                      </p>
                      <p className="text-[10px] text-slate-550 pt-1">
                        Dipinjam sejak: <span className="font-mono">{ast.assigned_date}</span>
                      </p>
                    </div>
                    <span className="text-[9px] font-bold bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full uppercase shrink-0">
                      In Use
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div>
            {emp.documents.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-10">Tidak ada dokumen bersama yang dibagikan.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emp.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="p-4 border border-slate-150 rounded-xl bg-white hover:bg-slate-50 transition shadow-xs flex items-center justify-between gap-3 select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                        <Lucide.FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-850 text-xs truncate leading-snug">
                          {doc.name}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {doc.size} &bull; {doc.folder}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => alert('Mengunduh file simulasi...')}
                      className="p-1 rounded bg-slate-100 text-slate-500 hover:text-slate-700 hover:bg-slate-200 shrink-0 cursor-pointer"
                    >
                      <Lucide.Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
