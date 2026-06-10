import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class LeaveService {
  constructor(private prisma: PrismaService) {}

  async findLeaveTypes() {
    return this.prisma.leaveType.findMany();
  }

  async getBalances(employeeId: string) {
    const leaveTypes = await this.prisma.leaveType.findMany();
    const requests = await this.prisma.leaveRequest.findMany({
      where: {
        employeeId,
        status: { in: [ApprovalStatus.APPROVED, ApprovalStatus.PENDING] },
      },
    });

    const adjustments = await this.prisma.auditLog.findMany({
      where: { action: 'leave.balance_adjust' },
      orderBy: { createdAt: 'desc' },
    });

    return leaveTypes.map(lt => {
      const used = requests
        .filter(r => r.leaveTypeId === lt.id && r.status === ApprovalStatus.APPROVED)
        .reduce((sum, r) => sum + r.totalDays, 0);

      const pending = requests
        .filter(r => r.leaveTypeId === lt.id && r.status === ApprovalStatus.PENDING)
        .reduce((sum, r) => sum + r.totalDays, 0);

      const adj = adjustments.find(a => {
        const details = a.details as any;
        return details?.employeeId === employeeId && details?.leaveTypeId === lt.id;
      });

      const finalQuota = adj ? (adj.details as any).quota : lt.maxDays;
      const finalUsed = adj ? (adj.details as any).used : used;

      return {
        id: lt.id,
        name: lt.name,
        quota: finalQuota,
        used: finalUsed,
        pending,
        remaining: finalQuota - finalUsed,
      };
    });
  }

  async getAllBalances() {
    const emps = await this.prisma.employee.findMany({
      include: { department: true }
    });
    
    const results: any[] = [];
    for (const emp of emps) {
      const bals = await this.getBalances(emp.id);
      bals.forEach(b => {
        results.push({
          id: `${emp.id}_${b.id}`,
          employee_id: emp.id,
          employee_name: emp.fullName,
          department_id: emp.departmentId,
          leave_type_id: b.id,
          leave_type_name: b.name,
          quota: b.quota,
          used: b.used,
          remaining: b.remaining,
          year: 2026,
        });
      });
    }
    return results;
  }

  async adjustBalance(userId: string, data: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: 'leave.balance_adjust',
        targetType: 'leave_balance',
        targetId: data.employeeId,
        targetName: `Adjust Balance`,
        details: {
          employeeId: data.employeeId,
          leaveTypeId: data.leaveTypeId,
          quota: parseInt(data.quota),
          used: parseInt(data.used),
          reason: data.reason
        }
      }
    });
  }


  async createRequest(employeeId: string, data: any, userId?: string) {
    // Check balance
    const balances = await this.getBalances(employeeId);
    const balance = balances.find(b => b.id === data.leaveTypeId);
    if (!balance) throw new NotFoundException('Tipe cuti tidak ditemukan');

    const totalDays = parseInt(data.totalDays) || 1;
    if (balance.remaining < totalDays) {
      throw new Error(`Kuota cuti tidak mencukupi. Kuota tersisa: ${balance.remaining} hari.`);
    }

    const request = await this.prisma.leaveRequest.create({
      data: {
        employeeId,
        leaveTypeId: data.leaveTypeId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDays,
        reason: data.reason || null,
        status: ApprovalStatus.PENDING,
      },
      include: {
        leaveType: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'leave.request_create',
        targetType: 'leave_request',
        targetId: request.id,
        targetName: `Cuti ${request.leaveType.name} (${totalDays} hari)`,
        details: request as any,
      },
    });

    return request;
  }

  async findMyRequests(employeeId: string) {
    return this.prisma.leaveRequest.findMany({
      where: { employeeId },
      include: { leaveType: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllRequests(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status.toUpperCase() as ApprovalStatus;
    }

    return this.prisma.leaveRequest.findMany({
      where,
      include: {
        leaveType: true,
        employee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async cancelRequest(id: string, employeeId: string, userId?: string) {
    const request = await this.prisma.leaveRequest.findUnique({
      where: { id },
      include: { leaveType: true },
    });
    if (!request) throw new NotFoundException('Pengajuan cuti tidak ditemukan');
    if (request.employeeId !== employeeId) {
      throw new UnauthorizedException('Anda tidak dapat membatalkan pengajuan cuti orang lain');
    }
    if (request.status !== ApprovalStatus.PENDING) {
      throw new Error('Hanya pengajuan berstatus PENDING yang dapat dibatalkan');
    }

    const deleted = await this.prisma.leaveRequest.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'leave.request_cancel',
        targetType: 'leave_request',
        targetId: id,
        targetName: `Batal Cuti ${request.leaveType.name}`,
        details: deleted as any,
      },
    });

    return deleted;
  }

  async getLeaveCalendar() {
    const approvedLeaves = await this.prisma.leaveRequest.findMany({
      where: { status: ApprovalStatus.APPROVED },
      include: {
        employee: true,
        leaveType: true,
      },
    });

    return approvedLeaves.map(al => ({
      id: al.id,
      title: `${al.employee.fullName} (${al.leaveType.name})`,
      start: al.startDate.toISOString().split('T')[0],
      end: al.endDate.toISOString().split('T')[0],
      allDay: true,
      employeeId: al.employeeId,
      employeeName: al.employee.fullName,
    }));
  }
}
