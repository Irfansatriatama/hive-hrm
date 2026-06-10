import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ApprovalStatus } from '@prisma/client';

@Injectable()
export class ApprovalService {
  constructor(private prisma: PrismaService) {}

  async getPendingApprovals(role: string, employeeId: string) {
    const isHR = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
    const isManager = role === 'MANAGER';

    // If not HR or Manager, they shouldn't see approval inbox
    if (!isHR && !isManager) return [];

    const approvals: any[] = [];

    // 1. Profile Update Requests
    const profileRequests = await this.prisma.profileUpdateRequest.findMany({
      where: { status: ApprovalStatus.PENDING },
      include: { employee: true },
    });

    profileRequests.forEach(pr => {
      approvals.push({
        id: pr.id,
        type: 'profile_update',
        summary: pr.summary,
        requester_name: pr.employee.fullName,
        date_submitted: pr.createdAt.toISOString(),
        status: 'pending',
        reason: pr.reason,
        details: pr.details,
      });
    });

    // 2. Leave Requests
    // For Managers, only show their direct subordinates
    let leaveWhere: any = { status: ApprovalStatus.PENDING };
    if (isManager) {
      leaveWhere.employee = { managerId: employeeId };
    }

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: leaveWhere,
      include: {
        employee: true,
        leaveType: true,
      },
    });

    leaveRequests.forEach(lr => {
      approvals.push({
        id: lr.id,
        type: 'leave',
        summary: `Pengajuan Cuti ${lr.leaveType.name} (${lr.totalDays} hari)`,
        requester_name: lr.employee.fullName,
        date_submitted: lr.createdAt.toISOString(),
        status: 'pending',
        reason: lr.reason,
        details: {
          startDate: lr.startDate.toISOString().split('T')[0],
          endDate: lr.endDate.toISOString().split('T')[0],
          totalDays: lr.totalDays,
        },
      });
    });

    return approvals;
  }

  async actionApproval(
    type: string,
    id: string,
    action: 'approve' | 'reject',
    userId: string,
    employeeId: string
  ) {
    const status = action === 'approve' ? ApprovalStatus.APPROVED : ApprovalStatus.REJECTED;

    if (type === 'leave') {
      const lr = await this.prisma.leaveRequest.findUnique({
        where: { id },
        include: { leaveType: true, employee: true },
      });
      if (!lr) throw new NotFoundException('Pengajuan cuti tidak ditemukan');

      const updated = await this.prisma.leaveRequest.update({
        where: { id },
        data: {
          status,
          approvedBy: employeeId,
          approvedAt: new Date(),
        },
      });

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: action === 'approve' ? 'leave.approve' : 'leave.reject',
          targetType: 'leave_request',
          targetId: id,
          targetName: `Cuti ${lr.employee.fullName}`,
          details: updated as any,
        },
      });

      return updated;
    }

    if (type === 'profile_update') {
      const pr = await this.prisma.profileUpdateRequest.findUnique({
        where: { id },
        include: { employee: true },
      });
      if (!pr) throw new NotFoundException('Pengajuan perubahan data tidak ditemukan');

      const updated = await this.prisma.profileUpdateRequest.update({
        where: { id },
        data: { status },
      });

      // If approved, dynamically update the employee record
      if (action === 'approve') {
        const details = pr.details as any;
        const updateData: any = {};

        if (details.address) updateData.address = details.address;
        if (details.phone) updateData.phone = details.phone;
        if (details.email) updateData.email = details.email;

        // Apply edits
        if (Object.keys(updateData).length > 0) {
          await this.prisma.employee.update({
            where: { id: pr.employeeId },
            data: updateData,
          });
        }
      }

      await this.prisma.auditLog.create({
        data: {
          userId,
          action: action === 'approve' ? 'profile.approve' : 'profile.reject',
          targetType: 'profile_update_request',
          targetId: id,
          targetName: `Data ${pr.employee.fullName}`,
          details: updated as any,
        },
      });

      return updated;
    }

    throw new Error('Unsupported approval type');
  }

  async getRules() {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: { in: ['approval.rule_create', 'approval.rule_edit', 'approval.rule_delete'] } },
      orderBy: { createdAt: 'asc' }
    });

    let rules = [
      { id: "AR001", request_type: "leave", condition_desc: "Semua pengajuan cuti", chain: ["manager", "hr_admin"], deadline_hours: 48, status: "active" },
      { id: "AR002", request_type: "overtime", condition_desc: "Pengajuan lembur karyawan", chain: ["manager"], deadline_hours: 24, status: "active" },
      { id: "AR003", request_type: "procurement", condition_desc: "Purchase Request bernilai > Rp 5.000.000", chain: ["manager", "finance", "super_admin"], deadline_hours: 72, status: "active" },
      { id: "AR004", request_type: "reward", condition_desc: "Penukaran katalog reward", chain: ["hr_admin"], deadline_hours: 48, status: "active" }
    ];

    logs.forEach(log => {
      const details = log.details as any;
      if (log.action === 'approval.rule_create') {
        rules.push(details.rule);
      } else if (log.action === 'approval.rule_edit') {
        const idx = rules.findIndex(r => r.id === details.after.id);
        if (idx !== -1) {
          rules[idx] = details.after;
        }
      } else if (log.action === 'approval.rule_delete') {
        rules = rules.filter(r => r.id !== details.deletedRule.id);
      }
    });

    return rules;
  }

  async createRule(userId: string, data: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: 'approval.rule_create',
        targetType: 'approval_rule',
        targetId: data.id,
        targetName: data.request_type,
        details: { rule: data } as any,
      }
    });
  }

  async updateRule(userId: string, id: string, before: any, after: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: 'approval.rule_edit',
        targetType: 'approval_rule',
        targetId: id,
        targetName: after.request_type,
        details: { before, after } as any,
      }
    });
  }

  async deleteRule(userId: string, id: string, deletedRule: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: 'approval.rule_delete',
        targetType: 'approval_rule',
        targetId: id,
        targetName: deletedRule.request_type,
        details: { deletedRule } as any,
      }
    });
  }

  async getSettings() {
    const latestLog = await this.prisma.auditLog.findFirst({
      where: { action: 'approval.settings_save' },
      orderBy: { createdAt: 'desc' }
    });

    if (latestLog) {
      return (latestLog.details as any).after;
    }

    return {
      email_notifications: true,
      auto_reminder_hours: 24,
      auto_delegation_enabled: false,
      global_deadline_hours: 48
    };
  }

  async saveSettings(userId: string, before: any, after: any) {
    return this.prisma.auditLog.create({
      data: {
        userId,
        action: 'approval.settings_save',
        targetType: 'settings',
        targetId: 'approval_settings',
        targetName: 'Approval Settings',
        details: { before, after } as any,
      }
    });
  }
}

