'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import DataTable from '@/components/shared/DataTable';
import Avatar from '@/components/shared/Avatar';

const ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'EMPLOYEE', 'FINANCE'];

export default function UserAccessPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAPI<any[]>('/core/user-access');
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSuperAdmin) loadUsers();
  }, [isSuperAdmin]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!confirm(`Ubah role user ini menjadi ${newRole}?`)) return;
    try {
      await fetchAPI(`/core/user-access/${userId}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: newRole }),
      });
      alert('Role berhasil diperbarui!');
      loadUsers();
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah role');
    }
  };

  const filtered = users.filter(
    (u) =>
      search === '' ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

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
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Manajemen Akses User</h1>
        <p className="text-xs text-slate-400 mt-1">Kelola role dan permission akses pengguna sistem.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
        <div className="relative">
          <Lucide.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>

        <DataTable
          headers={['User', 'Email', 'Role', 'Terdaftar']}
          rows={filtered}
          loading={loading}
          columns={[
            (row) => (
              <div className="flex items-center gap-2">
                <Avatar name={row.name} size="sm" />
                <span className="text-xs font-semibold text-slate-800">{row.name}</span>
              </div>
            ),
            (row) => <span className="text-xs text-slate-500">{row.email}</span>,
            (row) => (
              <select
                value={row.role}
                onChange={(e) => handleRoleChange(row.id, e.target.value)}
                disabled={row.id === user?.id}
                className="px-2 py-1 border border-slate-200 rounded text-[10px] font-bold bg-white disabled:opacity-50"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            ),
            (row) => <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>,
          ]}
          emptyText="Tidak ada user ditemukan."
        />
      </div>
    </div>
  );
}
