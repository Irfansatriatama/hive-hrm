import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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

@Injectable()
export class AttendanceService {
  constructor(private prisma: PrismaService) {}

  private async loadSettings() {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'attendance_settings' },
    });
    if (setting?.value) {
      return { ...DEFAULT_ATTENDANCE_SETTINGS, ...(setting.value as object) };
    }
    return { ...DEFAULT_ATTENDANCE_SETTINGS };
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

    return record || null;
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

    const [limitH, limitM] = settings.check_in_limit.split(':').map(Number);
    const baseline = new Date();
    baseline.setHours(limitH, limitM + settings.late_tolerance, 0, 0);

    let status = 'On Time';
    let lateMinutes = 0;

    if (now > baseline) {
      status = 'Late';
      lateMinutes = Math.round((now.getTime() - baseline.getTime()) / (1000 * 60));
    }

    return this.prisma.attendance.create({
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
  }

  async checkOut(
    employeeId: string,
    data?: { latitude?: number; longitude?: number; checkOutNote?: string },
  ) {
    const record = await this.getTodayStatus(employeeId);
    if (!record) {
      throw new NotFoundException('Karyawan belum melakukan check-in hari ini');
    }
    if (record.checkOut) {
      throw new Error('Karyawan sudah melakukan check-out hari ini');
    }

    const now = new Date();
    let workHours = 0;
    if (record.checkIn) {
      workHours = (now.getTime() - record.checkIn.getTime()) / (1000 * 60 * 60);
      workHours = Math.round(workHours * 10) / 10;
    }

    return this.prisma.attendance.update({
      where: { id: record.id },
      data: {
        checkOut: now,
        workHours,
        latitude: data?.latitude ?? record.latitude,
        longitude: data?.longitude ?? record.longitude,
        checkOutNote: data?.checkOutNote ?? null,
      },
    });
  }

  async getMyHistory(employeeId: string, month?: number, year?: number) {
    const where: { employeeId: string; date?: { gte: Date; lte: Date } } = { employeeId };

    if (month && year) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      where.date = { gte: start, lte: end };
    }

    return this.prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      ...(month && year ? {} : { take: 30 }),
    });
  }

  async getReport() {
    return this.prisma.attendance.findMany({
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { date: 'desc' },
    });
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
      } else if (newStatus === 'On Time' && !record.checkIn) {
        const date = new Date(record.date);
        const [h, m] = settings.check_in_limit.split(':').map(Number);
        const checkIn = new Date(date);
        checkIn.setHours(h, m, 0, 0);
        const [oh, om] = settings.check_out_limit.split(':').map(Number);
        const checkOut = new Date(date);
        checkOut.setHours(oh, om, 0, 0);
        updateData.checkIn = checkIn;
        updateData.checkOut = checkOut;
        updateData.workHours =
          Math.round(((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)) * 10) / 10;
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
