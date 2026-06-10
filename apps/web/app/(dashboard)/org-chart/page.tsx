'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import Avatar from '@/components/shared/Avatar';

interface DeptGroup {
  id: string;
  name: string;
  employees: any[];
}

export default function OrgChartPage() {
  const [departments, setDepartments] = useState<DeptGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedDept, setExpandedDept] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [depts, empData] = await Promise.all([
          fetchAPI<any[]>('/employees/departments'),
          fetchAPI<{ employees: any[] }>('/employees?limit=1000'),
        ]);

        const grouped: DeptGroup[] = depts.map((d) => ({
          id: d.id,
          name: d.name,
          employees: empData.employees.filter((e) => e.department_id === d.id),
        }));

        const unassigned = empData.employees.filter((e) => !e.department_id);
        if (unassigned.length > 0) {
          grouped.push({ id: 'unassigned', name: 'Lainnya', employees: unassigned });
        }

        setDepartments(grouped);
        const initial: Record<string, boolean> = {};
        grouped.forEach((g) => { initial[g.id] = true; });
        setExpandedDept(initial);
      } catch (err) {
        console.error('Failed to load org chart:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggleDept = (id: string) => {
    setExpandedDept((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Struktur Organisasi</h1>
        <p className="text-xs text-slate-400 mt-1">Hierarki karyawan berdasarkan departemen dan posisi.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <button
                onClick={() => toggleDept(dept.id)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-50 text-primary flex items-center justify-center">
                    <Lucide.Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-xs font-bold text-slate-800">{dept.name}</h3>
                    <p className="text-[10px] text-slate-400">{dept.employees.length} karyawan</p>
                  </div>
                </div>
                <Lucide.ChevronDown className={`w-4 h-4 text-slate-400 transition ${expandedDept[dept.id] ? 'rotate-180' : ''}`} />
              </button>

              {expandedDept[dept.id] && (
                <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 border-t border-slate-100 pt-4">
                  {dept.employees.length === 0 ? (
                    <p className="text-xs text-slate-400 col-span-full text-center py-4">Tidak ada karyawan di departemen ini.</p>
                  ) : (
                    dept.employees.map((emp) => (
                      <Link
                        key={emp.id}
                        href={`/employee/${emp.id}`}
                        className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50 hover:bg-white hover:shadow-sm transition"
                      >
                        <Avatar name={emp.full_name} size="md" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">{emp.full_name}</p>
                          <p className="text-[10px] text-slate-400 truncate">{emp.position?.name || 'Karyawan'}</p>
                          <p className="text-[9px] text-slate-400 font-mono">{emp.employee_number}</p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
