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

interface JobPosting {
  id: string;
  title: string;
  departmentId?: string | null;
  positionId?: string | null;
  description: string;
  requirements?: string | null;
  benefits?: string | null;
  employmentType: string;
  location?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  status: string;
  deadline?: string | null;
  openings: number;
  department?: { id: string; name: string } | null;
  position?: { id: string; name: string } | null;
  _count?: { applications: number };
}

interface StageHistory {
  id: string;
  stage: string;
  notes?: string | null;
  movedBy?: string | null;
  movedAt: string;
}

interface JobApplication {
  id: string;
  jobId: string;
  applicantName: string;
  email: string;
  phone?: string | null;
  resumeUrl?: string | null;
  coverLetter?: string | null;
  source?: string | null;
  currentStage: string;
  rating?: number | null;
  notes?: string | null;
  rejectedAt?: string | null;
  rejectedReason?: string | null;
  hiredAt?: string | null;
  stageHistory: StageHistory[];
  job?: JobPosting;
}

interface PipelineStage {
  id: string;
  name: string;
  sequence: number;
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
];

const SOURCE_OPTIONS = [
  { value: 'referral', label: 'Referral' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'jobstreet', label: 'Jobstreet' },
  { value: 'walk-in', label: 'Walk-in' },
  { value: 'other', label: 'Lainnya' },
];

const TERMINAL_STAGES = ['hired', 'rejected'];

function jobStatusBadge(status: string) {
  return <Badge status={status} />;
}

function StarRating({ value, onChange, readonly }: { value?: number | null; onChange?: (n: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          disabled={readonly}
          onClick={() => onChange?.(n)}
          className={readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110 transition-transform'}
        >
          <Lucide.Star
            className={`w-3.5 h-3.5 ${(value || 0) >= n ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`}
          />
        </button>
      ))}
    </div>
  );
}

const emptyJobForm = () => ({
  title: '',
  departmentId: '',
  positionId: '',
  description: '',
  requirements: '',
  benefits: '',
  employmentType: 'full_time',
  location: '',
  salaryMin: '',
  salaryMax: '',
  deadline: '',
  openings: '1',
});

const emptyApplicantForm = () => ({
  applicantName: '',
  email: '',
  phone: '',
  resumeUrl: '',
  coverLetter: '',
  source: 'other',
});

export default function HiringPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [activeTab, setActiveTab] = useState<'jobs' | 'pipeline'>('jobs');
  const [loading, setLoading] = useState(true);

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([]);

  const [jobModal, setJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [jobForm, setJobForm] = useState(emptyJobForm());
  const [saving, setSaving] = useState(false);

  const [selectedJobId, setSelectedJobId] = useState('');
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);

  const [moveModal, setMoveModal] = useState<JobApplication | null>(null);
  const [moveStage, setMoveStage] = useState('');
  const [moveNotes, setMoveNotes] = useState('');

  const [detailApp, setDetailApp] = useState<JobApplication | null>(null);
  const [detailNotes, setDetailNotes] = useState('');

  const [addApplicantModal, setAddApplicantModal] = useState(false);
  const [applicantForm, setApplicantForm] = useState(emptyApplicantForm());
  const [addApplicantJobId, setAddApplicantJobId] = useState('');

  const [rejectTarget, setRejectTarget] = useState<JobApplication | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [hireTarget, setHireTarget] = useState<JobApplication | null>(null);

  const kanbanColumns = [
    { key: 'applied', label: 'Applied' },
    ...pipelineStages.map(s => ({ key: s.name, label: s.name })),
    { key: 'hired', label: 'Hired' },
    { key: 'rejected', label: 'Rejected' },
  ];

  const allStageOptions = [
    { value: 'applied', label: 'Applied' },
    ...pipelineStages.map(s => ({ value: s.name, label: s.name })),
    { value: 'hired', label: 'Hired' },
    { value: 'rejected', label: 'Rejected' },
  ];

  const loadJobs = useCallback(async () => {
    setLoading(true);
    try {
      const [jobsData, deptData, posData, stagesData] = await Promise.all([
        fetchAPI<JobPosting[]>('/hiring/jobs'),
        fetchAPI<any[]>('/employees/departments'),
        fetchAPI<any[]>('/employees/positions'),
        fetchAPI<PipelineStage[]>('/hiring/stages'),
      ]);
      setJobs(jobsData);
      setDepartments(deptData);
      setPositions(posData);
      setPipelineStages(stagesData);
      if (!selectedJobId && jobsData.length > 0) {
        setSelectedJobId(jobsData[0].id);
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat data rekrutmen');
    } finally {
      setLoading(false);
    }
  }, [selectedJobId]);

  const loadApplications = useCallback(async (jobId: string) => {
    if (!jobId) {
      setApplications([]);
      return;
    }
    setLoadingApps(true);
    try {
      const data = await fetchAPI<JobApplication[]>(`/hiring/jobs/${jobId}/applications`);
      setApplications(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat pelamar');
    } finally {
      setLoadingApps(false);
    }
  }, []);

  useEffect(() => {
    if (isHR) loadJobs();
  }, [isHR, loadJobs]);

  useEffect(() => {
    if (activeTab === 'pipeline' && selectedJobId) {
      loadApplications(selectedJobId);
    }
  }, [activeTab, selectedJobId, loadApplications]);

  const openJobModal = (job?: JobPosting) => {
    setEditingJob(job || null);
    setJobForm(job
      ? {
          title: job.title,
          departmentId: job.departmentId || '',
          positionId: job.positionId || '',
          description: job.description,
          requirements: job.requirements || '',
          benefits: job.benefits || '',
          employmentType: job.employmentType,
          location: job.location || '',
          salaryMin: job.salaryMin != null ? String(job.salaryMin) : '',
          salaryMax: job.salaryMax != null ? String(job.salaryMax) : '',
          deadline: job.deadline ? job.deadline.slice(0, 10) : '',
          openings: String(job.openings),
        }
      : emptyJobForm());
    setJobModal(true);
  };

  const handleSaveJob = async () => {
    if (!jobForm.title.trim() || !jobForm.description.trim()) {
      alert('Judul dan deskripsi wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...jobForm,
        departmentId: jobForm.departmentId || null,
        positionId: jobForm.positionId || null,
        salaryMin: jobForm.salaryMin || null,
        salaryMax: jobForm.salaryMax || null,
        deadline: jobForm.deadline || null,
      };
      if (editingJob) {
        await fetchAPI(`/hiring/jobs/${editingJob.id}`, { method: 'PUT', body: JSON.stringify(payload) });
        alert('Lowongan berhasil diperbarui');
      } else {
        await fetchAPI('/hiring/jobs', { method: 'POST', body: JSON.stringify(payload) });
        alert('Lowongan berhasil dibuat');
      }
      setJobModal(false);
      loadJobs();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan lowongan');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenJob = async (job: JobPosting) => {
    try {
      await fetchAPI(`/hiring/jobs/${job.id}/open`, { method: 'POST' });
      alert('Lowongan dibuka');
      loadJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCloseJob = async (job: JobPosting) => {
    try {
      await fetchAPI(`/hiring/jobs/${job.id}/close`, { method: 'POST' });
      alert('Lowongan ditutup');
      loadJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRatingChange = async (app: JobApplication, rating: number) => {
    try {
      const updated = await fetchAPI<JobApplication>(`/hiring/applications/${app.id}`, {
        method: 'PUT',
        body: JSON.stringify({ rating }),
      });
      setApplications(prev => prev.map(a => (a.id === app.id ? { ...a, rating: updated.rating } : a)));
      if (detailApp?.id === app.id) setDetailApp({ ...detailApp, rating: updated.rating });
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMoveStage = async () => {
    if (!moveModal || !moveStage) return;
    try {
      await fetchAPI(`/hiring/applications/${moveModal.id}/stage`, {
        method: 'PUT',
        body: JSON.stringify({ stage: moveStage, notes: moveNotes }),
      });
      alert('Stage berhasil diperbarui');
      setMoveModal(null);
      setMoveStage('');
      setMoveNotes('');
      loadApplications(selectedJobId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const openDetail = async (app: JobApplication) => {
    try {
      const full = await fetchAPI<JobApplication>(`/hiring/applications/${app.id}`).catch(() => app);
      setDetailApp(full);
      setDetailNotes(full.notes || '');
    } catch {
      setDetailApp(app);
      setDetailNotes(app.notes || '');
    }
  };

  const handleSaveDetailNotes = async () => {
    if (!detailApp) return;
    try {
      const updated = await fetchAPI<JobApplication>(`/hiring/applications/${detailApp.id}`, {
        method: 'PUT',
        body: JSON.stringify({ notes: detailNotes }),
      });
      setDetailApp(updated);
      setApplications(prev => prev.map(a => (a.id === updated.id ? { ...a, notes: updated.notes } : a)));
      alert('Catatan disimpan');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleHire = async () => {
    if (!hireTarget) return;
    try {
      await fetchAPI(`/hiring/applications/${hireTarget.id}/hire`, { method: 'POST' });
      alert('Kandidat berhasil di-hire');
      setHireTarget(null);
      setDetailApp(null);
      loadApplications(selectedJobId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await fetchAPI(`/hiring/applications/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      alert('Kandidat ditolak');
      setRejectTarget(null);
      setRejectReason('');
      setDetailApp(null);
      loadApplications(selectedJobId);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddApplicant = async () => {
    if (!addApplicantJobId || !applicantForm.applicantName.trim() || !applicantForm.email.trim()) {
      alert('Nama dan email wajib diisi!');
      return;
    }
    try {
      await fetchAPI(`/hiring/jobs/${addApplicantJobId}/applications`, {
        method: 'POST',
        body: JSON.stringify(applicantForm),
      });
      alert('Pelamar berhasil ditambahkan');
      setAddApplicantModal(false);
      setApplicantForm(emptyApplicantForm());
      if (selectedJobId === addApplicantJobId) loadApplications(selectedJobId);
      loadJobs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const employmentLabel = (type: string) =>
    EMPLOYMENT_TYPES.find(e => e.value === type)?.label || type;

  if (!isHR) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-slate-500">
          Akses modul rekrutmen terbatas untuk HR Admin.
        </div>
      </div>
    );
  }

  const jobRows = jobs;

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{t('hiring')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Kelola lowongan kerja dan pipeline pelamar</p>
        </div>
        {activeTab === 'jobs' && (
          <button
            type="button"
            onClick={() => openJobModal()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold hover:opacity-90"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            Buat Lowongan
          </button>
        )}
      </div>

      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {(['jobs', 'pipeline'] as const).map(tab => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === tab ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab === 'jobs' ? t('hiring_jobs') : t('hiring_pipeline')}
          </button>
        ))}
      </div>

      {activeTab === 'jobs' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
          {loading ? (
            <p className="text-xs text-slate-400 text-center py-8">{t('loading')}</p>
          ) : (
            <DataTable
              headers={['Judul', 'Departemen', 'Tipe', 'Status', 'Deadline', t('hiring_applications'), t('action')]}
              rows={jobRows}
              loading={loading}
              columns={[
                row => <span className="font-semibold text-slate-800">{row.title}</span>,
                row => row.department?.name || '-',
                row => employmentLabel(row.employmentType),
                row => jobStatusBadge(row.status),
                row => (row.deadline ? formatDate(row.deadline) : '-'),
                row => String(row._count?.applications ?? 0),
                row => (
                  <div className="flex gap-1.5 flex-wrap" onClick={e => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => openJobModal(row)}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    >
                      {t('edit')}
                    </button>
                    {row.status === 'draft' && (
                      <button
                        type="button"
                        onClick={() => handleOpenJob(row)}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-green-50 text-green-700 hover:bg-green-100"
                      >
                        Buka
                      </button>
                    )}
                    {row.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleCloseJob(row)}
                        className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100"
                      >
                        Tutup
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAddApplicantJobId(row.id);
                        setAddApplicantModal(true);
                      }}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      + Pelamar
                    </button>
                  </div>
                ),
              ]}
            />
          )}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <label className="text-xs font-bold text-slate-600 shrink-0">Pilih Lowongan:</label>
            <FormField.Select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              options={[
                { value: '', label: '-- Pilih --' },
                ...jobs.map(j => ({ value: j.id, label: j.title })),
              ]}
            />
          </div>

          {!selectedJobId ? (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center text-xs text-slate-400">
              Pilih lowongan untuk melihat pipeline
            </div>
          ) : loadingApps ? (
            <p className="text-xs text-slate-400 text-center py-8">{t('loading')}</p>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {kanbanColumns.map(col => {
                const colApps = applications.filter(a => a.currentStage === col.key);
                return (
                  <div
                    key={col.key}
                    className="min-w-[220px] w-[220px] shrink-0 bg-slate-50 rounded-2xl border border-slate-100 p-3"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide truncate">
                        {col.label}
                      </span>
                      <span className="text-[10px] font-bold bg-white text-slate-500 px-1.5 py-0.5 rounded-md border border-slate-100">
                        {colApps.length}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {colApps.map(app => (
                        <div
                          key={app.id}
                          className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"
                        >
                          <p className="text-xs font-bold text-slate-800 truncate">{app.applicantName}</p>
                          <p className="text-[10px] text-slate-400 truncate mt-0.5">{app.email}</p>
                          {app.source && (
                            <p className="text-[10px] text-slate-500 mt-1 capitalize">{app.source}</p>
                          )}
                          <div className="mt-2">
                            <StarRating
                              value={app.rating}
                              onChange={n => handleRatingChange(app, n)}
                            />
                          </div>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {!TERMINAL_STAGES.includes(app.currentStage) && !app.hiredAt && !app.rejectedAt && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMoveModal(app);
                                  setMoveStage('');
                                  setMoveNotes('');
                                }}
                                className="px-2 py-1 text-[9px] font-bold rounded bg-blue-50 text-blue-700 hover:bg-blue-100"
                              >
                                Pindah Stage
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => openDetail(app)}
                              className="px-2 py-1 text-[9px] font-bold rounded bg-slate-100 text-slate-600 hover:bg-slate-200"
                            >
                              {t('detail')}
                            </button>
                          </div>
                        </div>
                      ))}
                      {colApps.length === 0 && (
                        <p className="text-[10px] text-slate-300 text-center py-4">Kosong</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Job Modal */}
      <Modal
        isOpen={jobModal}
        onClose={() => setJobModal(false)}
        title={editingJob ? 'Edit Lowongan' : 'Buat Lowongan Baru'}
        size="xl"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField.Input
            label="Judul Lowongan"
            value={jobForm.title}
            onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <FormField.Select
            label="Departemen"
            value={jobForm.departmentId}
            onChange={e => setJobForm(f => ({ ...f, departmentId: e.target.value }))}
            options={[
              { value: '', label: '-- Pilih --' },
              ...departments.map(d => ({ value: d.id, label: d.name })),
            ]}
          />
          <FormField.Select
            label="Posisi"
            value={jobForm.positionId}
            onChange={e => setJobForm(f => ({ ...f, positionId: e.target.value }))}
            options={[
              { value: '', label: '-- Pilih --' },
              ...positions.map(p => ({ value: p.id, label: p.name })),
            ]}
          />
          <FormField.Select
            label="Tipe Pekerjaan"
            value={jobForm.employmentType}
            onChange={e => setJobForm(f => ({ ...f, employmentType: e.target.value }))}
            options={EMPLOYMENT_TYPES}
          />
          <FormField.Input
            label="Lokasi"
            value={jobForm.location}
            onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))}
          />
          <FormField.Input
            label="Deadline"
            type="date"
            value={jobForm.deadline}
            onChange={e => setJobForm(f => ({ ...f, deadline: e.target.value }))}
          />
          <FormField.Input
            label="Gaji Min (IDR)"
            type="number"
            value={jobForm.salaryMin}
            onChange={e => setJobForm(f => ({ ...f, salaryMin: e.target.value }))}
          />
          <FormField.Input
            label="Gaji Max (IDR)"
            type="number"
            value={jobForm.salaryMax}
            onChange={e => setJobForm(f => ({ ...f, salaryMax: e.target.value }))}
          />
          <FormField.Input
            label="Jumlah Posisi"
            type="number"
            value={jobForm.openings}
            onChange={e => setJobForm(f => ({ ...f, openings: e.target.value }))}
          />
          <div className="md:col-span-2">
            <FormField.Textarea
              label="Deskripsi"
              value={jobForm.description}
              onChange={e => setJobForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              required
            />
          </div>
          <div className="md:col-span-2">
            <FormField.Textarea
              label="Persyaratan"
              value={jobForm.requirements}
              onChange={e => setJobForm(f => ({ ...f, requirements: e.target.value }))}
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <FormField.Textarea
              label="Benefit"
              value={jobForm.benefits}
              onChange={e => setJobForm(f => ({ ...f, benefits: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            type="button"
            onClick={() => setJobModal(false)}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleSaveJob}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
          >
            {saving ? t('loading') : t('save')}
          </button>
        </div>
      </Modal>

      {/* Move Stage Modal */}
      <Modal
        isOpen={!!moveModal}
        onClose={() => setMoveModal(null)}
        title="Pindah Stage"
        size="md"
      >
        {moveModal && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Pelamar: <strong>{moveModal.applicantName}</strong>
            </p>
            <FormField.Select
              label="Stage Tujuan"
              value={moveStage}
              onChange={e => setMoveStage(e.target.value)}
              options={[
                { value: '', label: '-- Pilih Stage --' },
                ...allStageOptions.filter(s => s.value !== moveModal.currentStage),
              ]}
            />
            <FormField.Textarea
              label="Catatan"
              value={moveNotes}
              onChange={e => setMoveNotes(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setMoveModal(null)} className="px-4 py-2 text-xs font-bold text-slate-500">
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleMoveStage}
                className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold"
              >
                Pindah
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailApp}
        onClose={() => setDetailApp(null)}
        title="Detail Pelamar"
        size="xl"
      >
        {detailApp && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Nama</p>
                <p className="text-sm font-semibold text-slate-800">{detailApp.applicantName}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Email</p>
                <p className="text-sm text-slate-700">{detailApp.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Telepon</p>
                <p className="text-sm text-slate-700">{detailApp.phone || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Sumber</p>
                <p className="text-sm text-slate-700 capitalize">{detailApp.source || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">Stage Saat Ini</p>
                <p className="text-sm font-semibold text-primary">{detailApp.currentStage}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Rating</p>
                <StarRating
                  value={detailApp.rating}
                  onChange={n => handleRatingChange(detailApp, n)}
                />
              </div>
              {detailApp.resumeUrl && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Resume</p>
                  <a href={detailApp.resumeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary underline">
                    {detailApp.resumeUrl}
                  </a>
                </div>
              )}
              {detailApp.coverLetter && (
                <div className="md:col-span-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Cover Letter</p>
                  <p className="text-xs text-slate-600 whitespace-pre-wrap">{detailApp.coverLetter}</p>
                </div>
              )}
            </div>

            <div>
              <FormField.Textarea
                label="Catatan Internal"
                value={detailNotes}
                onChange={e => setDetailNotes(e.target.value)}
                rows={2}
              />
              <button
                type="button"
                onClick={handleSaveDetailNotes}
                className="mt-2 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold hover:bg-slate-200"
              >
                Simpan Catatan
              </button>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-700 mb-2">Riwayat Stage</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {(detailApp.stageHistory || []).map(h => (
                  <div key={h.id} className="flex gap-3 text-xs border-l-2 border-primary/30 pl-3 py-1">
                    <div>
                      <p className="font-bold text-slate-700">{h.stage}</p>
                      {h.notes && <p className="text-slate-500">{h.notes}</p>}
                      <p className="text-[10px] text-slate-400">{formatDate(h.movedAt)}</p>
                    </div>
                  </div>
                ))}
                {(detailApp.stageHistory || []).length === 0 && (
                  <p className="text-xs text-slate-400">{t('no_data')}</p>
                )}
              </div>
            </div>

            {!detailApp.hiredAt && !detailApp.rejectedAt && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setHireTarget(detailApp)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
                >
                  Hire
                </button>
                <button
                  type="button"
                  onClick={() => setRejectTarget(detailApp)}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100"
                >
                  {t('reject')}
                </button>
              </div>
            )}
            {detailApp.hiredAt && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                Hired — {formatDate(detailApp.hiredAt)}
              </span>
            )}
            {detailApp.rejectedAt && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                Rejected — {detailApp.rejectedReason || formatDate(detailApp.rejectedAt)}
              </span>
            )}
          </div>
        )}
      </Modal>

      {/* Add Applicant Modal */}
      <Modal
        isOpen={addApplicantModal}
        onClose={() => setAddApplicantModal(false)}
        title="Tambah Pelamar Manual"
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Lengkap"
            value={applicantForm.applicantName}
            onChange={e => setApplicantForm(f => ({ ...f, applicantName: e.target.value }))}
            required
          />
          <FormField.Input
            label="Email"
            type="email"
            value={applicantForm.email}
            onChange={e => setApplicantForm(f => ({ ...f, email: e.target.value }))}
            required
          />
          <FormField.Input
            label="Telepon"
            value={applicantForm.phone}
            onChange={e => setApplicantForm(f => ({ ...f, phone: e.target.value }))}
          />
          <FormField.Select
            label="Sumber"
            value={applicantForm.source}
            onChange={e => setApplicantForm(f => ({ ...f, source: e.target.value }))}
            options={SOURCE_OPTIONS}
          />
          <FormField.Input
            label="URL Resume"
            value={applicantForm.resumeUrl}
            onChange={e => setApplicantForm(f => ({ ...f, resumeUrl: e.target.value }))}
          />
          <FormField.Textarea
            label="Cover Letter"
            value={applicantForm.coverLetter}
            onChange={e => setApplicantForm(f => ({ ...f, coverLetter: e.target.value }))}
            rows={3}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAddApplicantModal(false)} className="px-4 py-2 text-xs font-bold text-slate-500">
              {t('cancel')}
            </button>
            <button type="button" onClick={handleAddApplicant} className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold">
              {t('save')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!hireTarget}
        onClose={() => setHireTarget(null)}
        onConfirm={handleHire}
        title="Konfirmasi Hire"
        message={`Yakin ingin merekrut ${hireTarget?.applicantName}?`}
        confirmText="Hire"
        type="success"
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectReason(''); }}
        title="Tolak Kandidat"
        size="md"
      >
        {rejectTarget && (
          <div className="space-y-4">
            <p className="text-xs text-slate-600">
              Yakin ingin menolak <strong>{rejectTarget.applicantName}</strong>?
            </p>
            <FormField.Textarea
              label="Alasan Penolakan"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              rows={2}
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                className="px-4 py-2 text-xs font-bold text-slate-500"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold"
              >
                {t('reject')}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
