import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  private async expireOverdueLicenses() {
    const now = new Date();
    await this.prisma.employeeLicense.updateMany({
      where: {
        status: 'active',
        expiryDate: { lt: now },
      },
      data: { status: 'expired' },
    });
  }

  async findTypes() {
    return this.prisma.licenseType.findMany({
      include: { _count: { select: { licenses: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createType(data: any) {
    return this.prisma.licenseType.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description || null,
        validityDays: data.validityDays !== undefined && data.validityDays !== null && data.validityDays !== ''
          ? parseInt(data.validityDays, 10)
          : 365,
      },
    });
  }

  async updateType(id: string, data: any) {
    const type = await this.prisma.licenseType.findUnique({ where: { id } });
    if (!type) throw new NotFoundException('License type not found');

    return this.prisma.licenseType.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.code !== undefined && { code: data.code }),
        ...(data.description !== undefined && { description: data.description || null }),
        ...(data.validityDays !== undefined && {
          validityDays: data.validityDays !== null && data.validityDays !== ''
            ? parseInt(data.validityDays, 10)
            : 365,
        }),
      },
    });
  }

  async deleteType(id: string) {
    const type = await this.prisma.licenseType.findUnique({
      where: { id },
      include: { _count: { select: { licenses: true } } },
    });
    if (!type) throw new NotFoundException('License type not found');
    if (type._count.licenses > 0) {
      throw new BadRequestException('Cannot delete license type that is in use');
    }
    return this.prisma.licenseType.delete({ where: { id } });
  }

  async findAll(filters?: { employeeId?: string; typeId?: string; status?: string }) {
    await this.expireOverdueLicenses();

    const where: any = {};
    if (filters?.employeeId) where.employeeId = filters.employeeId;
    if (filters?.typeId) where.licenseTypeId = filters.typeId;
    if (filters?.status) where.status = filters.status;

    return this.prisma.employeeLicense.findMany({
      where,
      include: {
        employee: { include: { department: true, position: true } },
        licenseType: true,
      },
      orderBy: [{ expiryDate: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findExpiring() {
    await this.expireOverdueLicenses();

    const now = new Date();
    const in30Days = new Date();
    in30Days.setDate(in30Days.getDate() + 30);

    return this.prisma.employeeLicense.findMany({
      where: {
        status: 'active',
        expiryDate: { lte: in30Days, not: null },
      },
      include: {
        employee: { include: { department: true, position: true } },
        licenseType: true,
      },
      orderBy: { expiryDate: 'asc' },
    });
  }

  private async getLicenseOrThrow(id: string) {
    const license = await this.prisma.employeeLicense.findUnique({
      where: { id },
      include: {
        employee: { include: { department: true, position: true } },
        licenseType: true,
      },
    });
    if (!license) throw new NotFoundException('License not found');
    return license;
  }

  async findById(id: string) {
    await this.expireOverdueLicenses();
    return this.getLicenseOrThrow(id);
  }

  async create(data: any) {
    let expiryDate = data.expiryDate ? new Date(data.expiryDate) : null;

    if (!expiryDate && data.licenseTypeId && data.issuedDate) {
      const type = await this.prisma.licenseType.findUnique({ where: { id: data.licenseTypeId } });
      if (type) {
        expiryDate = new Date(data.issuedDate);
        expiryDate.setDate(expiryDate.getDate() + type.validityDays);
      }
    }

    return this.prisma.employeeLicense.create({
      data: {
        employeeId: data.employeeId,
        licenseTypeId: data.licenseTypeId || null,
        name: data.name,
        licenseNumber: data.licenseNumber || null,
        issuedBy: data.issuedBy || null,
        issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
        expiryDate,
        status: data.status || 'active',
        fileUrl: data.fileUrl || null,
        notes: data.notes || null,
      },
      include: {
        employee: { include: { department: true, position: true } },
        licenseType: true,
      },
    });
  }

  async update(id: string, data: any) {
    await this.getLicenseOrThrow(id);

    return this.prisma.employeeLicense.update({
      where: { id },
      data: {
        ...(data.licenseTypeId !== undefined && { licenseTypeId: data.licenseTypeId || null }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber || null }),
        ...(data.issuedBy !== undefined && { issuedBy: data.issuedBy || null }),
        ...(data.issuedDate !== undefined && {
          issuedDate: data.issuedDate ? new Date(data.issuedDate) : null,
        }),
        ...(data.expiryDate !== undefined && {
          expiryDate: data.expiryDate ? new Date(data.expiryDate) : null,
        }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.fileUrl !== undefined && { fileUrl: data.fileUrl || null }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: {
        employee: { include: { department: true, position: true } },
        licenseType: true,
      },
    });
  }

  async delete(id: string) {
    await this.getLicenseOrThrow(id);
    return this.prisma.employeeLicense.delete({ where: { id } });
  }
}
