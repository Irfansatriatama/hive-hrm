'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import TableActionMenu from '@/components/shared/TableActionMenu';

type TabId = 'schedule' | 'manage' | 'swaps';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'schedule', label: 'Jadwal Mingguan', icon: Lucide.Calendar },
  { id: 'manage', label: 'Kelola Tipe Shift', icon: Lucide.Settings },
  { id: 'swaps', label: 'Permintaan Tukar', icon: Lucide.ArrowLeftRight },
];

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getWeekDates(weekStart: Date) {
  const mon = getMonday(weekStart);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return {
      label: WEEKDAYS[i],
      dateStr: formatDateStr(d),
      dateLabel: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    };
  });
}

const EMPTY_SHIFT_FORM = {
  name: '',
  startTime: '08:00',
  endTime: '17:00',
  color: '#3B82F6',
  split: false,
};

export default function ShiftPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('schedule');
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));
  const [filterDept, setFilterDept] = useState('');

  const [shifts, setShifts] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [swaps, setSwaps] = useState<any[]>([]);
  const [allEmployees, setAllEmployees] = useState<any[]>([]);

  const [assignModal, setAssignModal] = useState<{
    open: boolean;
    employeeId: string;
    dateStr: string;
    employeeName: string;
    shiftId: string;
  }>({ open: false, employeeId: '', dateStr: '', employeeName: '', shiftId: '' });

  const [shiftModal, setShiftModal] = useState<{ open: boolean; item: any | null }>({
    open: false,
    item: null,
  });
  const [shiftForm, setShiftForm] = useState(EMPTY_SHIFT_FORM);

  const [swapModal, setSwapModal] = useState(false);
  const [swapForm, setSwapForm] = useState({ date: '', partnerId: '', shiftDetails: '' });
  const [saving, setSaving] = useState(false);

  const role = user?.role || '';
  const isAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  const canManageSchedule = isAdmin || role === 'MANAGER';
  const canApproveSwap = canManageSchedule;

  const weekDates = getWeekDates(currentWeekStart);
  const weekStartLabel = formatDate(weekDates[0].dateStr, { day: 'numeric', month: 'short', year: 'numeric' });
  const weekEndLabel = formatDate(weekDates[6].dateStr, { day: 'numeric', month: 'short', year: 'numeric' });

  const loadShifts = useCallback(async () => {
    const data = await fetchAPI<any[]>('/shift/types');
    setShifts(data);
  }, []);

  const loadSchedule = useCallback(async () => {
    const weekStart = formatDateStr(getMonday(currentWeekStart));
    const params = new URLSearchParams({ weekStart });
    if (filterDept) params.set('departmentId', filterDept);

    const [scheduleData, depts, shiftTypes] = await Promise.all([
      fetchAPI<{ employees: any[]; schedules: any[] }>(`/shift/schedules?${params}`),
      fetchAPI<any[]>('/employees/departments'),
      fetchAPI<any[]>('/shift/types'),
    ]);
    setEmployees(scheduleData.employees || []);
    setSchedules(scheduleData.schedules || []);
    setDepartments(depts);
    setShifts(shiftTypes);
  }, [currentWeekStart, filterDept]);

  const loadSwaps = useCallback(async () => {
    const [swapData, empsRes] = await Promise.all([
      fetchAPI<any[]>('/shift/swaps'),
      fetchAPI<{ employees: any[] }>('/employees?limit=1000'),
    ]);
    setSwaps(swapData);
    setAllEmployees(empsRes.employees || []);
  }, []);

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'schedule') {
        await loadSchedule();
      } else if (activeTab === 'manage') {
        await loadShifts();
      } else {
        await loadSwaps();
      }
    } catch (err) {
      console.error('Failed to load shift data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadSchedule, loadShifts, loadSwaps]);

  useEffect(() => {
    loadTabData();
  }, [loadTabData]);

  const navigateWeek = (direction: number) => {
    setCurrentWeekStart((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + direction * 7);
      return d;
    });
  };

  const getScheduleForCell = (employeeId: string, dateStr: string) => {
    const sch = schedules.find((s) => s.employeeId === employeeId && s.date === dateStr);
    if (!sch?.shiftId) return null;
    return sch.shift || shifts.find((s) => s.id === sch.shiftId) || null;
  };

  const openAssignModal = (employeeId: string, dateStr: string, employeeName: string) => {
    if (!canManageSchedule) return;
    const sch = schedules.find((s) => s.employeeId === employeeId && s.date === dateStr);
    setAssignModal({
      open: true,
      employeeId,
      dateStr,
      employeeName,
      shiftId: sch?.shiftId || '',
    });
  };

  const handleSaveAssign = async () => {
    setSaving(true);
    try {
      const saved = await fetchAPI<{
        id?: string;
        employeeId: string;
        date: string;
        shiftId: string | null;
        shift?: any;
      }>('/shift/schedules', {
        method: 'PUT',
        body: JSON.stringify({
          employeeId: assignModal.employeeId,
          date: assignModal.dateStr,
          shiftId: assignModal.shiftId || null,
        }),
      });

      const { employeeId, dateStr } = assignModal;
      setSchedules((prev) => {
        const rest = prev.filter((s) => !(s.employeeId === employeeId && s.date === dateStr));
        if (!saved.shiftId) return rest;
        const shift =
          saved.shift || shifts.find((s) => s.id === saved.shiftId) || null;
        return [...rest, { ...saved, employeeId, date: dateStr, shift }];
      });

      alert('Jadwal shift karyawan berhasil disimpan');
      setAssignModal({ open: false, employeeId: '', dateStr: '', employeeName: '', shiftId: '' });
      await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWeek = async () => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menyalin jadwal shift minggu lalu ke minggu berjalan ini secara bulk?',
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      const result = await fetchAPI<{ count: number }>('/shift/schedules/copy-week', {
        method: 'POST',
        body: JSON.stringify({ weekStart: formatDateStr(getMonday(currentWeekStart)) }),
      });
      alert(`Tersalin massal ${result.count} jadwal shift.`);
      await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Gagal menyalin jadwal');
    } finally {
      setSaving(false);
    }
  };

  const openShiftModal = (item?: any) => {
    setShiftModal({ open: true, item: item || null });
    setShiftForm(
      item
        ? {
            name: item.name,
            startTime: item.startTime,
            endTime: item.endTime,
            color: item.color || '#3B82F6',
            split: item.split || false,
          }
        : EMPTY_SHIFT_FORM,
    );
  };

  const handleSaveShift = async () => {
    if (!shiftForm.name || !shiftForm.startTime || !shiftForm.endTime) {
      alert('Nama shift dan jam kerja wajib diisi');
      return;
    }
    setSaving(true);
    try {
      if (shiftModal.item) {
        await fetchAPI(`/shift/types/${shiftModal.item.id}`, {
          method: 'PUT',
          body: JSON.stringify(shiftForm),
        });
        alert('Tipe shift berhasil diperbarui');
      } else {
        await fetchAPI('/shift/types', { method: 'POST', body: JSON.stringify(shiftForm) });
        alert('Tipe shift baru berhasil ditambahkan');
      }
      setShiftModal({ open: false, item: null });
      await loadShifts();
      if (activeTab === 'schedule') await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan shift');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteShift = async (id: string, name: string) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus tipe shift "${name}"? Jadwal aktif menggunakan shift ini akan direset.`,
      )
    ) {
      return;
    }
    try {
      await fetchAPI(`/shift/types/${id}`, { method: 'DELETE' });
      alert('Tipe shift berhasil dihapus');
      await loadShifts();
      if (activeTab === 'schedule') await loadSchedule();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus shift');
    }
  };

  const handleSaveSwap = async () => {
    if (!swapForm.date || !swapForm.partnerId || !swapForm.shiftDetails.trim()) {
      alert('Mohon lengkapi seluruh field pengajuan tukar shift');
      return;
    }
    setSaving(true);
    try {
      await fetchAPI('/shift/swaps', { method: 'POST', body: JSON.stringify(swapForm) });
      alert('Pengajuan tukar shift berhasil diajukan ke manager');
      setSwapModal(false);
      setSwapForm({ date: '', partnerId: '', shiftDetails: '' });
      await loadSwaps();
    } catch (err: any) {
      alert(err.message || 'Gagal mengajukan tukar shift');
    } finally {
      setSaving(false);
    }
  };

  const handleSwapAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await fetchAPI(`/shift/swaps/${id}/${action}`, { method: 'PUT' });
      alert(action === 'approve' ? 'Tukar shift disetujui!' : 'Tukar shift ditolak');
      await loadSwaps();
    } catch (err: any) {
      alert(err.message || 'Gagal memproses permintaan');
    }
  };

  useEffect(() => {
    if (activeTab === 'schedule' || activeTab === 'manage') {
      loadShifts().catch(console.error);
    }
  }, [activeTab, loadShifts]);

  const renderScheduleTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 select-none">
        <span className="text-xs font-bold text-slate-700 font-mono">
          {weekStartLabel} &rarr; {weekEndLabel}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigateWeek(-1)}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <Lucide.ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigateWeek(1)}
            className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition cursor-pointer"
          >
            <Lucide.ChevronRight className="w-4 h-4" />
          </button>
          {canManageSchedule && (
            <button
              onClick={handleCopyWeek}
              disabled={saving}
              className="ml-3 px-3 py-1.5 bg-blue-50 text-primary hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Lucide.Copy className="w-3.5 h-3.5" />
              <span>Salin dari Minggu Lalu</span>
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 select-none">
              <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider w-44">
                Karyawan
              </th>
              {weekDates.map((d) => (
                <th
                  key={d.dateStr}
                  className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center"
                >
                  {d.label}
                  <br />
                  <span className="text-[10px] font-normal text-slate-400 font-mono">
                    {d.dateLabel}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-slate-700">
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td className="px-4 py-3 font-bold text-slate-800 border-r border-slate-100">
                  <div className="flex items-center gap-2">
                    <Avatar name={emp.fullName} size="xs" />
                    <span className="truncate leading-none">{emp.fullName}</span>
                  </div>
                </td>
                {weekDates.map((d) => {
                  const shItem = getScheduleForCell(emp.id, d.dateStr);
                  return (
                    <td
                      key={d.dateStr}
                      onClick={() => openAssignModal(emp.id, d.dateStr, emp.fullName)}
                      className={`px-2 py-3 text-center border-r border-slate-100 transition ${
                        canManageSchedule ? 'hover:bg-blue-50/20 cursor-pointer' : ''
                      }`}
                    >
                      {shItem ? (
                        <div
                          className="px-2 py-1 rounded text-[10px] font-bold text-white border text-center shadow-sm select-none truncate"
                          style={{
                            backgroundColor: shItem.color || '#3B82F6',
                            borderColor: shItem.color || '#3B82F6',
                          }}
                          title={`${shItem.name} (${shItem.startTime} - ${shItem.endTime})`}
                        >
                          {(shItem.name || 'Shift').split(' ')[0]}
                          <br />
                          <span className="text-[9px] font-normal opacity-90 font-mono">
                            {shItem.startTime}-{shItem.endTime}
                          </span>
                        </div>
                      ) : (
                        <div className="py-2.5 text-center text-slate-400 font-medium select-none">
                          OFF
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {employees.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-slate-400">
                  Tidak ada karyawan aktif pada filter ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderManageTab = () => (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end select-none">
          <button
            onClick={() => openShiftModal()}
            className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            <span>Tambah Shift Baru</span>
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 select-none">
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Nama Shift
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Waktu Jam Kerja
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Split Mode
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Warna Label
              </th>
              {isAdmin && (
                <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">
                  Aksi
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {shifts.map((s) => (
              <tr key={s.id} className="table-row-hover border-b border-slate-100 transition">
                <td className="px-6 py-4 font-bold text-slate-800">{s.name}</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-600">
                  {s.startTime} - {s.endTime}
                </td>
                <td className="px-6 py-4">{s.split ? 'Ya (Split)' : 'Tidak (Normal)'}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 select-none">
                    <span
                      className="w-3.5 h-3.5 rounded-full inline-block"
                      style={{ backgroundColor: s.color || '#3B82F6' }}
                    />
                    <span className="font-mono font-semibold text-[10px] text-slate-500">
                      {s.color}
                    </span>
                  </div>
                </td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right font-medium">
                    <TableActionMenu
                      items={[
                        { label: 'Edit', onClick: () => openShiftModal(s), variant: 'primary' },
                        {
                          label: 'Hapus',
                          onClick: () => handleDeleteShift(s.id, s.name),
                          variant: 'danger',
                        },
                      ]}
                    />
                  </td>
                )}
              </tr>
            ))}
            {shifts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                  Belum ada tipe shift terdaftar.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSwapsTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end select-none">
        <button
          onClick={() => setSwapModal(true)}
          className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
        >
          <Lucide.ArrowLeftRight className="w-3.5 h-3.5" />
          <span>Ajukan Tukar Shift</span>
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 select-none">
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Pemohon
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Rekan Tukar
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Tanggal Kerja
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Rencana Tukar
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {swaps.map((sw) => (
              <tr key={sw.id} className="table-row-hover border-b border-slate-100 transition">
                <td className="px-6 py-4 font-bold text-slate-800">
                  {sw.requester?.fullName || '-'}
                </td>
                <td className="px-6 py-4 font-bold text-slate-800">
                  {sw.partner?.fullName || '-'}
                </td>
                <td className="px-6 py-4 font-mono text-slate-500">
                  {formatDate(sw.date, { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-4 font-semibold text-slate-600 font-mono">
                  {sw.shiftDetails}
                </td>
                <td className="px-6 py-4">
                  <Badge status={sw.status} />
                </td>
                <td className="px-6 py-4 text-right font-medium">
                  <TableActionMenu
                    items={
                      sw.status === 'pending' && canApproveSwap
                        ? [
                            {
                              label: 'Setujui',
                              onClick: () => handleSwapAction(sw.id, 'approve'),
                              variant: 'primary',
                            },
                            {
                              label: 'Tolak',
                              onClick: () => handleSwapAction(sw.id, 'reject'),
                              variant: 'danger',
                            },
                          ]
                        : []
                    }
                  />
                </td>
              </tr>
            ))}
            {swaps.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  Belum ada permintaan tukar shift.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
            Perencanaan & Jadwal Shift Kerja
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Buat jadwal shift mingguan karyawan, tukar tugas jaga, dan kelola jam kerja operasional.
          </p>
        </div>
        {activeTab === 'schedule' && (
          <div>
            <select
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
            >
              <option value="">Semua Departemen</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        )}
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
                isActive
                  ? 'border-primary text-primary font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <TabIcon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-b-2xl border-x border-b border-slate-100 shadow-sm p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'schedule' ? (
          renderScheduleTab()
        ) : activeTab === 'manage' ? (
          renderManageTab()
        ) : (
          renderSwapsTab()
        )}
      </div>

      <Modal
        isOpen={assignModal.open}
        onClose={() =>
          setAssignModal({ open: false, employeeId: '', dateStr: '', employeeName: '', shiftId: '' })
        }
        title={`Tugaskan Shift: ${assignModal.employeeName}`}
        size="sm"
        footer={
          <>
            <button
              onClick={() =>
                setAssignModal({
                  open: false,
                  employeeId: '',
                  dateStr: '',
                  employeeName: '',
                  shiftId: '',
                })
              }
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveAssign}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50"
            >
              Simpan Jadwal
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500 font-mono select-none">
            Hari & Tanggal:{' '}
            {formatDate(assignModal.dateStr, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <FormField.Select
            label="Pilih Jadwal Shift Kerja"
            id="assign-shift-id"
            value={assignModal.shiftId}
            onChange={(e) => setAssignModal({ ...assignModal, shiftId: e.target.value })}
            options={[
              { value: '', label: 'Libur / OFF' },
              ...shifts.map((s) => ({
                value: s.id,
                label: `${s.name} (${s.startTime} - ${s.endTime})`,
              })),
            ]}
          />
        </div>
      </Modal>

      <Modal
        isOpen={shiftModal.open}
        onClose={() => setShiftModal({ open: false, item: null })}
        title={
          shiftModal.item
            ? `Edit Tipe Shift: ${shiftModal.item.name}`
            : 'Tambah Tipe Shift Baru'
        }
        size="md"
        footer={
          <>
            <button
              onClick={() => setShiftModal({ open: false, item: null })}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveShift}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50"
            >
              Simpan Shift
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Shift"
            id="sh-name"
            required
            value={shiftForm.name}
            onChange={(e) => setShiftForm({ ...shiftForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input
              label="Jam Mulai"
              id="sh-start"
              type="time"
              required
              value={shiftForm.startTime}
              onChange={(e) => setShiftForm({ ...shiftForm, startTime: e.target.value })}
            />
            <FormField.Input
              label="Jam Selesai"
              id="sh-end"
              type="time"
              required
              value={shiftForm.endTime}
              onChange={(e) => setShiftForm({ ...shiftForm, endTime: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input
              label="Warna Label (Hex)"
              id="sh-color"
              type="color"
              value={shiftForm.color}
              onChange={(e) => setShiftForm({ ...shiftForm, color: e.target.value })}
            />
            <div className="flex items-center pt-5 select-none">
              <FormField.Toggle
                id="sh-split"
                label="Split Shift Mode"
                checked={shiftForm.split}
                onChange={(e) => setShiftForm({ ...shiftForm, split: e.target.checked })}
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={swapModal}
        onClose={() => setSwapModal(false)}
        title="Ajukan Tukar Shift Kerja"
        size="md"
        footer={
          <>
            <button
              onClick={() => setSwapModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              onClick={handleSaveSwap}
              disabled={saving}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50"
            >
              Kirim Pengajuan
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input
            label="Tanggal Penukaran"
            id="sw-date"
            type="date"
            required
            value={swapForm.date}
            onChange={(e) => setSwapForm({ ...swapForm, date: e.target.value })}
          />
          <FormField.Select
            label="Rekan Kerja Partner Tukar"
            id="sw-partner"
            required
            value={swapForm.partnerId}
            onChange={(e) => setSwapForm({ ...swapForm, partnerId: e.target.value })}
            options={[
              { value: '', label: 'Pilih Rekan Kerja' },
              ...allEmployees
                .filter(
                  (emp) =>
                    emp.id !== user?.employee_id && emp.userId !== user?.id,
                )
                .map((emp) => ({
                  value: emp.id,
                  label: `${emp.full_name || emp.fullName} (${emp.employee_number || emp.employeeNumber || emp.id})`,
                })),
            ]}
          />
          <FormField.Input
            label="Detail Penukaran Shift (Keterangan)"
            id="sw-detail"
            placeholder="Morning Shift tukar dengan Day Shift..."
            required
            value={swapForm.shiftDetails}
            onChange={(e) => setSwapForm({ ...swapForm, shiftDetails: e.target.value })}
          />
        </div>
      </Modal>
    </div>
  );
}
