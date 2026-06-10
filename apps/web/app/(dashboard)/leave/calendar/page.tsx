'use client';

import React, { useState, useEffect } from 'react';
import * as Lucide from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function LeaveCalendarPage() {
  const { t } = useI18n();
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);

  // Modal Details
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDateStr, setModalDateStr] = useState('');
  const [modalLeaves, setModalLeaves] = useState<any[]>([]);

  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      try {
        const [events, depts, emps] = await Promise.all([
          fetchAPI<any[]>('/leave/calendar'),
          fetchAPI<any[]>('/employees/departments'),
          fetchAPI<any[]>('/employees'),
        ]);

        // Attach department info to events for filtering
        const eventsWithDept = events.map(evt => {
          const emp = emps.find(e => e.id === evt.employeeId);
          return {
            ...evt,
            departmentId: emp?.departmentId,
            reason: evt.reason || 'Cuti Tahunan',
          };
        });

        setCalendarEvents(eventsWithDept);
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load leave calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, []);

  const navigateMonth = (direction: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const currentMonthLabel = monthNames[currentDate.getMonth()];
  const currentYearLabel = currentDate.getFullYear();

  // Generate calendar grid
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay();
  // Adjust Monday as 0, Sunday as 6
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const weekdays = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

  const deptColorMap: Record<string, string> = {
    'DEPT001': 'bg-blue-50 text-blue-700 border-blue-100', // Tech
    'DEPT002': 'bg-purple-50 text-purple-700 border-purple-100', // HR
    'DEPT003': 'bg-emerald-50 text-emerald-700 border-emerald-100', // Finance
    'DEPT004': 'bg-amber-50 text-amber-700 border-amber-100', // Marketing
    'DEPT005': 'bg-rose-50 text-rose-700 border-rose-100', // Ops
    'DEPT006': 'bg-cyan-50 text-cyan-700 border-cyan-100' // CS
  };

  const handleDayClick = (dayDateStr: string, dayLeaves: any[]) => {
    if (dayLeaves.length === 0) return;
    setModalDateStr(dayDateStr);
    setModalLeaves(dayLeaves);
    setIsModalOpen(true);
  };

  // 1. Fill previous month's trailing cells
  const prevCells = [];
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    prevCells.push(
      <div key={`prev-${prevDay}`} className="p-2 bg-slate-50/50 text-slate-400 font-mono text-xs select-none">
        <span>{prevDay}</span>
      </div>
    );
  }

  // 2. Fill current month's active cells
  const activeCells = [];
  for (let day = 1; day <= totalDays; day++) {
    const activeDate = new Date(year, month, day);
    // Standard local string calculation to avoid time zone shifts
    const yyyy = activeDate.getFullYear();
    const mm = String(activeDate.getMonth() + 1).padStart(2, '0');
    const dd = String(activeDate.getDate()).padStart(2, '0');
    const activeDateStr = `${yyyy}-${mm}-${dd}`;

    const isToday = activeDateStr === todayStr;

    // Filters active leaves
    const dayLeaves = calendarEvents.filter((evt) => {
      if (filterDept !== '' && evt.departmentId !== filterDept) return false;
      return activeDateStr >= evt.start && activeDateStr <= evt.end;
    });

    activeCells.push(
      <div
        key={`curr-${day}`}
        onClick={() => handleDayClick(activeDateStr, dayLeaves)}
        className={`p-1.5 flex flex-col justify-start relative hover:bg-slate-50/30 transition border-r border-b border-slate-200 cursor-pointer ${
          isToday ? 'border-2 border-primary bg-blue-50/10' : ''
        }`}
      >
        <span
          className={`font-mono text-xs font-semibold text-slate-700 ${
            isToday
              ? 'bg-primary text-white w-5 h-5 rounded-full flex items-center justify-center -ml-0.5'
              : ''
          }`}
        >
          {day}
        </span>
        <div className="space-y-1 mt-1.5 max-h-[70px] overflow-y-auto">
          {dayLeaves.map((l, index) => {
            const colorClass = deptColorMap[l.departmentId] || 'bg-slate-50 text-slate-700 border-slate-100';
            const firstName = l.employeeName ? l.employeeName.split(' ')[0] : 'Karyawan';
            return (
              <div
                key={`${l.id}-${index}`}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold border truncate ${colorClass} select-none`}
                title={`${l.employeeName}: ${l.title}`}
              >
                {firstName} ({l.title.includes('Cuti') ? l.title.split(' ').slice(1).join(' ') || 'Cuti' : 'Cuti'})
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Fill next month's leading cells to complete grid cells (7 columns * 6 rows = 42 cells)
  const filledCellsCount = adjustedFirstDayIndex + totalDays;
  const remainingCellsCount = 42 - filledCellsCount;
  const nextCells = [];
  for (let day = 1; day <= remainingCellsCount; day++) {
    nextCells.push(
      <div key={`next-${day}`} className="p-2 bg-slate-50/50 text-slate-400 font-mono text-xs select-none">
        <span>{day}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Kalender Cuti Karyawan</h1>
          <p className="text-xs text-slate-400 mt-1">Jadwal ketidakhadiran karyawan secara visual. Membantu koordinasi lintas divisi.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
          >
            <option value="">Semua Departemen</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Wrapper */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 flex flex-col gap-4">
        {/* Calendar Navigation Header */}
        <div className="flex items-center justify-between select-none">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span>{currentMonthLabel}</span>
            <span className="text-slate-400 font-mono">{currentYearLabel}</span>
          </h2>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => navigateMonth(-1)}
              className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <Lucide.ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={setToday}
              className="px-3 py-1 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-200/50 transition cursor-pointer font-sans"
            >
              Today
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <Lucide.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 select-none">
            {weekdays.map((d) => (
              <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 auto-rows-[100px] divide-x divide-y divide-slate-200">
            {prevCells}
            {activeCells}
            {nextCells}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">
                Detail Cuti: {formatDate(modalDateStr)} ({modalLeaves.length} Orang)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 max-h-80 overflow-y-auto">
              {modalLeaves.map((l, index) => (
                <div key={`${l.id}-${index}`} className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs select-none">
                    {l.employeeName ? l.employeeName.charAt(0) : 'K'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 truncate">{l.employeeName}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {l.title} &bull; ({formatDate(l.start)} - {formatDate(l.end)})
                    </p>
                    <p className="text-[10px] text-slate-500 italic mt-1 font-medium">&ldquo;{l.reason}&rdquo;</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsModalOpen(false)}
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
