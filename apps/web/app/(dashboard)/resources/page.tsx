'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

type TabId = 'calendar' | 'manage';

interface BookableResource {
  id: string;
  name: string;
  code: string;
  type: string;
  description?: string | null;
  location?: string | null;
  capacity?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
}

interface ResourceBooking {
  id: string;
  resourceId: string;
  title: string;
  purpose?: string | null;
  startTime: string;
  endTime: string;
  attendees?: number | null;
  status: string;
  approvedAt?: string | null;
  rejectedReason?: string | null;
  notes?: string | null;
  resource: BookableResource;
  employee: { id: string; fullName: string; department?: { name: string } | null };
}

const WEEKDAYS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

const RESOURCE_TYPES = [
  { value: 'room', label: 'Ruang Rapat' },
  { value: 'vehicle', label: 'Kendaraan' },
  { value: 'equipment', label: 'Peralatan' },
  { value: 'other', label: 'Lainnya' },
];

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
      date: d,
      dateLabel: d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    };
  });
}

function toDatetimeLocal(iso?: string, dateStr?: string, hour = 9): string {
  const d = iso ? new Date(iso) : dateStr ? new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00`) : new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${h}:${min}`;
}

function formatTimeRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${fmt(s)}–${fmt(e)}`;
}

function bookingChipColor(status: string) {
  if (status === 'approved') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  if (status === 'rejected') return 'bg-red-100 text-red-700 border-red-200';
  if (status === 'cancelled') return 'bg-slate-100 text-slate-500 border-slate-200';
  return 'bg-amber-100 text-amber-700 border-amber-200';
}

const EMPTY_RESOURCE_FORM = {
  name: '',
  code: '',
  type: 'room',
  description: '',
  location: '',
  capacity: '',
  imageUrl: '',
  isActive: true,
};

const EMPTY_BOOKING_FORM = {
  resourceId: '',
  title: '',
  purpose: '',
  startTime: '',
  endTime: '',
  attendees: '',
  notes: '',
};

export default function ResourcesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('calendar');
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getMonday(new Date()));

  const [resources, setResources] = useState<BookableResource[]>([]);
  const [allResources, setAllResources] = useState<BookableResource[]>([]);
  const [bookings, setBookings] = useState<ResourceBooking[]>([]);

  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingForm, setBookingForm] = useState(EMPTY_BOOKING_FORM);
  const [editingBooking, setEditingBooking] = useState<ResourceBooking | null>(null);
  const [saving, setSaving] = useState(false);

  const [detailBooking, setDetailBooking] = useState<ResourceBooking | null>(null);
  const [approveTarget, setApproveTarget] = useState<ResourceBooking | null>(null);
  const [rejectTarget, setRejectTarget] = useState<ResourceBooking | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [cancelTarget, setCancelTarget] = useState<ResourceBooking | null>(null);

  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState(EMPTY_RESOURCE_FORM);
  const [editingResource, setEditingResource] = useState<BookableResource | null>(null);
  const [deleteResourceTarget, setDeleteResourceTarget] = useState<BookableResource | null>(null);

  const weekDates = useMemo(() => getWeekDates(currentWeekStart), [currentWeekStart]);
  const weekStartLabel = formatDate(weekDates[0].dateStr, { day: 'numeric', month: 'short', year: 'numeric' });
  const weekEndLabel = formatDate(weekDates[6].dateStr, { day: 'numeric', month: 'short', year: 'numeric' });

  const loadActiveResources = useCallback(async () => {
    const data = await fetchAPI<BookableResource[]>('/resources');
    setResources(data.filter(r => r.isActive));
  }, []);

  const loadCalendarData = useCallback(async () => {
    const weekStart = weekDates[0].date;
    const weekEnd = new Date(weekDates[6].date);
    weekEnd.setHours(23, 59, 59, 999);

    const bookingData = await fetchAPI<ResourceBooking[]>(
      `/resources/bookings/calendar?start=${weekStart.toISOString()}&end=${weekEnd.toISOString()}`,
    );
    setBookings(bookingData);
  }, [weekDates]);

  const loadManageData = useCallback(async () => {
    const data = await fetchAPI<BookableResource[]>('/resources?all=1');
    setAllResources(data);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      await loadActiveResources();
      if (activeTab === 'calendar') {
        await loadCalendarData();
      } else {
        await loadManageData();
      }
    } catch (err: any) {
      alert(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, loadCalendarData, loadManageData, loadActiveResources]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const navigateWeek = (direction: number) => {
    setCurrentWeekStart(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + direction * 7);
      return d;
    });
  };

  const getBookingsForCell = (resourceId: string, dateStr: string) => {
    return bookings.filter(b => {
      if (b.resourceId !== resourceId) return false;
      const start = new Date(b.startTime);
      const cellDate = new Date(`${dateStr}T00:00:00`);
      const cellEnd = new Date(`${dateStr}T23:59:59`);
      return start <= cellEnd && new Date(b.endTime) >= cellDate;
    });
  };

  const openCreateBooking = (resourceId: string, dateStr: string) => {
    setEditingBooking(null);
    setBookingForm({
      ...EMPTY_BOOKING_FORM,
      resourceId,
      startTime: toDatetimeLocal(undefined, dateStr, 9),
      endTime: toDatetimeLocal(undefined, dateStr, 10),
    });
    setBookingModalOpen(true);
  };

  const openEditBooking = (booking: ResourceBooking) => {
    setEditingBooking(booking);
    setBookingForm({
      resourceId: booking.resourceId,
      title: booking.title,
      purpose: booking.purpose || '',
      startTime: toDatetimeLocal(booking.startTime),
      endTime: toDatetimeLocal(booking.endTime),
      attendees: booking.attendees != null ? String(booking.attendees) : '',
      notes: booking.notes || '',
    });
    setBookingModalOpen(true);
  };

  const handleSaveBooking = async () => {
    if (!bookingForm.resourceId || !bookingForm.title.trim()) {
      alert('Resource dan judul wajib diisi');
      return;
    }
    if (!bookingForm.startTime || !bookingForm.endTime) {
      alert('Waktu mulai dan selesai wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        resourceId: bookingForm.resourceId,
        title: bookingForm.title,
        purpose: bookingForm.purpose || null,
        startTime: new Date(bookingForm.startTime).toISOString(),
        endTime: new Date(bookingForm.endTime).toISOString(),
        attendees: bookingForm.attendees || null,
        notes: bookingForm.notes || null,
      };

      if (editingBooking) {
        await fetchAPI(`/resources/bookings/${editingBooking.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Booking berhasil diperbarui');
      } else {
        await fetchAPI('/resources/bookings', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Booking berhasil dibuat');
      }

      setBookingModalOpen(false);
      setEditingBooking(null);
      await loadCalendarData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan booking');
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!approveTarget) return;
    try {
      await fetchAPI(`/resources/bookings/${approveTarget.id}/approve`, { method: 'POST' });
      alert('Booking disetujui');
      setApproveTarget(null);
      setDetailBooking(null);
      await loadCalendarData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui booking');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await fetchAPI(`/resources/bookings/${rejectTarget.id}/reject`, {
        method: 'POST',
        body: JSON.stringify({ reason: rejectReason }),
      });
      alert('Booking ditolak');
      setRejectTarget(null);
      setRejectReason('');
      setDetailBooking(null);
      await loadCalendarData();
    } catch (err: any) {
      alert(err.message || 'Gagal menolak booking');
    }
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await fetchAPI(`/resources/bookings/${cancelTarget.id}/cancel`, { method: 'POST' });
      alert('Booking dibatalkan');
      setCancelTarget(null);
      setDetailBooking(null);
      await loadCalendarData();
    } catch (err: any) {
      alert(err.message || 'Gagal membatalkan booking');
    }
  };

  const openCreateResource = () => {
    setEditingResource(null);
    setResourceForm(EMPTY_RESOURCE_FORM);
    setResourceModalOpen(true);
  };

  const openEditResource = (resource: BookableResource) => {
    setEditingResource(resource);
    setResourceForm({
      name: resource.name,
      code: resource.code,
      type: resource.type,
      description: resource.description || '',
      location: resource.location || '',
      capacity: resource.capacity != null ? String(resource.capacity) : '',
      imageUrl: resource.imageUrl || '',
      isActive: resource.isActive,
    });
    setResourceModalOpen(true);
  };

  const handleSaveResource = async () => {
    if (!resourceForm.name.trim() || !resourceForm.code.trim()) {
      alert('Nama dan kode wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: resourceForm.name,
        code: resourceForm.code,
        type: resourceForm.type,
        description: resourceForm.description || null,
        location: resourceForm.location || null,
        capacity: resourceForm.capacity || null,
        imageUrl: resourceForm.imageUrl || null,
        isActive: resourceForm.isActive,
      };

      if (editingResource) {
        await fetchAPI(`/resources/${editingResource.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Sumber daya berhasil diperbarui');
      } else {
        await fetchAPI('/resources', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Sumber daya berhasil ditambahkan');
      }

      setResourceModalOpen(false);
      await loadManageData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan sumber daya');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async () => {
    if (!deleteResourceTarget) return;
    try {
      await fetchAPI(`/resources/${deleteResourceTarget.id}`, { method: 'DELETE' });
      alert('Sumber daya berhasil dihapus');
      setDeleteResourceTarget(null);
      await loadManageData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus sumber daya');
    }
  };

  const typeLabel = (type: string) =>
    RESOURCE_TYPES.find(t => t.value === type)?.label || type;

  const renderCalendarTab = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
        <span className="text-xs font-bold text-slate-700 font-mono">
          {weekStartLabel} → {weekEndLabel}
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
          <button
            onClick={() => {
              setEditingBooking(null);
              setBookingForm({
                ...EMPTY_BOOKING_FORM,
                startTime: toDatetimeLocal(),
                endTime: toDatetimeLocal(undefined, formatDateStr(new Date()), 10),
              });
              setBookingModalOpen(true);
            }}
            className="ml-3 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Lucide.Plus className="w-3.5 h-3.5" />
            Booking Baru
          </button>
        </div>
      </div>

      <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
        <table className="w-full text-left border-collapse text-xs min-w-[800px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-3 font-bold text-slate-600 w-40 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                Sumber Daya
              </th>
              {weekDates.map(d => (
                <th key={d.dateStr} className="p-2 text-center font-bold text-slate-600 min-w-[110px]">
                  <div>{d.label}</div>
                  <div className="text-[10px] font-normal text-slate-400">{d.dateLabel}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {resources.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-400">
                  {t('no_data')}
                </td>
              </tr>
            ) : (
              resources.map(resource => (
                <tr key={resource.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                  <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-100">
                    <div className="font-bold text-slate-800">{resource.name}</div>
                    <div className="text-[10px] text-slate-400">{typeLabel(resource.type)}</div>
                    {resource.location && (
                      <div className="text-[10px] text-slate-400">{resource.location}</div>
                    )}
                  </td>
                  {weekDates.map(d => {
                    const cellBookings = getBookingsForCell(resource.id, d.dateStr);
                    return (
                      <td
                        key={d.dateStr}
                        className="p-1 align-top border-l border-slate-50 min-h-[80px] cursor-pointer hover:bg-blue-50/30 transition"
                        onClick={() => {
                          if (cellBookings.length === 0) {
                            openCreateBooking(resource.id, d.dateStr);
                          }
                        }}
                      >
                        <div className="flex flex-col gap-1 min-h-[60px]">
                          {cellBookings.map(booking => (
                            <button
                              key={booking.id}
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setDetailBooking(booking);
                              }}
                              className={`text-left px-1.5 py-1 rounded border text-[10px] font-semibold truncate cursor-pointer hover:opacity-80 ${bookingChipColor(booking.status)}`}
                              title={booking.title}
                            >
                              <div className="truncate">{booking.title}</div>
                              <div className="font-normal opacity-80">
                                {formatTimeRange(booking.startTime, booking.endTime)}
                              </div>
                            </button>
                          ))}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-amber-100 border border-amber-200" /> Pending
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200" /> Disetujui
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> Ditolak
        </span>
      </div>
    </div>
  );

  const renderManageTab = () => (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={openCreateResource}
          className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          Tambah Sumber Daya
        </button>
      </div>

      <DataTable
        headers={['Nama', 'Kode', 'Tipe', 'Lokasi', 'Kapasitas', 'Status', 'Aksi']}
        rows={allResources}
        loading={loading}
        columns={[
          row => row.name,
          row => <span className="font-mono text-xs">{row.code}</span>,
          row => typeLabel(row.type),
          row => row.location || '—',
          row => row.capacity ?? '—',
          row => <Badge status={row.isActive ? 'active' : 'inactive'} />,
          row => (
            <TableActionMenu
              items={[
                { label: t('edit'), onClick: () => openEditResource(row) },
                ...(isSuperAdmin
                  ? [{ label: t('delete'), onClick: () => setDeleteResourceTarget(row), variant: 'danger' as const }]
                  : []),
              ]}
            />
          ),
        ]}
      />
    </div>
  );

  const canEditBooking = (booking: ResourceBooking) =>
    booking.status === 'pending' && booking.employee.id === user?.employee_id;

  const canCancelBooking = (booking: ResourceBooking) =>
    (booking.status === 'pending' || booking.status === 'approved') &&
    (isAdmin || booking.employee.id === user?.employee_id);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">{t('resources')}</h1>
          <p className="text-xs text-slate-500 mt-0.5">Booking ruang rapat, kendaraan, dan peralatan kantor</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
        <div className="flex gap-1 mb-5 border-b border-slate-100 pb-3">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'calendar'
                ? 'bg-primary text-white'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Lucide.CalendarRange className="w-3.5 h-3.5 inline mr-1.5" />
            {t('resources_booking')}
          </button>
          {isAdmin && (
            <button
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'manage'
                  ? 'bg-primary text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Lucide.Settings className="w-3.5 h-3.5 inline mr-1.5" />
              {t('resources_manage')}
            </button>
          )}
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">{t('loading')}</div>
        ) : activeTab === 'calendar' ? (
          renderCalendarTab()
        ) : (
          renderManageTab()
        )}
      </div>

      {/* Create/Edit Booking Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => {
          setBookingModalOpen(false);
          setEditingBooking(null);
        }}
        title={editingBooking ? 'Edit Booking' : 'Buat Booking Baru'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Select
            label="Sumber Daya"
            value={bookingForm.resourceId}
            onChange={e => setBookingForm(f => ({ ...f, resourceId: e.target.value }))}
            options={[
              { value: '', label: '— Pilih —' },
              ...resources.map(r => ({ value: r.id, label: `${r.name} (${r.code})` })),
            ]}
            required
          />
          <FormField.Input
            label="Judul"
            value={bookingForm.title}
            onChange={e => setBookingForm(f => ({ ...f, title: e.target.value }))}
            required
          />
          <FormField.Input
            label="Tujuan"
            value={bookingForm.purpose}
            onChange={e => setBookingForm(f => ({ ...f, purpose: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <FormField.Input
              label="Waktu Mulai"
              type="datetime-local"
              value={bookingForm.startTime}
              onChange={e => setBookingForm(f => ({ ...f, startTime: e.target.value }))}
              required
            />
            <FormField.Input
              label="Waktu Selesai"
              type="datetime-local"
              value={bookingForm.endTime}
              onChange={e => setBookingForm(f => ({ ...f, endTime: e.target.value }))}
              required
            />
          </div>
          <FormField.Input
            label="Jumlah Peserta"
            type="number"
            value={bookingForm.attendees}
            onChange={e => setBookingForm(f => ({ ...f, attendees: e.target.value }))}
          />
          <FormField.Textarea
            label="Catatan"
            value={bookingForm.notes}
            onChange={e => setBookingForm(f => ({ ...f, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setBookingModalOpen(false);
                setEditingBooking(null);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveBooking}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Booking Detail Modal */}
      <Modal
        isOpen={!!detailBooking}
        onClose={() => setDetailBooking(null)}
        title="Detail Booking"
        size="md"
      >
        {detailBooking && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">{detailBooking.title}</h3>
              <Badge status={detailBooking.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Sumber Daya</span>
                <span className="font-semibold text-slate-800">{detailBooking.resource.name}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Pemesan</span>
                <span className="font-semibold text-slate-800">{detailBooking.employee.fullName}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Mulai</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(detailBooking.startTime, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Selesai</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(detailBooking.endTime, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {detailBooking.purpose && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Tujuan</span>
                  <span className="text-slate-700">{detailBooking.purpose}</span>
                </div>
              )}
              {detailBooking.rejectedReason && (
                <div className="col-span-2">
                  <span className="text-slate-400 block">Alasan Penolakan</span>
                  <span className="text-red-600">{detailBooking.rejectedReason}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              {canEditBooking(detailBooking) && (
                <button
                  onClick={() => {
                    openEditBooking(detailBooking);
                    setDetailBooking(null);
                  }}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                >
                  {t('edit')}
                </button>
              )}
              {isAdmin && detailBooking.status === 'pending' && (
                <>
                  <button
                    onClick={() => setApproveTarget(detailBooking)}
                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {t('approve')}
                  </button>
                  <button
                    onClick={() => setRejectTarget(detailBooking)}
                    className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                  >
                    {t('reject')}
                  </button>
                </>
              )}
              {canCancelBooking(detailBooking) && (
                <button
                  onClick={() => setCancelTarget(detailBooking)}
                  className="px-3 py-1.5 bg-slate-600 text-white rounded-lg text-xs font-bold cursor-pointer"
                >
                  Batalkan
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Resource CRUD Modal */}
      <Modal
        isOpen={resourceModalOpen}
        onClose={() => setResourceModalOpen(false)}
        title={editingResource ? 'Edit Sumber Daya' : 'Tambah Sumber Daya'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama"
            value={resourceForm.name}
            onChange={e => setResourceForm(f => ({ ...f, name: e.target.value }))}
            required
          />
          <FormField.Input
            label="Kode"
            value={resourceForm.code}
            onChange={e => setResourceForm(f => ({ ...f, code: e.target.value }))}
            required
          />
          <FormField.Select
            label="Tipe"
            value={resourceForm.type}
            onChange={e => setResourceForm(f => ({ ...f, type: e.target.value }))}
            options={RESOURCE_TYPES}
          />
          <FormField.Input
            label="Lokasi"
            value={resourceForm.location}
            onChange={e => setResourceForm(f => ({ ...f, location: e.target.value }))}
          />
          <FormField.Input
            label="Kapasitas"
            type="number"
            value={resourceForm.capacity}
            onChange={e => setResourceForm(f => ({ ...f, capacity: e.target.value }))}
          />
          <FormField.Textarea
            label="Deskripsi"
            value={resourceForm.description}
            onChange={e => setResourceForm(f => ({ ...f, description: e.target.value }))}
          />
          <FormField.Toggle
            label="Aktif"
            checked={resourceForm.isActive}
            onChange={e => setResourceForm(f => ({ ...f, isActive: e.target.checked }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setResourceModalOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-lg cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSaveResource}
              disabled={saving}
              className="px-4 py-2 bg-primary text-white rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50"
            >
              {saving ? t('loading') : t('save')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!approveTarget}
        onClose={() => setApproveTarget(null)}
        title="Setujui Booking"
        message={`Setujui booking "${approveTarget?.title}"?`}
        onConfirm={handleApprove}
        confirmText={t('approve')}
        type="success"
      />

      <Modal
        isOpen={!!rejectTarget}
        onClose={() => {
          setRejectTarget(null);
          setRejectReason('');
        }}
        title="Tolak Booking"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Tolak booking &quot;{rejectTarget?.title}&quot;?
          </p>
          <FormField.Textarea
            label="Alasan"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setRejectTarget(null);
                setRejectReason('');
              }}
              className="px-4 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-bold cursor-pointer"
            >
              {t('reject')}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelTarget}
        onClose={() => setCancelTarget(null)}
        title="Batalkan Booking"
        message={`Batalkan booking "${cancelTarget?.title}"?`}
        onConfirm={handleCancel}
        confirmText="Batalkan"
        type="danger"
      />

      <ConfirmDialog
        isOpen={!!deleteResourceTarget}
        onClose={() => setDeleteResourceTarget(null)}
        title="Hapus Sumber Daya"
        message={`Hapus "${deleteResourceTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDeleteResource}
        confirmText={t('delete')}
        type="danger"
      />
    </div>
  );
}
