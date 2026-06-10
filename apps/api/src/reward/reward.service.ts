import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export const DEFAULT_REWARD_SETTINGS = {
  max_give_daily: 100,
  max_receive_monthly: 500,
  manager_multiplier: 1.5,
};

const STARTING_BALANCE = 1000;

@Injectable()
export class RewardService {
  constructor(private prisma: PrismaService) {}

  private async loadSettings() {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'reward_settings' },
    });
    if (setting?.value) {
      return { ...DEFAULT_REWARD_SETTINGS, ...(setting.value as object) };
    }
    return { ...DEFAULT_REWARD_SETTINGS };
  }

  private async getOrCreateBalance(employeeId: string) {
    const existing = await this.prisma.employeePointBalance.findUnique({
      where: { employeeId },
    });
    if (existing) return existing;

    return this.prisma.employeePointBalance.create({
      data: { employeeId, balance: STARTING_BALANCE },
    });
  }

  async getPointsBalance(employeeId: string) {
    const balance = await this.getOrCreateBalance(employeeId);
    return balance.balance;
  }

  async getSettings() {
    return this.loadSettings();
  }

  async updateSettings(data: Record<string, unknown>, userId?: string) {
    const before = await this.loadSettings();
    const merged = { ...before, ...data };

    await this.prisma.appSetting.upsert({
      where: { key: 'reward_settings' },
      update: { value: merged as any },
      create: { key: 'reward_settings', value: merged as any },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.settings_save',
          targetType: 'settings',
          targetId: 'reward_settings',
          targetName: 'Reward Points Rule Settings',
          details: { before, after: merged },
        },
      });
    }

    return merged;
  }

  async getCatalog(includeInactive = false) {
    return this.prisma.rewardCatalogItem.findMany({
      where: includeInactive ? undefined : { status: 'active' },
      orderBy: { name: 'asc' },
    });
  }

  async createCatalogItem(
    data: {
      name: string;
      description: string;
      points: number;
      stock: number;
      category: string;
      status?: string;
    },
    userId?: string
  ) {
    if (!data.name?.trim() || !data.description?.trim()) {
      throw new BadRequestException('Nama dan deskripsi wajib diisi');
    }
    if (data.points <= 0 || data.stock < 0) {
      throw new BadRequestException('Poin dan stok harus valid');
    }

    const item = await this.prisma.rewardCatalogItem.create({
      data: {
        name: data.name.trim(),
        description: data.description.trim(),
        points: data.points,
        stock: data.stock,
        category: data.category,
        status: data.status || 'active',
      },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.catalog_create',
          targetType: 'reward',
          targetId: item.id,
          targetName: item.name,
          details: { item },
        },
      });
    }

    return item;
  }

  async updateCatalogItem(
    id: string,
    data: {
      name?: string;
      description?: string;
      points?: number;
      stock?: number;
      category?: string;
      status?: string;
    },
    userId?: string
  ) {
    const existing = await this.prisma.rewardCatalogItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item katalog tidak ditemukan');

    const item = await this.prisma.rewardCatalogItem.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.points !== undefined && { points: data.points }),
        ...(data.stock !== undefined && { stock: data.stock }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.catalog_edit',
          targetType: 'reward',
          targetId: id,
          targetName: item.name,
          details: { before: existing, after: item },
        },
      });
    }

    return item;
  }

  async deleteCatalogItem(id: string, userId?: string) {
    const existing = await this.prisma.rewardCatalogItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Item katalog tidak ditemukan');

    await this.prisma.rewardCatalogItem.delete({ where: { id } });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.catalog_delete',
          targetType: 'reward',
          targetId: id,
          targetName: existing.name,
          details: { deleted: existing },
        },
      });
    }

    return { success: true };
  }

  async getHashtags() {
    return this.prisma.rewardHashtag.findMany({
      orderBy: { tag: 'asc' },
    });
  }

  async createHashtag(
    data: { tag: string; description: string; status?: string },
    userId?: string
  ) {
    let tag = data.tag.trim();
    if (!tag || !data.description?.trim()) {
      throw new BadRequestException('Hashtag dan deskripsi wajib diisi');
    }
    if (!tag.startsWith('#')) tag = `#${tag}`;

    const item = await this.prisma.rewardHashtag.create({
      data: {
        tag,
        description: data.description.trim(),
        status: data.status || 'active',
      },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.hashtag_create',
          targetType: 'hashtag',
          targetId: tag,
          targetName: tag,
          details: { hashtag: item },
        },
      });
    }

    return item;
  }

  async updateHashtag(
    id: string,
    data: { tag?: string; description?: string; status?: string },
    userId?: string
  ) {
    const existing = await this.prisma.rewardHashtag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Hashtag tidak ditemukan');

    let tag = data.tag?.trim();
    if (tag && !tag.startsWith('#')) tag = `#${tag}`;

    const item = await this.prisma.rewardHashtag.update({
      where: { id },
      data: {
        ...(tag !== undefined && { tag }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.hashtag_edit',
          targetType: 'hashtag',
          targetId: item.tag,
          targetName: item.tag,
          details: { before: existing, after: item },
        },
      });
    }

    return item;
  }

  async deleteHashtag(id: string, userId?: string) {
    const existing = await this.prisma.rewardHashtag.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Hashtag tidak ditemukan');

    await this.prisma.rewardHashtag.delete({ where: { id } });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.hashtag_delete',
          targetType: 'hashtag',
          targetId: existing.tag,
          targetName: existing.tag,
          details: { deleted: existing },
        },
      });
    }

    return { success: true };
  }

  async sendAppreciation(
    senderUserId: string,
    senderEmployeeId: string,
    recipientEmployeeId: string,
    data: { points: number; message: string; hashtag: string }
  ) {
    const pointsToSend = parseInt(data.points as any) || 0;
    if (!recipientEmployeeId || !data.hashtag || !data.message?.trim()) {
      throw new BadRequestException('Mohon lengkapi seluruh field apresiasi poin');
    }
    if (pointsToSend < 10 || pointsToSend > 100) {
      throw new BadRequestException('Batas pengiriman poin adalah 10 hingga 100 poin per transaksi');
    }
    if (senderEmployeeId === recipientEmployeeId) {
      throw new BadRequestException('Tidak dapat mengirim poin ke diri sendiri');
    }

    const recipient = await this.prisma.employee.findUnique({
      where: { id: recipientEmployeeId },
    });
    if (!recipient) throw new NotFoundException('Karyawan penerima tidak ditemukan');

    const sender = await this.prisma.employee.findUnique({
      where: { id: senderEmployeeId },
    });
    if (!sender) throw new NotFoundException('Profil pengirim tidak ditemukan');

    const recipientBalance = await this.getOrCreateBalance(recipientEmployeeId);
    const newRecipientBalance = recipientBalance.balance + pointsToSend;

    const tx = await this.prisma.$transaction(async (tx) => {
      await tx.employeePointBalance.update({
        where: { employeeId: recipientEmployeeId },
        data: { balance: newRecipientBalance },
      });

      const hashtagRecord = await tx.rewardHashtag.findUnique({
        where: { tag: data.hashtag },
      });
      if (hashtagRecord) {
        await tx.rewardHashtag.update({
          where: { id: hashtagRecord.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      return tx.rewardPointTransaction.create({
        data: {
          employeeId: recipientEmployeeId,
          senderEmployeeId,
          type: 'received',
          points: pointsToSend,
          hashtag: data.hashtag,
          message: data.message.trim(),
          balanceAfter: newRecipientBalance,
          counterpartyName: sender.fullName,
        },
        include: {
          employee: true,
          senderEmployee: true,
        },
      });
    });

    await this.prisma.auditLog.create({
      data: {
        userId: senderUserId,
        action: 'reward.give',
        targetType: 'reward_points',
        targetId: tx.id,
        targetName: recipient.fullName,
        details: {
          from: sender.fullName,
          points: pointsToSend,
          hashtag: data.hashtag,
        },
      },
    });

    return tx;
  }

  async redeemItem(userId: string, employeeId: string, itemId: string) {
    const item = await this.prisma.rewardCatalogItem.findUnique({ where: { id: itemId } });
    if (!item || item.status !== 'active') {
      throw new NotFoundException('Item katalog tidak ditemukan');
    }
    if (item.stock <= 0) {
      throw new BadRequestException('Stok item habis');
    }

    const balance = await this.getOrCreateBalance(employeeId);
    if (balance.balance < item.points) {
      throw new BadRequestException(
        `Poin Anda tidak mencukupi untuk menukarkan item ini. Butuh: ${item.points}, Sisa: ${balance.balance}`
      );
    }

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Profil karyawan tidak ditemukan');

    const redemption = await this.prisma.rewardRedemption.create({
      data: {
        employeeId,
        rewardCatalogId: item.id,
        points: item.points,
        status: 'pending',
      },
      include: {
        employee: true,
        rewardCatalog: true,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'reward.redeem_request',
        targetType: 'reward_redemption',
        targetId: redemption.id,
        targetName: item.name,
        details: { requester: employee.fullName, points: item.points },
      },
    });

    return redemption;
  }

  async getRedemptions(filters?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    return this.prisma.rewardRedemption.findMany({
      where,
      include: {
        employee: true,
        rewardCatalog: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approveRedemption(id: string, userId?: string) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id },
      include: { employee: true, rewardCatalog: true },
    });
    if (!redemption) throw new NotFoundException('Klaim tidak ditemukan');
    if (redemption.status !== 'pending') {
      throw new BadRequestException('Klaim sudah diproses');
    }

    const balance = await this.getOrCreateBalance(redemption.employeeId);
    if (balance.balance < redemption.points) {
      throw new BadRequestException('Saldo poin karyawan tidak mencukupi');
    }
    if (redemption.rewardCatalog.stock <= 0) {
      throw new BadRequestException('Stok reward habis');
    }

    const newBalance = balance.balance - redemption.points;
    const now = new Date();

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.employeePointBalance.update({
        where: { employeeId: redemption.employeeId },
        data: { balance: newBalance },
      });

      await tx.rewardCatalogItem.update({
        where: { id: redemption.rewardCatalogId },
        data: { stock: { decrement: 1 } },
      });

      const updated = await tx.rewardRedemption.update({
        where: { id },
        data: {
          status: 'approved',
          dateProcessed: now,
          notes: 'Klaim disetujui, siap diambil di HRD.',
        },
        include: { employee: true, rewardCatalog: true },
      });

      await tx.rewardPointTransaction.create({
        data: {
          employeeId: redemption.employeeId,
          type: 'redeemed',
          points: redemption.points,
          message: `Penukaran poin dengan reward ${redemption.rewardCatalog.name}`,
          balanceAfter: newBalance,
          counterpartyName: redemption.rewardCatalog.name,
          rewardCatalogId: redemption.rewardCatalogId,
          redemptionId: redemption.id,
        },
      });

      return updated;
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.redeem_approve',
          targetType: 'reward_redemption',
          targetId: id,
          targetName: redemption.rewardCatalog.name,
          details: { employee: redemption.employee.fullName },
        },
      });
    }

    return result;
  }

  async rejectRedemption(id: string, notes?: string, userId?: string) {
    const redemption = await this.prisma.rewardRedemption.findUnique({
      where: { id },
      include: { employee: true, rewardCatalog: true },
    });
    if (!redemption) throw new NotFoundException('Klaim tidak ditemukan');
    if (redemption.status !== 'pending') {
      throw new BadRequestException('Klaim sudah diproses');
    }

    const updated = await this.prisma.rewardRedemption.update({
      where: { id },
      data: {
        status: 'rejected',
        dateProcessed: new Date(),
        notes: notes || 'Klaim ditolak oleh HR.',
      },
      include: { employee: true, rewardCatalog: true },
    });

    if (userId) {
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'reward.redeem_reject',
          targetType: 'reward_redemption',
          targetId: id,
          targetName: redemption.rewardCatalog.name,
          details: { employee: redemption.employee.fullName, notes },
        },
      });
    }

    return updated;
  }

  async getHashtagReport(filters?: {
    departmentId?: string;
    hashtag?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, unknown> = { type: 'received' };

    if (filters?.hashtag) {
      where.hashtag = filters.hashtag;
    }

    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    const txs = await this.prisma.rewardPointTransaction.findMany({
      where,
      include: {
        employee: { include: { department: true } },
        senderEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (filters?.departmentId) {
      return txs.filter((tx) => tx.employee.departmentId === filters.departmentId);
    }

    return txs;
  }

  async getLedger(filters?: {
    employeeId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const where: Record<string, unknown> = {};

    if (filters?.employeeId) {
      where.employeeId = filters.employeeId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.startDate || filters?.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        (where.createdAt as Record<string, Date>).gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        (where.createdAt as Record<string, Date>).lte = end;
      }
    }

    return this.prisma.rewardPointTransaction.findMany({
      where,
      include: {
        employee: true,
        senderEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMyTransactions(employeeId: string, limit = 50) {
    return this.prisma.rewardPointTransaction.findMany({
      where: {
        OR: [{ employeeId }, { senderEmployeeId: employeeId }],
      },
      include: {
        employee: true,
        senderEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getRecentFeed(limit = 5) {
    return this.prisma.rewardPointTransaction.findMany({
      where: { type: 'received' },
      include: {
        employee: true,
        senderEmployee: true,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  mapTransactionRow(tx: {
    id: string;
    type: string;
    points: number;
    hashtag?: string | null;
    message?: string | null;
    balanceAfter?: number | null;
    counterpartyName?: string | null;
    createdAt: Date;
    employee: { fullName: string; id: string };
    senderEmployee?: { fullName: string; id: string } | null;
  }) {
    const senderName =
      tx.type === 'received'
        ? tx.senderEmployee?.fullName || tx.counterpartyName || '-'
        : tx.employee.fullName;
    const recipientName =
      tx.type === 'received' ? tx.employee.fullName : tx.counterpartyName || '-';

    return {
      id: tx.id,
      employeeId: tx.employee.id,
      employeeName: tx.employee.fullName,
      senderName,
      recipientName,
      senderReceiverName: tx.counterpartyName || '-',
      type: tx.type,
      points: tx.points,
      hashtag: tx.hashtag || '',
      message: tx.message || '',
      date: tx.createdAt.toISOString(),
      balanceAfter: tx.balanceAfter,
    };
  }
}
