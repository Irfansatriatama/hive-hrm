'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { getWorkingDays } from '@/lib/utils';

export default function ApplyLeavePage() {
  const { t } = useI18n();
  const router = useRouter();
  
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [employee, setEmployee] = useState<any>(null);
  
  const [typeId, setTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadFormContext() {
      try {
        const [typesData, balancesData] = await Promise.all([
          fetchAPI('/leave/types'),
          fetchAPI('/leave/balances'),
        ]);
        setLeaveTypes(typesData);
        setBalances(balancesData);

        try {
          const me = await fetchAPI('/employees/me');
          if (me) setEmployee(me);
        } catch {
          // Employee profile may not be linked; form can still load
        }
      } catch (err) {
        console.error('Failed to load leave apply details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadFormContext();
  }, []);

  // Calculate active working days excluding weekends
  const duration = (startDate && endDate) ? getWorkingDays(startDate, endDate) : 0;

  // Selected leave type balance
  const activeBalance = balances.find((b) => b.leaveTypeId === typeId);
  const currentRemaining = activeBalance ? activeBalance.remaining : 0;
  const isUnlimited = activeBalance?.quota >= 99; // Unlimited types like sick leave or special leave

  const currentBalanceLabel = activeBalance
    ? (isUnlimited ? 'Unlimited' : `${currentRemaining} Hari`)
    : '-';

  let newRemaining = currentRemaining - duration;
  let newBalanceLabel = '-';
  let isBalanceInsufficient = false;

  if (activeBalance) {
    if (isUnlimited) {
      newBalanceLabel = 'Unlimited';
    } else {
      if (newRemaining < 0) {
        isBalanceInsufficient = true;
        newBalanceLabel = 'Saldo Kurang';
      } else {
        newBalanceLabel = `${newRemaining} Hari`;
      }
    }
  }

  // Approval Chain Preview
  let managerChainName = 'Sari Dewi Lestari (HR Manager)';
  if (employee && employee.manager) {
    managerChainName = `${employee.manager.fullName || employee.manager.full_name} (${t('manager')}) → Sari Dewi Lestari (HR Manager)`;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachment(e.target.files[0]);
    }
  };

  const isFormValid =
    typeId &&
    startDate &&
    endDate &&
    reason.trim() &&
    duration > 0 &&
    !isBalanceInsufficient;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    try {
      // Create request payload
      const payload = {
        leaveTypeId: typeId,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        totalDays: duration,
        reason,
        attachmentName: attachment ? attachment.name : '',
      };

      await fetchAPI('/leave/requests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      alert('Pengajuan cuti berhasil dikirim ke antrean persetujuan!');
      router.push('/leave');
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim pengajuan cuti');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-scale-up">
      <div className="p-6 border-b border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Form Pengajuan Cuti Baru</h1>
        <p className="text-xs text-slate-400 mt-1">Isi detail tanggal dan alasan cuti. Sistem akan menghitung otomatis hari kerja efektif Anda.</p>
      </div>

      <div className="p-6 space-y-6">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Tipe Cuti Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Tipe Cuti <span className="text-red-500">*</span></label>
            <select
              value={typeId}
              onChange={(e) => setTypeId(e.target.value)}
              required
              className="block w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
            >
              <option value="">Pilih Tipe Cuti</option>
              {leaveTypes.map((lt) => (
                <option key={lt.id} value={lt.id}>{lt.name}</option>
              ))}
            </select>
          </div>

          {/* Attachment */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Unggah Lampiran (Opsional)</label>
            <input
              type="file"
              onChange={handleFileChange}
              className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-primary hover:file:bg-blue-100 cursor-pointer"
            />
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Tanggal Mulai Cuti <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="block w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Tanggal Selesai Cuti <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              required
              className="block w-full px-4 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
            />
          </div>

          {/* Balance Preview Card */}
          <div className="md:col-span-2 bg-slate-50 border border-slate-200/60 rounded-xl p-4 grid grid-cols-3 gap-4 text-center select-none">
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Durasi Pengajuan</span>
              <span className="text-lg font-bold text-slate-700 font-mono">{duration} Hari</span>
            </div>
            <div className="border-x border-slate-200">
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Saldo Cuti Saat Ini</span>
              <span className="text-lg font-bold text-slate-700 font-mono">{currentBalanceLabel}</span>
            </div>
            <div>
              <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Saldo Setelah Pengajuan</span>
              <span className={`text-lg font-bold font-mono ${isBalanceInsufficient ? 'text-red-500 text-sm mt-1 block' : 'text-slate-700'}`}>
                {newBalanceLabel}
              </span>
            </div>
          </div>

          {/* Reason */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">Alasan Pengajuan Cuti <span className="text-red-500">*</span></label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Tuliskan keterangan detail alasan Anda cuti..."
              required
              rows={3}
              className="block w-full px-4 py-2.5 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition resize-none"
            />
          </div>

          {/* Workflow Chain Preview */}
          <div className="md:col-span-2 p-4 bg-blue-50/40 border border-blue-100 rounded-xl flex items-start gap-3 select-none text-xs">
            <Lucide.ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="block font-bold text-slate-700">Rantai Persetujuan (Approval Chain Preview)</span>
              <span className="text-slate-500 flex items-center gap-1 mt-1 font-semibold">
                {managerChainName}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="md:col-span-2 pt-4 flex justify-end gap-3 select-none">
            <Link
              href="/leave"
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Batal
            </Link>
            <button
              type="submit"
              disabled={!isFormValid || submitting}
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 disabled:pointer-events-none transition cursor-pointer"
            >
              {submitting ? 'Mengirim...' : 'Kirim Pengajuan'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
