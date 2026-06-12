'use client';

import React, { useState, useEffect, useMemo } from 'react';
import * as Lucide from 'lucide-react';
import { fetchAPI } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  buildLeaveDayInfo,
  buildMonthSummary,
  categoryDotColor,
  categoryLabel,
  dateToLocalStr,
  holidayTypeLabel,
  todayLocalStr,
  type LeaveDayInfo,
  type LeaveEvent,
  type LeaveHoliday,
} from '@/lib/leave-calendar-utils';

export default function LeaveCalendarPage() {
  const [calendarEvents, setCalendarEvents] = useState<LeaveEvent[]>([]);
  const [holidays, setHolidays] = useState<LeaveHoliday[]>([]);
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string | null>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [filterDept, setFilterDept] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<LeaveDayInfo | null>(null);

  useEffect(() => {
    async function loadCalendar() {
      setLoading(true);
      try {
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        const [calendar, depts, emps] = await Promise.all([
          fetchAPI<any>(`/leave/calendar?month=${month}&year=${year}`),
          fetchAPI<any[]>('/employees/departments'),
          fetchAPI<any[]>('/employees'),
        ]);

        const events = calendar?.events ?? [];
        const eventsWithDept = events.map((evt: any) => {
          const emp = emps.find((e) => e.id === evt.employeeId);
          return {
            ...evt,
            departmentId: emp?.departmentId,
            reason: evt.reason || 'Cuti Tahunan',
          };
        });

        setCalendarEvents(eventsWithDept);
        setHolidays(calendar?.holidays ?? []);
        setCurrentEmployeeId(calendar?.currentEmployeeId ?? null);
        setDepartments(depts);
      } catch (err) {
        console.error('Failed to load leave calendar:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCalendar();
  }, [currentDate]);

  const navigateMonth = (direction: number) => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + direction);
    setCurrentDate(d);
  };

  const setToday = () => setCurrentDate(new Date());

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const todayStr = todayLocalStr();

  const filteredEvents = useMemo(
    () =>
      calendarEvents.filter(
        (evt: any) => filterDept === '' || evt.departmentId === filterDept,
      ),
    [calendarEvents, filterDept],
  );

  const monthSummary = useMemo(
    () =>
      buildMonthSummary({
        year,
        month: month + 1,
        holidays,
        events: filteredEvents,
      }),
    [year, month, holidays, filteredEvents],
  );

  const firstDayIndex = new Date(year, month, 1).getDay();
  const adjustedFirstDayIndex = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const totalDays = new Date(year, month + 1, 0).getDate();
  const prevMonthTotalDays = new Date(year, month, 0).getDate();
  const weekdays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  const prevCells = [];
  for (let i = adjustedFirstDayIndex - 1; i >= 0; i--) {
    const prevDay = prevMonthTotalDays - i;
    prevCells.push(
      <div
        key={`prev-${prevDay}`}
        className="p-2 bg-slate-50/50 text-slate-400 font-mono text-xs select-none"
      >
        <span>{prevDay}</span>
      </div>,
    );
  }

  const activeCells = [];
  for (let day = 1; day <= totalDays; day++) {
    const activeDate = new Date(year, month, day);
    const activeDateStr = dateToLocalStr(activeDate);

    const dayLeaves = filteredEvents.filter(
      (evt) => activeDateStr >= evt.start && activeDateStr <= evt.end,
    );
    const dayHoliday = holidays.find((h) => h.date === activeDateStr);
    const info = buildLeaveDayInfo({
      dateStr: activeDateStr,
      date: activeDate,
      todayStr,
      holiday: dayHoliday,
      leaves: dayLeaves,
      currentEmployeeId,
    });

    activeCells.push(
      <div
        key={`curr-${day}`}
        onClick={() => info.isInteractive && setSelectedDay(info)}
        className={`p-1.5 flex flex-col justify-start relative hover:bg-slate-50/30 transition border-r border-b border-slate-200 ${
          info.isInteractive ? 'cursor-pointer' : ''
        } ${info.backgroundClass} ${info.borderClass}`}
      >
        <span
          className={`font-mono text-xs font-semibold ${
            info.isToday
              ? 'text-emerald-600 font-bold'
              : info.categories.includes('nationalOrSunday')
                ? 'text-red-600'
                : 'text-slate-700'
          }`}
        >
          {day}
        </span>
        {dayHoliday && (
          <span className="text-[7px] text-slate-500 truncate mt-0.5">
            {dayHoliday.name}
          </span>
        )}
        <div className="space-y-1 mt-1 max-h-[50px] overflow-y-auto flex-1">
          {dayLeaves.slice(0, 2).map((l, index) => {
            const isOwn = l.isOwn || l.employeeId === currentEmployeeId;
            const colorClass = isOwn
              ? 'bg-amber-50 text-amber-800 border-amber-100'
              : 'bg-blue-50 text-blue-700 border-blue-100';
            const firstName = l.employeeName?.split(' ')[0] ?? 'Karyawan';
            return (
              <div
                key={`${l.id}-${index}`}
                className={`px-1.5 py-0.5 rounded text-[8px] font-bold border truncate ${colorClass}`}
                title={`${l.employeeName}: ${l.title}`}
              >
                {firstName}
              </div>
            );
          })}
        </div>
        {info.categories.length > 1 && (
          <div className="flex gap-0.5 mt-auto pt-0.5">
            {info.categories.slice(0, 4).map((cat) => (
              <span
                key={cat}
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ backgroundColor: categoryDotColor(cat) }}
              />
            ))}
            {info.categories.length > 4 && (
              <span className="text-[7px] text-slate-400">
                +{info.categories.length - 4}
              </span>
            )}
          </div>
        )}
      </div>,
    );
  }

  const filledCellsCount = adjustedFirstDayIndex + totalDays;
  const remainingCellsCount = 42 - filledCellsCount;
  const nextCells = [];
  for (let day = 1; day <= remainingCellsCount; day++) {
    nextCells.push(
      <div
        key={`next-${day}`}
        className="p-2 bg-slate-50/50 text-slate-400 font-mono text-xs select-none"
      >
        <span>{day}</span>
      </div>,
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl shadow-sm border border-slate-100 select-none">
        <div>
          <h1 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Kalender Cuti Karyawan
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Jadwal ketidakhadiran karyawan secara visual. Ketuk hari berwarna
            untuk detail.
          </p>
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:border-primary"
        >
          <option value="">Semua Departemen</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between select-none">
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
            <span>{monthNames[month]}</span>
            <span className="text-slate-400 font-mono">{year}</span>
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
              Hari Ini
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="px-2.5 py-1 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 transition cursor-pointer"
            >
              <Lucide.ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 text-center text-sm text-slate-400">Memuat...</div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden flex flex-col">
            <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 select-none">
              {weekdays.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                >
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
        )}

        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 mt-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase">
            Keterangan Bulan Ini
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded border-2 border-emerald-500 bg-transparent" />
              Hari ini (aktif)
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-200" /> Libur nasional / Minggu
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-purple-200" /> Cuti bersama pemerintah
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-cyan-200" /> Libur kantor
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-amber-200" /> Cuti saya
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-200" /> Cuti karyawan lain
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1">
            Hari dengan lebih dari satu kategori menampilkan titik warna di bawah
            sel kalender.
          </p>
        </div>

        {monthSummary.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase">
              Ringkasan {monthNames[month]} {year}
            </h3>
            {monthSummary.map((item, idx) => (
              <div key={idx} className="flex gap-2">
                <span
                  className="w-1 rounded shrink-0 self-stretch"
                  style={{ backgroundColor: categoryDotColor(item.category) }}
                />
                <div>
                  <p className="text-xs font-semibold text-slate-800">{item.title}</p>
                  <p className="text-[10px] text-slate-500 whitespace-pre-line mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in select-none">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden animate-scale-up max-h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-slate-800 text-sm">
                {formatDate(selectedDay.dateStr)}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <Lucide.X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto flex-1">
              <div className="flex flex-wrap gap-1.5">
                {selectedDay.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{
                      color: categoryDotColor(cat),
                      borderColor: categoryDotColor(cat),
                      backgroundColor: `${categoryDotColor(cat)}22`,
                    }}
                  >
                    {categoryLabel(cat)}
                  </span>
                ))}
              </div>

              {selectedDay.isToday && (
                <ModalSection color="#22C55E" title="Hari Ini" body="Tanggal aktif saat ini." />
              )}
              {selectedDay.isSunday && (
                <ModalSection
                  color="#EF4444"
                  title="Hari Minggu"
                  body="Hari libur mingguan."
                />
              )}
              {selectedDay.holiday && (
                <ModalSection
                  color={categoryDotColor(
                    selectedDay.holiday.type === 'collective'
                      ? 'collective'
                      : selectedDay.holiday.type === 'company'
                        ? 'company'
                        : 'nationalOrSunday',
                  )}
                  title={holidayTypeLabel(selectedDay.holiday.type)}
                  body={selectedDay.holiday.name}
                />
              )}
              {selectedDay.leaves.some(
                (l) => l.isOwn || l.employeeId === currentEmployeeId,
              ) && (
                <ModalSection
                  color="#F59E0B"
                  title="Cuti Saya"
                  body={selectedDay.leaves
                    .filter((l) => l.isOwn || l.employeeId === currentEmployeeId)
                    .map((l) => `${l.title}\n${l.start} – ${l.end}`)
                    .join('\n\n')}
                />
              )}
              {selectedDay.leaves.some(
                (l) => !(l.isOwn || l.employeeId === currentEmployeeId),
              ) && (
                <ModalSection
                  color="#3B82F6"
                  title="Cuti Karyawan Lain"
                  body={selectedDay.leaves
                    .filter((l) => !(l.isOwn || l.employeeId === currentEmployeeId))
                    .map(
                      (l) =>
                        `${l.employeeName}\n${l.title}\n${l.start} – ${l.end}`,
                    )
                    .join('\n\n')}
                />
              )}
            </div>

            <div className="p-5 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedDay(null)}
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

function ModalSection({
  color,
  title,
  body,
}: {
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex gap-2 p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
      <span className="w-1 rounded shrink-0" style={{ backgroundColor: color }} />
      <div>
        <h4 className="text-xs font-bold text-slate-800">{title}</h4>
        <p className="text-[10px] text-slate-500 whitespace-pre-line mt-0.5">{body}</p>
      </div>
    </div>
  );
}
