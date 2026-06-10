import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RewardService {
  // Mock catalog items
  private catalog = [
    { id: 'CAT001', name: 'Voucher Belanja Indomaret Rp 50.000', points: 250, category: 'voucher' },
    { id: 'CAT002', name: 'Tumbler Eksklusif NDI', points: 400, category: 'merchandise' },
    { id: 'CAT003', name: 'Voucher Grab/Gojek Rp 100.000', points: 500, category: 'voucher' },
    { id: 'CAT004', name: 'Jaket Hoodie HIVE HRM', points: 800, category: 'merchandise' },
  ];

  constructor(private prisma: PrismaService) {}

  async getPointsBalance(employeeId: string, userId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['reward.send_points', 'reward.redeem'] },
      },
    });

    let balance = 1000; // Starting baseline

    logs.forEach(l => {
      const details = l.details as any;
      if (!details) return;

      if (l.action === 'reward.send_points') {
        // Sent
        if (l.userId === userId) {
          balance -= parseInt(details.points) || 0;
        }
        // Received
        if (l.targetId === employeeId) {
          balance += parseInt(details.points) || 0;
        }
      }

      if (l.action === 'reward.redeem') {
        if (l.userId === userId) {
          balance -= parseInt(details.points) || 0;
        }
      }
    });

    return balance;
  }

  async sendAppreciation(
    senderUserId: string,
    senderEmployeeId: string,
    recipientEmployeeId: string,
    data: { points: number; message: string; hashtag: string }
  ) {
    const balance = await this.getPointsBalance(senderEmployeeId, senderUserId);
    const pointsToSend = parseInt(data.points as any) || 0;
    if (balance < pointsToSend) {
      throw new Error(`Poin Anda tidak mencukupi. Sisa poin: ${balance}`);
    }

    const recipient = await this.prisma.employee.findUnique({
      where: { id: recipientEmployeeId },
    });
    if (!recipient) throw new NotFoundException('Karyawan penerima tidak ditemukan');

    const log = await this.prisma.auditLog.create({
      data: {
        userId: senderUserId,
        action: 'reward.send_points',
        targetType: 'employee',
        targetId: recipientEmployeeId,
        targetName: recipient.fullName,
        details: {
          points: pointsToSend,
          message: data.message,
          hashtag: data.hashtag,
          senderName: senderEmployeeId,
        } as any,
      },
    });

    return log;
  }

  async getCatalog() {
    return this.catalog;
  }

  async redeemItem(
    userId: string,
    employeeId: string,
    employeeName: string,
    itemId: string
  ) {
    const item = this.catalog.find(i => i.id === itemId);
    if (!item) throw new NotFoundException('Item katalog tidak ditemukan');

    const balance = await this.getPointsBalance(employeeId, userId);
    if (balance < item.points) {
      throw new Error(`Poin Anda tidak mencukupi untuk menukarkan item ini. Butuh: ${item.points}, Sisa: ${balance}`);
    }

    const log = await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'reward.redeem',
        targetType: 'reward_catalog',
        targetId: item.id,
        targetName: item.name,
        details: {
          points: item.points,
          employeeName,
          status: 'approved', // Auto-approved in this mock flow
        } as any,
      },
    });

    return log;
  }

  async getTransactions(employeeId: string, userId: string) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        action: { in: ['reward.send_points', 'reward.redeem'] },
      },
      orderBy: { createdAt: 'desc' },
    });

    const txs: any[] = [];

    logs.forEach(l => {
      const details = l.details as any;
      if (!details) return;

      // Send transaction
      if (l.action === 'reward.send_points') {
        const isSender = l.userId === userId;
        const isRecipient = l.targetId === employeeId;

        if (isSender || isRecipient) {
          txs.push({
            id: l.id,
            date: l.createdAt.toISOString(),
            description: isSender
              ? `Apresiasi kepada ${l.targetName} (${details.hashtag})`
              : `Menerima apresiasi dari rekan kerja (${details.hashtag})`,
            points: details.points,
            type: isSender ? 'debit' : 'credit',
            message: details.message,
          });
        }
      }

      // Redeem transaction
      if (l.action === 'reward.redeem' && l.userId === userId) {
        txs.push({
          id: l.id,
          date: l.createdAt.toISOString(),
          description: `Penukaran hadiah: ${l.targetName}`,
          points: details.points,
          type: 'debit',
          message: 'Item siap diambil di HRD',
        });
      }
    });

    return txs;
  }
}
