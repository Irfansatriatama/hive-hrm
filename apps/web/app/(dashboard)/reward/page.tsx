'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

export default function RewardPage() {
  const [balance, setBalance] = useState<number>(0);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<any[]>([]);
  const [feed, setFeed] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [recipientId, setRecipientId] = useState('');
  const [hashtag, setHashtag] = useState('');
  const [points, setPoints] = useState(10);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [redeemTarget, setRedeemTarget] = useState<any | null>(null);

  const loadRewardContext = async () => {
    setLoading(true);
    try {
      const [balVal, catalogData, empsRes, htData, feedData, profile] = await Promise.all([
        fetchAPI<number>('/reward/balance'),
        fetchAPI<any[]>('/reward/catalog'),
        fetchAPI<{ employees: any[] }>('/employees?limit=1000'),
        fetchAPI<any[]>('/reward/hashtags'),
        fetchAPI<any[]>('/reward/feed'),
        fetchAPI<any>('/employees/me').catch(() => null),
      ]);

      setBalance(balVal);
      setCatalog(catalogData);
      setHashtags(htData.filter((h: any) => h.status === 'active'));
      setFeed(feedData);
      setEmployees((empsRes.employees || []).filter((e: any) => e.id !== profile?.id));
    } catch (err) {
      console.error('Failed to load reward context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRewardContext();
  }, []);

  const handleSendAppreciation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientId || !hashtag || points < 10 || points > 100 || !message.trim() || sending) {
      alert('Mohon lengkapi seluruh field apresiasi poin');
      return;
    }

    setSending(true);
    try {
      await fetchAPI('/reward/appreciation', {
        method: 'POST',
        body: JSON.stringify({ recipientId, points, message, hashtag }),
      });
      alert(`Berhasil mengirim ${points} poin apresiasi!`);
      setRecipientId('');
      setHashtag('');
      setPoints(10);
      setMessage('');
      loadRewardContext();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim apresiasi');
    } finally {
      setSending(false);
    }
  };

  const handleRedeem = async () => {
    if (!redeemTarget) return;
    try {
      await fetchAPI('/reward/redeem', {
        method: 'POST',
        body: JSON.stringify({ itemId: redeemTarget.id }),
      });
      alert('Permohonan penukaran poin berhasil dikirim. Menunggu persetujuan HR.');
      setRedeemTarget(null);
      loadRewardContext();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan redeem');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div>
            <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Katalog Penukaran Reward</h1>
            <p className="text-xs text-slate-400 mt-1">Tukarkan poin penghargaan yang Anda kumpulkan dengan berbagai voucher & merchandise.</p>
          </div>
          <div className="bg-blue-50 text-primary border border-blue-100 px-4 py-2 rounded-xl flex items-center gap-2.5 shrink-0 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center shrink-0">
              <Lucide.Coins className="w-4 h-4" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-base font-bold font-mono leading-none">{balance} Pts</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Poin Saya</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {catalog.map((item) => {
              const canRedeem = balance >= item.points && item.stock > 0;
              return (
                <div key={item.id} className="bg-white border border-slate-200/60 rounded-xl p-4.5 shadow-sm hover:shadow-md transition flex flex-col justify-between select-none">
                  <div>
                    <div className="h-28 w-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 mb-3 border border-slate-100">
                      <Lucide.Gift className="w-8 h-8" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.category}</span>
                    <h4 className="font-bold text-slate-800 text-xs mt-1 leading-snug">{item.name}</h4>
                    <p className="text-[10px] text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primary font-mono">{item.points} Poin</span>
                      <span className="text-[9px] text-slate-400 font-semibold mt-0.5">Stok: {item.stock}</span>
                    </div>
                    <button
                      onClick={() => canRedeem && setRedeemTarget(item)}
                      disabled={!canRedeem}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition cursor-pointer ${
                        canRedeem
                          ? 'bg-primary hover:bg-primary-dark text-white shadow'
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      Tukar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
          <h3 className="font-bold text-slate-800 text-xs border-b border-slate-100 pb-2.5 uppercase tracking-wider select-none flex items-center gap-1.5">
            <Lucide.Heart className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Kirim Apresiasi Poin</span>
          </h3>

          <form onSubmit={handleSendAppreciation} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Rekan Kerja</label>
              <select
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                required
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Pilih Rekan Kerja</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>{emp.full_name || emp.fullName}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nilai Perusahaan (#Hashtag)</label>
              <select
                value={hashtag}
                onChange={(e) => setHashtag(e.target.value)}
                required
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
              >
                <option value="">Pilih Nilai Perusahaan</option>
                {hashtags.map((h) => (
                  <option key={h.id} value={h.tag}>{h.tag} - {h.description}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jumlah Poin (10 - 100)</label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(parseInt(e.target.value) || 10)}
                required
                min={10}
                max={100}
                className="block w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Pesan Apresiasi</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Tuliskan ucapan terima kasih atas bantuan rekan Anda..."
                rows={2}
                className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={sending}
              className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow text-xs transition cursor-pointer disabled:opacity-50"
            >
              {sending ? 'Mengirim...' : 'Kirim Poin Apresiasi'}
            </button>
          </form>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider select-none">Aktivitas Poin Terbaru</h3>
            <Link href="/reward/transactions" className="text-[10px] text-primary font-bold hover:underline">Semua</Link>
          </div>
          <div className="space-y-3 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : feed.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-6">Belum ada aktivitas pemberian poin terbaru.</p>
            ) : (
              feed.map((tx) => (
                <div key={tx.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50 flex items-start gap-3 select-none">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-green-600 bg-green-50">
                    <Lucide.ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 truncate">{tx.employeeName}</span>
                      <span className="font-bold text-primary font-mono">+{tx.points} Pts</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-medium mt-0.5">{tx.hashtag} &bull; {tx.senderName}</p>
                    {tx.message && (
                      <p className="text-slate-500 text-[10px] italic mt-1 leading-relaxed">&ldquo;{tx.message}&rdquo;</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!redeemTarget}
        onClose={() => setRedeemTarget(null)}
        onConfirm={handleRedeem}
        title="Konfirmasi Penukaran Poin"
        message={redeemTarget ? `Apakah Anda yakin ingin menukarkan ${redeemTarget.points} poin Anda untuk "${redeemTarget.name}"? Stok tersisa: ${redeemTarget.stock}.` : ''}
        confirmText="Ya, Tukar"
        type="success"
      />
    </div>
  );
}
