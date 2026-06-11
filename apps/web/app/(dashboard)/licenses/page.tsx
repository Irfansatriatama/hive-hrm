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

type TabId = 'all' | 'expiring' | 'types';

interface LicenseType {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  validityDays: number;
  _count?: { licenses: number };
}

interface Employee {
  id: string;
  fullName: string;
  employeeNumber: string;
  department?: { name: string } | null;
}

interface EmployeeLicense {
  id: string;
  employeeId: string;
  licenseTypeId?: string | null;
  name: string;
  licenseNumber?: string | null;
  issuedBy?: string | null;
  issuedDate?: string | null;
  expiryDate?: string | null;
  status: string;
  fileUrl?: string | null;
  notes?: string | null;
  employee?: Employee;
  licenseType?: LicenseType | null;
}

const EMPTY_LICENSE_FORM = {
  employeeId: '',
  licenseTypeId: '',
  name: '',
  licenseNumber: '',
  issuedBy: '',
  issuedDate: '',
  expiryDate: '',
  fileUrl: '',
  notes: '',
};

const EMPTY_TYPE_FORM = {
  name: '',
  code: '',
  description: '',
  validityDays: '365',
};

function daysUntilExpiry(expiryDate?: string | null): number | null {
  if (!expiryDate) return null;
  const expiry = new Date(expiryDate);
  if (isNaN(expiry.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  expiry.setHours(0, 0, 0, 0);
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getDisplayStatus(license: EmployeeLicense): 'active' | 'expired' | 'expiring' | 'revoked' {
  if (license.status === 'revoked') return 'revoked';
  if (license.status === 'expired') return 'expired';
  const days = daysUntilExpiry(license.expiryDate);
  if (days !== null && days <= 30) return 'expiring';
  return 'active';
}

function StatusBadge({ license }: { license: EmployeeLicense }) {
  const display = getDisplayStatus(license);
  if (display === 'expiring') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 select-none uppercase tracking-wider">
        Hampir Kadaluarsa
      </span>
    );
  }
  if (display === 'revoked') {
    return <Badge status="inactive" />;
  }
  if (display === 'expired') {
    return <Badge status="rejected" />;
  }
  return <Badge status="active" />;
}

export default function LicensesPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<TabId>('all');
  const [licenses, setLicenses] = useState<EmployeeLicense[]>([]);
  const [expiringLicenses, setExpiringLicenses] = useState<EmployeeLicense[]>([]);
  const [types, setTypes] = useState<LicenseType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<EmployeeLicense | null>(null);
  const [licenseForm, setLicenseForm] = useState(EMPTY_LICENSE_FORM);
  const [savingLicense, setSavingLicense] = useState(false);
  const [deleteLicenseTarget, setDeleteLicenseTarget] = useState<EmployeeLicense | null>(null);

  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LicenseType | null>(null);
  const [typeForm, setTypeForm] = useState(EMPTY_TYPE_FORM);
  const [savingType, setSavingType] = useState(false);
  const [deleteTypeTarget, setDeleteTypeTarget] = useState<LicenseType | null>(null);

  const expiringCount = useMemo(() => {
    if (isAdmin) return expiringLicenses.length;
    return licenses.filter(l => getDisplayStatus(l) === 'expiring').length;
  }, [isAdmin, expiringLicenses, licenses]);

  const loadLicenses = useCallback(async () => {
    try {
      const data = await fetchAPI<EmployeeLicense[]>('/licenses');
      setLicenses(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat lisensi');
    }
  }, []);

  const loadExpiring = useCallback(async () => {
    if (isAdmin) {
      try {
        const data = await fetchAPI<EmployeeLicense[]>('/licenses/expiring');
        setExpiringLicenses(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat lisensi hampir kadaluarsa');
      }
    }
  }, [isAdmin]);

  const loadTypes = useCallback(async () => {
    try {
      const data = await fetchAPI<LicenseType[]>('/licenses/types');
      setTypes(data);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat tipe lisensi');
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const data = await fetchAPI<{ employees: Employee[] }>('/employees?limit=1000');
      setEmployees(data.employees || []);
    } catch {
      setEmployees([]);
    }
  }, [isAdmin]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadLicenses(), loadExpiring(), loadTypes(), loadEmployees()]);
    setLoading(false);
  }, [loadLicenses, loadExpiring, loadTypes, loadEmployees]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const openCreateLicense = () => {
    setEditingLicense(null);
    setLicenseForm(EMPTY_LICENSE_FORM);
    setLicenseModalOpen(true);
  };

  const openEditLicense = (item: EmployeeLicense) => {
    setEditingLicense(item);
    setLicenseForm({
      employeeId: item.employeeId,
      licenseTypeId: item.licenseTypeId || '',
      name: item.name,
      licenseNumber: item.licenseNumber || '',
      issuedBy: item.issuedBy || '',
      issuedDate: item.issuedDate ? item.issuedDate.slice(0, 10) : '',
      expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '',
      fileUrl: item.fileUrl || '',
      notes: item.notes || '',
    });
    setLicenseModalOpen(true);
  };

  const handleLicenseTypeChange = (typeId: string) => {
    setLicenseForm(prev => {
      const next = { ...prev, licenseTypeId: typeId };
      const selectedType = types.find(tp => tp.id === typeId);
      if (selectedType && prev.issuedDate && !prev.expiryDate) {
        const issued = new Date(prev.issuedDate);
        issued.setDate(issued.getDate() + selectedType.validityDays);
        next.expiryDate = issued.toISOString().slice(0, 10);
      }
      if (selectedType && !prev.name) {
        next.name = selectedType.name;
      }
      return next;
    });
  };

  const handleIssuedDateChange = (date: string) => {
    setLicenseForm(prev => {
      const next = { ...prev, issuedDate: date };
      if (date && prev.licenseTypeId && !prev.expiryDate) {
        const selectedType = types.find(tp => tp.id === prev.licenseTypeId);
        if (selectedType) {
          const issued = new Date(date);
          issued.setDate(issued.getDate() + selectedType.validityDays);
          next.expiryDate = issued.toISOString().slice(0, 10);
        }
      }
      return next;
    });
  };

  const handleSaveLicense = async () => {
    if (!licenseForm.name.trim()) {
      alert('Nama lisensi wajib diisi');
      return;
    }
    if (isAdmin && !editingLicense && !licenseForm.employeeId) {
      alert('Pilih karyawan terlebih dahulu');
      return;
    }
    setSavingLicense(true);
    try {
      const payload = {
        employeeId: licenseForm.employeeId || undefined,
        licenseTypeId: licenseForm.licenseTypeId || null,
        name: licenseForm.name,
        licenseNumber: licenseForm.licenseNumber || null,
        issuedBy: licenseForm.issuedBy || null,
        issuedDate: licenseForm.issuedDate || null,
        expiryDate: licenseForm.expiryDate || null,
        fileUrl: licenseForm.fileUrl || null,
        notes: licenseForm.notes || null,
      };
      if (editingLicense) {
        await fetchAPI(`/licenses/${editingLicense.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Lisensi berhasil diperbarui');
      } else {
        await fetchAPI('/licenses', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Lisensi berhasil ditambahkan');
      }
      setLicenseModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan lisensi');
    } finally {
      setSavingLicense(false);
    }
  };

  const handleDeleteLicense = async () => {
    if (!deleteLicenseTarget) return;
    try {
      await fetchAPI(`/licenses/${deleteLicenseTarget.id}`, { method: 'DELETE' });
      alert('Lisensi berhasil dihapus');
      setDeleteLicenseTarget(null);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus lisensi');
    }
  };

  const openCreateType = () => {
    setEditingType(null);
    setTypeForm(EMPTY_TYPE_FORM);
    setTypeModalOpen(true);
  };

  const openEditType = (item: LicenseType) => {
    setEditingType(item);
    setTypeForm({
      name: item.name,
      code: item.code,
      description: item.description || '',
      validityDays: String(item.validityDays),
    });
    setTypeModalOpen(true);
  };

  const handleSaveType = async () => {
    if (!typeForm.name.trim() || !typeForm.code.trim()) {
      alert('Nama dan kode wajib diisi');
      return;
    }
    setSavingType(true);
    try {
      const payload = {
        name: typeForm.name,
        code: typeForm.code.toUpperCase(),
        description: typeForm.description || null,
        validityDays: parseInt(typeForm.validityDays, 10) || 365,
      };
      if (editingType) {
        await fetchAPI(`/licenses/types/${editingType.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Tipe lisensi berhasil diperbarui');
      } else {
        await fetchAPI('/licenses/types', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Tipe lisensi berhasil ditambahkan');
      }
      setTypeModalOpen(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan tipe lisensi');
    } finally {
      setSavingType(false);
    }
  };

  const handleDeleteType = async () => {
    if (!deleteTypeTarget) return;
    try {
      await fetchAPI(`/licenses/types/${deleteTypeTarget.id}`, { method: 'DELETE' });
      alert('Tipe lisensi berhasil dihapus');
      setDeleteTypeTarget(null);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus tipe lisensi');
    }
  };

  const displayedExpiring = isAdmin
    ? expiringLicenses
    : licenses.filter(l => getDisplayStatus(l) === 'expiring');

  const licenseColumns = isAdmin
    ? [
        (row: EmployeeLicense) => row.employee?.fullName || '-',
        (row: EmployeeLicense) => row.name,
        (row: EmployeeLicense) => row.licenseNumber || '-',
        (row: EmployeeLicense) => row.issuedBy || '-',
        (row: EmployeeLicense) => formatDate(row.issuedDate),
        (row: EmployeeLicense) => formatDate(row.expiryDate),
        (row: EmployeeLicense) => <StatusBadge license={row} />,
        (row: EmployeeLicense) => (
          <TableActionMenu
            items={[
              { label: 'Edit', onClick: () => openEditLicense(row) },
              ...(isAdmin
                ? [{ label: 'Hapus', onClick: () => setDeleteLicenseTarget(row), variant: 'danger' as const }]
                : []),
            ]}
          />
        ),
      ]
    : [
        (row: EmployeeLicense) => row.name,
        (row: EmployeeLicense) => row.licenseNumber || '-',
        (row: EmployeeLicense) => row.issuedBy || '-',
        (row: EmployeeLicense) => formatDate(row.issuedDate),
        (row: EmployeeLicense) => formatDate(row.expiryDate),
        (row: EmployeeLicense) => <StatusBadge license={row} />,
        (row: EmployeeLicense) => (
          <TableActionMenu
            items={[{ label: 'Edit', onClick: () => openEditLicense(row) }]}
          />
        ),
      ];

  const typeColumns = [
    (row: LicenseType) => row.name,
    (row: LicenseType) => row.code,
    (row: LicenseType) => row.description || '-',
    (row: LicenseType) => `${row.validityDays} hari`,
    (row: LicenseType) => String(row._count?.licenses ?? 0),
    (row: LicenseType) => (
      <TableActionMenu
        items={[
          { label: 'Edit', onClick: () => openEditType(row) },
          ...(isSuperAdmin
            ? [{ label: 'Hapus', onClick: () => setDeleteTypeTarget(row), variant: 'danger' as const }]
            : []),
        ]}
      />
    ),
  ];

  return (
    <div className="space-y-5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-lg font-bold text-slate-800">{t('licenses')}</h1>
          <p className="text-xs text-slate-400 mt-1">
            Kelola lisensi, sertifikasi, dan pantau tanggal kadaluarsa karyawan.
          </p>
        </div>
        <button
          onClick={openCreateLicense}
          className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2.5 flex items-center gap-2 hover:opacity-90 transition"
        >
          <Lucide.Plus className="w-4 h-4" />
          Tambah Lisensi
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-100 pb-0">
        {([
          { id: 'all' as TabId, label: 'Semua Lisensi' },
          { id: 'expiring' as TabId, label: t('licenses_expiring'), badge: expiringCount },
          ...(isAdmin ? [{ id: 'types' as TabId, label: t('licenses_types') }] : []),
        ]).map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tab.label}
            {'badge' in tab && tab.badge! > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px]">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
          <Lucide.Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
          <p className="text-xs text-slate-400 mt-2">Memuat data...</p>
        </div>
      ) : (
        <>
          {activeTab === 'all' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <DataTable
                headers={
                  isAdmin
                    ? ['Karyawan', 'Nama Lisensi', 'Nomor', 'Penerbit', 'Tgl Terbit', 'Tgl Kadaluarsa', 'Status', 'Aksi']
                    : ['Nama Lisensi', 'Nomor', 'Penerbit', 'Tgl Terbit', 'Tgl Kadaluarsa', 'Status', 'Aksi']
                }
                rows={licenses}
                columns={licenseColumns}
                emptyText="Belum ada lisensi terdaftar"
              />
            </div>
          )}

          {activeTab === 'expiring' && (
            <div className="space-y-3">
              {displayedExpiring.length === 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-10 text-center">
                  <Lucide.ShieldCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Tidak ada lisensi hampir kadaluarsa</p>
                  <p className="text-xs text-slate-400 mt-1">Semua lisensi masih berlaku lebih dari 30 hari.</p>
                </div>
              ) : (
                displayedExpiring.map(item => {
                  const days = daysUntilExpiry(item.expiryDate);
                  return (
                    <div
                      key={item.id}
                      className="bg-white rounded-2xl shadow-sm border border-red-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                          <Lucide.AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{item.name}</h3>
                          {isAdmin && item.employee && (
                            <p className="text-xs text-slate-500">{item.employee.fullName}</p>
                          )}
                          <p className="text-xs text-red-500 font-bold mt-1">
                            {days !== null && days <= 0
                              ? 'Sudah kadaluarsa'
                              : `Kadaluarsa dalam ${days} hari (${formatDate(item.expiryDate)})`}
                          </p>
                          {item.licenseNumber && (
                            <p className="text-[10px] text-slate-400 mt-0.5">No: {item.licenseNumber}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => openEditLicense(item)}
                        className="text-xs font-bold text-primary border border-primary/20 rounded-lg px-3 py-2 hover:bg-primary/5 transition shrink-0"
                      >
                        Perbarui
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {activeTab === 'types' && isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={openCreateType}
                  className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2 flex items-center gap-2 hover:opacity-90 transition"
                >
                  <Lucide.Plus className="w-4 h-4" />
                  Tambah Tipe
                </button>
              </div>
              <DataTable
                headers={['Nama', 'Kode', 'Deskripsi', 'Masa Berlaku', 'Digunakan', 'Aksi']}
                rows={types}
                columns={typeColumns}
                emptyText="Belum ada tipe lisensi"
              />
            </div>
          )}
        </>
      )}

      <Modal
        isOpen={licenseModalOpen}
        onClose={() => setLicenseModalOpen(false)}
        title={editingLicense ? 'Edit Lisensi' : 'Tambah Lisensi'}
        size="md"
      >
        <div className="space-y-4">
          {isAdmin && (
            <FormField.Select
              label="Karyawan"
              value={licenseForm.employeeId}
              onChange={e => setLicenseForm(prev => ({ ...prev, employeeId: e.target.value }))}
              options={[
                { value: '', label: 'Pilih karyawan...' },
                ...employees.map(e => ({
                  value: e.id,
                  label: `${e.fullName} (${e.employeeNumber})`,
                })),
              ]}
              disabled={!!editingLicense}
            />
          )}
          <FormField.Select
            label="Tipe Lisensi"
            value={licenseForm.licenseTypeId}
            onChange={e => handleLicenseTypeChange(e.target.value)}
            options={[
              { value: '', label: 'Pilih tipe (opsional)...' },
              ...types.map(tp => ({ value: tp.id, label: `${tp.name} (${tp.code})` })),
            ]}
          />
          <FormField.Input
            label="Nama Lisensi"
            value={licenseForm.name}
            onChange={e => setLicenseForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <FormField.Input
            label="Nomor Lisensi"
            value={licenseForm.licenseNumber}
            onChange={e => setLicenseForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
          />
          <FormField.Input
            label="Penerbit"
            value={licenseForm.issuedBy}
            onChange={e => setLicenseForm(prev => ({ ...prev, issuedBy: e.target.value }))}
          />
          <FormField.Input
            label="Tanggal Terbit"
            type="date"
            value={licenseForm.issuedDate}
            onChange={e => handleIssuedDateChange(e.target.value)}
          />
          <FormField.Input
            label="Tanggal Kadaluarsa"
            type="date"
            value={licenseForm.expiryDate}
            onChange={e => setLicenseForm(prev => ({ ...prev, expiryDate: e.target.value }))}
          />
          <FormField.Input
            label="URL File / Dokumen"
            value={licenseForm.fileUrl}
            onChange={e => setLicenseForm(prev => ({ ...prev, fileUrl: e.target.value }))}
            placeholder="https://..."
          />
          <FormField.Textarea
            label="Catatan"
            value={licenseForm.notes}
            onChange={e => setLicenseForm(prev => ({ ...prev, notes: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setLicenseModalOpen(false)}
              className="text-xs font-bold text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSaveLicense}
              disabled={savingLicense}
              className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {savingLicense ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={typeModalOpen}
        onClose={() => setTypeModalOpen(false)}
        title={editingType ? 'Edit Tipe Lisensi' : 'Tambah Tipe Lisensi'}
        size="md"
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama"
            value={typeForm.name}
            onChange={e => setTypeForm(prev => ({ ...prev, name: e.target.value }))}
            required
          />
          <FormField.Input
            label="Kode"
            value={typeForm.code}
            onChange={e => setTypeForm(prev => ({ ...prev, code: e.target.value }))}
            required
          />
          <FormField.Textarea
            label="Deskripsi"
            value={typeForm.description}
            onChange={e => setTypeForm(prev => ({ ...prev, description: e.target.value }))}
          />
          <FormField.Input
            label="Masa Berlaku (hari)"
            type="number"
            value={typeForm.validityDays}
            onChange={e => setTypeForm(prev => ({ ...prev, validityDays: e.target.value }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => setTypeModalOpen(false)}
              className="text-xs font-bold text-slate-500 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              onClick={handleSaveType}
              disabled={savingType}
              className="bg-primary text-white rounded-lg text-xs font-bold px-4 py-2 hover:opacity-90 transition disabled:opacity-50"
            >
              {savingType ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteLicenseTarget}
        onClose={() => setDeleteLicenseTarget(null)}
        onConfirm={handleDeleteLicense}
        title="Hapus Lisensi"
        message={`Yakin ingin menghapus lisensi "${deleteLicenseTarget?.name}"?`}
      />

      <ConfirmDialog
        isOpen={!!deleteTypeTarget}
        onClose={() => setDeleteTypeTarget(null)}
        onConfirm={handleDeleteType}
        title="Hapus Tipe Lisensi"
        message={`Yakin ingin menghapus tipe "${deleteTypeTarget?.name}"?`}
      />
    </div>
  );
}
