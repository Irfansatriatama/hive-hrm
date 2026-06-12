export type LeaveDayCategory =
  | 'today'
  | 'nationalOrSunday'
  | 'collective'
  | 'company'
  | 'ownLeave'
  | 'otherLeave';

export const LEAVE_CALENDAR_COLORS: Record<LeaveDayCategory, string> = {
  today: '#22C55E',
  nationalOrSunday: '#EF4444',
  collective: '#7C3AED',
  company: '#0891B2',
  ownLeave: '#F59E0B',
  otherLeave: '#3B82F6',
};

export interface LeaveHoliday {
  id: string;
  name: string;
  date: string;
  type: 'national' | 'collective' | 'company';
  description?: string;
}

export interface LeaveEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  employeeId: string;
  employeeName: string;
  isOwn?: boolean;
}

export interface LeaveDayInfo {
  dateStr: string;
  isToday: boolean;
  isSunday: boolean;
  holiday?: LeaveHoliday;
  leaves: LeaveEvent[];
  categories: LeaveDayCategory[];
  isInteractive: boolean;
  backgroundClass: string;
  borderClass: string;
}

export interface MonthSummaryItem {
  category: LeaveDayCategory;
  title: string;
  subtitle: string;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function buildLeaveDayInfo(params: {
  dateStr: string;
  date: Date;
  todayStr: string;
  holiday?: LeaveHoliday;
  leaves: LeaveEvent[];
  currentEmployeeId?: string | null;
}): LeaveDayInfo {
  const { dateStr, date, todayStr, holiday, leaves, currentEmployeeId } = params;
  const isToday = dateStr === todayStr;
  const isSunday = date.getDay() === 0;
  const hasOwnLeave = leaves.some(
    (l) => l.isOwn || l.employeeId === currentEmployeeId,
  );
  const hasOtherLeave = leaves.some(
    (l) => !(l.isOwn || l.employeeId === currentEmployeeId),
  );

  const categories: LeaveDayCategory[] = [];
  if (isToday) categories.push('today');
  if (holiday?.type === 'national') categories.push('nationalOrSunday');
  else if (isSunday) categories.push('nationalOrSunday');
  if (holiday?.type === 'collective') categories.push('collective');
  if (holiday?.type === 'company') categories.push('company');
  if (hasOwnLeave) categories.push('ownLeave');
  if (hasOtherLeave) categories.push('otherLeave');

  const primary = categories.find(
    (c) => c !== 'today',
  ) ?? (isToday ? 'today' : undefined);

  const backgroundClass = primary
    ? {
        nationalOrSunday: 'bg-red-100/80',
        collective: 'bg-purple-100/80',
        company: 'bg-cyan-100/80',
        ownLeave: 'bg-amber-100/80',
        otherLeave: 'bg-blue-100/80',
        today: '',
      }[primary]
    : '';

  const borderClass = isToday ? 'border-2 border-emerald-500' : '';

  return {
    dateStr,
    isToday,
    isSunday,
    holiday,
    leaves,
    categories,
    isInteractive: categories.length > 0,
    backgroundClass,
    borderClass,
  };
}

export function buildMonthSummary(params: {
  year: number;
  month: number;
  holidays: LeaveHoliday[];
  events: LeaveEvent[];
}): MonthSummaryItem[] {
  const { year, month, holidays, events } = params;
  const items: MonthSummaryItem[] = [];
  const fmt = (iso: string) => {
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const national = holidays.filter((h) => h.type === 'national');
  if (national.length) {
    items.push({
      category: 'nationalOrSunday',
      title: 'Libur Nasional',
      subtitle: national.map((h) => `${fmt(h.date)} — ${h.name}`).join('\n'),
    });
  }

  const collective = holidays.filter((h) => h.type === 'collective');
  if (collective.length) {
    items.push({
      category: 'collective',
      title: 'Cuti Bersama Pemerintah',
      subtitle: collective.map((h) => `${fmt(h.date)} — ${h.name}`).join('\n'),
    });
  }

  const company = holidays.filter((h) => h.type === 'company');
  if (company.length) {
    items.push({
      category: 'company',
      title: 'Libur Kantor',
      subtitle: company.map((h) => `${fmt(h.date)} — ${h.name}`).join('\n'),
    });
  }

  let sundayCount = 0;
  const totalDays = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= totalDays; d++) {
    if (new Date(year, month, d).getDay() === 0) sundayCount++;
  }
  if (sundayCount) {
    items.push({
      category: 'nationalOrSunday',
      title: 'Hari Minggu',
      subtitle: `${sundayCount} hari Minggu (libur mingguan)`,
    });
  }

  const own = events.filter((e) => e.isOwn);
  if (own.length) {
    items.push({
      category: 'ownLeave',
      title: 'Cuti Saya',
      subtitle: own
        .map((e) => `${fmt(e.start)}–${fmt(e.end)}: ${e.title}`)
        .join('\n'),
    });
  }

  const others = events.filter((e) => !e.isOwn);
  if (others.length) {
    items.push({
      category: 'otherLeave',
      title: 'Cuti Karyawan Lain',
      subtitle: others
        .map((e) => `${fmt(e.start)}–${fmt(e.end)}: ${e.employeeName}`)
        .join('\n'),
    });
  }

  return items;
}

export function holidayTypeLabel(type: string): string {
  switch (type) {
    case 'collective':
      return 'Cuti Bersama Pemerintah';
    case 'company':
      return 'Libur Kantor';
    default:
      return 'Libur Nasional';
  }
}

export function categoryLabel(cat: LeaveDayCategory): string {
  switch (cat) {
    case 'today':
      return 'Hari Ini';
    case 'nationalOrSunday':
      return 'Libur Nasional / Minggu';
    case 'collective':
      return 'Cuti Bersama';
    case 'company':
      return 'Libur Kantor';
    case 'ownLeave':
      return 'Cuti Saya';
    case 'otherLeave':
      return 'Cuti Karyawan Lain';
  }
}

export function todayLocalStr(): string {
  return toLocalDateStr(new Date());
}

export function dateToLocalStr(d: Date): string {
  return toLocalDateStr(d);
}

export function categoryDotColor(cat: LeaveDayCategory): string {
  return LEAVE_CALENDAR_COLORS[cat];
}
