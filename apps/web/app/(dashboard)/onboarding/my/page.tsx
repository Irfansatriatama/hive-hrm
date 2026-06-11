'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
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
  };
}

interface MyAssignment {
  id: string;
  status: string;
  startDate: string;
  completedAt?: string | null;
  template: { id: string; name: string; description?: string | null };
  taskProgress: TaskProgress[];
}

function getProgressPercent(taskProgress: TaskProgress[]) {
  if (taskProgress.length === 0) return 0;
  const done = taskProgress.filter(p => p.status === 'done' || p.status === 'skipped').length;
  return Math.round((done / taskProgress.length) * 100);
}

export default function MyOnboardingPage() {
  const { t } = useI18n();
  const [assignment, setAssignment] = useState<MyAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const loadAssignment = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<MyAssignment | null>('/onboarding/my');
      setAssignment(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat onboarding');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignment();
  }, []);

  const handleMarkDone = async (taskId: string) => {
    if (!assignment) return;
    setUpdating(taskId);
    try {
      const updated = await fetchAPI<MyAssignment>(
        `/onboarding/assignments/${assignment.id}/tasks/${taskId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ status: 'done' }),
        },
      );
      setAssignment(updated);
      alert('Task ditandai selesai');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui task');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 h-32 animate-pulse" />
        <div className="bg-white rounded-2xl border border-slate-100 p-5 h-64 animate-pulse" />
      </div>
    );
  }

  const progressPercent = assignment ? getProgressPercent(assignment.taskProgress) : 0;
  const doneCount = assignment
    ? assignment.taskProgress.filter(p => p.status === 'done' || p.status === 'skipped').length
    : 0;
  const totalCount = assignment?.taskProgress.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-400 select-none">
        <Link href="/onboarding" className="hover:text-slate-600 font-medium">{t('onboarding')}</Link>
        <Lucide.ChevronRight className="w-3 h-3" />
        <span className="text-slate-500">{t('onboarding_my')}</span>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('onboarding_my')}</h1>
        <p className="text-xs text-slate-400 mt-1">Checklist onboarding Anda sebagai karyawan baru</p>
      </div>

      {!assignment ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-100 text-center">
          <Lucide.ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-xs text-slate-400">Anda tidak memiliki proses onboarding aktif</p>
        </div>
      ) : (
        <>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">{assignment.template.name}</h2>
                {assignment.template.description && (
                  <p className="text-xs text-slate-400 mt-1">{assignment.template.description}</p>
                )}
                <p className="text-[10px] text-slate-400 mt-2">
                  Mulai: {formatDate(assignment.startDate)}
                </p>
              </div>
              <Badge status={assignment.status === 'completed' ? 'approved' : 'pending'} />
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold text-slate-600">Progress</span>
                <span className="text-slate-500">{doneCount}/{totalCount} task · {progressPercent}%</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-4">
              {t('onboarding_tasks')}
            </h3>
            <div className="space-y-3">
              {assignment.taskProgress.map(progress => {
                const isEmployeeTask = progress.task.assignedTo === 'employee';
                const canMark = isEmployeeTask && progress.status === 'pending' && assignment.status !== 'completed';

                return (
                  <div
                    key={progress.id}
                    className={`flex items-start gap-3 p-4 rounded-xl border transition ${
                      progress.status === 'done'
                        ? 'bg-green-50 border-green-100'
                        : progress.status === 'skipped'
                          ? 'bg-slate-50 border-slate-100 opacity-60'
                          : 'bg-white border-slate-100'
                    }`}
                  >
                    <div className="mt-0.5">
                      {progress.status === 'done' ? (
                        <Lucide.CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : progress.status === 'skipped' ? (
                        <Lucide.MinusCircle className="w-5 h-5 text-slate-400" />
                      ) : (
                        <Lucide.Circle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${
                        progress.status === 'done' ? 'text-green-800 line-through' : 'text-slate-800'
                      }`}>
                        {progress.task.title}
                      </p>
                      {progress.task.description && (
                        <p className="text-[10px] text-slate-400 mt-0.5">{progress.task.description}</p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-1">
                        {progress.task.category} · Target H+{progress.task.dueAfterDays}
                        {!isEmployeeTask && ' · Ditangani oleh ' + progress.task.assignedTo}
                      </p>
                    </div>
                    {canMark && (
                      <button
                        onClick={() => handleMarkDone(progress.taskId)}
                        disabled={updating === progress.taskId}
                        className="px-3 py-1.5 bg-primary text-white rounded-lg text-[10px] font-bold shrink-0 disabled:opacity-50 cursor-pointer"
                      >
                        {updating === progress.taskId ? '...' : 'Tandai Selesai'}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
