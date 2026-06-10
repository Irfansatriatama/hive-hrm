'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import Avatar from '@/components/shared/Avatar';
import FormField from '@/components/shared/FormField';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu, {
  findDetailAction,
  triggerDetailAction,
  type TableActionItem,
} from '@/components/shared/TableActionMenu';

interface Group {
  id: string;
  name: string;
  description: string | null;
  memberIds: string[];
}

interface Employee {
  id: string;
  full_name: string;
}

export default function GroupingPage() {
  const { t } = useI18n();

  // States
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Group modal
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [editGroupId, setEditGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  // Member View modal
  const [showViewModal, setShowViewModal] = useState(false);
  const [viewGroup, setViewGroup] = useState<Group | null>(null);

  // Delete Dialog
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteGroupName, setDeleteGroupName] = useState('');

  // Load Groups and Employees
  const loadData = async () => {
    setLoading(true);
    try {
      const [groupsData, empData] = await Promise.all([
        fetchAPI<Group[]>('/employees/groups'),
        fetchAPI<{ employees: Employee[] }>('/employees?limit=1000'),
      ]);
      setGroups(groupsData);
      setEmployees(empData.employees);
    } catch (err) {
      console.error('Failed to load groupings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Modal handlers
  const handleOpenAddModal = () => {
    setModalTitle('Buat Grup Kustom Baru');
    setEditGroupId(null);
    setGroupName('');
    setGroupDesc('');
    setSelectedMembers([]);
    setShowModal(true);
  };

  const handleOpenEditModal = (group: Group) => {
    setModalTitle(`Edit Grup ${group.name}`);
    setEditGroupId(group.id);
    setGroupName(group.name);
    setGroupDesc(group.description || '');
    setSelectedMembers(group.memberIds || []);
    setShowModal(true);
  };

  const handleToggleMember = (empId: string) => {
    setSelectedMembers(prev =>
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleSaveGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('Nama grup wajib diisi');
      return;
    }

    try {
      if (editGroupId) {
        // Edit API
        await fetchAPI(`/employees/groups/${editGroupId}`, {
          method: 'PUT',
          body: JSON.stringify({
            name: groupName,
            description: groupDesc,
            memberIds: selectedMembers,
          }),
        });
        alert(`Grup ${groupName} berhasil diperbarui`);
      } else {
        // Create API
        await fetchAPI('/employees/groups', {
          method: 'POST',
          body: JSON.stringify({
            name: groupName,
            description: groupDesc,
            memberIds: selectedMembers,
          }),
        });
        alert(`Grup kustom ${groupName} berhasil dibuat`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      alert('Gagal menyimpan grup: ' + err.message);
    }
  };

  // View Members Modal
  const handleOpenViewModal = (group: Group) => {
    setViewGroup(group);
    setShowViewModal(true);
  };

  const getGroupActionItems = (group: Group): TableActionItem[] => [
    { label: 'Lihat Anggota', onClick: () => handleOpenViewModal(group), variant: 'primary', isDetail: true },
    { label: 'Edit', onClick: () => handleOpenEditModal(group) },
    { label: 'Hapus', onClick: () => handleDeleteClick(group), variant: 'danger' },
  ];

  const handleGroupRowClick = (group: Group) => {
    const detail = findDetailAction(getGroupActionItems(group));
    if (detail) triggerDetailAction(detail);
  };

  // Delete handlers
  const handleDeleteClick = (group: Group) => {
    setDeleteGroupId(group.id);
    setDeleteGroupName(group.name);
  };

  const handleConfirmDelete = async () => {
    if (!deleteGroupId) return;
    try {
      await fetchAPI(`/employees/groups/${deleteGroupId}`, {
        method: 'DELETE',
      });
      alert(`Grup ${deleteGroupName} telah dihapus`);
      setDeleteGroupId(null);
      loadData();
    } catch (err: any) {
      alert('Gagal menghapus grup: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Kelompok Kustom Karyawan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organisasikan karyawan ke dalam tim proyek, kepanitiaan, atau task force kustom.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="px-3 py-2 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer select-none"
        >
          <Lucide.Plus className="w-3.5 h-3.5" />
          <span>Buat Grup Baru</span>
        </button>
      </div>

      {/* Main Groups Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[350px]">
        {loading ? (
          <div className="flex items-center justify-center h-full py-20 select-none">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-slate-500 font-semibold">{t('loading')}</span>
            </div>
          </div>
        ) : groups.length === 0 ? (
          <div className="flex items-center justify-center h-full py-20 select-none text-slate-450 text-xs">
            Belum ada grup kustom dibentuk.
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 select-none font-bold text-slate-500">
                <th className="px-6 py-3.5 uppercase tracking-wider">Nama Grup</th>
                <th className="px-6 py-3.5 uppercase tracking-wider">Deskripsi</th>
                <th className="px-6 py-3.5 uppercase tracking-wider">Jumlah Anggota</th>
                <th className="px-6 py-3.5 uppercase tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {groups.map(g => (
                <tr
                  key={g.id}
                  className="hover:bg-slate-50/50 transition cursor-pointer"
                  onClick={() => handleGroupRowClick(g)}
                >
                  <td className="px-6 py-4 font-bold text-slate-800">{g.name}</td>
                  <td className="px-6 py-4 text-slate-500 max-w-sm truncate">
                    {g.description || '-'}
                  </td>
                  <td className="px-6 py-4 font-bold text-primary font-mono">
                    {(g.memberIds || []).length} Anggota
                  </td>
                  <td
                    className="px-6 py-4 text-right font-bold select-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableActionMenu items={getGroupActionItems(g)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Dialog */}
      {deleteGroupId && (
        <ConfirmDialog
          isOpen={true}
          title="Hapus Grup"
          message={`Apakah Anda yakin ingin membubarkan grup "${deleteGroupName}"? Data anggota di dalamnya tidak akan terhapus dari sistem.`}
          confirmText="Hapus"
          cancelText="Batal"
          type="danger"
          onConfirm={handleConfirmDelete}
          onClose={() => setDeleteGroupId(null)}
        />
      )}

      {/* Add / Edit Group Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <form
            onSubmit={handleSaveGroup}
            className="bg-white w-full max-w-lg rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-scale-up"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">{modalTitle}</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Lucide.X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <FormField.Input
                label="Nama Grup"
                required
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
              />
              <FormField.Textarea
                label="Deskripsi"
                value={groupDesc}
                onChange={e => setGroupDesc(e.target.value)}
                rows={2}
              />
              
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  Pilih Anggota Tim
                </label>
                <div className="border border-slate-200 rounded-lg p-3 max-h-56 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {employees.map(emp => {
                    const isChecked = selectedMembers.includes(emp.id);
                    return (
                      <label
                        key={emp.id}
                        className="flex items-center gap-2.5 p-1.5 rounded hover:bg-slate-50 cursor-pointer select-none text-xs text-slate-700"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleMember(emp.id)}
                          className="rounded border-slate-350 text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer"
                        />
                        <span>{emp.full_name} ({emp.id})</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50 select-none">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
              >
                Simpan Grup
              </button>
            </div>
          </form>
        </div>
      )}

      {/* View Members Modal */}
      {showViewModal && viewGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl flex flex-col max-h-[80vh] overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center select-none">
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
                Anggota Grup: {viewGroup.name} ({(viewGroup.memberIds || []).length})
              </h2>
              <button
                onClick={() => setShowViewModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <Lucide.X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <p className="text-xs text-slate-500">{viewGroup.description || 'Tidak ada deskripsi'}</p>
              
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {(viewGroup.memberIds || []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Belum ada anggota di grup ini.</p>
                ) : (
                  viewGroup.memberIds.map(mId => {
                    const emp = employees.find(e => e.id === mId);
                    if (!emp) return null;
                    return (
                      <div
                        key={mId}
                        className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div className="flex items-center gap-3">
                          <Avatar name={emp.full_name} size="sm" />
                          <div>
                            <h4 className="font-bold text-slate-800 text-xs">{emp.full_name}</h4>
                            <p className="text-[10px] text-slate-450 font-mono">{emp.id}</p>
                          </div>
                        </div>
                        <Link
                          href={`/employee/${emp.id}`}
                          onClick={() => setShowViewModal(false)}
                          className="text-xs text-primary font-bold hover:underline cursor-pointer"
                        >
                          Lihat Profil
                        </Link>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end bg-slate-50 select-none">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-semibold rounded-lg shadow transition cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
