import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AttendanceService {
  private settings = {
    workStart: '08:00',
    workEnd: '17:00',
    gracePeriod: 15, // minutes
    officeLat: -6.2088,
    officeLng: 106.8456,
    radius: 100, // meters
  };

  constructor(private prisma: PrismaService) {}

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

  async checkIn(employeeId: string, data: { location?: string; notes?: string }) {
    const todayStatus = await this.getTodayStatus(employeeId);
    if (todayStatus) {
      throw new Error('Karyawan sudah melakukan check-in hari ini');
    }

    const now = new Date();
    const workStartHour = 8;
    const workStartMin = 0;
    
    const checkInTime = new Date();
    const baseline = new Date();
    baseline.setHours(workStartHour, workStartMin, 0, 0);
    
    let status = 'hadir';
    let lateMinutes = 0;
    
    const diff = (checkInTime.getTime() - baseline.getTime()) / (1000 * 60);
    if (diff > this.settings.gracePeriod) {
      status = 'late';
      lateMinutes = Math.round(diff);
    }

    return this.prisma.attendance.create({
      data: {
        employeeId,
        date: new Date(),
        checkIn: now,
        status,
        lateMinutes,
        location: data.location || 'Head Office',
        notes: data.notes || null,
      },
    });
  }

  async checkOut(employeeId: string) {
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
      },
    });
  }

  async getMyHistory(employeeId: string) {
    return this.prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { date: 'desc' },
      take: 30,
    });
  }

  async getReport(query: { search?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) {
    const { search, startDate, endDate, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.date.lte = end;
      }
    }

    if (search) {
      where.employee = {
        fullName: { contains: search, mode: 'insensitive' },
      };
    }

    const [logs, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        include: { employee: true },
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendance.count({ where }),
    ]);

    return { logs, total };
  }

  getSettings() {
    return this.settings;
  }

  updateSettings(data: any) {
    this.settings = { ...this.settings, ...data };
    return this.settings;
  }
}
