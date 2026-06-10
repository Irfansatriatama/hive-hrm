'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import FormField from '@/components/shared/FormField';
import Modal from '@/components/shared/Modal';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import TableActionMenu from '@/components/shared/TableActionMenu';

type ViewMode = 'grid' | 'list';
type SortBy = 'newest' | 'oldest' | 'name' | 'size';

interface DocumentItem {
  id: string;
  name: string;
  folder?: string;
  category?: string;
  type?: string;
  fileType?: string;
  size?: string;
  fileSize?: number;
  fileUrl?: string;
  visibility?: string;
  createdAt: string;
}

interface DocumentFolder {
  id: string;
  name: string;
}

const FILE_TYPE_OPTIONS = [
  { value: 'PDF', label: 'PDF' },
  { value: 'DOC', label: 'DOC / Word' },
  { value: 'XLS', label: 'XLS / Excel' },
  { value: 'IMG', label: 'IMG / Image' },
];

function getFileIcon(type: string) {
  const map: Record<string, { icon: React.ElementType; color: string }> = {
    PDF: { icon: Lucide.FileText, color: 'text-red-500' },
    DOC: { icon: Lucide.FileText, color: 'text-blue-500' },
    XLS: { icon: Lucide.FileSpreadsheet, color: 'text-green-600' },
    PPT: { icon: Lucide.Presentation, color: 'text-orange-500' },
    IMG: { icon: Lucide.Image, color: 'text-cyan-500' },
  };
  return map[type?.toUpperCase()] || { icon: Lucide.File, color: 'text-slate-400' };
}

function parseSizeValue(size?: string, fileSize?: number): number {
  if (fileSize) return fileSize;
  if (!size) return 0;
  const normalized = size.trim().toUpperCase();
  const match = normalized.match(/^([\d.]+)\s*(KB|MB|GB)?$/);
  if (!match) return 0;
  const value = parseFloat(match[1]);
  const unit = match[2] || 'MB';
  if (unit === 'KB') return value * 1024;
  if (unit === 'GB') return value * 1024 * 1024 * 1024;
  return value * 1024 * 1024;
}

function getDocType(doc: DocumentItem) {
  return doc.type || doc.fileType || 'PDF';
}

function getDocFolder(doc: DocumentItem) {
  return doc.folder || doc.category || '-';
}

function getDocSize(doc: DocumentItem) {
  if (doc.size) return doc.size;
  if (!doc.fileSize) return '-';
  const mb = doc.fileSize / (1024 * 1024);
  return mb < 1 ? `${(doc.fileSize / 1024).toFixed(0)} KB` : `${mb.toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [folders, setFolders] = useState<DocumentFolder[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeFolder, setActiveFolder] = useState('Semua');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  const [folderModal, setFolderModal] = useState(false);
  const [uploadModal, setUploadModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);

  const [folderName, setFolderName] = useState('');
  const [uploadForm, setUploadForm] = useState({
    name: '',
    folder: '',
    fileType: 'PDF',
    fileSize: '1.2 MB',
    visibility: 'all',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [folderData, docData] = await Promise.all([
        fetchAPI<DocumentFolder[]>('/core/documents/folders'),
        fetchAPI<DocumentItem[]>('/core/documents'),
      ]);
      setFolders(folderData);
      setDocuments(docData);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (activeFolder !== 'Semua') {
      result = result.filter((d) => getDocFolder(d) === activeFolder);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((d) => d.name.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      }
      return parseSizeValue(b.size, b.fileSize) - parseSizeValue(a.size, a.fileSize);
    });

    return result;
  }, [documents, activeFolder, searchQuery, sortBy]);

  const openUploadModal = () => {
    const defaultFolder =
      activeFolder !== 'Semua' ? activeFolder : folders[0]?.name || '';
    setUploadForm({
      name: '',
      folder: defaultFolder,
      fileType: 'PDF',
      fileSize: '1.2 MB',
      visibility: 'all',
    });
    setUploadModal(true);
  };

  const handleCreateFolder = async () => {
    const name = folderName.trim();
    if (!name) {
      alert('Nama folder wajib diisi!');
      return;
    }
    try {
      await fetchAPI('/core/documents/folders', {
        method: 'POST',
        body: JSON.stringify({ name }),
      });
      alert('Folder baru berhasil dibuat');
      setFolderModal(false);
      setFolderName('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat folder');
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.name.trim() || !uploadForm.fileSize.trim()) {
      alert('Nama dokumen dan ukuran file wajib diisi!');
      return;
    }
    try {
      await fetchAPI('/core/documents', {
        method: 'POST',
        body: JSON.stringify({
          name: uploadForm.name.trim(),
          folder: uploadForm.folder,
          fileType: uploadForm.fileType,
          size: uploadForm.fileSize.trim(),
          visibility: uploadForm.visibility,
        }),
      });
      alert('Dokumen berhasil diunggah');
      setUploadModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah dokumen');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetchAPI(`/core/documents/${deleteTarget.id}`, { method: 'DELETE' });
      alert('Dokumen berhasil dihapus');
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus dokumen');
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    if (doc.fileUrl) {
      window.open(doc.fileUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    alert(`Mengunduh file "${doc.name}"...`);
  };

  const renderGridView = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {filteredDocs.map((doc) => {
        const fileIcon = getFileIcon(getDocType(doc));
        const Icon = fileIcon.icon;
        return (
          <div
            key={doc.id}
            onClick={() => handleDownload(doc)}
            className="p-4 bg-white border border-slate-150 rounded-2xl hover:shadow-md transition flex flex-col justify-between min-h-[130px] group cursor-pointer"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
                <Icon className={`w-6 h-6 ${fileIcon.color}`} />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteTarget(doc);
                }}
                className="text-slate-350 hover:text-red-500 opacity-0 group-hover:opacity-100 transition p-1 cursor-pointer"
              >
                <Lucide.Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-1 mt-3">
              <h4 className="text-xs font-bold text-slate-800 leading-snug break-all line-clamp-2">
                {doc.name}
              </h4>
              <div className="flex items-center justify-between text-[9px] text-slate-400 font-semibold pt-1">
                <span className="font-mono">
                  {getDocSize(doc)} &bull; {getDocType(doc)}
                </span>
                <span className="font-mono">
                  {formatDate(doc.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-100 select-none text-[10px] text-slate-500 uppercase font-bold tracking-wider">
            <th className="px-6 py-3.5">Nama Berkas</th>
            <th className="px-6 py-3.5">Format</th>
            <th className="px-6 py-3.5">Ukuran</th>
            <th className="px-6 py-3.5">Folder</th>
            <th className="px-6 py-3.5">Tanggal</th>
            <th className="px-6 py-3.5 text-right">Aksi</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {filteredDocs.map((doc) => {
            const fileIcon = getFileIcon(getDocType(doc));
            const Icon = fileIcon.icon;
            return (
              <tr
                key={doc.id}
                onClick={() => handleDownload(doc)}
                className="table-row-hover border-b border-slate-100 transition text-xs text-slate-700 cursor-pointer"
              >
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4.5 h-4.5 ${fileIcon.color}`} />
                    <span className="font-bold text-slate-850 truncate max-w-md">{doc.name}</span>
                  </div>
                </td>
                <td className="px-6 py-3 font-semibold text-slate-500 font-mono">{getDocType(doc)}</td>
                <td className="px-6 py-3 font-semibold text-slate-500 font-mono">{getDocSize(doc)}</td>
                <td className="px-6 py-3 font-semibold text-slate-550">{getDocFolder(doc)}</td>
                <td className="px-6 py-3 font-semibold text-slate-400 font-mono">
                  {formatDate(doc.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
                </td>
                <td className="px-6 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                  <TableActionMenu
                    items={[
                      { label: 'Unduh', onClick: () => handleDownload(doc), variant: 'primary' },
                      { label: 'Hapus', onClick: () => setDeleteTarget(doc), variant: 'danger' },
                    ]}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* LEFT PANEL: Folders */}
      <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 self-start">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 select-none">
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Kategori Folder</h2>
          <button
            type="button"
            onClick={() => {
              setFolderName('');
              setFolderModal(true);
            }}
            className="text-primary hover:underline text-[10px] font-bold cursor-pointer"
          >
            + Tambah Folder
          </button>
        </div>

        <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 select-none">
          <button
            type="button"
            onClick={() => setActiveFolder('Semua')}
            className={`w-full text-left px-3 py-2.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              activeFolder === 'Semua'
                ? 'bg-primary/10 text-primary'
                : 'text-slate-550 hover:bg-slate-50'
            }`}
          >
            <Lucide.Layers className="w-4 h-4 shrink-0" />
            <span>Semua Berkas / All</span>
          </button>
          {folders.map((folder) => (
            <button
              key={folder.id}
              type="button"
              onClick={() => setActiveFolder(folder.name)}
              title={folder.name}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition flex items-center gap-2 cursor-pointer ${
                activeFolder === folder.name
                  ? 'bg-primary/10 text-primary font-bold'
                  : 'text-slate-550 hover:bg-slate-50 font-semibold'
              }`}
            >
              <Lucide.Folder className="w-4 h-4 shrink-0 text-amber-500" />
              <span className="truncate">{folder.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL: Documents */}
      <div className="lg:col-span-9 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-500 font-bold text-sm">
            <Lucide.FolderOpen className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{activeFolder}</span>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="flex border border-slate-200 rounded-lg p-0.5 bg-slate-50">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                }`}
              >
                <Lucide.LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                className={`p-1.5 rounded transition cursor-pointer ${
                  viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'
                }`}
              >
                <Lucide.List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={openUploadModal}
              className="px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lucide.Upload className="w-3.5 h-3.5" />
              <span>Unggah Dokumen</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1 select-none">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Lucide.Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari dokumen..."
              className="block w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary bg-slate-50/50"
            />
          </div>

          <div className="flex items-center gap-2 select-none shrink-0 text-xs font-semibold text-slate-650">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="block px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
            >
              <option value="newest">Terbaru / Newest</option>
              <option value="oldest">Terlama / Oldest</option>
              <option value="name">Nama A-Z / Name</option>
              <option value="size">Ukuran / File Size</option>
            </select>
          </div>
        </div>

        <div className="flex-1">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3 select-none">
              <Lucide.FolderOpen className="w-12 h-12 text-slate-300" />
              <p className="text-xs font-semibold">Tidak ada data</p>
            </div>
          ) : viewMode === 'grid' ? (
            renderGridView()
          ) : (
            renderListView()
          )}
        </div>
      </div>

      <Modal
        isOpen={folderModal}
        onClose={() => setFolderModal(false)}
        title="Tambah Folder"
        size="sm"
        footer={
          <>
            <button
              type="button"
              onClick={() => setFolderModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleCreateFolder}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
            >
              Buat Folder
            </button>
          </>
        }
      >
        <FormField.Input
          label="Nama Folder Baru"
          required
          placeholder="Contoh: Laporan Keuangan"
          value={folderName}
          onChange={(e) => setFolderName(e.target.value)}
        />
      </Modal>

      <Modal
        isOpen={uploadModal}
        onClose={() => setUploadModal(false)}
        title="Unggah Dokumen"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => setUploadModal(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleUpload}
              className="px-4 py-2 bg-primary hover:bg-primary-dark text-white text-xs font-bold rounded-lg shadow transition cursor-pointer"
            >
              Unggah Berkas
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <FormField.Input
            label="Nama Dokumen / Berkas"
            required
            placeholder="Contoh: SOP WFH 2026.pdf"
            value={uploadForm.name}
            onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <FormField.Select
              label="Pilih Folder"
              value={uploadForm.folder}
              onChange={(e) => setUploadForm({ ...uploadForm, folder: e.target.value })}
              options={folders.map((f) => ({ value: f.name, label: f.name }))}
            />
            <FormField.Select
              label="Tipe Berkas"
              value={uploadForm.fileType}
              onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value })}
              options={FILE_TYPE_OPTIONS}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField.Input
              label="Ukuran File (Contoh: 1.5 MB)"
              required
              value={uploadForm.fileSize}
              onChange={(e) => setUploadForm({ ...uploadForm, fileSize: e.target.value })}
            />
            <FormField.Select
              label="Akses Visibilitas"
              value={uploadForm.visibility}
              onChange={(e) => setUploadForm({ ...uploadForm, visibility: e.target.value })}
              options={[
                { value: 'all', label: 'Semua Karyawan' },
                { value: 'private', label: 'Hanya Saya (Private)' },
              ]}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
              Seret atau Pilih File Mock PDF/DOC
            </label>
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center text-xs text-slate-400 bg-slate-50/50">
              Simulasi unggah file — metadata dokumen akan disimpan ke direktori bersama.
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Dokumen"
        message="Apakah Anda yakin ingin menghapus berkas dokumen ini secara permanen?"
        confirmText="Hapus"
        type="danger"
      />
    </div>
  );
}
