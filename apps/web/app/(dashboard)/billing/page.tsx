'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';

interface Invoice {
  id: string;
  period: string;
  amount: number;
  status: string;
  pay_date: string;
}

interface BillingData {
  plan_name: string;
  price_monthly: number;
  seats_total: number;
  seats_used: number;
  start_date: string;
  end_date: string;
  card_brand: string;
  card_last4: string;
  card_holder: string;
  card_exp: string;
  invoices: Invoice[];
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [cardModal, setCardModal] = useState(false);
  const [cardForm, setCardForm] = useState({ card_brand: 'Visa', card_last4: '', card_holder: '', card_exp: '' });

  const loadBilling = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<BillingData>('/core/billing');
      setBilling(data);
      setCardForm({
        card_brand: data.card_brand || 'Visa',
        card_last4: data.card_last4 || '',
        card_holder: data.card_holder || '',
        card_exp: data.card_exp || '',
      });
    } catch (err) {
      console.error('Failed to load billing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBilling(); }, []);

  const handleSaveCard = async () => {
    if (!cardForm.card_last4 || !cardForm.card_holder || !cardForm.card_exp) {
      alert('Lengkapi data kartu kredit');
      return;
    }
    try {
      await fetchAPI('/core/billing', { method: 'PUT', body: JSON.stringify(cardForm) });
      alert('Metode pembayaran berhasil diperbarui');
      setCardModal(false);
      loadBilling();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui kartu');
    }
  };

  const downloadInvoice = (id: string) => {
    alert(`Mengunduh invoice ${id} (simulasi PDF)`);
  };

  if (loading || !billing) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const seatPercent = Math.round((billing.seats_used / billing.seats_total) * 100);

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Penagihan & Langganan Portal</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola rencana SaaS HIVE HRM, periksa penggunaan kursi karyawan, dan unduh salinan invoice.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between gap-6">
            <div className="space-y-4 flex-1">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-bold uppercase tracking-wider">Rencana Langganan Aktif</span>
                <h2 className="text-lg font-bold text-slate-900 leading-tight">{billing.plan_name}</h2>
                <p className="text-xs text-slate-400">Professional Package Enterprise (Multi-Branch Ready)</p>
              </div>

              <div className="space-y-1 select-none">
                <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1.5">
                  <span>Penggunaan Kursi Karyawan</span>
                  <span className="font-mono font-bold">{billing.seats_used} / {billing.seats_total} Seats ({seatPercent}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${seatPercent}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1 font-semibold text-slate-600 text-xs">
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Masa Langganan Aktif</span>
                  <span className="font-mono text-slate-800 font-bold">{formatDate(billing.start_date)}</span>
                  <span className="text-slate-400 font-normal"> s/d </span>
                  <span className="font-mono text-slate-800 font-bold">{formatDate(billing.end_date)}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Total Biaya Bulanan</span>
                  <span className="font-mono text-slate-800 font-bold">{formatRupiah(billing.price_monthly)} / Bulan</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 flex flex-col justify-between items-start md:items-end gap-3 select-none">
              <button onClick={() => setUpgradeModal(true)} className="w-full md:w-auto px-4 py-2.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center justify-center gap-1.5 transition cursor-pointer">
                <Lucide.ArrowUpCircle className="w-4 h-4" />
                <span>Tingkatkan Paket</span>
              </button>
              <div className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                * Dikenakan PPN 11% sesuai regulasi perpajakan yang berlaku.
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">Riwayat Transaksi & Invoice</h2>
            <DataTable
              headers={['Nomor Invoice', 'Periode', 'Jumlah Tagihan', 'Status', 'Tanggal Bayar', 'Berkas']}
              rows={billing.invoices}
              columns={[
                'id',
                'period',
                (row) => formatRupiah(row.amount),
                (row) => (
                  <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-[10px]">{row.status}</span>
                ),
                (row) => formatDate(row.pay_date, { day: 'numeric', month: 'short', year: 'numeric' }),
                (row) => (
                  <button onClick={() => downloadInvoice(row.id)} className="text-primary hover:underline font-bold flex items-center gap-1 ml-auto text-xs cursor-pointer">
                    <Lucide.Download className="w-3.5 h-3.5" />
                    <span>Unduh PDF</span>
                  </button>
                ),
              ]}
            />
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">Metode Pembayaran</h2>

            <div className="bg-gradient-to-tr from-slate-900 to-slate-800 rounded-2xl p-5 text-white shadow-md relative overflow-hidden flex flex-col justify-between min-h-[160px] font-mono select-none">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="flex justify-between items-center relative z-10">
                <span className="text-base font-bold italic tracking-wide">{billing.card_brand}</span>
                <div className="w-8 h-5 bg-amber-500/20 border border-amber-500/30 rounded" />
              </div>
              <div className="text-lg tracking-widest font-semibold py-4 relative z-10">
                •••• •••• •••• {billing.card_last4}
              </div>
              <div className="flex justify-between items-end text-[10px] relative z-10">
                <div className="space-y-0.5">
                  <span className="text-slate-400 block uppercase tracking-wider text-[8px]">CARDHOLDER NAME</span>
                  <span className="truncate max-w-[160px] block font-bold tracking-wider">{billing.card_holder}</span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-slate-400 block uppercase tracking-wider text-[8px]">EXPIRES</span>
                  <span className="font-bold tracking-wider">{billing.card_exp}</span>
                </div>
              </div>
            </div>

            <div className="pt-2 select-none">
              <button onClick={() => setCardModal(true)} className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer">
                <Lucide.CreditCard className="w-4 h-4" />
                <span>Ganti Kartu Kredit</span>
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-4 select-none">
            <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Fitur Unggulan Tersedia</h2>
            <ul className="text-xs space-y-2.5 text-slate-600 font-semibold">
              {[
                'Multi-cabang (Multi-branch Office routing)',
                'Workflow persetujuan PO & Cuti berjenjang',
                '10 GB Kuota unggah Berbagi Dokumen',
                'Modul gamifikasi & dashboard Hashtag Nilai',
                'Struktur organisasi dinamis interaktif',
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2.5">
                  <Lucide.CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Modal isOpen={upgradeModal} onClose={() => setUpgradeModal(false)} title="Tingkatkan Paket Langganan" size="lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2 select-none">
          {[
            { name: 'Starter Plan', price: 'Rp 500k', seats: '25 karyawan', features: ['Absensi & Cuti dasar', '1 Cabang'] },
            { name: 'Professional Plan', price: 'Rp 1.5jt', seats: '100 karyawan', features: ['Semua modul aktif', 'Multi-cabang'], current: true },
            { name: 'Enterprise Plan', price: 'Rp 5jt', seats: 'Tanpa Batas', features: ['Dedicated support', 'Custom integration'] },
          ].map((plan) => (
            <div key={plan.name} className={`p-5 border rounded-2xl flex flex-col justify-between gap-5 transition ${plan.current ? 'border-primary bg-blue-50/30' : 'border-slate-200 hover:border-primary/50'}`}>
              <div className="space-y-2">
                <h3 className="font-bold text-slate-800 text-sm">{plan.name}</h3>
                <div className="text-base font-bold font-mono text-slate-900">{plan.price} <span className="text-[10px] text-slate-400 font-normal">/ Bln</span></div>
                <p className="text-[10px] text-slate-500">Maksimal {plan.seats}</p>
                <ul className="text-[10px] text-slate-500 space-y-1 pt-2">
                  {plan.features.map((f) => <li key={f}>&bull; {f}</li>)}
                </ul>
              </div>
              {plan.current ? (
                <span className="text-center text-[10px] font-bold text-primary uppercase">Paket Aktif</span>
              ) : (
                <button onClick={() => alert('Hubungi tim sales untuk upgrade paket.')} className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer">
                  Pilih Paket
                </button>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={cardModal} onClose={() => setCardModal(false)} title="Ganti Kartu Kredit">
        <div className="space-y-4">
          <FormField.Select
            label="Brand Kartu"
            options={[{ value: 'Visa', label: 'Visa' }, { value: 'Mastercard', label: 'Mastercard' }]}
            value={cardForm.card_brand}
            onChange={(e) => setCardForm({ ...cardForm, card_brand: e.target.value })}
          />
          <FormField.Input label="4 Digit Terakhir" required maxLength={4} value={cardForm.card_last4} onChange={(e) => setCardForm({ ...cardForm, card_last4: e.target.value })} />
          <FormField.Input label="Nama Pemegang Kartu" required value={cardForm.card_holder} onChange={(e) => setCardForm({ ...cardForm, card_holder: e.target.value })} />
          <FormField.Input label="Masa Berlaku (MM/YY)" required placeholder="08/29" value={cardForm.card_exp} onChange={(e) => setCardForm({ ...cardForm, card_exp: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setCardModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleSaveCard} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan</button>
        </div>
      </Modal>
    </div>
  );
}
