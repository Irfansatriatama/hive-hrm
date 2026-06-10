'use client';

import React, { useEffect, useState } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import FormField from '@/components/shared/FormField';
import {
  defaultWizardData,
  employeeToWizardData,
  type EmployeeWizardData,
  type EmployeeWizardSource,
  validateWizardStep,
} from '@/lib/employeeWizard';

interface EmployeeWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  employee?: EmployeeWizardSource | null;
}

export default function EmployeeWizardModal({
  isOpen,
  onClose,
  onSaved,
  employee = null,
}: EmployeeWizardModalProps) {
  const { t } = useI18n();
  const isEdit = Boolean(employee?.id);

  const [wizardStep, setWizardStep] = useState(1);
  const [wizardData, setWizardData] = useState<EmployeeWizardData>({});
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    setWizardStep(1);
    setWizardErrors({});
    setWizardData(employee ? employeeToWizardData(employee) : defaultWizardData());

    async function loadDropdowns() {
      try {
        const [depts, pos, mgrs] = await Promise.all([
          fetchAPI('/employees/departments'),
          fetchAPI('/employees/positions'),
          fetchAPI('/employees/managers'),
        ]);
        setDepartments(depts);
        setPositions(pos);
        setManagers(mgrs);
      } catch (err) {
        console.error('Failed to load dropdown options:', err);
      }
    }

    loadDropdowns();
  }, [isOpen, employee?.id]);

  if (!isOpen) return null;

  const handleInputChange = (field: string, val: unknown) => {
    setWizardData(prev => ({ ...prev, [field]: val }));
    if (wizardErrors[field]) {
      setWizardErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleNextStep = () => {
    const errors = validateWizardStep(wizardStep, wizardData);
    setWizardErrors(errors);
    if (Object.keys(errors).length === 0) {
      setWizardStep(prev => prev + 1);
    }
  };

  const handleSaveWizard = async () => {
    try {
      if (isEdit && employee?.id) {
        await fetchAPI(`/employees/${employee.id}`, {
          method: 'PUT',
          body: JSON.stringify(wizardData),
        });
        alert('Karyawan berhasil diperbarui');
      } else {
        await fetchAPI('/employees', {
          method: 'POST',
          body: JSON.stringify(wizardData),
        });
        alert('Karyawan baru berhasil ditambahkan');
      }
      onClose();
      onSaved();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data karyawan');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center select-none">
          <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            {isEdit ? `Edit Data Karyawan (${employee?.id || ''})` : 'Tambah Karyawan Baru'} — Langkah{' '}
            {wizardStep} dari 4
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <Lucide.X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center justify-between border-b border-slate-150 px-6 py-4 select-none text-[10px] sm:text-xs">
          {[
            { step: 1, label: 'Data Pribadi' },
            { step: 2, label: 'Data Kepegawaian' },
            { step: 3, label: 'Payroll & Finansial' },
            { step: 4, label: 'Konfirmasi' },
          ].map((item, index) => (
            <React.Fragment key={item.step}>
              {index > 0 && <div className="h-0.5 flex-1 bg-slate-100 mx-3" />}
              <div
                className={`flex items-center gap-2 ${
                  wizardStep === item.step ? 'text-primary font-bold' : 'text-slate-400'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                    wizardStep === item.step
                      ? 'border-primary bg-primary text-white'
                      : 'border-slate-300'
                  }`}
                >
                  {item.step}
                </span>
                <span>{item.label}</span>
              </div>
            </React.Fragment>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {wizardStep === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField.Input
                label="Nama Depan"
                required
                value={wizardData.firstName || ''}
                onChange={e => handleInputChange('firstName', e.target.value)}
                error={wizardErrors.firstName}
              />
              <FormField.Input
                label="Nama Belakang"
                required
                value={wizardData.lastName || ''}
                onChange={e => handleInputChange('lastName', e.target.value)}
                error={wizardErrors.lastName}
              />
              <FormField.Select
                label="Jenis Kelamin"
                value={wizardData.gender || 'male'}
                onChange={e => handleInputChange('gender', e.target.value)}
                options={[
                  { value: 'male', label: 'Laki-laki' },
                  { value: 'female', label: 'Perempuan' },
                ]}
              />
              <FormField.Input
                label="Tanggal Lahir"
                type="date"
                required
                value={wizardData.birthDate || ''}
                onChange={e => handleInputChange('birthDate', e.target.value)}
              />
              <FormField.Input
                label="Tempat Lahir"
                value={wizardData.birthPlace || ''}
                onChange={e => handleInputChange('birthPlace', e.target.value)}
              />
              <FormField.Input
                label="Agama"
                value={wizardData.religion || 'Islam'}
                onChange={e => handleInputChange('religion', e.target.value)}
              />
              <FormField.Select
                label="Status Pernikahan"
                value={wizardData.maritalStatus || 'single'}
                onChange={e => handleInputChange('maritalStatus', e.target.value)}
                options={[
                  { value: 'single', label: 'Lajang' },
                  { value: 'married', label: 'Menikah' },
                  { value: 'divorced', label: 'Cerai Hidup' },
                  { value: 'widowed', label: 'Cerai Mati' },
                ]}
              />
              <FormField.Select
                label="Golongan Darah"
                value={wizardData.bloodType || 'O'}
                onChange={e => handleInputChange('bloodType', e.target.value)}
                options={[
                  { value: 'A', label: 'A' },
                  { value: 'B', label: 'B' },
                  { value: 'AB', label: 'AB' },
                  { value: 'O', label: 'O' },
                ]}
              />
              <FormField.Input
                label="Nomor Telepon"
                required
                value={wizardData.phone || ''}
                onChange={e => handleInputChange('phone', e.target.value)}
                error={wizardErrors.phone}
              />
              <FormField.Input
                label="Email Pribadi"
                type="email"
                required
                value={wizardData.email || ''}
                onChange={e => handleInputChange('email', e.target.value)}
                error={wizardErrors.email}
              />
              <div className="md:col-span-2">
                <FormField.Textarea
                  label="Alamat Lengkap"
                  value={wizardData.address || ''}
                  onChange={e => handleInputChange('address', e.target.value)}
                  rows={2}
                />
              </div>
            </div>
          )}

          {wizardStep === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField.Input
                label="Tanggal Bergabung"
                type="date"
                required
                value={wizardData.joinDate || ''}
                onChange={e => handleInputChange('joinDate', e.target.value)}
                error={wizardErrors.joinDate}
              />
              <FormField.Select
                label="Status Karyawan"
                value={wizardData.status || 'ACTIVE'}
                onChange={e => handleInputChange('status', e.target.value)}
                options={[
                  { value: 'ACTIVE', label: 'Aktif' },
                  { value: 'INACTIVE', label: 'Nonaktif' },
                  { value: 'TERMINATED', label: 'Terminated / Keluar' },
                  { value: 'ON_LEAVE', label: 'Cuti Kerja' },
                ]}
              />
              <FormField.Select
                label="Tipe Pekerjaan"
                value={wizardData.employmentType || 'permanent'}
                onChange={e => handleInputChange('employmentType', e.target.value)}
                options={[
                  { value: 'permanent', label: 'Tetap / Permanent' },
                  { value: 'contract', label: 'Kontrak' },
                  { value: 'intern', label: 'Magang / Intern' },
                  { value: 'outsource', label: 'Outsource' },
                ]}
              />
              <FormField.Select
                label="Departemen"
                value={wizardData.departmentId || ''}
                onChange={e => handleInputChange('departmentId', e.target.value)}
                options={[
                  { value: '', label: 'Pilih Departemen' },
                  ...departments.map((d: any) => ({ value: d.id, label: d.name })),
                ]}
              />
              <FormField.Select
                label="Jabatan"
                value={wizardData.positionId || ''}
                onChange={e => handleInputChange('positionId', e.target.value)}
                options={[
                  { value: '', label: 'Pilih Jabatan' },
                  ...positions.map((p: any) => ({ value: p.id, label: p.name })),
                ]}
              />
              <FormField.Select
                label="Atasan Langsung (Manager)"
                value={wizardData.directManagerId || ''}
                onChange={e => handleInputChange('directManagerId', e.target.value)}
                options={[
                  { value: '', label: 'Tidak ada (Direct Director)' },
                  ...managers.map((m: any) => ({ value: m.id, label: m.fullName })),
                ]}
              />
              <FormField.Input
                label="Lokasi Kerja"
                value={wizardData.workLocation || 'Head Office'}
                onChange={e => handleInputChange('workLocation', e.target.value)}
              />
              <FormField.Input
                label="Email Kantor"
                type="email"
                value={wizardData.workEmail || ''}
                onChange={e => handleInputChange('workEmail', e.target.value)}
              />
            </div>
          )}

          {wizardStep === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField.Input
                label="Gaji Pokok (Rupiah)"
                type="number"
                required
                value={wizardData.basicSalary || ''}
                onChange={e => handleInputChange('basicSalary', e.target.value)}
                error={wizardErrors.basicSalary}
              />
              <FormField.Input
                label="Nama Bank"
                value={wizardData.bankName || 'BCA'}
                onChange={e => handleInputChange('bankName', e.target.value)}
              />
              <FormField.Input
                label="Nomor Rekening"
                value={wizardData.bankAccount || ''}
                onChange={e => handleInputChange('bankAccount', e.target.value)}
              />
              <FormField.Input
                label="Nama Pemilik Rekening"
                value={wizardData.bankAccountName || ''}
                onChange={e => handleInputChange('bankAccountName', e.target.value)}
              />
              <FormField.Select
                label="Status Pajak (Tax Status)"
                value={wizardData.taxStatus || 'TK/0'}
                onChange={e => handleInputChange('taxStatus', e.target.value)}
                options={[
                  { value: 'TK/0', label: 'TK/0 - Lajang, Tanpa Tanggungan' },
                  { value: 'K/0', label: 'K/0 - Menikah, Tanpa Tanggungan' },
                  { value: 'K/1', label: 'K/1 - Menikah, 1 Tanggungan' },
                  { value: 'K/2', label: 'K/2 - Menikah, 2 Tanggungan' },
                  { value: 'K/3', label: 'K/3 - Menikah, 3 Tanggungan' },
                ]}
              />
              <FormField.Input
                label="BPJS Kesehatan"
                value={wizardData.bpjsKes || ''}
                onChange={e => handleInputChange('bpjsKes', e.target.value)}
              />
              <FormField.Input
                label="BPJS Ketenagakerjaan (TK)"
                value={wizardData.bpjsTk || ''}
                onChange={e => handleInputChange('bpjsTk', e.target.value)}
              />
              <FormField.Input
                label="NPWP"
                value={wizardData.npwp || ''}
                onChange={e => handleInputChange('npwp', e.target.value)}
              />
              <FormField.Input
                label="No. KTP"
                required
                value={wizardData.ktp || ''}
                onChange={e => handleInputChange('ktp', e.target.value)}
                error={wizardErrors.ktp}
              />
              <FormField.Input
                label="No. Kartu Keluarga (KK)"
                value={wizardData.kk || ''}
                onChange={e => handleInputChange('kk', e.target.value)}
              />
            </div>
          )}

          {wizardStep === 4 && (
            <div className="space-y-4 text-slate-700 text-xs">
              <p className="text-slate-500">
                Periksa kembali seluruh detail sebelum menyimpan data karyawan ke dalam sistem.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <h4 className="font-bold text-primary uppercase tracking-wider mb-2">1. Data Pribadi</h4>
                  <p>
                    <strong>Nama:</strong> {wizardData.firstName} {wizardData.lastName}
                  </p>
                  <p>
                    <strong>Email:</strong> {wizardData.email}
                  </p>
                  <p>
                    <strong>Telepon:</strong> {wizardData.phone}
                  </p>
                  <p>
                    <strong>Alamat:</strong> {wizardData.address || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-primary uppercase tracking-wider mb-2">2. Kepegawaian</h4>
                  <p>
                    <strong>Departemen:</strong>{' '}
                    {departments.find(d => d.id === wizardData.departmentId)?.name || '-'}
                  </p>
                  <p>
                    <strong>Jabatan:</strong>{' '}
                    {positions.find(p => p.id === wizardData.positionId)?.name || '-'}
                  </p>
                  <p>
                    <strong>Tipe/Status:</strong>{' '}
                    <span className="capitalize">{wizardData.employmentType}</span> / {wizardData.status}
                  </p>
                  <p>
                    <strong>Join Date:</strong> {wizardData.joinDate || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <h4 className="font-bold text-primary uppercase tracking-wider mb-2">
                    3. Payroll & Finansial
                  </h4>
                  <p>
                    <strong>Gaji Pokok:</strong> Rp {Number(wizardData.basicSalary).toLocaleString('id-ID')}
                  </p>
                  <p>
                    <strong>Bank:</strong> {wizardData.bankName} - {wizardData.bankAccount || '-'}
                  </p>
                  <p>
                    <strong>NPWP/KTP:</strong> {wizardData.npwp || '-'} / {wizardData.ktp}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 select-none">
          {wizardStep === 1 ? (
            <button
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              {t('cancel')}
            </button>
          ) : (
            <button
              onClick={() => setWizardStep(prev => prev - 1)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Kembali
            </button>
          )}

          {wizardStep === 4 ? (
            <button
              onClick={handleSaveWizard}
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
            >
              {isEdit ? 'Simpan Perubahan' : 'Simpan Karyawan'}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              className="px-5 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
            >
              Lanjutkan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
