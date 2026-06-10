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
        return this.getAttendanceReport(filters);
      case 'hr_leaves':
        return this.getLeaveReport(filters);
      case 'payroll_rekap':
        return this.getPayrollReport(filters);
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

  private async getAttendanceReport(filters: ReportFilters): Promise<ReportPreviewResult> {
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

  private async getLeaveReport(filters: ReportFilters): Promise<ReportPreviewResult> {
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

  private async getPayrollReport(filters: ReportFilters): Promise<ReportPreviewResult> {
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
