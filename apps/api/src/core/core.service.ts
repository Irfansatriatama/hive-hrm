import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { hashPassword } from 'better-auth/crypto';
import { EmployeeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DEFAULT_SYSTEM_MODULES } from './default-system-modules';
import { DEFAULT_ROLES, DEFAULT_PERMISSION_MATRIX, PERMISSION_MATRIX_MODULES } from './default-roles';

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
        color: data.color || '#3B82F6',
        split: data.split || false,
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

  async updateBranch(id: string, data: any) {
    return this.prisma.branch.update({
      where: { id },
      data: {
        name: data.name,
        address: data.address || null,
        pic: data.pic || null,
        staffCount: data.staffCount !== undefined ? parseInt(data.staffCount) : undefined,
      },
    });
  }

  async deleteBranch(id: string) {
    return this.prisma.branch.delete({ where: { id } });
  }

  // 6b. Public Holidays
  async getHolidays() {
    return this.prisma.publicHoliday.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async createHoliday(data: any) {
    if (!data.date) {
      throw new BadRequestException('Tanggal libur wajib diisi');
    }

    const date = new Date(data.date);
    const isoDate = data.date.split('T')[0];
    const existing = await this.prisma.publicHoliday.findFirst({
      where: { date },
    });
    if (existing) {
      throw new BadRequestException('Tanggal libur tersebut sudah terdaftar');
    }

    const dayName = date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return this.prisma.publicHoliday.create({
      data: {
        name: data.name?.trim() || dayName,
        date,
        type: data.type || 'national',
        description: data.description || isoDate,
      },
    });
  }

  async deleteHoliday(id: string) {
    return this.prisma.publicHoliday.delete({ where: { id } });
  }

  // 8. System Modules
  async ensureSystemModules() {
    for (const mod of DEFAULT_SYSTEM_MODULES) {
      await this.prisma.systemModule.upsert({
        where: { key: mod.key },
        update: {
          name: mod.name,
          description: mod.description,
          icon: mod.icon,
          isCore: mod.isCore,
          sortOrder: mod.sortOrder,
        },
        create: {
          key: mod.key,
          name: mod.name,
          description: mod.description,
          icon: mod.icon,
          isCore: mod.isCore,
          isEnabled: true,
          sortOrder: mod.sortOrder,
        },
      });
    }
  }

  async getModules() {
    await this.ensureSystemModules();
    return this.prisma.systemModule.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async updateModule(key: string, isEnabled: boolean) {
    const mod = await this.prisma.systemModule.findUnique({ where: { key } });
    if (!mod) {
      throw new NotFoundException(`Module "${key}" not found`);
    }
    if (mod.isCore && !isEnabled) {
      throw new BadRequestException('Core modules cannot be disabled');
    }
    return this.prisma.systemModule.update({
      where: { key },
      data: { isEnabled },
    });
  }

  async bulkUpdateModules(updates: { key: string; isEnabled: boolean }[]) {
    const results = [];
    for (const item of updates) {
      results.push(await this.updateModule(item.key, item.isEnabled));
    }
    return results;
  }

  // 9. Billing Settings
  async getBillingSettings() {
    const setting = await this.prisma.appSetting.findUnique({
      where: { key: 'billing_details' },
    });
    if (setting) return setting.value;

    const employeeCount = await this.prisma.employee.count({
      where: { status: 'ACTIVE' },
    });

    const defaultBilling = {
      plan_name: 'Professional Plan',
      price_monthly: 1500000,
      seats_total: 100,
      seats_used: employeeCount,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      card_brand: 'Visa',
      card_last4: '4242',
      card_holder: 'PT. Nusantara Digital Inovasi',
      card_exp: '08/29',
      invoices: [
        { id: 'INV-2026-005', period: 'Mei 2026', amount: 1500000, status: 'Paid', pay_date: '2026-05-01' },
        { id: 'INV-2026-004', period: 'April 2026', amount: 1500000, status: 'Paid', pay_date: '2026-04-01' },
        { id: 'INV-2026-003', period: 'Maret 2026', amount: 1500000, status: 'Paid', pay_date: '2026-03-01' },
        { id: 'INV-2026-002', period: 'Februari 2026', amount: 1500000, status: 'Paid', pay_date: '2026-02-01' },
        { id: 'INV-2026-001', period: 'Januari 2026', amount: 1500000, status: 'Paid', pay_date: '2026-01-01' },
      ],
    };

    await this.prisma.appSetting.create({
      data: { key: 'billing_details', value: defaultBilling as any },
    });

    return defaultBilling;
  }

  async updateBillingSettings(data: any) {
    const existing = await this.prisma.appSetting.findUnique({
      where: { key: 'billing_details' },
    });
    const merged = { ...(existing?.value as object || {}), ...data };
    return this.prisma.appSetting.upsert({
      where: { key: 'billing_details' },
      update: { value: merged as any },
      create: { key: 'billing_details', value: merged as any },
    });
  }

  // 7. User Access Management
  async ensureDefaultRoles() {
    for (const role of DEFAULT_ROLES) {
      await this.prisma.roleDefinition.upsert({
        where: { key: role.key },
        update: { name: role.name, description: role.description, isSystem: role.isSystem },
        create: { key: role.key, name: role.name, description: role.description, isSystem: role.isSystem },
      });
    }
  }

  async getRoles() {
    await this.ensureDefaultRoles();
    const roles = await this.prisma.roleDefinition.findMany({ orderBy: { key: 'asc' } });
    const users = await this.prisma.user.findMany({ select: { role: true } });
    return roles.map((role) => ({
      ...role,
      userCount: users.filter((u) => u.role === role.key).length,
    }));
  }

  async createRole(data: { key: string; name: string; description?: string }) {
    const key = data.key.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '');
    if (!key || !data.name.trim()) {
      throw new BadRequestException('Role key dan nama wajib diisi');
    }
    const existing = await this.prisma.roleDefinition.findUnique({ where: { key } });
    if (existing) throw new BadRequestException('ID Role sudah digunakan');
    return this.prisma.roleDefinition.create({
      data: { key, name: data.name.trim(), description: data.description?.trim() || null, isSystem: false },
    });
  }

  async updateRole(key: string, data: { name: string; description?: string }) {
    const role = await this.prisma.roleDefinition.findUnique({ where: { key } });
    if (!role) throw new NotFoundException('Role tidak ditemukan');
    return this.prisma.roleDefinition.update({
      where: { key },
      data: { name: data.name.trim(), description: data.description?.trim() || null },
    });
  }

  async deleteRole(key: string) {
    const role = await this.prisma.roleDefinition.findUnique({ where: { key } });
    if (!role) throw new NotFoundException('Role tidak ditemukan');
    if (role.isSystem) throw new BadRequestException('Role bawaan sistem tidak dapat dihapus');
    const assigned = await this.prisma.user.count({ where: { role: key } });
    if (assigned > 0) throw new BadRequestException('Role masih digunakan oleh user');
    return this.prisma.roleDefinition.delete({ where: { key } });
  }

  async getPermissionMatrix() {
    await this.ensureDefaultRoles();
    const setting = await this.prisma.appSetting.findUnique({ where: { key: 'permission_matrix' } });
    const matrix = (setting?.value as Record<string, string[]>) || DEFAULT_PERMISSION_MATRIX;
    const roles = await this.prisma.roleDefinition.findMany({ orderBy: { key: 'asc' } });
    return { modules: PERMISSION_MATRIX_MODULES, roles, matrix };
  }

  async savePermissionMatrix(matrix: Record<string, string[]>) {
    return this.prisma.appSetting.upsert({
      where: { key: 'permission_matrix' },
      update: { value: matrix as any },
      create: { key: 'permission_matrix', value: matrix as any },
    });
  }

  async getPublicPermissionMatrix() {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: 'permission_matrix' } });
    return (setting?.value as Record<string, string[]>) || DEFAULT_PERMISSION_MATRIX;
  }

  async getUsers() {
    const users = await this.prisma.user.findMany({
      orderBy: { email: 'asc' },
      include: {
        employee: { select: { id: true, fullName: true } },
        sessions: { orderBy: { updatedAt: 'desc' }, take: 1 },
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt || user.sessions[0]?.updatedAt || null,
      employeeId: user.employee?.id || null,
    }));
  }

  async getUnassignedEmployees() {
    return this.prisma.employee.findMany({
      where: { userId: null, status: EmployeeStatus.ACTIVE },
      orderBy: { fullName: 'asc' },
      select: { id: true, fullName: true, email: true },
    });
  }

  async updateUserRole(id: string, role: string) {
    const normalizedRole = role.toUpperCase().replace(/-/g, '_');
    const roleDef = await this.prisma.roleDefinition.findUnique({ where: { key: normalizedRole } });
    if (!roleDef) throw new BadRequestException('Role tidak valid');

    const user = await this.prisma.user.update({
      where: { id },
      data: { role: normalizedRole },
    });

    const emp = await this.prisma.employee.findFirst({ where: { email: user.email } });
    if (emp) {
      await this.prisma.auditLog.create({
        data: {
          userId: id,
          action: 'user.update_role',
          targetType: 'employee',
          targetId: emp.id,
          targetName: emp.fullName,
          details: { role: normalizedRole } as any,
        },
      });
    }

    return user;
  }

  async updateUserStatus(id: string, status: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { status },
    });
    if (status === 'suspended') {
      await this.prisma.session.deleteMany({ where: { userId: id } });
    }
    return user;
  }

  async resetUserPassword(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { accounts: { where: { providerId: 'credential' } } },
    });
    if (!user) throw new NotFoundException('User tidak ditemukan');

    const newPassword = `Hive@${Math.floor(1000 + Math.random() * 9000)}`;
    const hashed = await hashPassword(newPassword);

    const account = user.accounts[0];
    if (account) {
      await this.prisma.account.update({
        where: { id: account.id },
        data: { password: hashed },
      });
    }

    await this.prisma.auditLog.create({
      data: {
        userId: id,
        action: 'user.reset_password',
        targetType: 'user',
        targetId: id,
        targetName: user.name,
        details: { resetPerformed: true } as any,
      },
    });

    return { password: newPassword };
  }

  async createUserAccount(data: { employeeId: string; email: string; password: string; role: string }) {
    const employee = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException('Karyawan tidak ditemukan');
    if (employee.userId) throw new BadRequestException('Karyawan sudah memiliki akun user');

    const email = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) throw new BadRequestException('Email sudah terdaftar');

    const normalizedRole = data.role.toUpperCase().replace(/-/g, '_');
    const roleDef = await this.prisma.roleDefinition.findUnique({ where: { key: normalizedRole } });
    if (!roleDef) throw new BadRequestException('Role tidak valid');

    const hashed = await hashPassword(data.password);
    const user = await this.prisma.user.create({
      data: {
        name: employee.fullName,
        email,
        role: normalizedRole,
        status: 'active',
        emailVerified: true,
      },
    });

    await this.prisma.account.create({
      data: {
        userId: user.id,
        accountId: email,
        providerId: 'credential',
        password: hashed,
      },
    });

    await this.prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id, email },
    });

    return user;
  }
}
