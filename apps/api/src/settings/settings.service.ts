import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_GLOBAL_PREFERENCES = {
  timezone: 'Asia/Jakarta',
  date_format: 'DD/MM/YYYY',
  currency: 'IDR',
  retirement_age: 56,
  session_timeout: 120,
  enforce_complex_pwd: true,
};

const DEFAULT_GRADE_LIMITS = [
  { grade: 'M1', title: 'Executive / CEO', limit: 9990000000 },
  { grade: 'M2', title: 'Manager / Head', limit: 50000000 },
  { grade: 'M3', title: 'Tech Lead', limit: 25000000 },
  { grade: 'S1', title: 'Senior Staff Developer', limit: 15000000 },
  { grade: 'S2', title: 'Middle Developer / QA', limit: 5000000 },
  { grade: 'S3', title: 'Junior Staff', limit: 1000000 },
];

const DEFAULT_PROCUREMENT_CATEGORIES = [
  { name: 'Laptop & Hardware Elektronik', code: 'ELK', tax: 11 },
  { name: 'Alat Tulis Kantor (ATK)', code: 'OFF', tax: 0 },
  { name: 'Iklan Digital & Kampanye', code: 'ADV', tax: 11 },
  { name: 'Sewa Gedung & Ops Kantor', code: 'REN', tax: 10 },
];

const DEFAULT_LEAVE_BLACKOUTS = [
  { date: '2026-12-25', description: 'Periode Tutup Buku & Natal' },
  { date: '2026-12-31', description: 'Malam Tahun Baru - Operasional Piket Penting' },
];

const DEFAULT_CUSTOM_FORMS = [
  {
    name: 'Checklist Kelayakan Laptop Kantor',
    fields: [
      { type: 'text', label: 'ID Aset Laptop', placeholder: 'Contoh: AST001', required: true, help: '' },
      { type: 'select', label: 'Kondisi Fisik Monitor', placeholder: '', required: true, help: '', options: 'Mulus, Lecet Sedikit, Retak/Garis LCD' },
      { type: 'file', label: 'Unggah Bukti Kerusakan', placeholder: '', required: false, help: '' },
    ],
  },
];

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  private async loadAppSetting<T extends Record<string, unknown>>(key: string, defaults: T): Promise<T> {
    const row = await this.prisma.appSetting.findUnique({ where: { key } });
    if (!row?.value || typeof row.value !== 'object') return defaults;
    return { ...defaults, ...(row.value as Record<string, unknown>) } as T;
  }

  private async saveAppSetting(key: string, value: unknown) {
    return this.prisma.appSetting.upsert({
      where: { key },
      update: { value: value as any },
      create: { key, value: value as any },
    });
  }

  // --- Global Preferences ---
  async getGlobalPreferences() {
    return this.loadAppSetting('global_preferences', DEFAULT_GLOBAL_PREFERENCES);
  }

  async updateGlobalPreferences(data: Record<string, unknown>) {
    const merged = { ...DEFAULT_GLOBAL_PREFERENCES, ...data };
    await this.saveAppSetting('global_preferences', merged);
    return merged;
  }

  // --- Procurement Grade Limits ---
  async getProcurementLimits() {
    const row = await this.prisma.appSetting.findUnique({ where: { key: 'procurement_grade_limits' } });
    if (!row?.value || !Array.isArray(row.value)) {
      await this.saveAppSetting('procurement_grade_limits', DEFAULT_GRADE_LIMITS);
      return DEFAULT_GRADE_LIMITS;
    }
    return row.value as typeof DEFAULT_GRADE_LIMITS;
  }

  async updateProcurementLimits(limits: { grade: string; title: string; limit: number }[]) {
    await this.saveAppSetting('procurement_grade_limits', limits);
    return limits;
  }

  // --- Procurement Categories ---
  private async ensureDefaultProcurementCategories() {
    const count = await this.prisma.procurementCategory.count();
    if (count > 0) return;
    await this.prisma.procurementCategory.createMany({ data: DEFAULT_PROCUREMENT_CATEGORIES });
  }

  async getProcurementCategories() {
    await this.ensureDefaultProcurementCategories();
    const cats = await this.prisma.procurementCategory.findMany({ orderBy: { createdAt: 'asc' } });
    return cats.map((c, idx) => ({
      ...c,
      displayId: `CAT${String(idx + 1).padStart(3, '0')}`,
    }));
  }

  async createProcurementCategory(data: { name: string; code: string; tax: number }) {
    const name = data.name?.trim();
    const code = data.code?.trim().toUpperCase();
    if (!name || !code) {
      throw new BadRequestException('Nama kategori dan kode singkat wajib diisi!');
    }
    return this.prisma.procurementCategory.create({
      data: { name, code, tax: parseFloat(String(data.tax)) || 0 },
    });
  }

  async updateProcurementCategory(id: string, data: { name: string; code: string; tax: number }) {
    const existing = await this.prisma.procurementCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kategori pengadaan tidak ditemukan');

    return this.prisma.procurementCategory.update({
      where: { id },
      data: {
        name: data.name.trim(),
        code: data.code.trim().toUpperCase(),
        tax: parseFloat(String(data.tax)) || 0,
      },
    });
  }

  async deleteProcurementCategory(id: string) {
    const existing = await this.prisma.procurementCategory.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Kategori pengadaan tidak ditemukan');
    return this.prisma.procurementCategory.delete({ where: { id } });
  }

  // --- Procurement Vendors (settings CRUD) ---
  async getProcurementVendors() {
    return this.prisma.procurementVendor.findMany({ orderBy: { name: 'asc' } });
  }

  async createProcurementVendor(data: {
    name: string;
    npwp: string;
    contact: string;
    category: string;
  }) {
    const name = data.name?.trim();
    const npwp = data.npwp?.trim();
    const contact = data.contact?.trim();
    if (!name || !npwp || !contact) {
      throw new BadRequestException('Mohon lengkapi seluruh field!');
    }
    return this.prisma.procurementVendor.create({
      data: {
        name,
        npwp,
        contact,
        category: data.category || null,
        status: 'active',
      },
    });
  }

  async updateProcurementVendor(
    id: string,
    data: { name: string; npwp: string; contact: string; category: string },
  ) {
    const existing = await this.prisma.procurementVendor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Vendor tidak ditemukan');

    return this.prisma.procurementVendor.update({
      where: { id },
      data: {
        name: data.name.trim(),
        npwp: data.npwp.trim(),
        contact: data.contact.trim(),
        category: data.category || null,
      },
    });
  }

  async deleteProcurementVendor(id: string) {
    const existing = await this.prisma.procurementVendor.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Vendor tidak ditemukan');
    return this.prisma.procurementVendor.delete({ where: { id } });
  }

  // --- Leave Types ---
  async getLeaveTypes() {
    const types = await this.prisma.leaveType.findMany({ orderBy: { name: 'asc' } });
    return types.map((t, idx) => ({
      ...t,
      displayId: `LT${String(idx + 1).padStart(3, '0')}`,
      payType: t.isPaid ? 'paid' : 'unpaid',
    }));
  }

  async createLeaveType(data: { name: string; maxDays: number; payType: string }) {
    const name = data.name?.trim();
    const maxDays = parseInt(String(data.maxDays)) || 0;
    if (!name || maxDays < 0) {
      throw new BadRequestException('Mohon isi nama cuti dan jatah limit dengan benar!');
    }
    return this.prisma.leaveType.create({
      data: {
        name,
        maxDays,
        isPaid: data.payType !== 'unpaid',
      },
    });
  }

  async updateLeaveType(
    id: string,
    data: { name: string; maxDays: number; payType: string },
  ) {
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tipe cuti tidak ditemukan');

    return this.prisma.leaveType.update({
      where: { id },
      data: {
        name: data.name.trim(),
        maxDays: parseInt(String(data.maxDays)) || 0,
        isPaid: data.payType !== 'unpaid',
      },
    });
  }

  async deleteLeaveType(id: string) {
    const existing = await this.prisma.leaveType.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tipe cuti tidak ditemukan');
    return this.prisma.leaveType.delete({ where: { id } });
  }

  async updateLeaveAccruals(
    rules: { leaveTypeId: string; accrualType: string; carryOver: boolean; maxCarry: number }[],
  ) {
    for (const rule of rules) {
      await this.prisma.leaveType.update({
        where: { id: rule.leaveTypeId },
        data: {
          accrualType: rule.accrualType || 'none',
          carryOver: !!rule.carryOver,
          maxCarry: parseInt(String(rule.maxCarry)) || 0,
        },
      });
    }
    return this.getLeaveTypes();
  }

  // --- Leave Blackouts ---
  private async ensureDefaultBlackouts() {
    const count = await this.prisma.leaveBlackout.count();
    if (count > 0) return;

    for (const b of DEFAULT_LEAVE_BLACKOUTS) {
      await this.prisma.leaveBlackout.create({
        data: {
          date: new Date(b.date),
          description: b.description,
        },
      });
    }
  }

  async getLeaveBlackouts() {
    await this.ensureDefaultBlackouts();
    const rows = await this.prisma.leaveBlackout.findMany({ orderBy: { date: 'asc' } });
    return rows.map((b) => ({
      id: b.id,
      date: b.date.toISOString().split('T')[0],
      description: b.description,
    }));
  }

  async createLeaveBlackout(data: { date: string; description: string }) {
    const date = data.date?.trim();
    const description = data.description?.trim();
    if (!date || !description) {
      throw new BadRequestException('Tanggal dan alasan larangan wajib diisi!');
    }

    const existing = await this.prisma.leaveBlackout.findUnique({
      where: { date: new Date(date) },
    });
    if (existing) {
      throw new BadRequestException('Tanggal blackout tersebut sudah terdaftar!');
    }

    const row = await this.prisma.leaveBlackout.create({
      data: { date: new Date(date), description },
    });
    return {
      id: row.id,
      date: row.date.toISOString().split('T')[0],
      description: row.description,
    };
  }

  async deleteLeaveBlackout(id: string) {
    const existing = await this.prisma.leaveBlackout.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tanggal blackout tidak ditemukan');
    return this.prisma.leaveBlackout.delete({ where: { id } });
  }

  // --- Custom Forms ---
  private async ensureDefaultCustomForms() {
    const count = await this.prisma.customForm.count();
    if (count > 0) return;

    for (const form of DEFAULT_CUSTOM_FORMS) {
      await this.prisma.customForm.create({
        data: {
          name: form.name,
          fields: form.fields as any,
          status: 'active',
        },
      });
    }
  }

  async getCustomForms() {
    await this.ensureDefaultCustomForms();
    const forms = await this.prisma.customForm.findMany({ orderBy: { createdAt: 'asc' } });
    return forms.map((f, idx) => ({
      id: f.id,
      displayId: `CF${String(idx + 1).padStart(3, '0')}`,
      name: f.name,
      fields: f.fields,
      status: f.status,
      createdAt: f.createdAt.toISOString().split('T')[0],
    }));
  }

  async createCustomForm(data: { name: string; fields: unknown[] }) {
    const name = data.name?.trim();
    if (!name) throw new BadRequestException('Nama formulir wajib diisi!');

    return this.prisma.customForm.create({
      data: {
        name,
        fields: (data.fields || []) as any,
        status: 'active',
      },
    });
  }

  async getCustomFormById(id: string) {
    const form = await this.prisma.customForm.findUnique({ where: { id } });
    if (!form) throw new NotFoundException('Formulir tidak ditemukan');
    return form;
  }

  async deleteCustomForm(id: string) {
    const existing = await this.prisma.customForm.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Formulir tidak ditemukan');
    return this.prisma.customForm.delete({ where: { id } });
  }
}
