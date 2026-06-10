import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class CoreService {
  constructor(private prisma: PrismaService) {}

  // 1. Announcements
  async getAnnouncements() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAnnouncement(data: any) {
    return this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        category: data.category || 'General',
        isPinned: data.isPinned || false,
        isPublished: true,
        createdBy: data.createdBy || 'HR Admin',
      },
    });
  }

  // 2. Assets
  async getAssets() {
    return this.prisma.asset.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAsset(data: any) {
    const count = await this.prisma.asset.count();
    const assetCode = `AST-${String(count + 1).padStart(3, '0')}`;
    
    return this.prisma.asset.create({
      data: {
        assetCode,
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        serialNumber: data.serialNumber || null,
        condition: data.condition || 'Baik',
        status: 'Available',
      },
    });
  }

  async assignAsset(id: string, employeeId: string) {
    return this.prisma.asset.update({
      where: { id },
      data: {
        employeeId,
        status: 'In Use',
        purchaseDate: new Date(), // simulating assignment date
      },
    });
  }

  async returnAsset(id: string) {
    return this.prisma.asset.update({
      where: { id },
      data: {
        employeeId: null,
        status: 'Available',
      },
    });
  }

  // 3. Documents
  async getDocuments() {
    return this.prisma.document.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createDocument(data: any) {
    return this.prisma.document.create({
      data: {
        name: data.name,
        category: data.category,
        fileUrl: data.fileUrl || 'https://cloudinary.com/simulated-doc.pdf',
        fileType: data.fileType || 'PDF',
        fileSize: parseInt(data.fileSize) || 1200000,
        employeeId: data.employeeId || null,
        isPublic: data.isPublic || false,
      },
    });
  }

  // 4. Shifts
  async getShifts() {
    return this.prisma.shift.findMany({
      orderBy: { startTime: 'asc' },
    });
  }

  async createShift(data: any) {
    return this.prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        breakTime: parseInt(data.breakTime) || 60,
        isDefault: data.isDefault || false,
      },
    });
  }

  // 5. Visitors
  async getVisitors() {
    return this.prisma.visitor.findMany({
      orderBy: { checkIn: 'desc' },
    });
  }

  async createVisitor(data: any) {
    return this.prisma.visitor.create({
      data: {
        visitorName: data.visitorName,
        company: data.company || null,
        phone: data.phone || null,
        purpose: data.purpose,
        hostEmployeeId: data.hostEmployeeId || null,
        status: 'in',
      },
    });
  }

  async checkOutVisitor(id: string) {
    return this.prisma.visitor.update({
      where: { id },
      data: {
        checkOut: new Date(),
        status: 'out',
      },
    });
  }

  // 6. Company & Branches
  async getCompany() {
    let company = await this.prisma.company.findFirst();
    if (!company) {
      company = await this.prisma.company.create({
        data: {
          name: 'PT. Nusantara Digital Inovasi',
          tagline: 'Transformasi Digital untuk Indonesia',
          industry: 'Teknologi Informasi',
        },
      });
    }
    return company;
  }

  async updateCompany(id: string, data: any) {
    return this.prisma.company.update({
      where: { id },
      data: {
        name: data.name,
        tagline: data.tagline,
        industry: data.industry,
        npwp: data.npwp,
        phone: data.phone,
        email: data.email,
        website: data.website,
        address: data.address,
      },
    });
  }

  async getBranches() {
    return this.prisma.branch.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async createBranch(data: any) {
    return this.prisma.branch.create({
      data: {
        name: data.name,
        address: data.address || null,
        pic: data.pic || null,
        staffCount: parseInt(data.staffCount) || 0,
      },
    });
  }

  // 7. User Access Matrix
  async getUsers() {
    return this.prisma.user.findMany({
      orderBy: { email: 'asc' },
    });
  }

  async updateUserRole(id: string, role: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        role: role.toUpperCase() as UserRole,
      },
    });

    // Sync roles with standard employees
    const emp = await this.prisma.employee.findFirst({ where: { email: user.email } });
    if (emp) {
      await this.prisma.auditLog.create({
        data: {
          userId: id,
          action: 'user.update_role',
          targetType: 'employee',
          targetId: emp.id,
          targetName: emp.fullName,
          details: { role } as any,
        },
      });
    }

    return user;
  }
}
