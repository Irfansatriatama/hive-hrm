'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';

export default function ProcurementPage() {
  const { t } = useI18n();
  const [pos, setPos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ itemName: '', quantity: 1, price: 0 });

  const loadPOs = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/procurement/po');
      setPos(data.slice(0, 5));
    } catch (err) {
      console.error('Failed to load procurement POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPOs();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.itemName.trim() || submitting) return;
    setSubmitting(true);
    try {
      await fetchAPI('/procurement/po', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      alert('Purchase Order berhasil diajukan!');
      setForm({ itemName: '', quantity: 1, price: 0 });
      loadPOs();
    } catch (err: any) {
      alert(err.message || 'Gagal mengajukan PO');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Pengajuan Procurement</h1>
          <p className="text-xs text-slate-400 mt-1">Ajukan permintaan pembelian barang atau jasa ke departemen finance.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <FormField.Input
            label="Nama Barang / Jasa"
            required
            value={form.itemName}
            onChange={(e) => setForm({ ...form, itemName: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input
              label="Jumlah"
              type="number"
              required
              min={1}
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) || 1 })}
            />
            <FormField.Input
              label="Harga Satuan (Rp)"
              type="number"
              required
              min={0}
              value={form.price}
              onChange={(e) => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estimasi Total</span>
            <p className="text-sm font-bold text-primary font-mono mt-1">
              {formatRupiah(form.quantity * form.price)}
            </p>
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2.5 px-4 rounded-lg shadow text-xs transition cursor-pointer disabled:opacity-50"
          >
            {submitting ? 'Mengajukan...' : 'Ajukan Purchase Order'}
          </button>
        </form>
      </div>

      <div className="lg:col-span-7 space-y-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between select-none">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">PO Terbaru</h3>
          <Link href="/procurement/po" className="text-[10px] text-primary font-bold hover:underline">
            Lihat Semua
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pos.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center">
            <Lucide.ShoppingCart className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Belum ada purchase order.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pos.map((po) => (
              <div key={po.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between gap-4 select-none">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 text-primary flex items-center justify-center shrink-0">
                    <Lucide.FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{po.itemName}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{po.poNumber} · {formatDate(po.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-primary font-mono">{formatRupiah(po.totalPrice)}</p>
                  <Badge status={po.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
