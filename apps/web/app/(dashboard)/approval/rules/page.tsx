'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import Badge from '@/components/shared/Badge';

export default function ApprovalRulesPage() {
  const { t } = useI18n();
  const [rules, setRules] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('EMPLOYEE');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeRule, setActiveRule] = useState<any>(null);
  
  const [ruleType, setRuleType] = useState('leave');
  const [ruleDeadline, setRuleDeadline] = useState(48);
  const [ruleCond, setRuleCond] = useState('');
  const [ruleStatus, setRuleStatus] = useState('active');
  const [selectedChain, setSelectedChain] = useState<string[]>([]);
  
  const [saving, setSaving] = useState(false);

  const loadRules = async () => {
    setLoading(true);
    try {
      const me = await fetchAPI('/auth/me');
      setUserRole(me?.role || 'EMPLOYEE');

      const rulesData = await fetchAPI<any[]>('/approval/rules');
      setRules(rulesData);
    } catch (err) {
      console.error('Failed to load approval rules:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRules();
  }, []);

  const openRuleModal = (rule: any = null) => {
    if (rule) {
      setActiveRule(rule);
      setRuleType(rule.request_type);
      setRuleDeadline(rule.deadline_hours);
      setRuleCond(rule.condition_desc || '');
      setRuleStatus(rule.status);
      setSelectedChain(rule.chain || []);
    } else {
      setActiveRule(null);
      setRuleType('leave');
      setRuleDeadline(48);
      setRuleCond('');
      setRuleStatus('active');
      setSelectedChain(['manager']);
    }
    setIsModalOpen(true);
  };

  const handleCheckboxChange = (roleVal: string) => {
    setSelectedChain((prev) =>
      prev.includes(roleVal) ? prev.filter((r) => r !== roleVal) : [...prev, roleVal]
    );
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCond.trim() || selectedChain.length === 0 || saving) {
      alert('Kondisi trigger dan minimal satu approver wajib dikonfigurasi!');
      return;
    }

    setSaving(true);
    try {
      if (activeRule) {
        // Edit mode
        const updatedRule = {
          id: activeRule.id,
          request_type: ruleType,
          condition_desc: ruleCond,
          chain: selectedChain,
          deadline_hours: ruleDeadline,
          status: ruleStatus,
        };

        await fetchAPI(`/approval/rules/${activeRule.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            before: activeRule,
            after: updatedRule,
          }),
        });
        alert('Aturan alur persetujuan berhasil diperbarui!');
      } else {
        // Create mode
        const newRule = {
          id: `AR00${rules.length + 1}`,
          request_type: ruleType,
          condition_desc: ruleCond,
          chain: selectedChain,
          deadline_hours: ruleDeadline,
          status: ruleStatus,
        };

        await fetchAPI('/approval/rules', {
          method: 'POST',
          body: JSON.stringify(newRule),
        });
        alert('Aturan alur persetujuan berhasil ditambahkan!');
      }
      setIsModalOpen(false);
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan aturan');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRule = async (rule: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus aturan persetujuan untuk tipe "${rule.request_type}"?`)) {
      return;
    }

    try {
      await fetchAPI(`/approval/rules/${rule.id}`, {
        method: 'DELETE',
        body: JSON.stringify({
          deletedRule: rule,
        }),
      });
      alert('Aturan alur persetujuan berhasil dihapus!');
      loadRules();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus aturan');
    }
  };

  const isHR = userRole === 'SUPER_ADMIN' || userRole === 'HR_ADMIN';

  if (!isHR && !loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h3 className="font-bold text-slate-800 text-sm">Akses Ditolak</h3>
        <p className="text-xs text-slate-500 mt-1">Hanya HR Admin dan Super Admin yang dapat mengonfigurasi aturan alur persetujuan.</p>
      </div>
    );
  }

  const rolesList = [
    { v: 'manager', l: 'Manager Atasan Langsung' },
    { v: 'hr_admin', l: 'HR Department Admin' },
    { v: 'finance', l: 'Finance & Accounting Manager' },
    { v: 'super_admin', l: 'System Super Administrator' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none animate-fade-in">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Aturan Alur Persetujuan (Approval Rules)</h1>
          <p className="text-xs text-slate-400 mt-1">Konfigurasi persetujuan bertingkat, kondisi eskalasi, dan batas waktu tindak lanjut pengajuan.</p>
        </div>
        <button
          onClick={() => openRuleModal()}
          className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer select-none"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          <span>Tambah Aturan Baru</span>
        </button>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="text-center py-12 text-slate-400">Belum ada aturan workflow dikonfigurasi.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 select-none text-slate-500 font-bold">
                  <th className="px-6 py-3.5 uppercase tracking-wider">Tipe Pengajuan</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Kondisi Pemicu</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Rantai Approver (Chain)</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Batas Waktu (Deadline)</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3.5 uppercase tracking-wider text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {rules.map((row) => {
                  const chainLabels = (row.chain || []).map((role: string) =>
                    role.toUpperCase().replace('_', ' ')
                  );
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 capitalize">{row.request_type.replace('_', ' ')}</td>
                      <td className="px-6 py-4 text-slate-500">{row.condition_desc || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700 font-mono">
                        {chainLabels.join(' → ')}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-500">{row.deadline_hours} Jam</td>
                      <td className="px-6 py-4">
                        <Badge status={row.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2 font-medium">
                        <button
                          onClick={() => openRuleModal(row)}
                          className="text-primary hover:underline text-xs font-bold cursor-pointer"
                        >
                          Edit
                        </button>
                        <span className="text-slate-200">|</span>
                        <button
                          onClick={() => handleDeleteRule(row)}
                          className="text-red-500 hover:underline text-xs font-bold cursor-pointer"
                        >
                          Hapus
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Rule Creator Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                {activeRule ? 'Edit Aturan Alur' : 'Tambah Aturan Alur Persetujuan'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveRule}>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Tipe Request
                    </label>
                    <select
                      value={ruleType}
                      onChange={(e) => setRuleType(e.target.value)}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                    >
                      <option value="leave">Cuti / Leave</option>
                      <option value="overtime">Lembur / Overtime</option>
                      <option value="procurement">Pengadaan PO / Procurement</option>
                      <option value="reward">Reward Catalog Claims</option>
                      <option value="profile_update">Pembaruan Data Karyawan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                      Deadline Per Tingkat (Jam)
                    </label>
                    <input
                      type="number"
                      value={ruleDeadline}
                      onChange={(e) => setRuleDeadline(parseInt(e.target.value) || 24)}
                      required
                      min={1}
                      className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Kondisi Trigger (Deskripsi)
                  </label>
                  <input
                    type="text"
                    value={ruleCond}
                    onChange={(e) => setRuleCond(e.target.value)}
                    required
                    placeholder="Contoh: Nilai PO > Rp 5.000.000"
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Susunan Alur Penyetuju (Pilih Sesuai Urutan Tingkatan)
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 rounded-lg p-3">
                    {rolesList.map((r) => {
                      const isChecked = selectedChain.includes(r.v);
                      return (
                        <label
                          key={r.v}
                          className="flex items-center gap-3 p-1 rounded hover:bg-slate-50 cursor-pointer select-none text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleCheckboxChange(r.v)}
                            className="rounded border-slate-300 text-primary focus:ring-primary w-4.5 h-4.5"
                          />
                          <span>{r.l}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Status Aturan
                  </label>
                  <select
                    value={ruleStatus}
                    onChange={(e) => setRuleStatus(e.target.value)}
                    className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white"
                  >
                    <option value="active">Aktif</option>
                    <option value="inactive">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow disabled:opacity-50 transition cursor-pointer"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Aturan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
