'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface RequestHistory {
  id: string;
  type: string;
  summary: string;
  createdAt: string;
  status: string;
  reason: string;
}

export default function RequestPage() {
  const { t } = useI18n();

  // Form states
  const [reqType, setReqType] = useState('address');
  const [reason, setReason] = useState('');
  
  // Dynamic fields
  const [addressNew, setAddressNew] = useState('');
  const [emgName, setEmgName] = useState('');
  const [emgRel, setEmgRel] = useState('');
  const [emgPhone, setEmgPhone] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAcName, setBankAcName] = useState('');
  const [bankAcNum, setBankAcNum] = useState('');
  const [otherField, setOtherField] = useState('');
  const [otherValue, setOtherValue] = useState('');

  // History states
  const [history, setHistory] = useState<RequestHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelId, setCancelId] = useState<string | null>(null);

  // Load history
  const loadHistory = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<RequestHistory[]>('/employees/requests/my');
      setHistory(data);
    } catch (err) {
      console.error('Failed to load request history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Form Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      alert('Mohon isi alasan pengajuan');
      return;
    }

    let summary = '';
    let details: any = {};

    if (reqType === 'address') {
      if (!addressNew.trim()) {
        alert('Alamat baru harus diisi');
        return;
      }
      summary = 'Update Alamat Rumah';
      details = { address: addressNew };
    } else if (reqType === 'emergency') {
      if (!emgName || !emgRel || !emgPhone) {
        alert('Mohon isi lengkap data kontak darurat');
        return;
      }
      summary = 'Update Kontak Darurat';
      details = {
        emergency_contact_name: emgName,
        emergency_contact_relation: emgRel,
        emergency_contact_phone: emgPhone,
      };
    } else if (reqType === 'bank') {
      if (!bankName || !bankAcName || !bankAcNum) {
        alert('Mohon isi lengkap informasi rekening bank');
        return;
      }
      summary = 'Update Info Rekening Bank';
      details = {
        bank_name: bankName,
        bank_account_name: bankAcName,
        bank_account: bankAcNum,
      };
    } else {
      if (!otherField || !otherValue) {
        alert('Mohon isi lengkap kolom lainnya');
        return;
      }
      summary = `Update ${otherField}`;
      details = { field: otherField, value: otherValue };
    }

    try {
      await fetchAPI('/employees/requests', {
        method: 'POST',
        body: JSON.stringify({
          type: reqType,
          summary,
          details,
          reason,
        }),
      });
      alert('Pengajuan perubahan profil berhasil dikirim');
      setReason('');
      setAddressNew('');
      setEmgName('');
      setEmgRel('');
      setEmgPhone('');
      setBankName('');
      setBankAcName('');
      setBankAcNum('');
      setOtherField('');
      setOtherValue('');
      loadHistory();
    } catch (err: any) {
      alert('Gagal mengirim pengajuan: ' + err.message);
    }
  };

  // Cancel handler
  const handleCancelClick = (id: string) => {
    setCancelId(id);
  };

  const handleConfirmCancel = async () => {
    if (!cancelId) return;
    try {
      await fetchAPI(`/employees/requests/${cancelId}`, {
        method: 'DELETE',
      });
      alert('Pengajuan berhasil dibatalkan');
      setCancelId(null);
      loadHistory();
    } catch (err: any) {
      alert('Gagal membatalkan pengajuan: ' + err.message);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Form Request Panel */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm lg:col-span-5 flex flex-col gap-5"
      >
        <div>
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Ajukan Perubahan Data</h2>
          <p className="text-xs text-slate-400 mt-1">
            Ajukan perbaikan data pribadi Anda untuk diverifikasi dan disetujui oleh HRD.
          </p>
        </div>

        <div className="space-y-4">
          <FormField.Select
            label="Tipe Perubahan Data"
            id="req-type"
            value={reqType}
            onChange={e => setReqType(e.target.value)}
            options={[
              { value: 'address', label: 'Perubahan Alamat Rumah' },
              { value: 'emergency', label: 'Perubahan Kontak Darurat' },
              { value: 'bank', label: 'Perubahan Rekening Gaji (Bank)' },
              { value: 'other', label: 'Perubahan Data Lainnya' },
            ]}
          />

          {/* Dynamic Inputs Area */}
          <div className="space-y-4">
            {reqType === 'address' && (
              <FormField.Textarea
                label="Alamat Rumah Baru"
                required
                value={addressNew}
                onChange={e => setAddressNew(e.target.value)}
                placeholder="Masukkan alamat lengkap baru termasuk RT/RW, kecamatan, dan kode pos..."
                rows={3}
              />
            )}

            {reqType === 'emergency' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField.Input
                    label="Nama Lengkap Kontak"
                    required
                    value={emgName}
                    onChange={e => setEmgName(e.target.value)}
                  />
                  <FormField.Input
                    label="Hubungan Keluarga"
                    placeholder="Suami, Istri, Ibu, Ayah..."
                    required
                    value={emgRel}
                    onChange={e => setEmgRel(e.target.value)}
                  />
                </div>
                <FormField.Input
                  label="Nomor Handphone HP"
                  required
                  value={emgPhone}
                  onChange={e => setEmgPhone(e.target.value)}
                />
              </div>
            )}

            {reqType === 'bank' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FormField.Input
                    label="Nama Bank Baru"
                    placeholder="BCA, Mandiri, BNI..."
                    required
                    value={bankName}
                    onChange={e => setBankName(e.target.value)}
                  />
                  <FormField.Input
                    label="Nama Pemilik Rekening"
                    required
                    value={bankAcName}
                    onChange={e => setBankAcName(e.target.value)}
                  />
                </div>
                <FormField.Input
                  label="Nomor Rekening Baru"
                  required
                  value={bankAcNum}
                  onChange={e => setBankAcNum(e.target.value)}
                />
              </div>
            )}

            {reqType === 'other' && (
              <div className="space-y-4">
                <FormField.Input
                  label="Nama Kolom Data"
                  placeholder="Contoh: Nomor KK, Golongan Darah..."
                  required
                  value={otherField}
                  onChange={e => setOtherField(e.target.value)}
                />
                <FormField.Textarea
                  label="Detail Perubahan Data Baru"
                  placeholder="Tuliskan data baru Anda di sini..."
                  required
                  value={otherValue}
                  onChange={e => setOtherValue(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <FormField.Textarea
            label="Alasan Perubahan / Catatan Tambahan"
            required
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Tulis alasan singkat pengubahan data ini..."
            rows={2}
          />

          <button
            type="submit"
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-lg shadow transition cursor-pointer text-xs"
          >
            Kirim Pengajuan
          </button>
        </div>
      </form>

      {/* History Panel */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm lg:col-span-7 flex flex-col overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 select-none">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Riwayat Pengajuan Saya
          </h2>
        </div>
        <div className="overflow-x-auto flex-1 min-h-[350px]">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20 select-none">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-slate-500 font-semibold">{t('loading')}</span>
              </div>
            </div>
          ) : history.length === 0 ? (
            <div className="flex items-center justify-center h-full py-20 select-none text-slate-400 text-xs">
              Belum ada riwayat pengajuan perubahan data
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                  <th className="px-6 py-3.5 uppercase tracking-wider">Perubahan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Diajukan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-650">
                {history.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition">
                    <td className="px-6 py-3.5 font-bold text-slate-700">{req.summary}</td>
                    <td className="px-6 py-3.5 text-slate-500 font-mono">
                      {new Date(req.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-6 py-3.5">
                      <Badge status={req.status.toLowerCase()} />
                    </td>
                    <td className="px-6 py-3.5 text-right font-medium">
                      {req.status.toLowerCase() === 'pending' ? (
                        <button
                          onClick={() => handleCancelClick(req.id)}
                          className="text-red-500 hover:underline cursor-pointer"
                        >
                          Batalkan
                        </button>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Cancel Confirmation */}
      {cancelId && (
        <ConfirmDialog
          isOpen={true}
          title="Batalkan Pengajuan"
          message="Apakah Anda yakin ingin menarik/membatalkan pengajuan perubahan data ini?"
          confirmText="Ya, Tarik"
          cancelText="Batal"
          type="warning"
          onConfirm={handleConfirmCancel}
          onClose={() => setCancelId(null)}
        />
      )}
    </div>
  );
}
