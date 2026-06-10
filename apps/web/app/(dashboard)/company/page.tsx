'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate, formatRupiah } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import DataTable from '@/components/shared/DataTable';
import TableActionMenu from '@/components/shared/TableActionMenu';
import Modal from '@/components/shared/Modal';

type TabId = 'profile' | 'branches' | 'departments' | 'positions' | 'holidays';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'profile', label: 'Profil Perusahaan', icon: Lucide.Building2 },
  { id: 'branches', label: 'Cabang / Lokasi', icon: Lucide.MapPin },
  { id: 'departments', label: 'Departemen', icon: Lucide.GitMerge },
  { id: 'positions', label: 'Jabatan / Level', icon: Lucide.Award },
  { id: 'holidays', label: 'Hari Libur Nasional', icon: Lucide.Calendar },
];

export default function CompanyPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'HR_ADMIN';
  const [activeTab, setActiveTab] = useState<TabId>('profile');
  const [loading, setLoading] = useState(true);

  const [company, setCompany] = useState<any>(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);

  const [profileForm, setProfileForm] = useState({
    name: '', tagline: '', industry: '', npwp: '', phone: '', email: '', website: '', address: '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const [branchModal, setBranchModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [branchForm, setBranchForm] = useState({ name: '', address: '', pic: '', staffCount: '0' });

  const [deptModal, setDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<any>(null);
  const [deptForm, setDeptForm] = useState({ name: '', code: '' });

  const [posModal, setPosModal] = useState(false);
  const [editingPos, setEditingPos] = useState<any>(null);
  const [posForm, setPosForm] = useState({
    name: '', grade: 'S2', departmentId: '', salaryMin: '5000000', salaryMax: '10000000',
  });

  const [holidayDate, setHolidayDate] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [companyData, branchData, deptData, posData, holidayData, stats] = await Promise.all([
        fetchAPI('/core/company'),
        fetchAPI<any[]>('/core/company/branches'),
        fetchAPI<any[]>('/employees/departments'),
        fetchAPI<any[]>('/employees/positions'),
        fetchAPI<any[]>('/core/company/holidays'),
        fetchAPI<any>('/employees/dashboard-stats'),
      ]);
      setCompany(companyData);
      setProfileForm({
        name: companyData.name || '',
        tagline: companyData.tagline || '',
        industry: companyData.industry || '',
        npwp: companyData.npwp || '',
        phone: companyData.phone || '',
        email: companyData.email || '',
        website: companyData.website || '',
        address: companyData.address || '',
      });
      setBranches(branchData);
      setDepartments(deptData);
      setPositions(posData);
      setHolidays(holidayData);
      setEmployeeCount(stats?.totalActive || 0);
    } catch (err) {
      console.error('Failed to load company data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company?.id || !profileForm.name.trim() || savingProfile) return;
    setSavingProfile(true);
    try {
      await fetchAPI(`/core/company/${company.id}`, {
        method: 'PUT',
        body: JSON.stringify(profileForm),
      });
      alert('Profil perusahaan berhasil diperbarui');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan profil');
    } finally {
      setSavingProfile(false);
    }
  };

  const openBranchModal = (branch?: any) => {
    setEditingBranch(branch || null);
    setBranchForm(branch
      ? { name: branch.name, address: branch.address || '', pic: branch.pic || '', staffCount: String(branch.staffCount || 0) }
      : { name: '', address: '', pic: '', staffCount: '0' });
    setBranchModal(true);
  };

  const handleSaveBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.pic.trim() || !branchForm.address.trim()) {
      alert('Mohon lengkapi seluruh kolom wajib');
      return;
    }
    try {
      if (editingBranch) {
        await fetchAPI(`/core/company/branches/${editingBranch.id}`, {
          method: 'PUT',
          body: JSON.stringify(branchForm),
        });
      } else {
        await fetchAPI('/core/company/branches', {
          method: 'POST',
          body: JSON.stringify(branchForm),
        });
      }
      setBranchModal(false);
      alert(editingBranch ? 'Data cabang berhasil diperbarui' : 'Kantor cabang baru berhasil didaftarkan');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan cabang');
    }
  };

  const handleDeleteBranch = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus kantor cabang "${name}"?`)) return;
    try {
      await fetchAPI(`/core/company/branches/${id}/delete`, { method: 'POST' });
      alert('Data cabang berhasil dihapus');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus cabang');
    }
  };

  const openDeptModal = (dept?: any) => {
    setEditingDept(dept || null);
    setDeptForm(dept ? { name: dept.name, code: dept.code } : { name: '', code: '' });
    setDeptModal(true);
  };

  const handleSaveDept = async () => {
    if (!deptForm.name.trim() || !deptForm.code.trim()) {
      alert('Nama divisi dan kode singkat wajib diisi!');
      return;
    }
    try {
      if (editingDept) {
        await fetchAPI(`/employees/departments/${editingDept.id}`, {
          method: 'PUT',
          body: JSON.stringify(deptForm),
        });
        alert('Departemen divisi berhasil diperbarui');
      } else {
        await fetchAPI('/employees/departments', {
          method: 'POST',
          body: JSON.stringify(deptForm),
        });
        alert('Departemen divisi baru berhasil ditambahkan');
      }
      setDeptModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan departemen');
    }
  };

  const handleDeleteDept = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus divisi "${name}"? Seluruh data staff yang berasosiasi dengan divisi ini harus dipindahkan.`)) return;
    try {
      await fetchAPI(`/employees/departments/${id}/delete`, { method: 'POST' });
      alert('Departemen divisi berhasil dihapus');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus departemen');
    }
  };

  const openPosModal = (pos?: any) => {
    setEditingPos(pos || null);
    setPosForm(pos
      ? {
          name: pos.name,
          grade: pos.grade,
          departmentId: pos.departmentId || '',
          salaryMin: String(pos.salaryMin),
          salaryMax: String(pos.salaryMax),
        }
      : { name: '', grade: 'S2', departmentId: '', salaryMin: '5000000', salaryMax: '10000000' });
    setPosModal(true);
  };

  const handleSavePos = async () => {
    const salaryMin = parseInt(posForm.salaryMin) || 0;
    const salaryMax = parseInt(posForm.salaryMax) || 0;
    if (!posForm.name.trim() || !posForm.grade.trim() || salaryMin < 0 || salaryMax <= salaryMin) {
      alert('Mohon lengkapi seluruh field dengan range gaji valid!');
      return;
    }
    try {
      const payload = {
        name: posForm.name,
        grade: posForm.grade,
        departmentId: posForm.departmentId || null,
        salaryMin,
        salaryMax,
      };
      if (editingPos) {
        await fetchAPI(`/employees/positions/${editingPos.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        alert('Level jabatan berhasil diperbarui');
      } else {
        await fetchAPI('/employees/positions', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        alert('Level jabatan baru berhasil didaftarkan');
      }
      setPosModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan jabatan');
    }
  };

  const handleDeletePos = async (id: string, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus jabatan "${name}"?`)) return;
    try {
      await fetchAPI(`/employees/positions/${id}/delete`, { method: 'POST' });
      alert('Level jabatan berhasil dihapus');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jabatan');
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayDate) {
      alert('Mohon pilih tanggal libur!');
      return;
    }
    try {
      await fetchAPI('/core/company/holidays', {
        method: 'POST',
        body: JSON.stringify({ date: holidayDate }),
      });
      setHolidayDate('');
      alert(`Tanggal libur ${holidayDate} berhasil didaftarkan`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menambah hari libur');
    }
  };

  const handleDeleteHoliday = async (id: string, dateLabel: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus tanggal libur "${dateLabel}"? Aksi ini akan mempengaruhi perhitungan saldo cuti efektif.`)) return;
    try {
      await fetchAPI(`/core/company/holidays/${id}/delete`, { method: 'POST' });
      alert(`Tanggal libur ${dateLabel} telah dihapus`);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus hari libur');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
        <div>
          <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Struktur Organisasi Perusahaan</h1>
          <p className="text-xs text-slate-400 mt-1">
            Lacak legalitas PT, lokasi kantor cabang, departemen divisi, level jabatan, dan hari libur nasional.
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
        {activeTab === 'profile' && (
          <div className="max-w-3xl space-y-6">
            <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField.Input label="Nama Perusahaan Resmi" required value={profileForm.name} onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="Tagline Bisnis" value={profileForm.tagline} onChange={(e) => setProfileForm({ ...profileForm, tagline: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="Bidang Industri" value={profileForm.industry} onChange={(e) => setProfileForm({ ...profileForm, industry: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="NPWP Perusahaan" value={profileForm.npwp} onChange={(e) => setProfileForm({ ...profileForm, npwp: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="Nomor Telepon Kantor" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="Email Kontak Resmi" type="email" value={profileForm.email} onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="Website" value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} disabled={!isAdmin} />
              <FormField.Input label="Jumlah Karyawan Aktif (Auto)" value={String(employeeCount)} readOnly disabled />
              <div className="md:col-span-2">
                <FormField.Textarea label="Alamat Kantor Pusat" rows={2} value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} disabled={!isAdmin} />
              </div>
            </form>
            {isAdmin && (
              <div className="flex justify-end">
                <button type="button" onClick={handleSaveProfile} disabled={savingProfile} className="px-5 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition cursor-pointer disabled:opacity-50">
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'branches' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex justify-end">
                <button onClick={() => openBranchModal()} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  <span>Tambah Cabang</span>
                </button>
              </div>
            )}
            <DataTable
              headers={['Nama Cabang', 'Alamat Lengkap', 'PIC Kantor', 'Jumlah Staff']}
              rows={branches}
              columns={[
                'name',
                'address',
                'pic',
                (row) => `${row.staffCount} Staff`,
              ]}
              actions={
                isAdmin
                  ? (row: any) => (
                      <TableActionMenu
                        items={[
                          { label: 'Edit', onClick: () => openBranchModal(row), variant: 'primary' },
                          { label: 'Hapus', onClick: () => handleDeleteBranch(row.id, row.name), variant: 'danger' },
                        ]}
                      />
                    )
                  : undefined
              }
            />
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex justify-end">
                <button onClick={() => openDeptModal()} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  <span>Tambah Departemen</span>
                </button>
              </div>
            )}
            <DataTable
              headers={['Kode ID', 'Nama Divisi', 'Short Code', 'Kepala Divisi', 'Total Staff']}
              rows={departments}
              columns={[
                (row) => <span className="font-mono font-bold">{row.id}</span>,
                'name',
                (row) => <span className="font-mono font-semibold">{row.code}</span>,
                'headName',
                (row) => `${row.staffCount} Staff`,
              ]}
              actions={
                isAdmin
                  ? (row: any) => (
                      <TableActionMenu
                        items={[
                          { label: 'Edit', onClick: () => openDeptModal(row), variant: 'primary' },
                          { label: 'Hapus', onClick: () => handleDeleteDept(row.id, row.name), variant: 'danger' },
                        ]}
                      />
                    )
                  : undefined
              }
            />
          </div>
        )}

        {activeTab === 'positions' && (
          <div className="space-y-4">
            {isAdmin && (
              <div className="flex justify-end">
                <button onClick={() => openPosModal()} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                  <Lucide.Plus className="w-3.5 h-3.5" />
                  <span>Tambah Jabatan</span>
                </button>
              </div>
            )}
            <DataTable
              headers={['ID Jabatan', 'Nama Jabatan', 'Grade/Level', 'Departemen', 'Rentang Gaji Pokok']}
              rows={positions}
              columns={[
                (row) => <span className="font-mono font-bold">{row.id}</span>,
                'name',
                (row) => <span className="font-mono font-bold">{row.grade}</span>,
                (row) => row.department?.name || 'Full Company (General)',
                (row) => `${formatRupiah(row.salaryMin)} - ${formatRupiah(row.salaryMax)}`,
              ]}
              actions={
                isAdmin
                  ? (row: any) => (
                      <TableActionMenu
                        items={[
                          { label: 'Edit', onClick: () => openPosModal(row), variant: 'primary' },
                          { label: 'Hapus', onClick: () => handleDeletePos(row.id, row.name), variant: 'danger' },
                        ]}
                      />
                    )
                  : undefined
              }
            />
          </div>
        )}

        {activeTab === 'holidays' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {isAdmin && (
              <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl md:col-span-4 flex flex-col gap-4">
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider pb-2 border-b border-slate-200 select-none">
                  Tambah Hari Libur
                </h3>
                <FormField.Input
                  label="Pilih Tanggal Libur"
                  type="date"
                  required
                  value={holidayDate}
                  onChange={(e) => setHolidayDate(e.target.value)}
                />
                <button
                  onClick={handleAddHoliday}
                  className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg shadow text-xs transition cursor-pointer"
                >
                  Tambahkan Tanggal
                </button>
              </div>
            )}
            <div className={`${isAdmin ? 'md:col-span-8' : 'md:col-span-12'} bg-white border border-slate-200/80 rounded-2xl overflow-hidden flex flex-col`}>
              <DataTable
                headers={['Tanggal ISO', 'Nama Hari']}
                rows={[...holidays].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())}
                columns={[
                  (row) => {
                    const iso = new Date(row.date).toISOString().split('T')[0];
                    return <span className="font-mono font-bold">{iso}</span>;
                  },
                  (row) => formatDate(row.date),
                ]}
                actions={
                  isAdmin
                    ? (row: any) => {
                        const iso = new Date(row.date).toISOString().split('T')[0];
                        return (
                          <TableActionMenu
                            items={[
                              { label: 'Hapus', onClick: () => handleDeleteHoliday(row.id, iso), variant: 'danger' },
                            ]}
                          />
                        );
                      }
                    : undefined
                }
              />
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={branchModal} onClose={() => setBranchModal(false)} title={editingBranch ? `Edit Cabang: ${editingBranch.name}` : 'Tambah Kantor Cabang Baru'}>
        <div className="space-y-4">
          <FormField.Input label="Nama Cabang Kantor" required value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
          <FormField.Input label="Nama Penanggung Jawab (PIC)" required value={branchForm.pic} onChange={(e) => setBranchForm({ ...branchForm, pic: e.target.value })} />
          <FormField.Textarea label="Alamat Lengkap Kantor" required rows={2} value={branchForm.address} onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setBranchModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleSaveBranch} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan Kantor</button>
        </div>
      </Modal>

      <Modal isOpen={deptModal} onClose={() => setDeptModal(false)} title={editingDept ? `Edit Divisi: ${editingDept.name}` : 'Tambah Departemen Baru'}>
        <div className="space-y-4">
          <FormField.Input label="Nama Divisi Departemen" required value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
          <FormField.Input label="Kode Singkat (Short Code)" required placeholder="Contoh: MKT, FIN" value={deptForm.code} onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setDeptModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleSaveDept} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan Divisi</button>
        </div>
      </Modal>

      <Modal isOpen={posModal} onClose={() => setPosModal(false)} title={editingPos ? `Edit Jabatan: ${editingPos.name}` : 'Tambah Jabatan Karyawan Baru'} size="lg">
        <div className="space-y-4">
          <FormField.Input label="Nama Jabatan / Posisi" required value={posForm.name} onChange={(e) => setPosForm({ ...posForm, name: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Grade / Level (Contoh: M1, S1)" required value={posForm.grade} onChange={(e) => setPosForm({ ...posForm, grade: e.target.value.toUpperCase() })} />
            <FormField.Select
              label="Departemen Divisi"
              value={posForm.departmentId}
              onChange={(e) => setPosForm({ ...posForm, departmentId: e.target.value })}
              options={[
                { value: '', label: 'Full Company (General)' },
                ...departments.map((d) => ({ value: d.id, label: d.name })),
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input label="Gaji Minimum (Rupiah)" type="number" required value={posForm.salaryMin} onChange={(e) => setPosForm({ ...posForm, salaryMin: e.target.value })} />
            <FormField.Input label="Gaji Maksimum (Rupiah)" type="number" required value={posForm.salaryMax} onChange={(e) => setPosForm({ ...posForm, salaryMax: e.target.value })} />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setPosModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleSavePos} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer">Simpan Jabatan</button>
        </div>
      </Modal>
    </div>
  );
}
