import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const ACTIVE_PO_STATUSES = ['PO Created', 'Sent to Vendor', 'Partially Received'];
const PENDING_STATUSES = ['Submitted', 'Draft'];
const STATUS_FLOW = [
  'Draft',
  'Submitted',
  'Approved',
  'PO Created',
  'Sent to Vendor',
  'Partially Received',
  'Fully Received',
  'Invoiced',
  'Paid',
];

const DEFAULT_VENDORS = [
  {
    name: 'PT. Computindo Utama',
    npwp: '01.234.567.8-012.000',
    contact: '(021) 556-9023 (Rony)',
    category: 'Laptop & Hardware Elektronik',
  },
  {
    name: 'Bhinneka Mandiri Prima',
    npwp: '02.554.891.2-021.000',
    contact: 'sales@bhinneka.com',
    category: 'Laptop & Hardware Elektronik',
  },
  {
    name: 'Tokopedia Corporate Account',
    npwp: '01.992.112.5-015.000',
    contact: 'corp@tokopedia.com',
    category: 'Alat Tulis Kantor (ATK)',
  },
];

interface LineItemInput {
  name: string;
  spec?: string;
  qty: number;
  unit: string;
  price: number;
}

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  private mapPO(po: any) {
    const items = (po.items as LineItemInput[]) || [];
    return {
      id: po.id,
      poNumber: po.poNumber,
      requesterId: po.requesterId,
      requesterName: po.requesterName,
      departmentId: po.departmentId,
      departmentName: po.department?.name || 'General',
      vendorName: po.vendorName,
      items: items.map((itm) => ({
        ...itm,
        total: (itm.qty || 0) * (itm.price || 0),
      })),
      subtotal: po.subtotal,
      taxEnabled: po.taxEnabled,
      taxPercentage: po.taxPercentage,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      targetDate: po.targetDate.toISOString(),
      status: po.status,
      notes: po.notes,
      createdAt: po.createdAt.toISOString(),
      updatedAt: po.updatedAt.toISOString(),
    };
  }

  private async ensureDefaultVendors() {
    const count = await this.prisma.procurementVendor.count();
    if (count > 0) return;

    await this.prisma.procurementVendor.createMany({
      data: DEFAULT_VENDORS,
      skipDuplicates: true,
    });
  }

  private async generatePoNumber() {
    const year = new Date().getFullYear();
    const prefix = `PO${year}`;
    const count = await this.prisma.purchaseOrder.count({
      where: { poNumber: { startsWith: prefix } },
    });
    return `${prefix}${String(count + 1).padStart(3, '0')}`;
  }

  private calculateTotals(
    items: LineItemInput[],
    taxEnabled: boolean,
    taxPercent: number,
  ) {
    const normalized = items.map((itm) => ({
      name: (itm.name || '').trim(),
      spec: (itm.spec || '').trim(),
      qty: Math.max(1, parseInt(String(itm.qty)) || 1),
      unit: (itm.unit || 'unit').trim() || 'unit',
      price: parseFloat(String(itm.price)) || 0,
    }));

    const subtotal = normalized.reduce(
      (sum, itm) => sum + itm.qty * itm.price,
      0,
    );
    const taxAmount = taxEnabled
      ? Math.round(subtotal * (taxPercent / 100))
      : 0;
    const totalAmount = subtotal + taxAmount;

    return { items: normalized, subtotal, taxAmount, totalAmount };
  }

  async getVendors() {
    await this.ensureDefaultVendors();
    return this.prisma.procurementVendor.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' },
    });
  }

  async getPOs() {
    const pos = await this.prisma.purchaseOrder.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });
    return pos.map((po) => this.mapPO(po));
  }

  async getPOById(id: string) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { department: true },
    });
    if (!po) {
      throw new NotFoundException('Purchase Order tidak ditemukan');
    }
    return this.mapPO(po);
  }

  async getDashboard() {
    const pos = await this.prisma.purchaseOrder.findMany({
      include: { department: true },
      orderBy: { createdAt: 'desc' },
    });

    const currentYearMonth = new Date().toISOString().substring(0, 7);
    const thisMonthPOs = pos.filter((p) =>
      p.createdAt.toISOString().startsWith(currentYearMonth),
    );

    const months = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'Mei',
      'Jun',
      'Jul',
      'Agu',
      'Sep',
      'Okt',
      'Nov',
      'Des',
    ];
    const monthlyValues = new Array(12).fill(0);
    pos.forEach((p) => {
      const monthIdx = p.createdAt.getMonth();
      monthlyValues[monthIdx] += p.totalAmount || p.subtotal || 0;
    });

    return {
      totalPrCount: thisMonthPOs.length,
      activePoCount: pos.filter((p) => ACTIVE_PO_STATUSES.includes(p.status))
        .length,
      thisMonthValue: thisMonthPOs.reduce(
        (sum, p) => sum + (p.totalAmount || p.subtotal || 0),
        0,
      ),
      pendingApprovalCount: pos.filter((p) => PENDING_STATUSES.includes(p.status))
        .length,
      recentActivities: pos.slice(0, 5).map((po) => this.mapPO(po)),
      monthlyTrend: {
        labels: months,
        values: monthlyValues,
      },
    };
  }

  async createPO(
    userId: string,
    userName: string,
    data: {
      departmentId?: string;
      targetDate: string;
      vendorName: string;
      notes?: string;
      items: LineItemInput[];
      taxEnabled?: boolean;
      taxPercent?: number;
      status?: string;
    },
  ) {
    if (!data.targetDate) {
      throw new BadRequestException('Tanggal dibutuhkan wajib diisi');
    }

    const items = Array.isArray(data.items) ? data.items : [];
    if (items.length === 0 || !items.some((itm) => itm.name?.trim())) {
      throw new BadRequestException('Minimal satu item pembelian wajib diisi');
    }

    const taxEnabled = data.taxEnabled !== false;
    const taxPercent = parseFloat(String(data.taxPercent ?? 11)) || 11;
    const targetStatus = data.status === 'Submitted' ? 'Submitted' : 'Draft';
    const { items: normalizedItems, subtotal, taxAmount, totalAmount } =
      this.calculateTotals(items, taxEnabled, taxPercent);

    const poNumber = await this.generatePoNumber();

    const po = await this.prisma.purchaseOrder.create({
      data: {
        poNumber,
        requesterId: userId,
        requesterName: userName,
        departmentId: data.departmentId || null,
        vendorName: data.vendorName || 'Lainnya',
        items: normalizedItems as any,
        subtotal,
        taxEnabled,
        taxPercentage: taxPercent,
        taxAmount,
        totalAmount,
        targetDate: new Date(data.targetDate),
        status: targetStatus,
        notes: data.notes?.trim() || null,
      },
      include: { department: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `procurement.create_${targetStatus.toLowerCase()}`,
        targetType: 'procurement',
        targetId: po.id,
        targetName: po.vendorName,
        details: { poNumber: po.poNumber, status: targetStatus } as any,
      },
    });

    return this.mapPO(po);
  }

  async updatePOStatus(id: string, targetStatus: string, userId: string, role: string) {
    const po = await this.prisma.purchaseOrder.findUnique({ where: { id } });
    if (!po) {
      throw new NotFoundException('Purchase Order tidak ditemukan');
    }

    if (!STATUS_FLOW.includes(targetStatus)) {
      throw new BadRequestException('Status tidak valid');
    }

    const isAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
    const isFinance = role === 'FINANCE';

    const allowedTransitions: Record<string, { statuses: string[]; roles: string[] }> = {
      Submitted: {
        statuses: ['Approved', 'Draft'],
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE', 'MANAGER'],
      },
      Approved: { statuses: ['PO Created'], roles: ['SUPER_ADMIN', 'HR_ADMIN'] },
      'PO Created': {
        statuses: ['Sent to Vendor'],
        roles: ['SUPER_ADMIN', 'HR_ADMIN'],
      },
      'Sent to Vendor': {
        statuses: ['Fully Received', 'Partially Received'],
        roles: ['SUPER_ADMIN', 'HR_ADMIN'],
      },
      'Partially Received': {
        statuses: ['Fully Received'],
        roles: ['SUPER_ADMIN', 'HR_ADMIN'],
      },
      'Fully Received': {
        statuses: ['Invoiced', 'Paid'],
        roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'],
      },
      Invoiced: { statuses: ['Paid'], roles: ['SUPER_ADMIN', 'HR_ADMIN', 'FINANCE'] },
    };

    const rule = allowedTransitions[po.status];
    if (!rule || !rule.statuses.includes(targetStatus)) {
      throw new BadRequestException(
        `Transisi status dari "${po.status}" ke "${targetStatus}" tidak diizinkan`,
      );
    }

    const canTransition =
      (isAdmin && rule.roles.some((r) => ['SUPER_ADMIN', 'HR_ADMIN'].includes(r))) ||
      (isFinance && rule.roles.includes('FINANCE')) ||
      (role === 'MANAGER' && rule.roles.includes('MANAGER'));

    if (!canTransition) {
      throw new UnauthorizedException('Anda tidak memiliki akses untuk mengubah status PO ini');
    }

    const before = { ...po };
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: targetStatus },
      include: { department: true },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'procurement.status_change',
        targetType: 'procurement',
        targetId: id,
        targetName: updated.vendorName,
        details: { before: { status: before.status }, after: { status: targetStatus } } as any,
      },
    });

    return this.mapPO(updated);
  }

  async getReport() {
    const pos = await this.getPOs();
    const approved = pos.filter(
      (po) =>
        ['Approved', 'PO Created', 'Sent to Vendor', 'Partially Received', 'Fully Received', 'Invoiced', 'Paid'].includes(
          po.status,
        ),
    );
    const pending = pos.filter((po) =>
      ['Draft', 'Submitted'].includes(po.status),
    );

    const totalApprovedBudget = approved.reduce(
      (sum, po) => sum + po.totalAmount,
      0,
    );
    const totalPendingBudget = pending.reduce(
      (sum, po) => sum + po.totalAmount,
      0,
    );

    return {
      totalApprovedBudget,
      totalPendingBudget,
      approvedCount: approved.length,
      pendingCount: pending.length,
      recentApproved: approved.slice(0, 5),
    };
  }
}
