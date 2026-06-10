'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import FormField from '@/components/shared/FormField';

type ViewMode = 'list' | 'create' | 'detail';

interface LineItem {
  name: string;
  spec: string;
  qty: number;
  unit: string;
  price: number;
}

const STATUS_FLOW = [
  'Draft',
  'Submitted',
  'Approved',
  'PO Created',
  'Sent to Vendor',
  'Partially Received',
  'Fully Received',
  'Invoiced',
  'Paid',
];

const emptyLineItem = (): LineItem => ({
  name: '',
  spec: '',
  qty: 1,
  unit: 'unit',
  price: 0,
});

export default function ProcurementPOPage() {
  const { user } = useAuth();
  const [view, setView] = useState<ViewMode>('list');
  const [activePoId, setActivePoId] = useState<string | null>(null);
  const [pos, setPos] = useState<any[]>([]);
  const [activePo, setActivePo] = useState<any | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formItems, setFormItems] = useState<LineItem[]>([emptyLineItem()]);
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [taxPercent, setTaxPercent] = useState(11);
  const [formMeta, setFormMeta] = useState({
    departmentId: '',
    targetDate: '',
    vendorName: '',
    notes: '',
  });

  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  const isFinance = user?.role === 'FINANCE';

  const loadRegistry = async () => {
    setLoading(true);
    try {
      const [poData, deptData, vendorData] = await Promise.all([
        fetchAPI<any[]>('/procurement/po'),
        fetchAPI<any[]>('/employees/departments'),
        fetchAPI<any[]>('/procurement/vendors'),
      ]);
      setPos(poData);
      setDepartments(deptData);
      setVendors(vendorData);
      if (!formMeta.departmentId && deptData.length > 0) {
        setFormMeta((prev) => ({ ...prev, departmentId: deptData[0].id }));
      }
      if (!formMeta.vendorName && vendorData.length > 0) {
        setFormMeta((prev) => ({ ...prev, vendorName: vendorData[0].name }));
      }
    } catch (err) {
      console.error('Failed to load PO registry:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const po = await fetchAPI<any>(`/procurement/po/${id}`);
      setActivePo(po);
    } catch (err) {
      console.error('Failed to load PO detail:', err);
      alert('Gagal memuat detail PO');
      setView('list');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistry();
  }, []);

  useEffect(() => {
    if (view === 'detail' && activePoId) {
      loadDetail(activePoId);
    }
  }, [view, activePoId]);

  const openCreate = () => {
    setFormItems([emptyLineItem()]);
    setTaxEnabled(true);
    setTaxPercent(11);
    setFormMeta({
      departmentId: departments[0]?.id || '',
      targetDate: '',
      vendorName: vendors[0]?.name || 'Lainnya',
      notes: '',
    });
    setView('create');
  };

  const openDetail = (id: string) => {
    setActivePoId(id);
    setView('detail');
  };

  const backToList = () => {
    setView('list');
    setActivePoId(null);
    setActivePo(null);
    loadRegistry();
  };

  const updateItemField = (idx: number, prop: keyof LineItem, value: string | number) => {
    setFormItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [prop]: value };
      return next;
    });
  };

  const addLineItem = () => {
    setFormItems((prev) => [...prev, emptyLineItem()]);
  };

  const removeLineItem = (idx: number) => {
    setFormItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev));
  };

  const { subtotal, taxAmount, grandTotal } = useMemo(() => {
    const sub = formItems.reduce((sum, itm) => sum + (itm.qty || 0) * (itm.price || 0), 0);
    const tax = taxEnabled ? Math.round(sub * (taxPercent / 100)) : 0;
    return { subtotal: sub, taxAmount: tax, grandTotal: sub + tax };
  }, [formItems, taxEnabled, taxPercent]);

  const saveDraftOrSubmit = async (targetStatus: 'Draft' | 'Submitted') => {
    if (!formMeta.targetDate) {
      alert('Tanggal dibutuhkan wajib diisi!');
      return;
    }

    setSubmitting(true);
    try {
      const result = await fetchAPI<any>('/procurement/po', {
        method: 'POST',
        body: JSON.stringify({
          departmentId: formMeta.departmentId,
          targetDate: formMeta.targetDate,
          vendorName: formMeta.vendorName,
          notes: formMeta.notes,
          items: formItems,
          taxEnabled,
          taxPercent,
          status: targetStatus,
        }),
      });
      alert(`Purchase order ${result.poNumber} berhasil disimpan sebagai ${targetStatus}`);
      backToList();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const updateStatus = async (targetStatus: string) => {
    if (!activePoId) return;
    try {
      await fetchAPI(`/procurement/po/${activePoId}/status`, {
        method: 'POST',
        body: JSON.stringify({ status: targetStatus }),
      });
      alert(`Purchase order status diupdate ke: ${targetStatus}`);
      loadDetail(activePoId);
      loadRegistry();
    } catch (err: any) {
      alert(err.message || 'Gagal mengupdate status PO');
    }
  };

  const renderStatusBadge = (status: string) => (
    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold border border-blue-100 text-[10px]">
      {status}
    </span>
  );

  const renderActionButtons = (po: any) => {
    const buttons: React.ReactNode[] = [];
    const canApprove =
      isAdmin || isFinance || user?.role === 'MANAGER';

    if (po.status === 'Submitted' && canApprove) {
      buttons.push(
        <button
          key="approve"
          onClick={() => updateStatus('Approved')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
        >
          Setujui PO
        </button>,
        <button
          key="reject"
          onClick={() => updateStatus('Draft')}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
        >
          Tolak PO
        </button>,
      );
    } else if (po.status === 'Approved' && isAdmin) {
      buttons.push(
        <button
          key="release"
          onClick={() => updateStatus('PO Created')}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
        >
          Rilis PO
        </button>,
      );
    } else if (po.status === 'PO Created' && isAdmin) {
      buttons.push(
        <button
          key="send"
          onClick={() => updateStatus('Sent to Vendor')}
          className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
        >
          Kirim ke Vendor
        </button>,
      );
    } else if (po.status === 'Sent to Vendor' && isAdmin) {
      buttons.push(
        <button
          key="received"
          onClick={() => updateStatus('Fully Received')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
        >
          Tandai Diterima
        </button>,
      );
    } else if (po.status === 'Fully Received' && isFinance) {
      buttons.push(
        <button
          key="paid"
          onClick={() => updateStatus('Paid')}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
        >
          Proses Lunas Bayar
        </button>,
      );
    }

    return buttons;
  };

  if (view === 'create') {
    const vendorOptions = [
      ...vendors.map((v) => ({ value: v.name, label: v.name })),
      { value: 'Lainnya', label: 'Lainnya / Manual Input' },
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm select-none">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={backToList} className="hover:text-slate-600 font-medium cursor-pointer">
              Nomor PO
            </button>
            <Lucide.ChevronRight className="w-3 h-3" />
            <span className="text-slate-500">Buat PR</span>
          </div>
          <button
            onClick={backToList}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lucide.ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none border-b border-slate-100 pb-3">
            Formulir Pengajuan Belanja Barang (PR)
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 select-none">
            <FormField.Select
              label="Divisi Departemen Pemohon"
              value={formMeta.departmentId}
              onChange={(e) => setFormMeta({ ...formMeta, departmentId: e.target.value })}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
            />
            <FormField.Input
              label="Tanggal Dibutuhkan (Required Date)"
              type="date"
              required
              value={formMeta.targetDate}
              onChange={(e) => setFormMeta({ ...formMeta, targetDate: e.target.value })}
            />
            <FormField.Select
              label="Vendor Supplier Rujukan"
              value={formMeta.vendorName}
              onChange={(e) => setFormMeta({ ...formMeta, vendorName: e.target.value })}
              options={vendorOptions}
            />
            <FormField.Input
              label="Catatan Keterangan Belanja"
              placeholder="Contoh: Pengadaan monitor baru untuk IT team"
              value={formMeta.notes}
              onChange={(e) => setFormMeta({ ...formMeta, notes: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 select-none">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Item Pembelian (Line Items)</h3>
              <button
                onClick={addLineItem}
                className="px-2.5 py-1.5 bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-100 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer"
              >
                + Tambah Baris Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-500 uppercase font-bold tracking-wider text-left select-none">
                    <th className="p-2">Nama Barang</th>
                    <th className="p-2">Spesifikasi / Detail</th>
                    <th className="p-2 text-center w-20">Qty</th>
                    <th className="p-2 text-center w-20">Satuan</th>
                    <th className="p-2 text-right w-36">Harga Satuan</th>
                    <th className="p-2 text-right w-36">Total</th>
                    <th className="p-2 text-center w-10" />
                  </tr>
                </thead>
                <tbody>
                  {formItems.map((itm, idx) => {
                    const lineTotal = (itm.qty || 0) * (itm.price || 0);
                    return (
                      <tr key={idx} className="border-b border-slate-100 text-xs">
                        <td className="p-2">
                          <input
                            type="text"
                            value={itm.name}
                            onChange={(e) => updateItemField(idx, 'name', e.target.value)}
                            placeholder="Nama Barang"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={itm.spec}
                            onChange={(e) => updateItemField(idx, 'spec', e.target.value)}
                            placeholder="Spesifikasi / Spec"
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="number"
                            value={itm.qty}
                            onChange={(e) => updateItemField(idx, 'qty', parseInt(e.target.value) || 1)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 w-20">
                          <input
                            type="text"
                            value={itm.unit}
                            onChange={(e) => updateItemField(idx, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                          />
                        </td>
                        <td className="p-2 w-36">
                          <input
                            type="number"
                            value={itm.price}
                            onChange={(e) => updateItemField(idx, 'price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-right font-mono font-bold"
                          />
                        </td>
                        <td className="p-2 w-36 text-right font-mono font-bold text-slate-800 select-none">
                          {formatRupiah(lineTotal)}
                        </td>
                        <td className="p-2 text-center w-10">
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <Lucide.X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row justify-between gap-6 select-none font-semibold text-xs text-slate-600">
            <div className="flex items-center gap-3 pt-2">
              <FormField.Toggle
                label="Kenakan PPN Pajak"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
              />
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(parseFloat(e.target.value) || 0)}
                className="w-16 px-2 py-1 border border-slate-200 rounded text-xs text-center font-mono font-bold"
              />
              <span>%</span>
            </div>

            <div className="w-full md:max-w-xs space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span>Subtotal Pengadaan:</span>
                <span className="font-bold text-slate-800">{formatRupiah(subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>PPN Pajak ({taxPercent}%):</span>
                <span className="font-bold">{formatRupiah(taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm text-slate-900 font-bold">
                <span className="text-xs uppercase tracking-wider text-slate-500">Total Akhir Belanja:</span>
                <span className="text-primary">{formatRupiah(grandTotal)}</span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 select-none">
            <button
              onClick={() => saveDraftOrSubmit('Draft')}
              disabled={submitting}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition cursor-pointer disabled:opacity-50"
            >
              Simpan Draft
            </button>
            <button
              onClick={() => saveDraftOrSubmit('Submitted')}
              disabled={submitting}
              className="px-5 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Kirim untuk Approval'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'detail') {
    if (loading || !activePo) {
      return (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    const currentStatusIdx = STATUS_FLOW.indexOf(activePo.status);
    const actionButtons = renderActionButtons(activePo);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-5 rounded-2xl border border-slate-100 shadow-sm select-none">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button onClick={backToList} className="hover:text-slate-600 font-medium cursor-pointer">
              Nomor PO
            </button>
            <Lucide.ChevronRight className="w-3 h-3" />
            <span className="text-slate-500">{activePo.poNumber}</span>
          </div>
          <button
            onClick={backToList}
            className="px-3 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lucide.ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Daftar</span>
          </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none">
            Progres Alur Status PO
          </h3>
          <div className="flex flex-wrap items-center gap-y-4 gap-x-2 pt-2">
            {STATUS_FLOW.map((st, idx) => {
              const isPast = idx <= currentStatusIdx;
              const isCurrent = idx === currentStatusIdx;
              return (
                <React.Fragment key={st}>
                  <div
                    className={`flex items-center gap-2.5 text-[10px] font-bold ${
                      isPast ? 'text-slate-800' : 'text-slate-400'
                    } relative select-none`}
                  >
                    {isPast ? (
                      <Lucide.CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : (
                      <div className="w-3 h-3 rounded-full bg-slate-200 border-2 border-slate-300" />
                    )}
                    <span className={isCurrent ? 'text-primary font-bold scale-[1.05]' : ''}>{st}</span>
                  </div>
                  {idx < STATUS_FLOW.length - 1 && (
                    <div className="w-6 h-0.5 border-t border-slate-200 mx-1 shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm space-y-6">
          <div className="flex justify-between items-start gap-4 pb-6 border-b border-slate-150 select-none">
            <div>
              <h1 className="text-xl font-bold text-primary font-mono tracking-wide">{activePo.poNumber}</h1>
              <p className="text-[10px] text-slate-400 mt-1">
                Diajukan Oleh: {activePo.requesterName} &bull; Divisi: {activePo.departmentName}
              </p>
            </div>
            <div className="text-right">
              {renderStatusBadge(activePo.status)}
              <p className="text-[10px] text-slate-400 mt-2">Dibuat: {formatDate(activePo.createdAt)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 select-none font-semibold text-xs text-slate-600 border-b border-slate-100 pb-5">
            <div>
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Rujukan Vendor</span>
              <span className="text-slate-800 font-bold text-sm block">{activePo.vendorName || '-'}</span>
              <span className="text-slate-400 block mt-1">Pajak Default: {activePo.taxPercentage}% PPN</span>
            </div>
            <div className="text-right">
              <span className="block text-[10px] text-slate-400 uppercase tracking-wider mb-1">Target Pengiriman</span>
              <span className="text-slate-800 font-bold block font-mono text-sm">
                {formatDate(activePo.targetDate)}
              </span>
              <span className="text-slate-500 block mt-1">Keterangan: {activePo.notes || '-'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider select-none">
              Item Rincian Belanja (Purchase details)
            </h3>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 select-none font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="px-6 py-3.5">Nama Item</th>
                    <th className="px-6 py-3.5">Spesifikasi / Detail</th>
                    <th className="px-6 py-3.5 text-center w-24">Kuantitas</th>
                    <th className="px-6 py-3.5 text-right w-36">Harga Satuan</th>
                    <th className="px-6 py-3.5 text-right w-36">Total Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {(activePo.items || []).map((itm: any, idx: number) => (
                    <tr key={idx}>
                      <td className="px-6 py-3.5 font-bold text-slate-800">{itm.name}</td>
                      <td className="px-6 py-3.5 text-slate-500 font-semibold">{itm.spec || '-'}</td>
                      <td className="px-6 py-3.5 text-center font-bold font-mono text-slate-800">
                        {itm.qty} {itm.unit}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold font-mono text-slate-700">
                        {formatRupiah(itm.price)}
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold font-mono text-slate-800">
                        {formatRupiah(itm.qty * itm.price)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-end pt-2 select-none">
            <div className="w-full max-w-xs space-y-2 font-mono font-semibold text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-800">{formatRupiah(activePo.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>PPN Pajak ({activePo.taxPercentage}%):</span>
                <span className="font-bold">{formatRupiah(activePo.taxAmount)}</span>
              </div>
              <div className="flex justify-between border-t border-slate-100 pt-2 text-sm text-slate-900 font-bold">
                <span className="text-xs uppercase tracking-wider text-slate-500">Total Akhir:</span>
                <span className="text-primary">{formatRupiah(activePo.totalAmount)}</span>
              </div>
            </div>
          </div>

          {actionButtons.length > 0 && (
            <div className="border-t border-slate-100 pt-4 flex justify-end gap-3 select-none">
              {actionButtons}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Daftar Dokumen PO</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Kelola rekap purchase request & order untuk kebutuhan operasional.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          <span>Buat PR / PO Baru</span>
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  <th className="px-6 py-3.5">Nomor PO</th>
                  <th className="px-6 py-3.5">Vendor Supplier</th>
                  <th className="px-6 py-3.5">Departemen</th>
                  <th className="px-6 py-3.5">Nilai Total</th>
                  <th className="px-6 py-3.5">Status Alur</th>
                  <th className="px-6 py-3.5">Tgl Buat</th>
                  <th className="px-6 py-3.5">Tgl Dibutuhkan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pos.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-400 select-none">
                      Belum ada pengadaan terdaftar
                    </td>
                  </tr>
                ) : (
                  pos.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => openDetail(p.id)}
                      className="table-row-hover border-b border-slate-100 transition text-xs text-slate-700 cursor-pointer"
                    >
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{p.poNumber}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">{p.vendorName || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-500">{p.departmentName}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{formatRupiah(p.totalAmount)}</td>
                      <td className="px-6 py-4">{renderStatusBadge(p.status)}</td>
                      <td className="px-6 py-4 font-semibold font-mono text-slate-500">
                        {formatDate(p.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-6 py-4 font-semibold font-mono text-slate-500">
                        {formatDate(p.targetDate, { day: 'numeric', month: 'short', year: 'numeric' })}
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
  );
}
