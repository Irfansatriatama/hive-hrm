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
  private async resolveEmployeeForUser(user: { email?: string | null; id?: string }) {
    if (!user.email) return null;
    return this.prisma.employee.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }] },
      select: { id: true, departmentId: true, fullName: true },
    });
  }

  private formatAnnouncementRow(ann: any, extra: Record<string, unknown> = {}) {
    return {
      id: ann.id,
      title: ann.title,
      content: ann.content,
      target: ann.target,
      pinned: ann.isPinned,
      isPinned: ann.isPinned,
      status: ann.status,
      publish_date: ann.publishDate,
      publishDate: ann.publishDate,
      expire_date: ann.expireDate,
      expireDate: ann.expireDate,
      author: ann.createdBy || 'HR Admin',
      createdBy: ann.createdBy || 'HR Admin',
      createdAt: ann.createdAt,
      updatedAt: ann.updatedAt,
      ...extra,
    };
  }

  async getAnnouncementFeed(user: { email?: string | null; id?: string }) {
    const employee = await this.resolveEmployeeForUser(user);
    const employeeId = employee?.id;
    const departmentId = employee?.departmentId;
    const now = new Date();

    const announcements = await this.prisma.announcement.findMany({
      where: {
        status: 'published',
        publishDate: { lte: now },
        OR: [{ expireDate: null }, { expireDate: { gte: now } }],
      },
      orderBy: [{ isPinned: 'desc' }, { publishDate: 'desc' }],
    });

    const filtered = announcements.filter(
      (ann) => ann.target === 'all' || (departmentId && ann.target === departmentId),
    );

    let readIds = new Set<string>();
    if (employeeId) {
      const reads = await this.prisma.announcementRead.findMany({
        where: { employeeId, announcementId: { in: filtered.map((a) => a.id) } },
        select: { announcementId: true },
      });
      readIds = new Set(reads.map((r) => r.announcementId));
    }

    return filtered.map((ann) =>
      this.formatAnnouncementRow(ann, {
        isRead: readIds.has(ann.id),
      }),
    );
  }

  async getAnnouncementsManage() {
    const announcements = await this.prisma.announcement.findMany({
      orderBy: [{ isPinned: 'desc' }, { publishDate: 'desc' }],
    });
    return announcements.map((ann) => this.formatAnnouncementRow(ann));
  }

  async createAnnouncement(data: any, userId?: string) {
    const publishDate = data.publishDate || data.publish_date
      ? new Date(data.publishDate || data.publish_date)
      : new Date();
    const expireRaw = data.expireDate || data.expire_date;
    const expireDate = expireRaw ? new Date(expireRaw) : null;

    const created = await this.prisma.announcement.create({
      data: {
        title: data.title,
        content: data.content,
        target: data.target || 'all',
        isPinned: data.isPinned ?? data.pinned ?? false,
        status: data.status || 'published',
        publishDate,
        expireDate,
        createdBy: data.createdBy || 'HR Admin',
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'announcement.create',
        targetType: 'announcement',
        targetId: created.id,
        targetName: created.title,
        details: { announcement: created } as any,
      },
    });

    return this.formatAnnouncementRow(created);
  }

  async updateAnnouncement(id: string, data: any, userId?: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pengumuman tidak ditemukan');

    const publishRaw = data.publishDate ?? data.publish_date;
    const expireRaw = data.expireDate ?? data.expire_date;

    const updated = await this.prisma.announcement.update({
      where: { id },
      data: {
        title: data.title ?? existing.title,
        content: data.content ?? existing.content,
        target: data.target ?? existing.target,
        isPinned: data.isPinned ?? data.pinned ?? existing.isPinned,
        status: data.status ?? existing.status,
        publishDate: publishRaw ? new Date(publishRaw) : existing.publishDate,
        expireDate:
          expireRaw === '' || expireRaw === null
            ? null
            : expireRaw
              ? new Date(expireRaw)
              : existing.expireDate,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'announcement.update',
        targetType: 'announcement',
        targetId: updated.id,
        targetName: updated.title,
        details: { before: existing, after: updated } as any,
      },
    });

    return this.formatAnnouncementRow(updated);
  }

  async deleteAnnouncement(id: string, userId?: string) {
    const existing = await this.prisma.announcement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Pengumuman tidak ditemukan');

    await this.prisma.announcement.delete({ where: { id } });

    await this.prisma.auditLog.create({
      data: {
        userId: userId || null,
        action: 'announcement.delete',
        targetType: 'announcement',
        targetId: id,
        targetName: existing.title,
        details: { deleted: existing } as any,
      },
    });

    return { success: true };
  }

  async markAnnouncementRead(announcementId: string, user: { email?: string | null; id?: string }) {
    const employee = await this.resolveEmployeeForUser(user);
    if (!employee) throw new BadRequestException('Profil karyawan tidak ditemukan');

    const announcement = await this.prisma.announcement.findUnique({ where: { id: announcementId } });
    if (!announcement) throw new NotFoundException('Pengumuman tidak ditemukan');

    await this.prisma.announcementRead.upsert({
      where: {
        announcementId_employeeId: {
          announcementId,
          employeeId: employee.id,
        },
      },
      create: { announcementId, employeeId: employee.id },
      update: { readAt: new Date() },
    });

    return { success: true };
  }

  // 2. Assets
  private isAssetAdmin(role?: string) {
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  }

  private async ensureDefaultAssetCategories() {
    const count = await this.prisma.assetCategory.count();
    if (count > 0) return;
    await this.prisma.assetCategory.createMany({
      data: [
        { code: 'AC001', name: 'Elektronik & Gadget', description: 'Laptop, Tablet, Monitor, dan Smartphone operasional.' },
        { code: 'AC002', name: 'Furnitur Kantor', description: 'Meja kerja, kursi ergonomis, lemari berkas.' },
        { code: 'AC003', name: 'Kendaraan Dinas', description: 'Mobil operasional kantor, motor operasional kurir.' },
        { code: 'AC004', name: 'Peralatan Rapat', description: 'Proyektor, mic wireless, pointer presentasi.' },
      ],
    });
  }

  private async ensureDefaultAssetLocations() {
    const count = await this.prisma.assetLocation.count();
    if (count > 0) return;
    await this.prisma.assetLocation.createMany({
      data: [
        { code: 'LOC001', name: 'Head Office Jakarta (Gedung Lt. 3)', address: 'Jl. TB Simatupang No. 88, Jakarta Selatan' },
        { code: 'LOC002', name: 'Bandung Branch Office (Lt. 1)', address: 'Jl. Merdeka No. 12, Bandung' },
        { code: 'LOC003', name: 'Gudang Logistik Sentul', address: 'Kawasan Industri Sentul, Blok B3, Bogor' },
      ],
    });
  }

  private async loadAssetLoanRules() {
    const row = await this.prisma.appSetting.findUnique({ where: { key: 'assets_loan_rules' } });
    const defaults = {
      max_duration_days: 30,
      approval_levels_count: 1,
      allow_external_use: true,
    };
    if (!row?.value || typeof row.value !== 'object') return defaults;
    return { ...defaults, ...(row.value as Record<string, unknown>) };
  }

  private async writeAssetHistory(data: {
    assetId: string;
    assetCode: string;
    assetName: string;
    action: string;
    employeeId?: string | null;
    employeeName: string;
    condition?: string | null;
  }) {
    await this.prisma.assetHistory.create({
      data: {
        assetId: data.assetId,
        assetCode: data.assetCode,
        assetName: data.assetName,
        action: data.action,
        employeeId: data.employeeId || null,
        employeeName: data.employeeName,
        condition: data.condition || null,
      },
    });
  }

  async getAssets(user: { email?: string | null; id?: string; role?: string }) {
    const isAdmin = this.isAssetAdmin(user.role);
    const employee = await this.resolveEmployeeForUser(user);

    return this.prisma.asset.findMany({
      where: isAdmin || !employee ? undefined : { employeeId: employee.id },
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createAsset(data: any) {
    const count = await this.prisma.asset.count();
    const assetCode = `AST${String(count + 1).padStart(3, '0')}`;

    return this.prisma.asset.create({
      data: {
        assetCode,
        name: data.name,
        category: data.category,
        brand: data.brand || null,
        model: data.model || null,
        serialNumber: data.serialNumber || null,
        condition: data.condition || 'good',
        status: 'available',
        location: data.location || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchasePrice: data.purchasePrice ? parseInt(data.purchasePrice, 10) : null,
      },
      include: { employee: true },
    });
  }

  async updateAsset(id: string, data: any) {
    const existing = await this.prisma.asset.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Asset not found');

    return this.prisma.asset.update({
      where: { id },
      data: {
        name: data.name ?? existing.name,
        category: data.category ?? existing.category,
        brand: data.brand ?? existing.brand,
        model: data.model ?? existing.model,
        serialNumber: data.serialNumber ?? existing.serialNumber,
        condition: data.condition ?? existing.condition,
        location: data.location ?? existing.location,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : existing.purchaseDate,
        purchasePrice: data.purchasePrice !== undefined ? parseInt(data.purchasePrice, 10) : existing.purchasePrice,
      },
      include: { employee: true },
    });
  }

  async assignAsset(id: string, employeeId: string) {
    const asset = await this.prisma.asset.findUnique({ where: { id } });
    if (!asset) throw new NotFoundException('Asset not found');

    const employee = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        employeeId,
        status: 'in_use',
        assignedDate: new Date(),
      },
      include: { employee: true },
    });

    await this.writeAssetHistory({
      assetId: updated.id,
      assetCode: updated.assetCode,
      assetName: updated.name,
      action: 'checkout',
      employeeId: employee.id,
      employeeName: employee.fullName,
      condition: updated.condition,
    });

    return updated;
  }

  async returnAsset(id: string) {
    const asset = await this.prisma.asset.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    const formerAssignee = asset.employee;

    const updated = await this.prisma.asset.update({
      where: { id },
      data: {
        employeeId: null,
        status: 'available',
        assignedDate: null,
      },
      include: { employee: true },
    });

    await this.writeAssetHistory({
      assetId: updated.id,
      assetCode: updated.assetCode,
      assetName: updated.name,
      action: 'checkin',
      employeeId: formerAssignee?.id || null,
      employeeName: formerAssignee?.fullName || '-',
      condition: updated.condition,
    });

    return updated;
  }

  async getAssetRequests(user: { email?: string | null; id?: string; role?: string }) {
    const isAdmin = this.isAssetAdmin(user.role);
    const employee = await this.resolveEmployeeForUser(user);

    return this.prisma.assetRequest.findMany({
      where: isAdmin || !employee ? undefined : { employeeId: employee.id },
      include: { employee: true },
      orderBy: { dateRequested: 'desc' },
    });
  }

  async createAssetRequest(
    user: { email?: string | null; id?: string },
    data: { assetName: string; reason: string; duration: number },
  ) {
    const employee = await this.resolveEmployeeForUser(user);
    if (!employee) throw new BadRequestException('Employee profile not found');

    const count = await this.prisma.assetRequest.count();
    const requestCode = `REQ-AST-${String(count + 1).padStart(2, '0')}`;

    return this.prisma.assetRequest.create({
      data: {
        requestCode,
        employeeId: employee.id,
        assetName: data.assetName,
        reason: data.reason,
        duration: data.duration || 1,
        status: 'pending',
      },
      include: { employee: true },
    });
  }

  async processAssetRequest(id: string, status: 'approved' | 'rejected') {
    const request = await this.prisma.assetRequest.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!request) throw new NotFoundException('Asset request not found');
    if (request.status !== 'pending') {
      throw new BadRequestException('Request already processed');
    }

    const updated = await this.prisma.assetRequest.update({
      where: { id },
      data: { status },
      include: { employee: true },
    });

    if (status === 'approved') {
      const asset = await this.prisma.asset.findFirst({
        where: { name: request.assetName, status: 'available' },
      });

      if (asset) {
        await this.prisma.asset.update({
          where: { id: asset.id },
          data: {
            employeeId: request.employeeId,
            status: 'in_use',
            assignedDate: new Date(),
          },
        });

        await this.writeAssetHistory({
          assetId: asset.id,
          assetCode: asset.assetCode,
          assetName: asset.name,
          action: 'checkout',
          employeeId: request.employeeId,
          employeeName: request.employee.fullName,
          condition: asset.condition,
        });
      }
    }

    return updated;
  }

  async getAssetHistory() {
    return this.prisma.assetHistory.findMany({
      orderBy: { date: 'desc' },
    });
  }

  async getAssetCategories() {
    await this.ensureDefaultAssetCategories();
    return this.prisma.assetCategory.findMany({ orderBy: { code: 'asc' } });
  }

  async createAssetCategory(data: { name: string; description?: string }) {
    const count = await this.prisma.assetCategory.count();
    const code = `AC${String(count + 1).padStart(3, '0')}`;
    return this.prisma.assetCategory.create({
      data: { code, name: data.name, description: data.description || null },
    });
  }

  async updateAssetCategory(id: string, data: { name: string; description?: string }) {
    return this.prisma.assetCategory.update({
      where: { id },
      data: { name: data.name, description: data.description || null },
    });
  }

  async deleteAssetCategory(id: string) {
    return this.prisma.assetCategory.delete({ where: { id } });
  }

  async getAssetLocations() {
    await this.ensureDefaultAssetLocations();
    return this.prisma.assetLocation.findMany({ orderBy: { code: 'asc' } });
  }

  async createAssetLocation(data: { name: string; address: string }) {
    const count = await this.prisma.assetLocation.count();
    const code = `LOC${String(count + 1).padStart(3, '0')}`;
    return this.prisma.assetLocation.create({
      data: { code, name: data.name, address: data.address },
    });
  }

  async updateAssetLocation(id: string, data: { name: string; address: string }) {
    return this.prisma.assetLocation.update({
      where: { id },
      data: { name: data.name, address: data.address },
    });
  }

  async deleteAssetLocation(id: string) {
    return this.prisma.assetLocation.delete({ where: { id } });
  }

  async getAssetLoanRules() {
    return this.loadAssetLoanRules();
  }

  async updateAssetLoanRules(data: Record<string, unknown>) {
    const before = await this.loadAssetLoanRules();
    const merged = { ...before, ...data };

    await this.prisma.appSetting.upsert({
      where: { key: 'assets_loan_rules' },
      update: { value: merged as any },
      create: { key: 'assets_loan_rules', value: merged as any },
    });

    return merged;
  }

  // 3. Documents
  private readonly defaultDocumentFolders = [
    'Peraturan Perusahaan',
    'Panduan Karyawan',
    'Formulir',
    'HR Policies',
    'Template Surat',
  ];

  async ensureDocumentFolders() {
    const existing = await this.prisma.documentFolder.findMany();
    if (existing.length === 0) {
      await this.prisma.documentFolder.createMany({
        data: this.defaultDocumentFolders.map((name) => ({ name })),
      });
    }
    return this.prisma.documentFolder.findMany({ orderBy: { name: 'asc' } });
  }

  async getDocumentFolders() {
    return this.ensureDocumentFolders();
  }

  async createDocumentFolder(name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new BadRequestException('Nama folder wajib diisi');
    }
    const existing = await this.prisma.documentFolder.findUnique({ where: { name: trimmed } });
    if (existing) {
      throw new BadRequestException('Nama folder tersebut sudah terdaftar');
    }
    return this.prisma.documentFolder.create({ data: { name: trimmed } });
  }

  async getDocuments() {
    await this.ensureDocumentFolders();
    const docs = await this.prisma.document.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((doc) => ({
      ...doc,
      folder: doc.category,
      type: doc.fileType,
      size: this.formatDocumentSize(doc.fileSize),
    }));
  }

  private formatDocumentSize(bytes?: number | null) {
    if (!bytes) return '1.2 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${mb.toFixed(1)} MB`;
  }

  private parseDocumentSize(size?: string | number | null) {
    if (typeof size === 'number') return size;
    if (!size) return 1200000;
    const normalized = String(size).trim().toUpperCase();
    const match = normalized.match(/^([\d.]+)\s*(KB|MB|GB)?$/);
    if (!match) return 1200000;
    const value = parseFloat(match[1]);
    const unit = match[2] || 'MB';
    if (unit === 'KB') return Math.round(value * 1024);
    if (unit === 'GB') return Math.round(value * 1024 * 1024 * 1024);
    return Math.round(value * 1024 * 1024);
  }

  async createDocument(data: any, uploadedBy?: string) {
    await this.ensureDocumentFolders();
    const folder = (data.folder || data.category || this.defaultDocumentFolders[0]).trim();
    const visibility = data.visibility || (data.isPublic ? 'all' : 'private');
    const folderExists = await this.prisma.documentFolder.findUnique({ where: { name: folder } });
    if (!folderExists) {
      await this.prisma.documentFolder.create({ data: { name: folder } });
    }

    return this.prisma.document.create({
      data: {
        name: data.name,
        category: folder,
        fileUrl: data.fileUrl || 'https://cloudinary.com/simulated-doc.pdf',
        fileType: data.fileType || data.type || 'PDF',
        fileSize: this.parseDocumentSize(data.fileSize ?? data.size),
        employeeId: data.employeeId || null,
        isPublic: visibility === 'all',
        visibility,
        uploadedBy: uploadedBy || null,
      },
      include: { employee: true },
    });
  }

  async deleteDocument(id: string) {
    const doc = await this.prisma.document.findUnique({ where: { id } });
    if (!doc) {
      throw new NotFoundException('Dokumen tidak ditemukan');
    }
    await this.prisma.document.delete({ where: { id } });
    return { success: true, name: doc.name };
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
  private formatVisitorRow(visitor: any, host?: { fullName: string; employeeNumber: string } | null) {
    return {
      id: visitor.id,
      badgeNumber: visitor.badgeNumber,
      badge_number: visitor.badgeNumber,
      visitorName: visitor.visitorName,
      visitor_name: visitor.visitorName,
      company: visitor.company,
      visitor_company: visitor.company,
      idType: visitor.idType,
      visitor_id_type: visitor.idType,
      idNumber: visitor.idNumber,
      visitor_id_number: visitor.idNumber,
      phone: visitor.phone,
      visitor_phone: visitor.phone,
      email: visitor.email,
      visitor_email: visitor.email,
      purpose: visitor.purpose,
      hostEmployeeId: visitor.hostEmployeeId,
      host_employee_id: visitor.hostEmployeeId,
      hostName: host?.fullName || visitor.hostEmployeeId || '-',
      vehicleNumber: visitor.vehicleNumber,
      vehicle_number: visitor.vehicleNumber,
      checkIn: visitor.checkIn,
      check_in: visitor.checkIn,
      checkOut: visitor.checkOut,
      check_out: visitor.checkOut,
      notes: visitor.notes,
      status: visitor.status,
      createdAt: visitor.createdAt,
    };
  }

  async getVisitors() {
    const visitors = await this.prisma.visitor.findMany({
      orderBy: { checkIn: 'desc' },
    });

    const hostIds = [
      ...new Set(visitors.map((v) => v.hostEmployeeId).filter((id): id is string => !!id)),
    ];
    const hosts = hostIds.length
      ? await this.prisma.employee.findMany({
          where: { id: { in: hostIds } },
          select: { id: true, fullName: true, employeeNumber: true },
        })
      : [];
    const hostMap = Object.fromEntries(hosts.map((h) => [h.id, h]));

    return visitors.map((visitor) =>
      this.formatVisitorRow(visitor, visitor.hostEmployeeId ? hostMap[visitor.hostEmployeeId] : null),
    );
  }

  async createVisitor(data: any) {
    const visitorName = (data.visitorName || data.visitor_name || '').trim();
    const company = (data.company || data.visitor_company || '').trim();
    const idNumber = (data.idNumber || data.visitor_id_number || '').trim();
    const phone = (data.phone || data.visitor_phone || '').trim();
    const purpose = (data.purpose || '').trim();

    if (!visitorName || !company || !idNumber || !phone || !purpose) {
      throw new BadRequestException('Mohon lengkapi data wajib tamu!');
    }

    const totalVisitors = await this.prisma.visitor.count();
    const badgeNumber = `V-${String(totalVisitors + 1).padStart(3, '0')}`;

    const created = await this.prisma.visitor.create({
      data: {
        badgeNumber,
        visitorName,
        company,
        idType: data.idType || data.visitor_id_type || 'KTP',
        idNumber,
        phone,
        email: data.email || data.visitor_email || null,
        purpose,
        hostEmployeeId: data.hostEmployeeId || data.host_employee_id || null,
        vehicleNumber: data.vehicleNumber || data.vehicle_number || null,
        notes: data.notes || '',
        status: 'checked_in',
      },
    });

    let host: { fullName: string; employeeNumber: string } | null = null;
    if (created.hostEmployeeId) {
      host = await this.prisma.employee.findUnique({
        where: { id: created.hostEmployeeId },
        select: { fullName: true, employeeNumber: true },
      });
    }

    return this.formatVisitorRow(created, host);
  }

  async checkOutVisitor(id: string) {
    const existing = await this.prisma.visitor.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Tamu tidak ditemukan');
    }
    if (existing.status === 'checked_out') {
      throw new BadRequestException('Tamu sudah check-out');
    }

    const updated = await this.prisma.visitor.update({
      where: { id },
      data: {
        checkOut: new Date(),
        status: 'checked_out',
      },
    });

    let host: { fullName: string; employeeNumber: string } | null = null;
    if (updated.hostEmployeeId) {
      host = await this.prisma.employee.findUnique({
        where: { id: updated.hostEmployeeId },
        select: { fullName: true, employeeNumber: true },
      });
    }

    return this.formatVisitorRow(updated, host);
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
