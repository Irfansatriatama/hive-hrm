'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Modal from '@/components/shared/Modal';
import FormField from '@/components/shared/FormField';
import Badge from '@/components/shared/Badge';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

type TabId = 'active' | 'manage';

interface PollOption {
  id: string;
  text: string;
  sortOrder: number;
}

interface Poll {
  id: string;
  title: string;
  description?: string | null;
  type: string;
  target: string;
  status: string;
  isAnonymous: boolean;
  startDate?: string | null;
  endDate?: string | null;
  options: PollOption[];
  hasVoted?: boolean;
  _count?: { responses: number };
}

interface PollResultItem {
  optionId: string;
  text: string;
  count: number;
  percentage: number;
  voters?: string[];
}

interface PollResults {
  pollId: string;
  title: string;
  type: string;
  isAnonymous: boolean;
  status: string;
  totalResponses: number;
  voterCount: number;
  results: PollResultItem[];
}

interface Department {
  id: string;
  name: string;
}

const EMPTY_FORM = {
  title: '',
  description: '',
  type: 'single',
  target: 'all',
  isAnonymous: false,
  startDate: '',
  endDate: '',
  options: ['', ''],
};

function formatTarget(target: string, departments: Department[]) {
  if (target === 'all') return 'Semua Karyawan';
  if (target.startsWith('department:')) {
    const deptId = target.replace('department:', '');
    const dept = departments.find(d => d.id === deptId);
    return dept ? `Dept: ${dept.name}` : target;
  }
  return target;
}

function ResultBars({ results }: { results: PollResultItem[] }) {
  return (
    <div className="space-y-2 mt-3">
      {results.map(r => (
        <div key={r.optionId}>
          <div className="flex justify-between text-[10px] text-slate-500 mb-0.5">
            <span className="truncate pr-2">{r.text}</span>
            <span className="font-bold shrink-0">{r.percentage}% ({r.count})</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${Math.max(r.percentage, r.count > 0 ? 4 : 0)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function PollsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('active');
  const [polls, setPolls] = useState<Poll[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [resultsMap, setResultsMap] = useState<Record<string, PollResults>>({});

  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [votePoll, setVotePoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [voting, setVoting] = useState(false);

  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingPoll, setEditingPoll] = useState<Poll | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Poll | null>(null);
  const [detailPoll, setDetailPoll] = useState<Poll | null>(null);
  const [detailResults, setDetailResults] = useState<PollResults | null>(null);

  const loadPolls = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<Poll[]>('/polls');
      setPolls(data);

      const votedPolls = data.filter(p => p.hasVoted || p.status === 'closed');
      const resultsEntries = await Promise.all(
        votedPolls.map(async p => {
          try {
            const res = await fetchAPI<PollResults>(`/polls/${p.id}/results`);
            return [p.id, res] as const;
          } catch {
            return null;
          }
        }),
      );
      const map: Record<string, PollResults> = {};
      resultsEntries.forEach(entry => {
        if (entry) map[entry[0]] = entry[1];
      });
      setResultsMap(map);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat polling');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPolls();
    fetchAPI<Department[]>('/employees/departments')
      .then(setDepartments)
      .catch(() => {});
  }, [loadPolls]);

  const activePolls = polls.filter(p => p.status === 'active');

  const openVoteModal = (poll: Poll) => {
    setVotePoll(poll);
    setSelectedOption('');
    setSelectedOptions([]);
    setVoteModalOpen(true);
  };

  const handleVote = async () => {
    if (!votePoll) return;

    if (votePoll.type === 'single' && !selectedOption) {
      alert('Pilih satu opsi');
      return;
    }
    if (votePoll.type === 'multiple' && selectedOptions.length === 0) {
      alert('Pilih minimal satu opsi');
      return;
    }

    setVoting(true);
    try {
      const body =
        votePoll.type === 'single'
          ? { optionId: selectedOption }
          : { optionIds: selectedOptions };

      const results = await fetchAPI<PollResults>(`/polls/${votePoll.id}/vote`, {
        method: 'POST',
        body: JSON.stringify(body),
      });

      alert('Vote berhasil dikirim');
      setResultsMap(prev => ({ ...prev, [votePoll.id]: results }));
      setVoteModalOpen(false);
      loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal mengirim vote');
    } finally {
      setVoting(false);
    }
  };

  const openCreateModal = () => {
    setEditingPoll(null);
    setForm(EMPTY_FORM);
    setFormModalOpen(true);
  };

  const openEditModal = (poll: Poll) => {
    setEditingPoll(poll);
    setForm({
      title: poll.title,
      description: poll.description || '',
      type: poll.type,
      target: poll.target,
      isAnonymous: poll.isAnonymous,
      startDate: poll.startDate ? poll.startDate.slice(0, 16) : '',
      endDate: poll.endDate ? poll.endDate.slice(0, 16) : '',
      options: poll.options.length >= 2 ? poll.options.map(o => o.text) : ['', ''],
    });
    setFormModalOpen(true);
  };

  const handleSavePoll = async () => {
    if (!form.title.trim()) {
      alert('Judul polling wajib diisi');
      return;
    }
    const validOptions = form.options.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      alert('Minimal 2 opsi wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        description: form.description || null,
        type: form.type,
        target: form.target,
        isAnonymous: form.isAnonymous,
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        options: validOptions,
      };

      if (editingPoll) {
        await fetchAPI(`/polls/${editingPoll.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Polling berhasil diperbarui');
      } else {
        await fetchAPI('/polls', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Polling berhasil dibuat');
      }

      setFormModalOpen(false);
      loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan polling');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async (poll: Poll) => {
    try {
      await fetchAPI(`/polls/${poll.id}/publish`, { method: 'POST' });
      alert('Polling berhasil dipublikasikan');
      loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal mempublikasikan polling');
    }
  };

  const handleClose = async (poll: Poll) => {
    try {
      await fetchAPI(`/polls/${poll.id}/close`, { method: 'POST' });
      alert('Polling berhasil ditutup');
      loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal menutup polling');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchAPI(`/polls/${deleteTarget.id}`, { method: 'DELETE' });
      alert('Polling berhasil dihapus');
      setDeleteTarget(null);
      loadPolls();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus polling');
    }
  };

  const openDetail = async (poll: Poll) => {
    setDetailPoll(poll);
    try {
      const res = await fetchAPI<PollResults>(`/polls/${poll.id}/results`);
      setDetailResults(res);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat hasil');
      setDetailResults(null);
    }
  };

  const updateOption = (index: number, value: string) => {
    const next = [...form.options];
    next[index] = value;
    setForm({ ...form, options: next });
  };

  const addOption = () => {
    setForm({ ...form, options: [...form.options, ''] });
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) return;
    setForm({ ...form, options: form.options.filter((_, i) => i !== index) });
  };

  const departmentOptions = [
    { value: 'all', label: 'Semua Karyawan' },
    ...departments.map(d => ({ value: `department:${d.id}`, label: d.name })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{t('polls')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Buat dan ikuti polling internal perusahaan
          </p>
        </div>
        {isAdmin && activeTab === 'manage' && (
          <button
            onClick={openCreateModal}
            className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2.5 flex items-center gap-1.5"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            Buat Polling
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'active'
              ? 'bg-white text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          {t('polls_active')}
        </button>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'manage'
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t('polls_manage')}
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Lucide.Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : activeTab === 'active' ? (
        activePolls.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
            <Lucide.BarChart className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Belum ada polling aktif</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activePolls.map(poll => {
              const results = resultsMap[poll.id];
              const hasVoted = poll.hasVoted || !!results;

              return (
                <div
                  key={poll.id}
                  className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-bold text-slate-800 leading-snug">{poll.title}</h3>
                    <Badge status="active" />
                  </div>

                  {poll.description && (
                    <p className="text-xs text-slate-500 mb-3 line-clamp-2">{poll.description}</p>
                  )}

                  <div className="space-y-1 text-[10px] text-slate-400 mb-3">
                    {poll.endDate && (
                      <div className="flex items-center gap-1.5">
                        <Lucide.Calendar className="w-3 h-3" />
                        <span>Deadline: {formatDate(poll.endDate)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Lucide.Users className="w-3 h-3" />
                      <span>{formatTarget(poll.target, departments)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Lucide.ListChecks className="w-3 h-3" />
                      <span>{poll.type === 'single' ? 'Pilihan tunggal' : 'Pilihan ganda'}</span>
                      {poll.isAnonymous && (
                        <span className="text-slate-400">· Anonim</span>
                      )}
                    </div>
                  </div>

                  {hasVoted && results ? (
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                        {t('polls_results')}
                      </p>
                      <ResultBars results={results.results} />
                    </div>
                  ) : (
                    <div className="mt-auto pt-2">
                      <button
                        onClick={() => openVoteModal(poll)}
                        className="w-full bg-primary text-white rounded-lg text-xs font-bold py-2.5"
                      >
                        {t('polls_vote')}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          <DataTable
            headers={['Judul', 'Tipe', 'Target', 'Status', 'Respon', 'Aksi']}
            rows={polls}
            loading={loading}
            emptyText="Belum ada polling"
            columns={[
              row => row.title,
              row => (row.type === 'single' ? 'Tunggal' : 'Ganda'),
              row => formatTarget(row.target, departments),
              row => <Badge status={row.status} />,
              row => String(row._count?.responses ?? 0),
              row => (
                <TableActionMenu
                  items={[
                    ...(row.status === 'draft'
                      ? [{ label: 'Edit', onClick: () => openEditModal(row) }]
                      : []),
                    ...(row.status === 'draft'
                      ? [{ label: 'Publikasikan', onClick: () => handlePublish(row) }]
                      : []),
                    ...(row.status === 'active'
                      ? [{ label: 'Tutup', onClick: () => handleClose(row) }]
                      : []),
                    { label: 'Lihat Hasil', onClick: () => openDetail(row) },
                    ...(isSuperAdmin
                      ? [{ label: 'Hapus', onClick: () => setDeleteTarget(row), variant: 'danger' as const }]
                      : []),
                  ]}
                />
              ),
            ]}
          />
        </div>
      )}

      {/* Vote Modal */}
      <Modal
        isOpen={voteModalOpen}
        onClose={() => setVoteModalOpen(false)}
        title={votePoll?.title || t('polls_vote')}
        size="md"
      >
        {votePoll && (
          <div className="space-y-4">
            {votePoll.description && (
              <p className="text-xs text-slate-500">{votePoll.description}</p>
            )}

            <div className="space-y-2">
              {votePoll.options.map(option =>
                votePoll.type === 'single' ? (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedOption === option.id
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="poll-option"
                      value={option.id}
                      checked={selectedOption === option.id}
                      onChange={() => setSelectedOption(option.id)}
                      className="accent-primary"
                    />
                    <span className="text-xs text-slate-700">{option.text}</span>
                  </label>
                ) : (
                  <label
                    key={option.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedOptions.includes(option.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-slate-100 hover:border-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptions.includes(option.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setSelectedOptions(prev => [...prev, option.id]);
                        } else {
                          setSelectedOptions(prev => prev.filter(id => id !== option.id));
                        }
                      }}
                      className="accent-primary"
                    />
                    <span className="text-xs text-slate-700">{option.text}</span>
                  </label>
                ),
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setVoteModalOpen(false)}
                className="px-4 py-2 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                onClick={handleVote}
                disabled={voting}
                className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2.5 disabled:opacity-50"
              >
                {voting ? 'Mengirim...' : 'Kirim Vote'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        title={editingPoll ? 'Edit Polling' : 'Buat Polling Baru'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Judul"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            required
          />
          <FormField.Textarea
            label="Deskripsi"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField.Select
              label="Tipe"
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              options={[
                { value: 'single', label: 'Pilihan Tunggal' },
                { value: 'multiple', label: 'Pilihan Ganda' },
              ]}
            />
            <FormField.Select
              label="Target"
              value={form.target}
              onChange={e => setForm({ ...form, target: e.target.value })}
              options={departmentOptions}
            />
          </div>
          <FormField.Toggle
            label="Polling Anonim"
            checked={form.isAnonymous}
            onChange={e => setForm({ ...form, isAnonymous: e.target.checked })}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField.Input
              label="Tanggal Mulai"
              type="datetime-local"
              value={form.startDate}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
            />
            <FormField.Input
              label="Tanggal Selesai"
              type="datetime-local"
              value={form.endDate}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-2 block">
              Opsi Jawaban
            </label>
            <div className="space-y-2">
              {form.options.map((opt, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={e => updateOption(index, e.target.value)}
                    placeholder={`Opsi ${index + 1}`}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-primary"
                  />
                  {form.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOption(index)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg"
                    >
                      <Lucide.X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addOption}
              className="mt-2 text-xs font-bold text-primary flex items-center gap-1"
            >
              <Lucide.Plus className="w-3 h-3" />
              Tambah Opsi
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setFormModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-500 rounded-lg hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={handleSavePoll}
              disabled={saving}
              className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2.5 disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Detail Results Modal */}
      <Modal
        isOpen={!!detailPoll}
        onClose={() => { setDetailPoll(null); setDetailResults(null); }}
        title={detailPoll?.title || t('polls_results')}
        size="md"
      >
        {detailResults ? (
          <div className="space-y-4">
            <div className="flex gap-3 text-xs text-slate-500">
              <span>Total respon: {detailResults.totalResponses}</span>
              <span>Pemilih: {detailResults.voterCount}</span>
            </div>
            <ResultBars results={detailResults.results} />
            {!detailResults.isAnonymous &&
              detailResults.results.some(r => r.voters && r.voters.length > 0) && (
                <div className="border-t border-slate-100 pt-3 space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">Daftar Pemilih</p>
                  {detailResults.results.map(r =>
                    r.voters && r.voters.length > 0 ? (
                      <div key={r.optionId} className="text-xs">
                        <span className="font-bold text-slate-700">{r.text}: </span>
                        <span className="text-slate-500">{r.voters.join(', ')}</span>
                      </div>
                    ) : null,
                  )}
                </div>
              )}
          </div>
        ) : (
          <div className="flex justify-center py-8">
            <Lucide.Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Polling"
        message={`Yakin ingin menghapus polling "${deleteTarget?.title}"?`}
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
