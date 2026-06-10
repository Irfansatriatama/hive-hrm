'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import Avatar from '@/components/shared/Avatar';
import Badge from '@/components/shared/Badge';
import DataTable from '@/components/shared/DataTable';
import TableActionMenu, {
  findDetailAction,
  triggerDetailAction,
  type TableActionItem,
} from '@/components/shared/TableActionMenu';
import Pagination from '@/components/shared/Pagination';
import FormField from '@/components/shared/FormField';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

interface Employee {
  id: string;
  employee_id: string;
  employee_number: string;
  first_name: string;
  last_name: string;
  full_name: string;
  gender: string;
  email: string;
  phone: string;
  status: string;
  employment_type: string;
  department_id: string;
  position_id: string;
  basic_salary: number;
  join_date: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
}

export default function EmployeePage() {
  const { lang, t } = useI18n();
  const { user } = useAuth();
  const router = useRouter();
  
  // State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Dropdown options from backend
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);

  // Wizard state
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [isEdit, setIsEdit] = useState(false);
  const [editEmpId, setEditEmpId] = useState<string | null>(null);
  const [wizardData, setWizardData] = useState<any>({});
  const [wizardErrors, setWizardErrors] = useState<Record<string, string>>({});

  // Dialog state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState<string>('');
  
  const csvInputRef = useRef<HTMLInputElement>(null);
  const itemsPerPage = 10;

  // Load departments, positions, managers
  useEffect(() => {
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
  }, []);

  // Load employees list on page / search / filter change
  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI(
        `/employees?page=${currentPage}&limit=${itemsPerPage}&search=${encodeURIComponent(
          searchQuery
        )}&dept=${encodeURIComponent(deptFilter)}&status=${encodeURIComponent(
          statusFilter
        )}&type=${encodeURIComponent(typeFilter)}`
      );
      setEmployees(data.employees);
      setTotal(data.total);
    } catch (err) {
      console.error('Failed to load employee list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [currentPage, searchQuery, deptFilter, statusFilter, typeFilter]);

  const handleFilterChange = () => {
    setCurrentPage(1);
  };

  // Delete Handler
  const handleDeleteClick = (emp: Employee) => {
    setDeleteId(emp.id);
    setDeleteName(emp.full_name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    try {
      await fetchAPI(`/employees/${deleteId}`, { method: 'DELETE' });
      setDeleteId(null);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus karyawan');
    }
  };

  // CSV Export
  const handleExportCSV = async () => {
    try {
      const res = await fetchAPI('/employees?limit=1000');
      const headers = ['ID', 'Nama', 'Email', 'Phone', 'Status', 'Tipe', 'DeptID', 'PositionID', 'ManagerID', 'Salary', 'JoinDate'];
      const csvRows = [headers.join(',')];
      res.employees.forEach((emp: any) => {
        const row = [
          emp.id,
          `"${emp.full_name}"`,
          emp.email,
          emp.phone || '',
          emp.status,
          emp.employment_type,
          emp.department_id || '',
          emp.position_id || '',
          emp.direct_manager_id || '',
          emp.basic_salary,
          emp.join_date || '',
        ];
        csvRows.push(row.join(','));
      });
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `HIVE_Employee_Export_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert('Gagal mengekspor data CSV: ' + err.message);
    }
  };

  // CSV Import
  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        if (lines.length < 2) throw new Error("File CSV kosong atau tidak valid");
        const headers = lines[0].replace(/[\r\n]/g, '').split(',');
        
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].replace(/[\r\n]/g, '');
          if (!line) continue;
          const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length < headers.length) continue;
          
          const rowData: Record<string, string> = {};
          headers.forEach((h, idx) => {
            rowData[h] = cols[idx];
          });
          
          const body = {
            firstName: rowData.Nama ? rowData.Nama.split(' ')[0] : 'Nama',
            lastName: rowData.Nama ? rowData.Nama.split(' ').slice(1).join(' ') : 'Karyawan',
            email: rowData.Email || `imported_${Date.now()}_${i}@hive.id`,
            phone: rowData.Phone || '081234567890',
            gender: 'male',
            birthDate: '1990-01-01',
            status: rowData.Status || 'active',
            employmentType: rowData.Tipe || 'permanent',
            departmentId: departments.find(d => d.id === rowData.DeptID)?.id || undefined,
            positionId: positions.find(p => p.id === rowData.PositionID)?.id || undefined,
            directManagerId: managers.find(m => m.id === rowData.ManagerID)?.id || undefined,
            basicSalary: parseFloat(rowData.Salary) || 5000000,
            joinDate: rowData.JoinDate || new Date().toISOString().split('T')[0],
          };
          
          await fetchAPI('/employees', {
            method: 'POST',
            body: JSON.stringify(body),
          });
          count++;
        }
        alert(`Impor CSV sukses! Menyimpan ${count} data karyawan.`);
        loadEmployees();
      } catch (err: any) {
        alert("Gagal mengimpor file CSV: " + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Open Wizard
  const openWizard = (isEditMode = false, emp?: Employee) => {
    setIsEdit(isEditMode);
    setWizardStep(1);
    setWizardErrors({});
    if (isEditMode && emp) {
      setEditEmpId(emp.id);
      setWizardData({
        firstName: emp.first_name,
        lastName: emp.last_name,
        gender: emp.gender,
        birthDate: emp.join_date ? new Date().toISOString().split('T')[0] : '', // placeholder
        birthPlace: 'Jakarta', // mocked
        religion: 'Islam',
        maritalStatus: 'single',
        bloodType: 'O',
        phone: emp.phone,
        email: emp.email,
        address: 'Head Office address',
        joinDate: emp.join_date || '',
        status: emp.status.toUpperCase(),
        employmentType: emp.employment_type,
        departmentId: emp.department_id || '',
        positionId: emp.position_id || '',
        directManagerId: '', // mocked or lookup
        basicSalary: emp.basic_salary,
        bankName: 'BCA',
        bankAccount: '1234567890',
        bankAccountName: emp.full_name,
        taxStatus: 'TK/0',
        ktp: '3201234567890123',
      });
    } else {
      setEditEmpId(null);
      setWizardData({
        gender: 'male',
        maritalStatus: 'single',
        bloodType: 'O',
        status: 'ACTIVE',
        employmentType: 'permanent',
        taxStatus: 'TK/0',
        basicSalary: 5000000,
        bankName: 'BCA',
      });
    }
    setShowWizard(true);
  };

  // Wizard Navigation
  const validateStep = () => {
    const errors: Record<string, string> = {};
    if (wizardStep === 1) {
      if (!wizardData.firstName) errors.firstName = 'Nama Depan wajib diisi';
      if (!wizardData.lastName) errors.lastName = 'Nama Belakang wajib diisi';
      if (!wizardData.phone) errors.phone = 'Nomor Telepon wajib diisi';
      if (!wizardData.email) errors.email = 'Email Pribadi wajib diisi';
    } else if (wizardStep === 2) {
      if (!wizardData.joinDate) errors.joinDate = 'Tanggal Bergabung wajib diisi';
    } else if (wizardStep === 3) {
      if (!wizardData.basicSalary) errors.basicSalary = 'Gaji Pokok wajib diisi';
      if (!wizardData.ktp) errors.ktp = 'Nomor KTP wajib diisi';
    }
    setWizardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep()) {
      setWizardStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    setWizardStep(prev => prev - 1);
  };

  const handleSaveWizard = async () => {
    try {
      if (isEdit && editEmpId) {
        await fetchAPI(`/employees/${editEmpId}`, {
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
      setShowWizard(false);
      loadEmployees();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan data karyawan');
    }
  };

  const handleInputChange = (field: string, val: any) => {
    setWizardData((prev: any) => ({ ...prev, [field]: val }));
    if (wizardErrors[field]) {
      setWizardErrors((prev: any) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Role details
  const isHR = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';

  const getEmployeeActionItems = (row: Employee): TableActionItem[] => [
    { label: t('detail'), href: `/employee/${row.id}`, variant: 'primary', isDetail: true },
    ...(isHR
      ? [
          { label: t('edit'), onClick: () => openWizard(true, row) },
          ...(user?.role === 'SUPER_ADMIN'
            ? [{ label: t('delete'), onClick: () => handleDeleteClick(row), variant: 'danger' as const }]
            : []),
        ]
      : []),
  ];

  const handleEmployeeRowClick = (row: Employee) => {
    const detail = findDetailAction(getEmployeeActionItems(row));
    if (detail) triggerDetailAction(detail, router.push);
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{t('employee')}</h1>
          <p className="text-xs text-slate-400 mt-1">Kelola data kepegawaian, payroll, dan dokumen kontrak karyawan</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* View Toggles */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 mr-1 select-none">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'table'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-650 hover:bg-slate-200/50'
              }`}
            >
              <Lucide.List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1 transition ${
                viewMode === 'grid'
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-655 hover:bg-slate-200/50'
              }`}
            >
              <Lucide.LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Import / Export / Add buttons (Only visible to Admin) */}
          {isHR && (
            <>
              <button
                onClick={() => csvInputRef.current?.click()}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lucide.Upload className="w-3.5 h-3.5" />
                <span>{t('import_csv')}</span>
              </button>
              <input
                type="file"
                ref={csvInputRef}
                accept=".csv"
                className="hidden"
                onChange={handleImportCSV}
              />
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Lucide.Download className="w-3.5 h-3.5" />
                <span>{t('export_csv')}</span>
              </button>
              <button
                onClick={() => openWizard(false)}
                className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
              >
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Karyawan</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter panel */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Search input */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-450 pointer-events-none">
            <Lucide.Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Cari nama atau ID..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              handleFilterChange();
            }}
            className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition"
          />
        </div>

        {/* Dept filter */}
        <select
          value={deptFilter}
          onChange={e => {
            setDeptFilter(e.target.value);
            handleFilterChange();
          }}
          className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition cursor-pointer"
        >
          <option value="">Semua Departemen</option>
          {departments.map((d: any) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => {
            setStatusFilter(e.target.value);
            handleFilterChange();
          }}
          className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition cursor-pointer"
        >
          <option value="">Semua Status</option>
          <option value="active">Aktif</option>
          <option value="inactive">Nonaktif</option>
        </select>

        {/* Employment Type Filter */}
        <select
          value={typeFilter}
          onChange={e => {
            setTypeFilter(e.target.value);
            handleFilterChange();
          }}
          className="block w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary transition cursor-pointer"
        >
          <option value="">Semua Tipe</option>
          <option value="permanent">Permanen / Tetap</option>
          <option value="contract">Kontrak</option>
          <option value="intern">Magang</option>
        </select>
      </div>

      {/* Main List Area */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center flex-1 py-20 select-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-semibold">{t('loading')}</span>
            </div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex items-center justify-center flex-1 py-20 select-none">
            <div className="text-center text-slate-450">
              <Lucide.UserX className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-semibold">{t('no_data')}</p>
            </div>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto flex-1">
            <DataTable
              headers={['Nama / ID', 'Departemen', 'Jabatan', 'Status', 'Tipe']}
              rows={employees}
              columns={[
                (row: Employee) => (
                  <div className="flex items-center gap-3">
                    <Avatar name={row.full_name} size="sm" />
                    <div>
                      <p className="font-bold text-slate-800">{row.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.id}</p>
                    </div>
                  </div>
                ),
                (row: Employee) => row.department?.name || '-',
                (row: Employee) => row.position?.name || '-',
                (row: Employee) => <Badge status={row.status.toLowerCase()} />,
                (row: Employee) => (
                  <span className="capitalize font-semibold text-slate-500">
                    {row.employment_type === 'permanent' ? 'Tetap' : row.employment_type}
                  </span>
                ),
              ]}
              actions={(row: Employee) => (
                <TableActionMenu items={getEmployeeActionItems(row)} />
              )}
              onRowClick={handleEmployeeRowClick}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5 flex-1">
            {employees.map(row => (
              <div
                key={row.id}
                className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col items-center text-center relative group"
              >
                <div className="absolute top-4 right-4">
                  <Badge status={row.status.toLowerCase()} />
                </div>

                <div className="my-3">
                  <Avatar name={row.full_name} size="lg" />
                </div>

                <h3 className="font-bold text-slate-800 text-sm leading-snug truncate w-full px-2">
                  {row.full_name}
                </h3>
                <p className="text-[10px] text-slate-400 font-medium font-mono mt-0.5">{row.id}</p>

                <p className="text-xs font-semibold text-slate-500 mt-3 truncate w-full px-2">
                  {row.position?.name || '-'}
                </p>
                <p className="text-[10px] text-slate-400 truncate w-full px-2">
                  {row.department?.name || '-'}
                </p>

                <div className="w-full border-t border-slate-100 my-4 pt-3 flex flex-col gap-1.5 text-left text-[11px] text-slate-550">
                  <div className="flex items-center gap-2 min-w-0">
                    <Lucide.Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{row.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Lucide.Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{row.phone}</span>
                  </div>
                </div>

                <div className="mt-auto w-full pt-2.5 border-t border-slate-100 flex items-center justify-center gap-4 text-xs font-bold select-none">
                  <Link href={`/employee/${row.id}`} className="text-primary hover:underline">
                    Profil
                  </Link>
                  {isHR && (
                    <>
                      <span className="text-slate-200">|</span>
                      <button
                        onClick={() => openWizard(true, row)}
                        className="text-slate-650 hover:underline cursor-pointer"
                      >
                        Edit
                      </button>
                      {user?.role === 'SUPER_ADMIN' && (
                        <>
                          <span className="text-slate-200">|</span>
                          <button
                            onClick={() => handleDeleteClick(row)}
                            className="text-red-500 hover:underline cursor-pointer"
                          >
                            Hapus
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination footer */}
        {total > itemsPerPage && (
          <div className="border-t border-slate-100 p-4">
            <Pagination
              totalItems={total}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Karyawan"
          message={`Apakah Anda yakin ingin menghapus data karyawan ${deleteName}? Aksi ini akan menghapus akun user, log absensi, dan saldo cuti terkait secara permanen.`}
          confirmText="Hapus"
          cancelText="Batal"
          type="danger"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteId(null)}
        />
      )}

      {/* Add / Edit Employee Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            {/* Wizard Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                {isEdit ? `Edit Data Karyawan (${wizardData.id || ''})` : 'Tambah Karyawan Baru'} — Langkah {wizardStep} dari 4
              </h2>
              <button
                onClick={() => setShowWizard(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Lucide.X className="w-5 h-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center justify-between border-b border-slate-150 px-6 py-4 select-none text-[10px] sm:text-xs">
              <div className={`flex items-center gap-2 ${wizardStep === 1 ? 'text-primary font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                  wizardStep === 1 ? 'border-primary bg-primary text-white' : 'border-slate-300'
                }`}>1</span>
                <span>Data Pribadi</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-100 mx-3" />
              <div className={`flex items-center gap-2 ${wizardStep === 2 ? 'text-primary font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                  wizardStep === 2 ? 'border-primary bg-primary text-white' : 'border-slate-300'
                }`}>2</span>
                <span>Data Kepegawaian</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-100 mx-3" />
              <div className={`flex items-center gap-2 ${wizardStep === 3 ? 'text-primary font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                  wizardStep === 3 ? 'border-primary bg-primary text-white' : 'border-slate-300'
                }`}>3</span>
                <span>Payroll & Finansial</span>
              </div>
              <div className="h-0.5 flex-1 bg-slate-100 mx-3" />
              <div className={`flex items-center gap-2 ${wizardStep === 4 ? 'text-primary font-bold' : 'text-slate-400'}`}>
                <span className={`w-5 h-5 rounded-full flex items-center justify-center border text-[10px] ${
                  wizardStep === 4 ? 'border-primary bg-primary text-white' : 'border-slate-300'
                }`}>4</span>
                <span>Konfirmasi</span>
              </div>
            </div>

            {/* Wizard Body (Scrollable) */}
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
                    value={wizardData.joinDate ? wizardData.joinDate.split('T')[0] : ''}
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
                      <h4 className="font-bold text-primary uppercase tracking-wider mb-2">
                        1. Data Pribadi
                      </h4>
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
                      <h4 className="font-bold text-primary uppercase tracking-wider mb-2">
                        2. Kepegawaian
                      </h4>
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
                        <span className="capitalize">{wizardData.employmentType}</span> /{' '}
                        {wizardData.status}
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
                        <strong>Gaji Pokok:</strong> Rp{' '}
                        {Number(wizardData.basicSalary).toLocaleString('id-ID')}
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

            {/* Wizard Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center bg-slate-50 select-none">
              {wizardStep === 1 ? (
                <button
                  onClick={() => setShowWizard(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
                >
                  {t('cancel')}
                </button>
              ) : (
                <button
                  onClick={handlePrevStep}
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
      )}
    </div>
  );
}
