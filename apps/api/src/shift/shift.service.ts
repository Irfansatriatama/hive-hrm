import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/** Parse YYYY-MM-DD as UTC midnight — avoids @db.Date timezone drift */
function parseDateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function formatDateOnly(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
@Injectable()
export class ShiftService {
  constructor(private prisma: PrismaService) {}

  async getShiftTypes() {
    return this.prisma.shift.findMany({
      orderBy: { startTime: 'asc' },
    });
  }

  async createShiftType(data: {
    name: string;
    startTime: string;
    endTime: string;
    color?: string;
    split?: boolean;
    breakTime?: number;
    isDefault?: boolean;
  }) {
    if (data.isDefault) {
      await this.prisma.shift.updateMany({ data: { isDefault: false } });
    }
    return this.prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        color: data.color || '#3B82F6',
        split: data.split || false,
        breakTime: data.breakTime != null ? parseInt(String(data.breakTime)) : 60,
        isDefault: data.isDefault || false,
      },
    });
  }

  async updateShiftType(
    id: string,
    data: {
      name?: string;
      startTime?: string;
      endTime?: string;
      color?: string;
      split?: boolean;
      breakTime?: number;
      isDefault?: boolean;
    },
  ) {
    const existing = await this.prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shift tidak ditemukan');

    if (data.isDefault) {
      await this.prisma.shift.updateMany({ data: { isDefault: false } });
    }

    return this.prisma.shift.update({
      where: { id },
      data: {
        ...(data.name != null && { name: data.name }),
        ...(data.startTime != null && { startTime: data.startTime }),
        ...(data.endTime != null && { endTime: data.endTime }),
        ...(data.color != null && { color: data.color }),
        ...(data.split != null && { split: data.split }),
        ...(data.breakTime != null && { breakTime: parseInt(String(data.breakTime)) }),
        ...(data.isDefault != null && { isDefault: data.isDefault }),
      },
    });
  }

  async deleteShiftType(id: string) {
    const existing = await this.prisma.shift.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Shift tidak ditemukan');

    await this.prisma.employeeShiftSchedule.updateMany({
      where: { shiftId: id },
      data: { shiftId: null },
    });

    return this.prisma.shift.delete({ where: { id } });
  }

  async getWeeklySchedule(weekStart: string, departmentId?: string) {
    const start = parseDateOnly(weekStart);
    const end = addDays(start, 6);

    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(departmentId ? { departmentId } : {}),
      },
      include: { department: true },
      orderBy: { fullName: 'asc' },
    });

    const schedules = await this.prisma.employeeShiftSchedule.findMany({
      where: {
        date: { gte: start, lte: end },
        employeeId: { in: employees.map((e) => e.id) },
      },
      include: { shift: true },
    });

    return {
      employees,
      schedules: schedules.map((s) => ({
        id: s.id,
        employeeId: s.employeeId,
        date: formatDateOnly(s.date),
        shiftId: s.shiftId,
        shift: s.shift,
      })),
    };
  }

  async assignSchedule(employeeId: string, dateStr: string, shiftId: string | null) {
    const date = parseDateOnly(dateStr);

    if (!shiftId) {
      await this.prisma.employeeShiftSchedule.deleteMany({
        where: { employeeId, date },
      });
      return { employeeId, date: dateStr, shiftId: null };
    }

    const record = await this.prisma.employeeShiftSchedule.upsert({
      where: {
        employeeId_date: { employeeId, date },
      },
      create: { employeeId, date, shiftId },
      update: { shiftId },
      include: { shift: true },
    });

    return {
      id: record.id,
      employeeId: record.employeeId,
      date: dateStr,
      shiftId: record.shiftId,
      shift: record.shift,
    };
  }
  async copyWeekSchedule(weekStart: string) {
    const start = parseDateOnly(weekStart);
    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      select: { id: true },
    });

    let count = 0;

    for (let i = 0; i < 7; i++) {
      const currentDay = addDays(start, i);
      const prevDay = addDays(currentDay, -7);

      const prevSchedules = await this.prisma.employeeShiftSchedule.findMany({
        where: {
          date: prevDay,
          employeeId: { in: employees.map((e) => e.id) },
          shiftId: { not: null },
        },
      });

      for (const prev of prevSchedules) {
        if (!prev.shiftId) continue;

        await this.prisma.employeeShiftSchedule.upsert({
          where: {
            employeeId_date: { employeeId: prev.employeeId, date: currentDay },
          },
          create: {
            employeeId: prev.employeeId,
            date: currentDay,
            shiftId: prev.shiftId,
          },
          update: { shiftId: prev.shiftId },
        });
        count++;
      }
    }

    return { count };
  }

  async getSwaps() {
    return this.prisma.shiftSwap.findMany({
      include: {
        requester: true,
        partner: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSwap(
    requesterId: string,
    data: { partnerId: string; date: string; shiftDetails: string },
  ) {
    return this.prisma.shiftSwap.create({
      data: {
        requesterId,
        partnerId: data.partnerId,
        date: parseDateOnly(data.date),
        shiftDetails: data.shiftDetails,
        status: 'pending',
      },
      include: {
        requester: true,
        partner: true,
      },
    });
  }

  async updateSwapStatus(id: string, status: string) {
    const existing = await this.prisma.shiftSwap.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Permintaan tukar shift tidak ditemukan');

    return this.prisma.shiftSwap.update({
      where: { id },
      data: { status },
      include: {
        requester: true,
        partner: true,
      },
    });
  }
}
