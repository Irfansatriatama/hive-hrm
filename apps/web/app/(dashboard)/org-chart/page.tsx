'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import Avatar from '@/components/shared/Avatar';

interface OrgEmployee {
  id: string;
  full_name: string;
  employee_number: string;
  department_id: string | null;
  department_name: string;
  position_id: string | null;
  position_name: string;
  direct_manager_id: string | null;
  manager_name: string | null;
  work_email: string;
  work_location: string;
  join_date: string | null;
}

interface OrgNodeProps {
  node: OrgEmployee;
  employees: OrgEmployee[];
  activeNodeId: string | null;
  onSelect: (id: string) => void;
}

function OrgNodeTree({ node, employees, activeNodeId, onSelect }: OrgNodeProps) {
  const children = employees.filter((e) => e.direct_manager_id === node.id);

  const nodeCard = (
    <button
      type="button"
      onClick={() => onSelect(node.id)}
      className={`org-node bg-white hover:border-primary border hover:shadow-md hover:scale-[1.02] p-4.5 rounded-xl w-52 flex flex-col items-center text-center cursor-pointer transition duration-200 relative shrink-0 z-10 ${
        activeNodeId === node.id ? 'border-primary shadow' : 'border-slate-200/80'
      }`}
    >
      <Avatar name={node.full_name} size="sm" />
      <h4 className="font-bold text-slate-800 text-[11px] leading-tight truncate w-full mt-2">
        {node.full_name}
      </h4>
      <p className="text-[10px] text-slate-400 font-semibold truncate w-full mt-0.5">
        {node.position_name || '-'}
      </p>
      <p className="text-[9px] text-slate-400 truncate w-full">{node.department_name || '-'}</p>
    </button>
  );

  if (children.length === 0) {
    return nodeCard;
  }

  return (
    <div className="flex flex-col items-center relative">
      {nodeCard}
      {/* Garis vertikal dari parent ke level bawah */}
      <div className="h-8 w-px min-w-px bg-slate-400 shrink-0" />
      <div className="flex gap-6 items-start relative px-4 pt-0">
        {/* Garis horizontal penghubung antar sibling (jika > 1 anak) */}
        {children.length > 1 && (
          <div className="absolute top-0 left-0 right-0 h-px bg-slate-400 ml-[104px] mr-[104px]" />
        )}
        {children.map((child) => (
          <div key={child.id} className="flex flex-col items-center relative">
            {/* Garis vertikal dari horizontal bar ke setiap anak */}
            <div className="h-4 w-px min-w-px bg-slate-400 shrink-0" />
            <OrgNodeTree
              node={child}
              employees={employees}
              activeNodeId={activeNodeId}
              onSelect={onSelect}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OrgChartPage() {
  const [employees, setEmployees] = useState<OrgEmployee[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState('');
  const [zoomScale, setZoomScale] = useState(1);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const viewportRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, scrollLeft: 0, scrollTop: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empData, deptData] = await Promise.all([
        fetchAPI<OrgEmployee[]>(`/employees/org-chart${filterDept ? `?dept=${filterDept}` : ''}`),
        fetchAPI<any[]>('/employees/departments'),
      ]);
      setEmployees(empData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to load org chart:', err);
    } finally {
      setLoading(false);
    }
  }, [filterDept]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('.org-node') || target.closest('button') || target.closest('select')) return;
      isDragging.current = true;
      dragStart.current = {
        x: e.pageX - viewport.offsetLeft,
        y: e.pageY - viewport.offsetTop,
        scrollLeft: viewport.scrollLeft,
        scrollTop: viewport.scrollTop,
      };
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      const x = e.pageX - viewport.offsetLeft;
      const y = e.pageY - viewport.offsetTop;
      const walkX = (x - dragStart.current.x) * 1.5;
      const walkY = (y - dragStart.current.y) * 1.5;
      viewport.scrollLeft = dragStart.current.scrollLeft - walkX;
      viewport.scrollTop = dragStart.current.scrollTop - walkY;
    };

    viewport.addEventListener('mousedown', onMouseDown);
    viewport.addEventListener('mouseup', onMouseUp);
    viewport.addEventListener('mouseleave', onMouseUp);
    viewport.addEventListener('mousemove', onMouseMove);

    return () => {
      viewport.removeEventListener('mousedown', onMouseDown);
      viewport.removeEventListener('mouseup', onMouseUp);
      viewport.removeEventListener('mouseleave', onMouseUp);
      viewport.removeEventListener('mousemove', onMouseMove);
    };
  }, [loading]);

  const allIds = new Set(employees.map((e) => e.id));
  // Root = karyawan tanpa atasan ATAU atasan tidak ada di dataset (mis. di luar filter dept)
  const roots = employees.filter(
    (e) => !e.direct_manager_id || !allIds.has(e.direct_manager_id),
  );

  const linkedCount = employees.filter(
    (e) => e.direct_manager_id && allIds.has(e.direct_manager_id),
  ).length;

  const selectedEmployee = employees.find((e) => e.id === activeNodeId);

  const handleSelectNode = (id: string) => {
    setActiveNodeId(id);
    setPanelOpen(true);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setActiveNodeId(null);
  };

  const adjustZoom = (amount: number) => {
    setZoomScale((prev) => Math.max(0.4, Math.min(2, prev + amount)));
  };

  const resetZoom = () => {
    setZoomScale(1);
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollLeft = (viewport.scrollWidth - viewport.clientWidth) / 2;
      viewport.scrollTop = 0;
    }
  };

  const handleExport = () => {
    alert('Mengekspor gambar struktur organisasi perusahaan...');
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-4 relative overflow-hidden select-none">
      <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <select
            value={filterDept}
            onChange={(e) => {
              setFilterDept(e.target.value);
              closePanel();
            }}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-primary/15"
          >
            <option value="">Seluruh Perusahaan (Full Company)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                Departemen: {d.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => adjustZoom(0.1)}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer"
            title="Zoom In"
          >
            <Lucide.ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => adjustZoom(-0.1)}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer"
            title="Zoom Out"
          >
            <Lucide.ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetZoom}
            className="p-2 border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-500 hover:text-slate-700 transition cursor-pointer"
            title="Fit to Screen"
          >
            <Lucide.Maximize className="w-4 h-4" />
          </button>
          <button
            onClick={handleExport}
            className="ml-3 px-3 py-1.5 bg-primary hover:bg-primary-dark text-white rounded-lg text-xs font-bold shadow transition flex items-center gap-1 cursor-pointer"
          >
            <Lucide.Download className="w-3.5 h-3.5" />
            <span>Ekspor Gambar</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-4 overflow-hidden relative min-h-0">
        <div
          ref={viewportRef}
          className="flex-1 bg-white border border-slate-100 rounded-2xl shadow-sm overflow-auto p-8 flex justify-center items-start org-chart-container cursor-grab active:cursor-grabbing"
        >
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : roots.length === 0 ? (
            <p className="text-xs text-slate-400">Database hirarki karyawan kosong</p>
          ) : (
            <div className="flex flex-col items-center gap-4 w-full">
              {linkedCount === 0 && (
                <p className="text-[11px] text-amber-600 bg-amber-50 border border-amber-100 px-3 py-2 rounded-lg max-w-md text-center">
                  Belum ada relasi atasan-bawahan. Atur &quot;Atasan Langsung&quot; di profil karyawan agar garis hierarki muncul.
                </p>
              )}
              <div
                className="transition-transform duration-200 origin-top flex flex-col items-center"
                style={{ transform: `scale(${zoomScale})` }}
              >
                <div className="flex flex-col items-center gap-10">
                  {roots.map((root) => (
                    <OrgNodeTree
                      key={root.id}
                      node={root}
                      employees={employees}
                      activeNodeId={activeNodeId}
                      onSelect={handleSelectNode}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <div
          className={`w-80 bg-white border border-slate-100 rounded-2xl shadow-lg p-5 flex flex-col justify-between shrink-0 absolute right-0 top-0 bottom-0 z-10 transition-transform duration-300 ${
            panelOpen && selectedEmployee ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {selectedEmployee && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                    Detail Karyawan
                  </h3>
                  <button
                    onClick={closePanel}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <Lucide.X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Avatar name={selectedEmployee.full_name} size="lg" />
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-800 text-sm truncate leading-snug">
                      {selectedEmployee.full_name}
                    </h4>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {selectedEmployee.employee_number}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 pt-3 text-[11px] text-slate-600 leading-relaxed border-t border-slate-100">
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Jabatan / Dept
                    </span>
                    <span className="font-bold text-slate-700">
                      {selectedEmployee.position_name || '-'}
                    </span>{' '}
                    &bull;{' '}
                    <span className="text-slate-500">
                      {selectedEmployee.department_name || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Atasan Langsung
                    </span>
                    <span className="font-semibold text-slate-700">
                      {selectedEmployee.manager_name || 'Tidak ada (Direct Director)'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Email Kantor
                    </span>
                    <span className="font-mono text-slate-600">
                      {selectedEmployee.work_email || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Lokasi Kerja
                    </span>
                    <span className="font-semibold text-slate-700">
                      {selectedEmployee.work_location || 'Head Office'}
                    </span>
                  </div>
                  <div>
                    <span className="block text-[9px] uppercase font-bold text-slate-400">
                      Tanggal Gabung
                    </span>
                    <span className="font-semibold text-slate-700 font-mono">
                      {selectedEmployee.join_date
                        ? formatDate(selectedEmployee.join_date, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : '-'}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href={`/employee/${selectedEmployee.id}`}
                className="w-full bg-primary hover:bg-primary-dark text-white text-center font-bold py-2.5 rounded-lg text-xs shadow-sm transition block"
              >
                Lihat Profil Lengkap
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
