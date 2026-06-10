'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import DataTable from '@/components/shared/DataTable';
import TableActionMenu from '@/components/shared/TableActionMenu';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';

type TabId = 'pipeline' | 'templates' | 'sources' | 'fields';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'pipeline', label: 'Alur Pipeline', icon: Lucide.GitCommitHorizontal },
  { id: 'templates', label: 'Template Lowongan', icon: Lucide.FileText },
  { id: 'sources', label: 'Sumber Kandidat', icon: Lucide.Network },
  { id: 'fields', label: 'Formulir Lamaran', icon: Lucide.CheckSquare },
];

export default function SettingsHiringPage() {
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('pipeline');
  const [loading, setLoading] = useState(true);

  const [stages, setStages] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [formFields, setFormFields] = useState<any[]>([]);

  const [stageModal, setStageModal] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [stageForm, setStageForm] = useState({ name: '', sequence: '1', pic: '', duration: '3' });

  const [templateModal, setTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({ position: '', description: '', qualification: '', benefits: '' });

  const [newSourceName, setNewSourceName] = useState('');
  const [savingFields, setSavingFields] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [stageData, templateData, sourceData, fieldData] = await Promise.all([
        fetchAPI<any[]>('/hiring/stages'),
        fetchAPI<any[]>('/hiring/templates'),
        fetchAPI<any[]>('/hiring/sources'),
        fetchAPI<any[]>('/hiring/form-fields'),
      ]);
      setStages(stageData);
      setTemplates(templateData);
      setSources(sourceData);
      setFormFields(fieldData);
    } catch (err) {
      console.error('Failed to load hiring settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isHR) loadData();
  }, [isHR]);

  const openStageModal = (stage?: any) => {
    setEditingStage(stage || null);
    setStageForm(stage
      ? { name: stage.name, sequence: String(stage.sequence), pic: stage.pic, duration: String(stage.duration) }
      : { name: '', sequence: String(stages.length + 1), pic: '', duration: '3' });
    setStageModal(true);
  };

  const handleSaveStage = async () => {
    if (!stageForm.name.trim() || !stageForm.pic.trim()) {
      alert('Nama tahapan dan nama PIC wajib diisi!');
      return;
    }
    try {
      const payload = {
        name: stageForm.name,
        sequence: parseInt(stageForm.sequence) || 1,
        pic: stageForm.pic,
        duration: parseInt(stageForm.duration) || 1,
      };
      if (editingStage) {
        await fetchAPI(`/hiring/stages/${editingStage.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        alert('Tahapan seleksi rekrutmen berhasil diperbarui');
      } else {
        await fetchAPI('/hiring/stages', { method: 'POST', body: JSON.stringify(payload) });
        alert('Tahapan seleksi baru berhasil didaftarkan');
      }
      setStageModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan tahapan');
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tahapan seleksi rekrutmen ini?')) return;
    try {
      await fetchAPI(`/hiring/stages/${id}/delete`, { method: 'POST' });
      alert('Tahapan seleksi rekrutmen berhasil dihapus');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tahapan');
    }
  };

  const openTemplateModal = (template?: any) => {
    setEditingTemplate(template || null);
    setTemplateForm(template
      ? { position: template.position, description: template.description, qualification: template.qualification, benefits: template.benefits || '' }
      : { position: '', description: '', qualification: '', benefits: '' });
    setTemplateModal(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.position.trim() || !templateForm.description.trim() || !templateForm.qualification.trim()) {
      alert('Mohon lengkapi kolom wajib');
      return;
    }
    try {
      if (editingTemplate) {
        await fetchAPI(`/hiring/templates/${editingTemplate.id}`, { method: 'PUT', body: JSON.stringify(templateForm) });
        alert('Template lowongan berhasil diperbarui');
      } else {
        await fetchAPI('/hiring/templates', { method: 'POST', body: JSON.stringify(templateForm) });
        alert('Template lowongan baru berhasil ditambahkan');
      }
      setTemplateModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan template');
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus template lowongan pekerjaan ini?')) return;
    try {
      await fetchAPI(`/hiring/templates/${id}/delete`, { method: 'POST' });
      alert('Template lowongan berhasil dihapus');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus template');
    }
  };

  const handleAddSource = async () => {
    if (!newSourceName.trim()) {
      alert('Nama media sumber wajib diisi!');
      return;
    }
    try {
      await fetchAPI('/hiring/sources', { method: 'POST', body: JSON.stringify({ name: newSourceName }) });
      setNewSourceName('');
      alert('Sumber rekrutmen baru berhasil ditambahkan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambahkan sumber');
    }
  };

  const handleToggleSource = async (id: string) => {
    try {
      await fetchAPI(`/hiring/sources/${id}/toggle`, { method: 'POST' });
      alert('Status sumber rekrutmen berhasil diperbarui');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui status');
    }
  };

  const toggleFieldRequired = (id: string) => {
    setFormFields(prev => prev.map(f => (f.id === id ? { ...f, required: !f.required } : f)));
  };

  const handleSaveFields = async () => {
    setSavingFields(true);
    try {
      await fetchAPI('/hiring/form-fields', {
        method: 'PUT',
        body: JSON.stringify({ fields: formFields.map(f => ({ id: f.id, required: f.required })) }),
      });
      alert('Struktur formulir rekrutmen lamaran berhasil disimpan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan formulir');
    } finally {
      setSavingFields(false);
    }
  };

  if (!isHR) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/settings" className="hover:text-slate-600 font-medium">Pengaturan</Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">Hiring</span>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Konfigurasi Rekrutmen & Hiring</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola alur seleksi karyawan, template lowongan kerja, sumber kandidat, dan formulir pendaftaran.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-t-2xl border-x border-t border-slate-100 shadow-sm flex overflow-x-auto select-none">
        {TABS.map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 border-b-2 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap ${
                isActive ? 'border-primary text-primary font-bold' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border-x border-b border-slate-100 shadow-sm p-6">
        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openStageModal()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Tahapan</span>
              </button>
            </div>
            <DataTable
              headers={['Urutan', 'Tahapan Seleksi', 'PIC Default', 'Target Waktu']}
              rows={[...stages].sort((a, b) => a.sequence - b.sequence)}
              loading={loading}
              columns={[
                (row) => <span className="font-bold font-mono text-slate-800">{row.sequence}</span>,
                (row) => <span className="font-bold text-slate-800">{row.name}</span>,
                (row) => <span className="font-semibold text-slate-600">{row.pic}</span>,
                (row) => <span className="font-bold font-mono text-slate-800">{row.duration} Hari</span>,
              ]}
              actions={(row) => (
                <TableActionMenu
                  items={[
                    { label: 'Edit', onClick: () => openStageModal(row), variant: 'primary' },
                    { label: 'Hapus', onClick: () => handleDeleteStage(row.id), variant: 'danger' },
                  ]}
                />
              )}
            />
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={() => openTemplateModal()}
                className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Template</span>
              </button>
            </div>
            <DataTable
              headers={['Nama Jabatan', 'Deskripsi Singkat']}
              rows={templates}
              loading={loading}
              columns={[
                (row) => <span className="font-bold text-slate-800">{row.position}</span>,
                (row) => <span className="text-slate-500 max-w-md truncate">{row.description}</span>,
              ]}
              actions={(row) => (
                <TableActionMenu
                  items={[
                    { label: 'Edit', onClick: () => openTemplateModal(row), variant: 'primary' },
                    { label: 'Hapus', onClick: () => handleDeleteTemplate(row.id), variant: 'danger' },
                  ]}
                />
              )}
            />
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl md:col-span-4 flex flex-col gap-4 select-none">
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-200">Tambah Sumber Baru</h3>
              <FormField.Input
                label="Nama Sumber / Media"
                required
                placeholder="Contoh: Glints, TechInAsia"
                value={newSourceName}
                onChange={(e) => setNewSourceName(e.target.value)}
              />
              <button
                onClick={handleAddSource}
                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow text-xs transition cursor-pointer"
              >
                Tambahkan Sumber
              </button>
            </div>
            <div className="md:col-span-8 bg-white border border-slate-200/80 rounded-2xl overflow-hidden">
              <DataTable
                headers={['ID', 'Sumber Rekrutmen', 'Status']}
                rows={sources}
                loading={loading}
                columns={[
                  (row) => <span className="font-bold font-mono text-slate-800">{row.id.slice(-8).toUpperCase()}</span>,
                  (row) => <span className="font-bold text-slate-700">{row.name}</span>,
                  (row) => row.active ? (
                    <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-[10px]">Aktif</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold border border-slate-200 text-[10px]">Nonaktif</span>
                  ),
                ]}
                actions={(row) => (
                  <TableActionMenu
                    items={[
                      {
                        label: row.active ? 'Nonaktifkan' : 'Aktifkan',
                        onClick: () => handleToggleSource(row.id),
                        variant: 'primary',
                      },
                    ]}
                  />
                )}
              />
            </div>
          </div>
        )}

        {activeTab === 'fields' && (
          <div className="space-y-4">
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <DataTable
                headers={['Nama Field Formulir', 'Field ID / Key', 'Wajib Diisi (Required)', 'Mekanisme']}
                rows={formFields}
                loading={loading}
                columns={[
                  (row) => <span className="font-bold text-slate-800">{row.label}</span>,
                  (row) => <span className="font-semibold font-mono text-slate-400 capitalize">{row.key}</span>,
                  (row) => (
                    <div className="text-center">
                      <input
                        type="checkbox"
                        checked={row.required}
                        disabled={row.isSystem}
                        onChange={() => toggleFieldRequired(row.id)}
                        className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer disabled:opacity-50"
                      />
                    </div>
                  ),
                  (row) => row.isSystem ? (
                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded">Core System Field</span>
                  ) : null,
                ]}
              />
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleSaveFields}
                disabled={savingFields}
                className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer disabled:opacity-50"
              >
                {savingFields ? 'Menyimpan...' : 'Simpan Struktur Formulir'}
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={stageModal}
        onClose={() => setStageModal(false)}
        title={editingStage ? 'Edit Tahapan Rekrutmen' : 'Tambah Tahapan Rekrutmen Baru'}
        footer={
          <>
            <button onClick={() => setStageModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={handleSaveStage} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Tahapan Rekrutmen" required value={stageForm.name} onChange={(e) => setStageForm({ ...stageForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Urutan Langkah (Sequence)" type="number" required value={stageForm.sequence} onChange={(e) => setStageForm({ ...stageForm, sequence: e.target.value })} />
            <FormField.Input label="Target Waktu Kerja (Hari)" type="number" required value={stageForm.duration} onChange={(e) => setStageForm({ ...stageForm, duration: e.target.value })} />
          </div>
          <FormField.Input label="PIC Penilai Default" required value={stageForm.pic} onChange={(e) => setStageForm({ ...stageForm, pic: e.target.value })} />
        </div>
      </Modal>

      <Modal
        isOpen={templateModal}
        onClose={() => setTemplateModal(false)}
        title={editingTemplate ? 'Edit Template Lowongan' : 'Tambah Template Lowongan Baru'}
        size="lg"
        footer={
          <>
            <button onClick={() => setTemplateModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
            <button onClick={handleSaveTemplate} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan</button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input label="Nama Posisi Pekerjaan" required value={templateForm.position} onChange={(e) => setTemplateForm({ ...templateForm, position: e.target.value })} />
          <FormField.Textarea label="Deskripsi Pekerjaan (Job Description)" required rows={2} value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })} />
          <FormField.Textarea label="Persyaratan Kualifikasi" required rows={2} value={templateForm.qualification} onChange={(e) => setTemplateForm({ ...templateForm, qualification: e.target.value })} />
          <FormField.Textarea label="Fasilitas & Benefit" rows={2} value={templateForm.benefits} onChange={(e) => setTemplateForm({ ...templateForm, benefits: e.target.value })} />
        </div>
      </Modal>
    </div>
  );
}
