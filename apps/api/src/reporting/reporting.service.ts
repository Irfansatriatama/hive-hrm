import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ReportType =
  | 'hr_attendance'
  | 'hr_leaves'
  | 'payroll_rekap'
  | 'perf_hashtags'
  | 'assets_borrowed'
  | 'proc_po';

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  departmentId?: string;
  employeeId?: string;
}

export interface ReportPreviewResult {
  title: string;
  headers: string[];
  columns: string[];
  rows: Record<string, string | number>[];
  badgeColumns: string[];
}

const REPORT_TITLES: Record<ReportType, string> = {
  hr_attendance: 'Laporan Rekapitulasi Kehadiran',
  hr_leaves: 'Laporan Status dan Rekapitulasi Cuti',
  payroll_rekap: 'Laporan Gaji per Departemen',
  perf_hashtags: 'Laporan Nilai Perusahaan (#Hashtag)',
  assets_borrowed: 'Laporan Peminjaman Aset',
  proc_po: 'Laporan Rekapitulasi Purchase Order',
};

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  getReportTitle(type: ReportType): string {
    return REPORT_TITLES[type] || 'Laporan Custom';
  }

  async getPreview(type: string, filters: ReportFilters): Promise<ReportPreviewResult> {
    if (!this.isValidReportType(type)) {
      throw new BadRequestException('Jenis laporan tidak valid');
    }

    switch (type) {
      case 'hr_attendance':
        return this.getAttendancePreview(filters);
      case 'hr_leaves':
        return this.getLeavePreview(filters);
      case 'payroll_rekap':
        return this.getPayrollPreview(filters);
      case 'perf_hashtags':
        return this.getHashtagReport(filters);
      case 'assets_borrowed':
        return this.getAssetsBorrowedReport(filters);
      case 'proc_po':
        return this.getProcurementReport(filters);
      default:
        throw new BadRequestException('Jenis laporan tidak valid');
    }
  }

  private isValidReportType(type: string): type is ReportType {
    return Object.keys(REPORT_TITLES).includes(type);
  }

  private buildDateRange(filters: ReportFilters) {
    const range: { gte?: Date; lte?: Date } = {};
    if (filters.startDate) {
      range.gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }
    return Object.keys(range).length > 0 ? range : undefined;
  }

  private formatDateShort(value?: Date | string | null): string {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  private formatTime(value?: Date | string | null): string {
    if (!value) return '-';
    const date = typeof value === 'string' ? new Date(value) : value;
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  }

  private formatDuration(checkIn?: Date | null, checkOut?: Date | null, workHours?: number | null): string {
    if (workHours) {
      const hrs = Math.floor(workHours);
      const mins = Math.round((workHours - hrs) * 60);
      return `${hrs}h ${mins}m`;
    }
    if (checkIn && checkOut) {
      const diff = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60);
      const hrs = Math.floor(diff / 60);
      const mins = Math.round(diff % 60);
      return `${hrs}h ${mins}m`;
    }
    return '-';
  }

  private formatRupiah(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  private getMonthRange(month: number, year: number) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    return { start, end };
  }

  private normalizeAttendanceStatus(status: string, lateMinutes?: number | null, checkIn?: Date | null) {
    const s = (status || '').toLowerCase();
    if (lateMinutes && lateMinutes > 0) return 'telat';
    if (s.includes('late') || s.includes('telat')) return 'telat';
    if (s.includes('alpha') || s.includes('absent')) return 'alpha';
    if (s.includes('izin') || s.includes('sakit') || s.includes('leave') || s.includes('permission')) {
      return 'izin';
    }
    if (checkIn || s.includes('on time') || s.includes('hadir') || s.includes('present')) {
      return 'hadir';
    }
    return 'alpha';
  }

  async getAttendanceReport(month: number, year: number) {
    const { start, end } = this.getMonthRange(month, year);
    const records = await this.prisma.attendance.findMany({
      where: { date: { gte: start, lte: end } },
      include: {
        employee: { include: { department: true } },
      },
    });

    const deptMap = new Map<
      string,
      { dept: string; hadir: number; izin: number; alpha: number; telat: number; totalHours: number; hourCount: number }
    >();
    const lateCountMap = new Map<string, { employee: (typeof records)[0]['employee']; count: number }>();

    for (const row of records) {
      const deptId = row.employee.departmentId || 'unassigned';
      const deptName = row.employee.department?.name || 'Tanpa Departemen';
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { dept: deptName, hadir: 0, izin: 0, alpha: 0, telat: 0, totalHours: 0, hourCount: 0 });
      }
      const entry = deptMap.get(deptId)!;
      const normalized = this.normalizeAttendanceStatus(row.status, row.lateMinutes, row.checkIn);
      entry[normalized as 'hadir' | 'izin' | 'alpha' | 'telat'] += 1;
      if (row.workHours) {
        entry.totalHours += row.workHours;
        entry.hourCount += 1;
      }

      if (normalized === 'telat') {
        const existing = lateCountMap.get(row.employeeId);
        if (existing) {
          existing.count += 1;
        } else {
          lateCountMap.set(row.employeeId, { employee: row.employee, count: 1 });
        }
      }
    }

    const byDept = [...deptMap.values()].map((d) => ({
      dept: d.dept,
      hadir: d.hadir,
      izin: d.izin,
      alpha: d.alpha,
      telat: d.telat,
      avgHours: d.hourCount > 0 ? Math.round((d.totalHours / d.hourCount) * 10) / 10 : 0,
    }));

    const topLate = [...lateCountMap.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((item) => ({
        id: item.employee.id,
        fullName: item.employee.fullName,
        department: item.employee.department?.name || '-',
        lateCount: item.count,
      }));

    return { byDept, topLate };
  }

  async getLeaveReport(month: number, year: number) {
    const { start, end } = this.getMonthRange(month, year);
    const records = await this.prisma.leaveRequest.findMany({
      where: {
        status: 'APPROVED',
        startDate: { lte: end },
        endDate: { gte: start },
      },
      include: {
        employee: { include: { department: true } },
        leaveType: true,
      },
    });

    const typeMap = new Map<string, { type: string; totalDays: number }>();
    const deptMap = new Map<string, { dept: string; totalDays: number }>();
    let total = 0;

    for (const row of records) {
      total += row.totalDays;
      const typeKey = row.leaveTypeId;
      if (!typeMap.has(typeKey)) {
        typeMap.set(typeKey, { type: row.leaveType.name, totalDays: 0 });
      }
      typeMap.get(typeKey)!.totalDays += row.totalDays;

      const deptId = row.employee.departmentId || 'unassigned';
      const deptName = row.employee.department?.name || 'Tanpa Departemen';
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { dept: deptName, totalDays: 0 });
      }
      deptMap.get(deptId)!.totalDays += row.totalDays;
    }

    return {
      byType: [...typeMap.values()],
      byDept: [...deptMap.values()],
      total,
    };
  }

  async getPayrollReport(periodId?: string) {
    if (periodId) {
      const records = await this.prisma.payrollRecord.findMany({
        where: { periodId },
        include: {
          employee: { include: { department: true } },
        },
      });

      const deptMap = new Map<
        string,
        { dept: string; gross: number; deduct: number; net: number; count: number }
      >();
      let totalGross = 0;
      let totalDeduct = 0;
      let totalNet = 0;

      for (const row of records) {
        totalGross += row.grossSalary;
        totalDeduct += row.totalDeduct;
        totalNet += row.netSalary;

        const deptId = row.employee.departmentId || 'unassigned';
        const deptName = row.employee.department?.name || 'Tanpa Departemen';
        if (!deptMap.has(deptId)) {
          deptMap.set(deptId, { dept: deptName, gross: 0, deduct: 0, net: 0, count: 0 });
        }
        const entry = deptMap.get(deptId)!;
        entry.gross += row.grossSalary;
        entry.deduct += row.totalDeduct;
        entry.net += row.netSalary;
        entry.count += 1;
      }

      return {
        totalGross,
        totalDeduct,
        totalNet,
        byDept: [...deptMap.values()],
        employeeCount: records.length,
        source: 'period' as const,
      };
    }

    const employees = await this.prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: { department: true },
    });

    const deptMap = new Map<
      string,
      { dept: string; gross: number; deduct: number; net: number; count: number }
    >();
    let totalGross = 0;
    let totalDeduct = 0;
    let totalNet = 0;

    for (const emp of employees) {
      const basicSalary = emp.basicSalary || emp.salary || 0;
      const taxEstimate = Math.round(basicSalary * 0.05);
      const bpjsEstimate = Math.round(basicSalary * 0.03);
      const gross = basicSalary;
      const deduct = taxEstimate + bpjsEstimate;
      const net = gross - deduct;

      totalGross += gross;
      totalDeduct += deduct;
      totalNet += net;

      const deptId = emp.departmentId || 'unassigned';
      const deptName = emp.department?.name || 'Tanpa Departemen';
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { dept: deptName, gross: 0, deduct: 0, net: 0, count: 0 });
      }
      const entry = deptMap.get(deptId)!;
      entry.gross += gross;
      entry.deduct += deduct;
      entry.net += net;
      entry.count += 1;
    }

    return {
      totalGross,
      totalDeduct,
      totalNet,
      byDept: [...deptMap.values()],
      employeeCount: employees.length,
      source: 'estimate' as const,
    };
  }

  async getHeadcountReport() {
    const employees = await this.prisma.employee.findMany({
      include: { department: true },
    });

    const deptMap = new Map<string, { dept: string; count: number }>();
    const statusMap = new Map<string, number>();
    const genderMap = new Map<string, number>();

    for (const emp of employees) {
      const deptId = emp.departmentId || 'unassigned';
      const deptName = emp.department?.name || 'Tanpa Departemen';
      if (!deptMap.has(deptId)) {
        deptMap.set(deptId, { dept: deptName, count: 0 });
      }
      deptMap.get(deptId)!.count += 1;

      statusMap.set(emp.status, (statusMap.get(emp.status) || 0) + 1);
      genderMap.set(emp.gender || 'Unknown', (genderMap.get(emp.gender || 'Unknown') || 0) + 1);
    }

    const now = new Date();
    const joinTrend: { month: string; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const count = employees.filter(
        (e) => e.joinDate && e.joinDate >= monthStart && e.joinDate <= monthEnd,
      ).length;
      const label = monthStart.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
      joinTrend.push({ month: label, count });
    }

    return {
      byDept: [...deptMap.values()],
      byStatus: [...statusMap.entries()].map(([status, count]) => ({ status, count })),
      byGender: [...genderMap.entries()].map(([gender, count]) => ({ gender, count })),
      joinTrend,
      total: employees.length,
    };
  }

  async getExpenseReport(month: number, year: number) {
    try {
      const { start, end } = this.getMonthRange(month, year);
      const claims = await this.prisma.expenseClaim.findMany({
        where: {
          createdAt: { gte: start, lte: end },
          status: { in: ['submitted', 'approved', 'paid'] },
        },
        include: {
          items: { include: { category: true } },
        },
      });

      const categoryMap = new Map<string, { category: string; totalAmount: number }>();
      let totalAmount = 0;

      for (const claim of claims) {
        totalAmount += claim.totalAmount;
        for (const item of claim.items) {
          const catName = item.category?.name || 'Lain-lain';
          if (!categoryMap.has(catName)) {
            categoryMap.set(catName, { category: catName, totalAmount: 0 });
          }
          categoryMap.get(catName)!.totalAmount += item.amount;
        }
        if (claim.items.length === 0) {
          const catName = 'Tanpa Kategori';
          if (!categoryMap.has(catName)) {
            categoryMap.set(catName, { category: catName, totalAmount: 0 });
          }
          categoryMap.get(catName)!.totalAmount += claim.totalAmount;
        }
      }

      return {
        byCategory: [...categoryMap.values()],
        totalAmount,
        claimCount: claims.length,
      };
    } catch {
      return { byCategory: [], totalAmount: 0, claimCount: 0 };
    }
  }

  private async getAttendancePreview(filters: ReportFilters): Promise<ReportPreviewResult> {
    const dateRange = this.buildDateRange(filters);
    const records = await this.prisma.attendance.findMany({
      where: {
        ...(dateRange ? { date: dateRange } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.departmentId
          ? { employee: { departmentId: filters.departmentId } }
          : {}),
      },
      include: {
        employee: { include: { department: true } },
      },
      orderBy: { date: 'desc' },
    });

    return {
      title: REPORT_TITLES.hr_attendance,
      headers: ['Nama Karyawan', 'Dept', 'Tanggal', 'Masuk', 'Keluar', 'Durasi', 'Status'],
      columns: ['employeeName', 'department', 'date', 'checkIn', 'checkOut', 'duration', 'status'],
      badgeColumns: ['status'],
      rows: records.map((row) => ({
        employeeName: row.employee.fullName,
        department: row.employee.department?.name || '-',
        date: this.formatDateShort(row.date),
        checkIn: this.formatTime(row.checkIn),
        checkOut: this.formatTime(row.checkOut),
        duration: this.formatDuration(row.checkIn, row.checkOut, row.workHours),
        status: row.status,
      })),
    };
  }

  private async getLeavePreview(filters: ReportFilters): Promise<ReportPreviewResult> {
    const dateRange = this.buildDateRange(filters);
    const records = await this.prisma.leaveRequest.findMany({
      where: {
        ...(dateRange ? { startDate: dateRange } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.departmentId
          ? { employee: { departmentId: filters.departmentId } }
          : {}),
      },
      include: {
        employee: true,
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const approverIds = [
      ...new Set(records.map((r) => r.approvedBy).filter(Boolean)),
    ] as string[];

    const approvers =
      approverIds.length > 0
        ? await this.prisma.employee.findMany({
            where: { id: { in: approverIds } },
            select: { id: true, fullName: true },
          })
        : [];

    const approverMap = new Map(approvers.map((a) => [a.id, a.fullName]));

    return {
      title: REPORT_TITLES.hr_leaves,
      headers: ['Nama Karyawan', 'Tipe Cuti', 'Mulai', 'Selesai', 'Hari Kerja', 'Status', 'Penyetuju'],
      columns: ['employeeName', 'leaveType', 'startDate', 'endDate', 'totalDays', 'status', 'approver'],
      badgeColumns: ['status'],
      rows: records.map((row) => ({
        employeeName: row.employee.fullName,
        leaveType: row.leaveType.name,
        startDate: this.formatDateShort(row.startDate),
        endDate: this.formatDateShort(row.endDate),
        totalDays: `${row.totalDays} Hari`,
        status: row.status.toLowerCase(),
        approver: row.approvedBy ? approverMap.get(row.approvedBy) || '-' : '-',
      })),
    };
  }

  private async getPayrollPreview(filters: ReportFilters): Promise<ReportPreviewResult> {
    const employees = await this.prisma.employee.findMany({
      where: {
        status: 'ACTIVE',
        ...(filters.employeeId ? { id: filters.employeeId } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      },
      include: { department: true },
      orderBy: { fullName: 'asc' },
    });

    return {
      title: REPORT_TITLES.payroll_rekap,
      headers: ['Karyawan', 'Departemen', 'Rekening Bank', 'Gaji Pokok', 'PPh 21 (Est)', 'BPJS (1%)', 'Net Salary'],
      columns: ['employeeName', 'department', 'bankAccount', 'basicSalary', 'taxEstimate', 'bpjsEstimate', 'netSalary'],
      badgeColumns: [],
      rows: employees.map((emp) => {
        const basicSalary = emp.basicSalary || emp.salary || 0;
        const taxEstimate = Math.round(basicSalary * 0.05);
        const bpjsEstimate = Math.round(basicSalary * 0.01);
        const netSalary = basicSalary - taxEstimate - bpjsEstimate;

        return {
          employeeName: emp.fullName,
          department: emp.department?.name || '-',
          bankAccount: `BCA ${emp.employeeNumber}`,
          basicSalary: this.formatRupiah(basicSalary),
          taxEstimate: this.formatRupiah(taxEstimate),
          bpjsEstimate: this.formatRupiah(bpjsEstimate),
          netSalary: this.formatRupiah(netSalary),
        };
      }),
    };
  }

  private async getHashtagReport(filters: ReportFilters): Promise<ReportPreviewResult> {
    const dateRange = this.buildDateRange(filters);
    const records = await this.prisma.rewardPointTransaction.findMany({
      where: {
        type: 'received',
        ...(dateRange ? { createdAt: dateRange } : {}),
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.departmentId
          ? { employee: { departmentId: filters.departmentId } }
          : {}),
      },
      include: {
        employee: true,
        senderEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      title: REPORT_TITLES.perf_hashtags,
      headers: ['Hashtag', 'Karyawan Penerima', 'Poin Masuk', 'Dari Pemberi', 'Tanggal'],
      columns: ['hashtag', 'employeeName', 'points', 'senderName', 'date'],
      badgeColumns: [],
      rows: records.map((row) => ({
        hashtag: row.hashtag || '-',
        employeeName: row.employee.fullName,
        points: `${row.points} Pts`,
        senderName: row.senderEmployee?.fullName || row.counterpartyName || '-',
        date: this.formatDateShort(row.createdAt),
      })),
    };
  }

  private async getAssetsBorrowedReport(filters: ReportFilters): Promise<ReportPreviewResult> {
    const dateRange = this.buildDateRange(filters);
    const assets = await this.prisma.asset.findMany({
      where: {
        employeeId: { not: null },
        ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
        ...(filters.departmentId
          ? { employee: { departmentId: filters.departmentId } }
          : {}),
        ...(dateRange?.gte || dateRange?.lte
          ? {
              assignedDate: {
                ...(dateRange.gte ? { gte: dateRange.gte } : {}),
                ...(dateRange.lte ? { lte: dateRange.lte } : {}),
              },
            }
          : {}),
      },
      include: { employee: true },
      orderBy: { assignedDate: 'desc' },
    });

    return {
      title: REPORT_TITLES.assets_borrowed,
      headers: ['Aset ID / Nama', 'Brand / Model', 'Kategori', 'Dipinjam Oleh', 'Mulai Pinjam', 'Status'],
      columns: ['assetName', 'brandModel', 'category', 'borrowedBy', 'assignedDate', 'status'],
      badgeColumns: ['status'],
      rows: assets.map((row) => ({
        assetName: `${row.name} (${row.assetCode})`,
        brandModel: `${row.brand || ''} ${row.model || ''}`.trim() || '-',
        category: row.category,
        borrowedBy: row.employee?.fullName || '-',
        assignedDate: this.formatDateShort(row.assignedDate),
        status: row.status,
      })),
    };
  }

  private async getProcurementReport(filters: ReportFilters): Promise<ReportPreviewResult> {
    const dateRange = this.buildDateRange(filters);
    const pos = await this.prisma.purchaseOrder.findMany({
      where: {
        ...(dateRange ? { createdAt: dateRange } : {}),
        ...(filters.departmentId ? { departmentId: filters.departmentId } : {}),
      },
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      title: REPORT_TITLES.proc_po,
      headers: ['No PO', 'Pemohon', 'Vendor', 'Subtotal', 'Pajak', 'Total', 'Tanggal Buat', 'Status'],
      columns: ['poNumber', 'requesterName', 'vendorName', 'subtotal', 'taxAmount', 'totalAmount', 'dateCreated', 'status'],
      badgeColumns: ['status'],
      rows: pos.map((row) => ({
        poNumber: row.poNumber,
        requesterName: row.requesterName,
        vendorName: row.vendorName,
        subtotal: this.formatRupiah(row.subtotal),
        taxAmount: this.formatRupiah(row.taxAmount),
        totalAmount: this.formatRupiah(row.totalAmount),
        dateCreated: this.formatDateShort(row.createdAt),
        status: row.status,
      })),
    };
  }
}
