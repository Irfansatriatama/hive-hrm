import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProcurementService {
  constructor(private prisma: PrismaService) {}

  async getPOs() {
    const logs = await this.prisma.auditLog.findMany({
      where: { action: 'procurement.create_po' },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map(l => {
      const details = l.details as any;
      return {
        id: l.id,
        poNumber: details?.poNumber || `PO-${l.id.substring(0, 8).toUpperCase()}`,
        itemName: details?.itemName || l.targetName,
        quantity: details?.quantity || 1,
        price: details?.price || 0,
        totalPrice: (details?.quantity || 1) * (details?.price || 0),
        status: details?.status || 'pending',
        requester: details?.requester || 'Standard Employee',
        createdAt: l.createdAt.toISOString(),
      };
    });
  }

  async createPO(userId: string, userName: string, data: any) {
    const total = (parseInt(data.quantity) || 1) * (parseFloat(data.price) || 0);
    const count = await this.prisma.auditLog.count({ where: { action: 'procurement.create_po' } });
    const poNumber = `PO-2026-${String(count + 1).padStart(4, '0')}`;

    const po = await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'procurement.create_po',
        targetType: 'purchase_order',
        targetName: data.itemName,
        details: {
          poNumber,
          itemName: data.itemName,
          quantity: parseInt(data.quantity) || 1,
          price: parseFloat(data.price) || 0,
          status: 'pending',
          requester: userName,
        } as any,
      },
    });

    return po;
  }

  async approveOrRejectPO(id: string, action: 'approve' | 'reject', userId: string) {
    const po = await this.prisma.auditLog.findUnique({ where: { id } });
    if (!po || po.action !== 'procurement.create_po') {
      throw new NotFoundException('Purchase Order tidak ditemukan');
    }

    const details = po.details as any;
    details.status = action === 'approve' ? 'approved' : 'rejected';

    await this.prisma.auditLog.update({
      where: { id },
      data: {
        details: details as any,
      },
    });

    // Also write a history action log
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: `procurement.${action}`,
        targetType: 'purchase_order',
        targetId: id,
        targetName: po.targetName,
        details: { poNumber: details.poNumber } as any,
      },
    });

    return details;
  }

  async getReport() {
    const pos = await this.getPOs();
    const approved = pos.filter(po => po.status === 'approved');
    const pending = pos.filter(po => po.status === 'pending');

    const totalApprovedBudget = approved.reduce((sum, po) => sum + po.totalPrice, 0);
    const totalPendingBudget = pending.reduce((sum, po) => sum + po.totalPrice, 0);

    return {
      totalApprovedBudget,
      totalPendingBudget,
      approvedCount: approved.length,
      pendingCount: pending.length,
      recentApproved: approved.slice(0, 5),
    };
  }
}
