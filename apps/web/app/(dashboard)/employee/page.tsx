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
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import EmployeeWizardModal from '@/components/employee/EmployeeWizardModal';

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
  const [wizardEmployee, setWizardEmployee] = useState<Employee | null>(null);

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

  const openWizard = (isEditMode = false, emp?: Employee) => {
    setWizardEmployee(isEditMode && emp ? emp : null);
    setShowWizard(true);
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

      <EmployeeWizardModal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSaved={loadEmployees}
        employee={wizardEmployee}
      />
    </div>
  );
}
