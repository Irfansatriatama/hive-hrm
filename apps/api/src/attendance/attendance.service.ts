import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Attendance } from '@prisma/client';

export const DEFAULT_ATTENDANCE_SETTINGS = {
  check_in_limit: '08:00',
  check_out_limit: '17:00',
  late_tolerance: 15,
  early_checkout_tolerance: 10,
  overtime_start_delay: 30,
  overtime_calculation_method: 'hourly',
  working_days: ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'],
  fingerprint_integration: false,
};

type AttendanceSettings = typeof DEFAULT_ATTENDANCE_SETTINGS;

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async loadSettings(): Promise<AttendanceSettings> {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'attendance_settings' },
    });
    if (setting?.value) {
      return { ...DEFAULT_ATTENDANCE_SETTINGS, ...(setting.value as object) };
    }
    return { ...DEFAULT_ATTENDANCE_SETTINGS };
  }

  private timeOnDate(base: Date, timeStr: string): Date {
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date(base);
    d.setHours(h, m, 0, 0);
    return d;
  }

  calculateLateMinutes(checkIn: Date, settings: AttendanceSettings): number {
    const baseline = this.timeOnDate(checkIn, settings.check_in_limit);
    baseline.setMinutes(baseline.getMinutes() + settings.late_tolerance);
    if (checkIn <= baseline) return 0;
    return Math.round((checkIn.getTime() - baseline.getTime()) / (1000 * 60));
  }

  calculateOvertimeMinutes(checkOut: Date, settings: AttendanceSettings): number {
    const baseline = this.timeOnDate(checkOut, settings.check_out_limit);
    baseline.setMinutes(baseline.getMinutes() + settings.overtime_start_delay);
    if (checkOut <= baseline) return 0;

    let diffMinutes = Math.round(
      (checkOut.getTime() - baseline.getTime()) / (1000 * 60),
    );

    if (settings.overtime_calculation_method === 'half_hourly') {
      diffMinutes = Math.floor(diffMinutes / 30) * 30;
    } else {
      diffMinutes = Math.floor(diffMinutes / 60) * 60;
    }

    return diffMinutes;
  }

  calculateEarlyLeaveMinutes(checkOut: Date, settings: AttendanceSettings): number {
    const earliest = this.timeOnDate(checkOut, settings.check_out_limit);
    earliest.setMinutes(earliest.getMinutes() - settings.early_checkout_tolerance);
    if (checkOut >= earliest) return 0;
    return Math.round((earliest.getTime() - checkOut.getTime()) / (1000 * 60));
  }

  async enrichRecord(record: Attendance, settings?: AttendanceSettings) {
    const s = settings ?? (await this.loadSettings());
    const overtimeMinutes =
      record.overtimeMinutes ??
      (record.checkOut ? this.calculateOvertimeMinutes(record.checkOut, s) : 0);
    const earlyLeaveMinutes =
      record.earlyLeaveMinutes ??
      (record.checkOut ? this.calculateEarlyLeaveMinutes(record.checkOut, s) : 0);

    return {
      ...record,
      overtimeMinutes,
      earlyLeaveMinutes,
      checkInLatitude: record.latitude,
      checkInLongitude: record.longitude,
      checkOutLatitude: record.checkOutLatitude,
      checkOutLongitude: record.checkOutLongitude,
    };
  }

  async getTodayStatus(employeeId: string) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const record = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: todayStart, lte: todayEnd },
      },
    });

    if (!record) return null;
    return this.enrichRecord(record);
  }

  async checkIn(
    employeeId: string,
    data: {
      location?: string;
      notes?: string;
      latitude?: number;
      longitude?: number;
      checkInNote?: string;
      selfieUrl?: string;
    },
  ) {
    const todayStatus = await this.getTodayStatus(employeeId);
    if (todayStatus) {
      throw new Error('Karyawan sudah melakukan check-in hari ini');
    }

    const settings = await this.loadSettings();
    const now = new Date();
    const lateMinutes = this.calculateLateMinutes(now, settings);
    const status = lateMinutes > 0 ? 'Late' : 'On Time';

    const created = await this.prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(),
        checkIn: now,
        status,
        lateMinutes,
        location:
          data.location ||
          (data.latitude != null && data.longitude != null
            ? `${data.latitude}, ${data.longitude}`
            : 'Head Office'),
        notes: data.notes || null,
        latitude: data.latitude ?? null,
        longitude: data.longitude ?? null,
        checkInNote: data.checkInNote ?? null,
        selfieUrl: data.selfieUrl ?? null,
      },
    });

    return this.enrichRecord(created, settings);
  }

  async checkOut(
    employeeId: string,
    data?: { latitude?: number; longitude?: number; checkOutNote?: string },
  ) {
    const record = await this.prisma.attendance.findFirst({
      where: {
        employeeId,
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Karyawan belum melakukan check-in hari ini');
    }
    if (record.checkOut) {
      throw new Error('Karyawan sudah melakukan check-out hari ini');
    }

    const settings = await this.loadSettings();
    const now = new Date();
    let workHours = 0;
    if (record.checkIn) {
      workHours = (now.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
      workHours = Math.round(workHours * 10) / 10;
    }

    const overtimeMinutes = this.calculateOvertimeMinutes(now, settings);
    const earlyLeaveMinutes = this.calculateEarlyLeaveMinutes(now, settings);

    const updated = await this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        workHours,
        overtimeMinutes,
        earlyLeaveMinutes,
        checkOutLatitude: data?.latitude ?? null,
        checkOutLongitude: data?.longitude ?? null,
        checkOutNote: data?.checkOutNote ?? null,
      },
    });

    return this.enrichRecord(updated, settings);
  }

  async getMyHistory(employeeId: string, month?: number, year?: number) {
    const where: { employeeId: string; date?: { gte: Date; lte: Date } } = {
      employeeId,
    };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    const settings = await this.loadSettings();
    const records = await this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      ...(month && year ? {} : { take: 30 }),
    });

    return Promise.all(records.map((r) => this.enrichRecord(r, settings)));
  }

  async getMySummary(employeeId: string, month?: number, year?: number) {
    const now = new Date();
    const y = year ?? now.getFullYear();
    const settings = await this.loadSettings();

    let start: Date;
    let end: Date;
    let periodLabel: string;

    if (month && month >= 1 && month <= 12) {
      start = new Date(y, month - 1, 1);
      end = new Date(y, month, 0, 23, 59, 59, 999);
      periodLabel = `${month}/${y}`;
    } else {
      start = new Date(y, 0, 1);
      end = new Date(y, 11, 31, 23, 59, 59, 999);
      periodLabel = `${y}`;
    }

    const records = await this.prisma.attendance.findMany({
      where: {
        employeeId,
        date: { gte: start, lte: end },
      },
      orderBy: { date: 'asc' },
    });

    let present = 0;
    let late = 0;
    let absent = 0;
    let totalWorkHours = 0;
    let totalOvertimeMinutes = 0;
    let totalLateMinutes = 0;
    let workDayCount = 0;

    for (const row of records) {
      const enriched = await this.enrichRecord(row, settings);
      const status = (row.status || '').toLowerCase();

      if (status.includes('absent') || status.includes('alpha')) {
        absent += 1;
      } else if (row.lateMinutes && row.lateMinutes > 0) {
        late += 1;
        present += 1;
      } else if (row.checkIn) {
        present += 1;
      }

      if (row.workHours) {
        totalWorkHours += row.workHours;
        workDayCount += 1;
      }
      totalOvertimeMinutes += enriched.overtimeMinutes ?? 0;
      totalLateMinutes += row.lateMinutes ?? 0;
    }

    return {
      period: periodLabel,
      month: month ?? null,
      year: y,
      totalRecords: records.length,
      present,
      late,
      absent,
      totalWorkHours: Math.round(totalWorkHours * 10) / 10,
      avgWorkHours:
        workDayCount > 0
          ? Math.round((totalWorkHours / workDayCount) * 10) / 10
          : 0,
      totalOvertimeMinutes,
      totalOvertimeHours: Math.round((totalOvertimeMinutes / 60) * 10) / 10,
      totalLateMinutes,
      settings: {
        check_in_limit: settings.check_in_limit,
        check_out_limit: settings.check_out_limit,
        overtime_start_delay: settings.overtime_start_delay,
      },
    };
  }

  async getRecordById(employeeId: string, id: string) {
    const record = await this.prisma.attendance.findFirst({
      where: { id, employeeId },
    });
    if (!record) {
      throw new NotFoundException('Data absensi tidak ditemukan');
    }
    return this.enrichRecord(record);
  }

  async getReport() {
    const settings = await this.loadSettings();
    const records = await this.prisma.attendance.findMany({
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return Promise.all(
      records.map(async (r) => ({
        ...(await this.enrichRecord(r, settings)),
        employee: r.employee,
      })),
    );
  }

  async bulkUpdateStatus(ids: string[], newStatus: string, userId?: string) {
    const settings = await this.loadSettings();
    const records = await this.prisma.attendance.findMany({
      where: { id: { in: ids } },
      include: { employee: true },
    });

    for (const record of records) {
      const before = record.status;
      const updateData: Record<string, unknown> = { status: newStatus };

      if (newStatus === 'Absent') {
        updateData.checkIn = null;
        updateData.checkOut = null;
        updateData.workHours = null;
        updateData.lateMinutes = null;
        updateData.overtimeMinutes = null;
        updateData.earlyLeaveMinutes = null;
      } else if (newStatus === 'On Time' && !record.checkIn) {
        const date = new Date(record.date);
        const checkIn = this.timeOnDate(date, settings.check_in_limit);
        const checkOut = this.timeOnDate(date, settings.check_out_limit);
        updateData.checkIn = checkIn;
        updateData.checkOut = checkOut;
        updateData.workHours =
          Math.round(
            ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 10,
          ) / 10;
        updateData.overtimeMinutes = 0;
        updateData.earlyLeaveMinutes = 0;
      }

      await this.prisma.attendance.update({
        where: { id: record.id },
        data: updateData,
      });

      if (userId) {
        await this.prisma.auditLog.create({
          data: {
            userId,
            action: 'attendance.bulk_edit',
            targetType: 'attendance',
            targetId: record.id,
            targetName: record.employee.fullName,
            details: { before, after: newStatus },
          },
        });
      }
    }

    return { count: records.length };
  }

  async getSettings() {
    return this.loadSettings();
  }

  async updateSettings(data: Record<string, unknown>, userId?: string) {
    const before = await this.loadSettings();
    const merged = { ...before, ...data };

    await this.prisma.appSetting.upsert({
      where: { key: 'attendance_settings' },
      update: { value: merged as any },
      create: { key: 'attendance_settings', value: merged as any },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'attendance.settings_save',
          targetType: 'settings',
          targetId: 'attendance_settings',
          targetName: 'Attendance Settings',
          details: { before, after: merged },
        },
      });
    }

    return merged;
  }
}
