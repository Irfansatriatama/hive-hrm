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

interface TaskProgress {
  id: string;
  taskId: string;
  status: string;
  task: {
    id: string;
    title: string;
    description?: string | null;
    category: string;
    assignedTo: string;
    dueAfterDays: number;
    sortOrder: number;
  };
}

interface Assignment {
  id: string;
  status: string;
  startDate: string;
  employee: { id: string; fullName: string; employeeNumber: string };
  template: { id: string; name: string };
  taskProgress: TaskProgress[];
}

interface TemplateTask {
  id: string;
  title: string;
  description?: string | null;
  category: string;
  dueAfterDays: number;
  assignedTo: string;
  sortOrder: number;
}

interface Template {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  _count?: { tasks: number };
  tasks?: TemplateTask[];
}

interface EmployeeOption {
  id: string;
  full_name: string;
  employee_number: string;
}

const CATEGORY_OPTIONS = [
  { value: 'document', label: 'Dokumen' },
  { value: 'equipment', label: 'Peralatan' },
  { value: 'training', label: 'Pelatihan' },
  { value: 'access', label: 'Akses Sistem' },
  { value: 'other', label: 'Lainnya' },
];

const ASSIGNED_TO_OPTIONS = [
  { value: 'employee', label: 'Karyawan' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr', label: 'HR' },
];

function getProgressText(taskProgress: TaskProgress[]) {
  const total = taskProgress.length;
  const done = taskProgress.filter(p => p.status === 'done' || p.status === 'skipped').length;
  return `${done}/${total} task selesai`;
}

const emptyTemplateForm = () => ({ name: '', description: '', isActive: true });
const emptyTaskForm = () => ({
  title: '',
  description: '',
  category: 'other',
  dueAfterDays: '7',
  assignedTo: 'employee',
  sortOrder: '0',
});
const emptyAssignForm = () => ({
  employeeId: '',
  templateId: '',
  startDate: new Date().toISOString().split('T')[0],
  notes: '',
});

export default function OnboardingPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const [tab, setTab] = useState<'assignments' | 'templates'>('assignments');
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignForm, setAssignForm] = useState(emptyAssignForm());
  const [assignSaving, setAssignSaving] = useState(false);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateForm, setTemplateForm] = useState(emptyTemplateForm());
  const [templateSaving, setTemplateSaving] = useState(false);

  const [tasksModalOpen, setTasksModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TemplateTask | null>(null);
  const [taskForm, setTaskForm] = useState(emptyTaskForm());
  const [taskSaving, setTaskSaving] = useState(false);

  const loadAssignments = useCallback(async () => {
    try {
      const data = await fetchAPI<Assignment[]>('/onboarding/assignments');
      setAssignments(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat daftar onboarding');
    }
  }, []);

  const loadTemplates = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await fetchAPI<Template[]>('/onboarding/templates');
      setTemplates(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat template');
    }
  }, [isAdmin]);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await fetchAPI<{ employees: EmployeeOption[] }>('/employees?limit=200');
      setEmployees(data.employees || []);
    } catch {
      setEmployees([]);
    }
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadAssignments(), loadTemplates(), loadEmployees()]);
    setLoading(false);
  }, [loadAssignments, loadTemplates, loadEmployees]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openAssignmentDetail = async (assignment: Assignment) => {
    setDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const detail = await fetchAPI<Assignment>(`/onboarding/assignments/${assignment.id}`);
      setSelectedAssignment(detail);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat detail');
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!assignForm.employeeId || !assignForm.templateId) {
      alert('Pilih karyawan dan template');
      return;
    }
    setAssignSaving(true);
    try {
      await fetchAPI('/onboarding/assignments', {
        method: 'POST',
        body: JSON.stringify(assignForm),
      });
      alert('Onboarding berhasil di-assign');
      setAssignModalOpen(false);
      setAssignForm(emptyAssignForm());
      loadAssignments();
    } catch (err: any) {
      alert(err.message || 'Gagal assign onboarding');
    } finally {
      setAssignSaving(false);
    }
  };

  const handleTaskStatus = async (assignmentId: string, taskId: string, status: string) => {
    try {
      const updated = await fetchAPI<Assignment>(`/onboarding/assignments/${assignmentId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      setSelectedAssignment(updated);
      loadAssignments();
      alert(status === 'done' ? 'Task ditandai selesai' : 'Task dilewati');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui task');
    }
  };

  const openCreateTemplate = () => {
    setEditingTemplate(null);
    setTemplateForm(emptyTemplateForm());
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (template: Template, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || '',
      isActive: template.isActive,
    });
    setTemplateModalOpen(true);
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name) {
      alert('Nama template wajib diisi');
      return;
    }
    setTemplateSaving(true);
    try {
      if (editingTemplate) {
        await fetchAPI(`/onboarding/templates/${editingTemplate.id}`, {
          method: 'PUT',
          body: JSON.stringify(templateForm),
        });
        alert('Template berhasil diperbarui');
      } else {
        await fetchAPI('/onboarding/templates', {
          method: 'POST',
          body: JSON.stringify(templateForm),
        });
        alert('Template berhasil dibuat');
      }
      setTemplateModalOpen(false);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan template');
    } finally {
      setTemplateSaving(false);
    }
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Hapus template ini?')) return;
    try {
      await fetchAPI(`/onboarding/templates/${id}`, { method: 'DELETE' });
      alert('Template berhasil dihapus');
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus template');
    }
  };

  const openTemplateTasks = async (template: Template) => {
    try {
      const data = await fetchAPI<Template[]>('/onboarding/templates');
      const full = data.find(t => t.id === template.id);
      setSelectedTemplate(full || template);
      setTasksModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat tasks');
    }
  };

  const openAddTask = () => {
    setEditingTask(null);
    setTaskForm(emptyTaskForm());
    setTaskModalOpen(true);
  };

  const openEditTask = (task: TemplateTask) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description || '',
      category: task.category,
      dueAfterDays: String(task.dueAfterDays),
      assignedTo: task.assignedTo,
      sortOrder: String(task.sortOrder),
    });
    setTaskModalOpen(true);
  };

  const handleSaveTask = async () => {
    if (!taskForm.title || !selectedTemplate) {
      alert('Judul task wajib diisi');
      return;
    }
    setTaskSaving(true);
    try {
      if (editingTask) {
        await fetchAPI(`/onboarding/templates/${selectedTemplate.id}/tasks/${editingTask.id}`, {
          method: 'PUT',
          body: JSON.stringify(taskForm),
        });
        alert('Task berhasil diperbarui');
      } else {
        await fetchAPI(`/onboarding/templates/${selectedTemplate.id}/tasks`, {
          method: 'POST',
          body: JSON.stringify(taskForm),
        });
        alert('Task berhasil ditambahkan');
      }
      setTaskModalOpen(false);
      const data = await fetchAPI<Template[]>('/onboarding/templates');
      const full = data.find(t => t.id === selectedTemplate.id);
      if (full) setSelectedTemplate(full);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan task');
    } finally {
      setTaskSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!selectedTemplate || !confirm('Hapus task ini?')) return;
    try {
      await fetchAPI(`/onboarding/templates/${selectedTemplate.id}/tasks/${taskId}`, {
        method: 'DELETE',
      });
      alert('Task berhasil dihapus');
      const data = await fetchAPI<Template[]>('/onboarding/templates');
      const full = data.find(t => t.id === selectedTemplate.id);
      if (full) setSelectedTemplate(full);
      loadTemplates();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('onboarding')}</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola proses onboarding karyawan baru</p>
        </div>
        {isAdmin && tab === 'assignments' && (
          <button
            onClick={() => { setAssignForm(emptyAssignForm()); setAssignModalOpen(true); }}
            className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            <span>+ Assign Onboarding</span>
          </button>
        )}
        {isAdmin && tab === 'templates' && (
          <button
            onClick={openCreateTemplate}
            className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            <span>+ Template Baru</span>
          </button>
        )}
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex gap-2 mb-5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setTab('assignments')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              tab === 'assignments' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Karyawan Onboarding
          </button>
          {isAdmin && (
            <button
              onClick={() => setTab('templates')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                tab === 'templates' ? 'bg-primary text-white' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              {t('onboarding_templates')}
            </button>
          )}
        </div>

        {tab === 'assignments' && (
          <DataTable
            headers={['Nama Karyawan', 'Template', 'Tanggal Mulai', 'Progress', 'Status']}
            rows={assignments}
            loading={loading}
            onRowClick={row => openAssignmentDetail(row)}
            columns={[
              row => row.employee.fullName,
              row => row.template.name,
              row => formatDate(row.startDate),
              row => getProgressText(row.taskProgress),
              row => (
                <Badge
                  status={row.status === 'completed' ? 'approved' : 'pending'}
                  className={row.status === 'completed' ? '' : ''}
                />
              ),
            ]}
          />
        )}

        {tab === 'templates' && isAdmin && (
          <DataTable
            headers={['Nama Template', 'Deskripsi', 'Jumlah Task', 'Status', 'Aksi']}
            rows={templates}
            loading={loading}
            onRowClick={row => openTemplateTasks(row)}
            columns={[
              row => row.name,
              row => row.description || '-',
              row => String(row._count?.tasks ?? row.tasks?.length ?? 0),
              row => (
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  row.isActive ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'
                }`}>
                  {row.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              ),
              row => (
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={e => openEditTemplate(row, e)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {t('edit')}
                  </button>
                  {user?.role === 'SUPER_ADMIN' && (
                    <button
                      onClick={e => handleDeleteTemplate(row.id, e)}
                      className="text-xs font-bold text-red-500 hover:underline"
                    >
                      {t('delete')}
                    </button>
                  )}
                </div>
              ),
            ]}
          />
        )}
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Onboarding"
        size="md"
      >
        <div className="space-y-4">
          <FormField.Select
            label="Karyawan"
            value={assignForm.employeeId}
            onChange={e => setAssignForm({ ...assignForm, employeeId: e.target.value })}
            options={[
              { value: '', label: '-- Pilih Karyawan --' },
              ...employees.map(e => ({
                value: e.id,
                label: `${e.full_name} (${e.employee_number})`,
              })),
            ]}
          />
          <FormField.Select
            label="Template"
            value={assignForm.templateId}
            onChange={e => setAssignForm({ ...assignForm, templateId: e.target.value })}
            options={[
              { value: '', label: '-- Pilih Template --' },
              ...templates.filter(t => t.isActive).map(t => ({
                value: t.id,
                label: t.name,
              })),
            ]}
          />
          <FormField.Input
            label="Tanggal Mulai"
            type="date"
            value={assignForm.startDate}
            onChange={e => setAssignForm({ ...assignForm, startDate: e.target.value })}
          />
          <FormField.Textarea
            label="Catatan"
            value={assignForm.notes}
            onChange={e => setAssignForm({ ...assignForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setAssignModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleAssign}
              disabled={assignSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {assignSaving ? 'Menyimpan...' : 'Assign'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Assignment Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => { setDetailModalOpen(false); setSelectedAssignment(null); }}
        title={selectedAssignment ? `Onboarding — ${selectedAssignment.employee.fullName}` : 'Detail Onboarding'}
        size="lg"
      >
        {detailLoading ? (
          <div className="py-8 text-center text-xs text-slate-400">Memuat...</div>
        ) : selectedAssignment ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Template: <strong className="text-slate-700">{selectedAssignment.template.name}</strong></span>
              <Badge status={selectedAssignment.status === 'completed' ? 'approved' : 'pending'} />
            </div>
            <p className="text-xs text-slate-400">
              Progress: {getProgressText(selectedAssignment.taskProgress)}
            </p>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {selectedAssignment.taskProgress.map(progress => (
                <div
                  key={progress.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    progress.status === 'done'
                      ? 'bg-green-50 border-green-100'
                      : progress.status === 'skipped'
                        ? 'bg-slate-50 border-slate-100'
                        : 'bg-white border-slate-100'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold ${
                      progress.status === 'done' ? 'text-green-800 line-through' : 'text-slate-800'
                    }`}>
                      {progress.task.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {progress.task.category} · {progress.task.assignedTo} · H+{progress.task.dueAfterDays}
                    </p>
                  </div>
                  {selectedAssignment.status !== 'completed' && progress.status === 'pending' && (
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleTaskStatus(selectedAssignment.id, progress.taskId, 'done')}
                        className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition cursor-pointer"
                        title="Tandai selesai"
                      >
                        <Lucide.Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleTaskStatus(selectedAssignment.id, progress.taskId, 'skipped')}
                        className="p-1.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-slate-200 transition cursor-pointer"
                        title="Lewati"
                      >
                        <Lucide.SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                  {progress.status === 'done' && (
                    <Lucide.CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  )}
                  {progress.status === 'skipped' && (
                    <Lucide.MinusCircle className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Template CRUD Modal */}
      <Modal
        isOpen={templateModalOpen}
        onClose={() => setTemplateModalOpen(false)}
        title={editingTemplate ? 'Edit Template' : 'Buat Template Baru'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Template"
            value={templateForm.name}
            onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })}
          />
          <FormField.Textarea
            label="Deskripsi"
            value={templateForm.description}
            onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })}
          />
          <FormField.Toggle
            label="Aktif"
            checked={templateForm.isActive}
            onChange={e => setTemplateForm({ ...templateForm, isActive: e.target.checked })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setTemplateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveTemplate}
              disabled={templateSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {templateSaving ? 'Menyimpan...' : t('save')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Template Tasks Modal */}
      <Modal
        isOpen={tasksModalOpen}
        onClose={() => { setTasksModalOpen(false); setSelectedTemplate(null); }}
        title={selectedTemplate ? `${t('onboarding_tasks')} — ${selectedTemplate.name}` : t('onboarding_tasks')}
        size="lg"
      >
        {selectedTemplate && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                onClick={openAddTask}
                className="px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
              >
                <Lucide.Plus className="w-3 h-3" /> Tambah Task
              </button>
            </div>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {(selectedTemplate.tasks || []).map(task => (
                <div key={task.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-slate-800">{task.title}</p>
                    <p className="text-[10px] text-slate-400">
                      {task.category} · {task.assignedTo} · H+{task.dueAfterDays}
                    </p>
                  </div>
                  <button
                    onClick={() => openEditTask(task)}
                    className="text-xs font-bold text-primary hover:underline"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => handleDeleteTask(task.id)}
                    className="text-xs font-bold text-red-500 hover:underline"
                  >
                    {t('delete')}
                  </button>
                </div>
              ))}
              {(selectedTemplate.tasks || []).length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Belum ada task</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Task CRUD Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Tambah Task'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Judul Task"
            value={taskForm.title}
            onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
          />
          <FormField.Textarea
            label="Deskripsi"
            value={taskForm.description}
            onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
          />
          <FormField.Select
            label="Kategori"
            value={taskForm.category}
            onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}
            options={CATEGORY_OPTIONS}
          />
          <FormField.Select
            label="Ditugaskan Ke"
            value={taskForm.assignedTo}
            onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
            options={ASSIGNED_TO_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input
              label="Due (hari setelah mulai)"
              type="number"
              value={taskForm.dueAfterDays}
              onChange={e => setTaskForm({ ...taskForm, dueAfterDays: e.target.value })}
            />
            <FormField.Input
              label="Urutan"
              type="number"
              value={taskForm.sortOrder}
              onChange={e => setTaskForm({ ...taskForm, sortOrder: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setTaskModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveTask}
              disabled={taskSaving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold disabled:opacity-50"
            >
              {taskSaving ? 'Menyimpan...' : t('save')}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
