'use client';

import React, { useState, useEffect, useCallback } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermission, normalizeRole } from '@/hooks/usePermission';
import { usePermissionsContext } from '@/lib/permissions-context';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import Avatar from '@/components/shared/Avatar';
import TableActionMenu from '@/components/shared/TableActionMenu';

type TabId = 'roles' | 'matrix' | 'users';

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'roles', label: 'Manajemen Role', icon: Lucide.Shield },
  { id: 'matrix', label: 'Matriks Hak Akses', icon: Lucide.Grid3x3 },
  { id: 'users', label: 'Akun Pengguna', icon: Lucide.Users },
];

export default function UserAccessPage() {
  const { user } = useAuth();
  const { isLoading: authLoading } = usePermission();
  const { refreshPermissions } = usePermissionsContext();
  const [activeTab, setActiveTab] = useState<TabId>('roles');
  const [loading, setLoading] = useState(true);

  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [matrixData, setMatrixData] = useState<{
    modules: { key: string; label: string }[];
    roles: { key: string; name: string }[];
    matrix: Record<string, string[]>;
  } | null>(null);
  const [localMatrix, setLocalMatrix] = useState<Record<string, string[]>>({});

  const [roleModal, setRoleModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [roleForm, setRoleForm] = useState({ key: '', name: '', description: '' });

  const [userModal, setUserModal] = useState(false);
  const [editUserModal, setEditUserModal] = useState<any>(null);
  const [editUserRole, setEditUserRole] = useState('');
  const [unassignedEmployees, setUnassignedEmployees] = useState<any[]>([]);
  const [newUserForm, setNewUserForm] = useState({ employeeId: '', email: '', password: 'Admin@1234', role: 'EMPLOYEE' });

  const [resetPwdModal, setResetPwdModal] = useState<{ name: string; password: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const isSuperAdmin = normalizeRole(user?.role) === 'SUPER_ADMIN';

  const loadTabData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'roles') {
        const data = await fetchAPI<any[]>('/core/user-access/roles');
        setRoles(data);
      } else if (activeTab === 'matrix') {
        const data = await fetchAPI<any>('/core/user-access/permissions');
        setMatrixData(data);
        setLocalMatrix(data.matrix || {});
      } else {
        const [userData, roleData] = await Promise.all([
          fetchAPI<any[]>('/core/user-access'),
          fetchAPI<any[]>('/core/user-access/roles'),
        ]);
        setUsers(userData);
        setRoles(roleData);
      }
    } catch (err) {
      console.error('Failed to load user access data:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isSuperAdmin) loadTabData();
  }, [isSuperAdmin, loadTabData]);

  const openRoleModal = (role?: any) => {
    setEditingRole(role || null);
    setRoleForm(role
      ? { key: role.key, name: role.name, description: role.description || '' }
      : { key: '', name: '', description: '' });
    setRoleModal(true);
  };

  const handleSaveRole = async () => {
    if (!roleForm.name.trim() || (!editingRole && !roleForm.key.trim())) {
      alert('ID Role dan Nama Role wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      if (editingRole) {
        await fetchAPI(`/core/user-access/roles/${editingRole.key}`, {
          method: 'PUT',
          body: JSON.stringify({ name: roleForm.name, description: roleForm.description }),
        });
        alert('Role berhasil diperbarui');
      } else {
        await fetchAPI('/core/user-access/roles', {
          method: 'POST',
          body: JSON.stringify(roleForm),
        });
        alert('Role baru berhasil ditambahkan');
      }
      setRoleModal(false);
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan role');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRole = async (key: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus role ini?')) return;
    try {
      await fetchAPI(`/core/user-access/roles/${key}`, { method: 'DELETE' });
      alert('Role berhasil dihapus');
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus role');
    }
  };

  const toggleMatrixCell = (moduleKey: string, roleKey: string) => {
    setLocalMatrix((prev) => {
      const current = prev[moduleKey] || [];
      const next = current.includes(roleKey)
        ? current.filter((r) => r !== roleKey)
        : [...current, roleKey];
      return { ...prev, [moduleKey]: next };
    });
  };

  const handleSaveMatrix = async () => {
    setSaving(true);
    try {
      await fetchAPI('/core/user-access/permissions', {
        method: 'PUT',
        body: JSON.stringify({ matrix: localMatrix }),
      });
      await refreshPermissions();
      alert('Matriks perizinan berhasil disimpan langsung ke sistem');
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan matriks');
    } finally {
      setSaving(false);
    }
  };

  const openAddUserModal = async () => {
    try {
      const [emps, roleData] = await Promise.all([
        fetchAPI<any[]>('/core/user-access/unassigned-employees'),
        roles.length ? Promise.resolve(roles) : fetchAPI<any[]>('/core/user-access/roles'),
      ]);
      if (!roles.length) setRoles(roleData);
      setUnassignedEmployees(emps);
      if (emps.length === 0) {
        alert('Semua karyawan sudah memiliki akun user.');
        return;
      }
      setNewUserForm({ employeeId: emps[0].id, email: emps[0].email, password: 'Admin@1234', role: 'EMPLOYEE' });
      setUserModal(true);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat daftar karyawan');
    }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.email.trim() || !newUserForm.password.trim()) {
      alert('Email dan kata sandi wajib diisi!');
      return;
    }
    setSaving(true);
    try {
      await fetchAPI('/core/user-access/users', {
        method: 'POST',
        body: JSON.stringify(newUserForm),
      });
      alert('Akun user baru berhasil didaftarkan');
      setUserModal(false);
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat akun user');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEditUser = async () => {
    if (!editUserModal) return;
    setSaving(true);
    try {
      await fetchAPI(`/core/user-access/${editUserModal.id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: editUserRole }),
      });
      alert('Peran user berhasil diperbarui');
      setEditUserModal(null);
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui role');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    try {
      const result = await fetchAPI<{ password: string }>(`/core/user-access/${userId}/reset-password`, {
        method: 'POST',
      });
      setResetPwdModal({ name: userName, password: result.password });
    } catch (err: any) {
      alert(err.message || 'Gagal reset password');
    }
  };

  const handleToggleStatus = async (userId: string, currentStatus: string, userName: string) => {
    const target = currentStatus === 'active' ? 'suspended' : 'active';
    const msg = target === 'suspended'
      ? `Apakah Anda yakin ingin menonaktifkan/menangguhkan akun "${userName}"?`
      : `Apakah Anda yakin ingin mengaktifkan kembali akun "${userName}"?`;
    if (!confirm(msg)) return;
    try {
      await fetchAPI(`/core/user-access/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: target }),
      });
      alert(target === 'suspended' ? 'Akun berhasil ditangguhkan' : 'Akun berhasil diaktifkan');
      loadTabData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status akun');
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm text-center max-w-lg mx-auto mt-10">
        <Lucide.ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-3" />
        <h2 className="text-sm font-bold text-slate-800">Akses Ditolak</h2>
        <p className="text-xs text-slate-500 mt-1">Manajemen akses user hanya untuk Super Admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-lg font-bold text-slate-800 uppercase tracking-wider">Hak Akses & Otorisasi Pengguna</h1>
        <p className="text-xs text-slate-400 mt-1">Kelola peran (roles), izin modul (permissions matrix), dan akun pengguna di sistem.</p>
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
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'roles' ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={() => openRoleModal()} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                <Lucide.Plus className="w-3.5 h-3.5" />
                <span>Tambah Role</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">ID Role</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Peran</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Deskripsi</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Jumlah User</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {roles.map((role) => (
                    <tr key={role.key} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{role.key}</td>
                      <td className="px-6 py-4 font-semibold text-slate-700">{role.name}</td>
                      <td className="px-6 py-4 text-slate-500 max-w-md truncate">{role.description}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 font-mono">{role.userCount} User</td>
                      <td className="px-6 py-4 text-right">
                        {role.isSystem ? (
                          <span className="text-xs text-slate-400">Role bawaan sistem tidak dapat dihapus.</span>
                        ) : (
                          <TableActionMenu
                            items={[
                              { label: 'Edit', onClick: () => openRoleModal(role), variant: 'primary' },
                              { label: 'Hapus', onClick: () => handleDeleteRole(role.key), variant: 'danger' },
                            ]}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'matrix' && matrixData ? (
          <div className="space-y-4 select-none">
            <div className="flex justify-end">
              <button onClick={handleSaveMatrix} disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50">
                <Lucide.Save className="w-3.5 h-3.5" />
                <span>{saving ? 'Menyimpan...' : 'Simpan Matriks Izin'}</span>
              </button>
            </div>
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider">Nama Modul / Fitur</th>
                    {matrixData.roles.map((r) => (
                      <th key={r.key} className="px-4 py-3 font-bold text-slate-500 uppercase tracking-wider text-center">{r.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-600">
                  {matrixData.modules.map((mod) => (
                    <tr key={mod.key} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-700">{mod.label}</td>
                      {matrixData.roles.map((r) => {
                        const checked = (localMatrix[mod.key] || []).includes(r.key);
                        return (
                          <td key={r.key} className="px-4 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleMatrixCell(mod.key, r.key)}
                              className="w-4 h-4 rounded text-primary border-slate-300 focus:ring-primary cursor-pointer"
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button onClick={openAddUserModal} className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer">
                <Lucide.UserPlus className="w-3.5 h-3.5" />
                <span>Tambah User</span>
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Nama Pengguna</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Peran / Role</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider">Terakhir Login</th>
                    <th className="px-6 py-3.5 font-bold text-slate-500 uppercase tracking-wider text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users.map((u) => {
                    const roleName = roles.find((r) => r.key === u.role)?.name || u.role;
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} size="sm" />
                            <span className="font-bold text-slate-800">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-semibold">{u.email}</td>
                        <td className="px-6 py-4 font-semibold text-slate-600 font-mono">{roleName}</td>
                        <td className="px-6 py-4">
                          {u.status === 'active' ? (
                            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 rounded-full font-bold border border-green-100 text-[10px]">Aktif</span>
                          ) : (
                            <span className="px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full font-bold border border-red-100 text-[10px]">Ditangguhkan</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-mono">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '-'}</td>
                        <td className="px-6 py-4 text-right">
                          <TableActionMenu
                            items={[
                              { label: 'Edit', onClick: () => { setEditUserModal(u); setEditUserRole(u.role); }, variant: 'primary' },
                              { label: 'Reset Sandi', onClick: () => handleResetPassword(u.id, u.name), variant: 'warning' },
                              {
                                label: u.status === 'active' ? 'Tangguhkan' : 'Aktifkan',
                                onClick: () => handleToggleStatus(u.id, u.status, u.name),
                                variant: u.status === 'active' ? 'danger' : 'primary',
                              },
                            ]}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Modal isOpen={roleModal} onClose={() => setRoleModal(false)} title={editingRole ? `Edit Role: ${editingRole.name}` : 'Tambah Role'}>
        <div className="space-y-4">
          <FormField.Input
            label="Role ID (Unique Key)"
            required
            value={roleForm.key}
            onChange={(e) => setRoleForm({ ...roleForm, key: e.target.value })}
            disabled={!!editingRole}
            placeholder="Contoh: IT_STAFF"
          />
          <FormField.Input label="Nama Peran (Role Name)" required value={roleForm.name} onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })} />
          <FormField.Textarea label="Deskripsi" rows={2} value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setRoleModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleSaveRole} disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50">Simpan</button>
        </div>
      </Modal>

      <Modal isOpen={userModal} onClose={() => setUserModal(false)} title="Tambah User">
        <div className="space-y-4">
          <FormField.Select
            label="Pilih Karyawan"
            options={unassignedEmployees.map((e) => ({ value: e.id, label: `${e.fullName} (${e.id})` }))}
            value={newUserForm.employeeId}
            onChange={(e) => {
              const emp = unassignedEmployees.find((x) => x.id === e.target.value);
              setNewUserForm({ ...newUserForm, employeeId: e.target.value, email: emp?.email || '' });
            }}
          />
          <FormField.Input label="Alamat Email" type="email" required value={newUserForm.email} onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })} />
          <FormField.Input label="Kata Sandi Awal" type="password" required value={newUserForm.password} onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })} />
          <FormField.Select
            label="Role / Peran"
            options={roles.map((r) => ({ value: r.key, label: r.name }))}
            value={newUserForm.role}
            onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setUserModal(false)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleCreateUser} disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50">Buat Akun</button>
        </div>
      </Modal>

      <Modal isOpen={!!editUserModal} onClose={() => setEditUserModal(null)} title={`Edit User Role: ${editUserModal?.name || ''}`} size="sm">
        <FormField.Select
          label="Peran / Role"
          options={roles.map((r) => ({ value: r.key, label: r.name }))}
          value={editUserRole}
          onChange={(e) => setEditUserRole(e.target.value)}
        />
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setEditUserModal(null)} className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer">Batal</button>
          <button onClick={handleSaveEditUser} disabled={saving} className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer disabled:opacity-50">Simpan</button>
        </div>
      </Modal>

      <Modal isOpen={!!resetPwdModal} onClose={() => setResetPwdModal(null)} title={`Reset Sandi: ${resetPwdModal?.name || ''}`} size="sm">
        <div className="space-y-3 py-2 text-center">
          <Lucide.KeyRound className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 text-sm">Kata Sandi Baru Berhasil Dibuat</h3>
          <p className="text-xs text-slate-500">Silakan salin kata sandi sementara berikut untuk dikirimkan kepada user:</p>
          <div className="bg-slate-100 border border-slate-200 py-3 rounded-lg font-mono text-base font-bold text-slate-800 tracking-wider">
            {resetPwdModal?.password}
          </div>
        </div>
        <div className="mt-4">
          <button onClick={() => setResetPwdModal(null)} className="w-full py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg transition cursor-pointer">Selesai</button>
        </div>
      </Modal>
    </div>
  );
}
