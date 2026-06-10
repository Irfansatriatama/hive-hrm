import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const DEFAULT_STAGES = [
  { name: 'Screening Resume', sequence: 1, pic: 'Fitri Nuraini', duration: 3 },
  { name: 'Psikotes / Technical Test', sequence: 2, pic: 'Fitri Nuraini', duration: 5 },
  { name: 'Wawancara HR', sequence: 3, pic: 'Sari Dewi Lestari', duration: 4 },
  { name: 'Wawancara User (Tech Lead)', sequence: 4, pic: 'Budi Santoso', duration: 7 },
  { name: 'Offering Letter', sequence: 5, pic: 'Sari Dewi Lestari', duration: 3 },
  { name: 'Onboarding Coordinator', sequence: 6, pic: 'Ratna Komala', duration: 1 },
];

const DEFAULT_TEMPLATES = [
  {
    position: 'Senior Full Stack Engineer',
    description: 'Membangun dan memelihara aplikasi inti HIVE HRM.',
    qualification: 'Pengalaman 5+ tahun PHP/React/Vue. Terbiasa dengan clean architecture.',
    benefits: 'Gaji kompetitif, Asuransi swasta, WFH 2 hari seminggu.',
  },
  {
    position: 'HR Generalist Specialist',
    description: 'Mengelola administrasi kepengurusan karyawan, onboarding, dan payroll.',
    qualification: 'S1 Psikologi/Hukum. Paham UU Ketenagakerjaan.',
    benefits: 'BPJS, Bonus tahunan, Katering makan siang.',
  },
];

const DEFAULT_SOURCES = [
  { name: 'LinkedIn Profile Apply', active: true },
  { name: 'Jobstreet Portal', active: true },
  { name: 'Website Karir Internal', active: true },
  { name: 'Rekomendasi Karyawan (Referral)', active: true },
  { name: 'Walk-in Interview & Drop CV', active: false },
];

const DEFAULT_FORM_FIELDS = [
  { key: 'full_name', label: 'Nama Lengkap Karyawan', required: true, isSystem: true, sortOrder: 1 },
  { key: 'email', label: 'Email Pribadi', required: true, isSystem: true, sortOrder: 2 },
  { key: 'phone', label: 'Nomor Telepon', required: true, isSystem: true, sortOrder: 3 },
  { key: 'resume', label: 'Berkas CV / Resume PDF', required: true, isSystem: false, sortOrder: 4 },
  { key: 'portfolio', label: 'Tautan Portofolio / GitHub Link', required: false, isSystem: false, sortOrder: 5 },
  { key: 'expected_salary', label: 'Ekspektasi Gaji Bulanan (IDR)', required: true, isSystem: false, sortOrder: 6 },
  { key: 'notice_period', label: 'Masa Notice Pengunduran Diri (Hari)', required: false, isSystem: false, sortOrder: 7 },
  { key: 'emergency_contact', label: 'Kontak Darurat Kerabat', required: false, isSystem: false, sortOrder: 8 },
];

@Injectable()
export class HiringService {
  constructor(private prisma: PrismaService) {}

  private async ensureDefaults() {
    const stageCount = await this.prisma.hiringPipelineStage.count();
    if (stageCount === 0) {
      await this.prisma.hiringPipelineStage.createMany({ data: DEFAULT_STAGES });
    }

    const templateCount = await this.prisma.jobTemplate.count();
    if (templateCount === 0) {
      await this.prisma.jobTemplate.createMany({ data: DEFAULT_TEMPLATES });
    }

    const sourceCount = await this.prisma.recruitmentSource.count();
    if (sourceCount === 0) {
      await this.prisma.recruitmentSource.createMany({ data: DEFAULT_SOURCES });
    }

    const fieldCount = await this.prisma.applicationFormField.count();
    if (fieldCount === 0) {
      await this.prisma.applicationFormField.createMany({ data: DEFAULT_FORM_FIELDS });
    }
  }

  async getStages() {
    await this.ensureDefaults();
    return this.prisma.hiringPipelineStage.findMany({ orderBy: { sequence: 'asc' } });
  }

  async createStage(data: { name: string; sequence: number; pic: string; duration: number }) {
    return this.prisma.hiringPipelineStage.create({
      data: {
        name: data.name.trim(),
        sequence: parseInt(String(data.sequence)) || 1,
        pic: data.pic.trim(),
        duration: parseInt(String(data.duration)) || 1,
      },
    });
  }

  async updateStage(id: string, data: { name: string; sequence: number; pic: string; duration: number }) {
    const existing = await this.prisma.hiringPipelineStage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tahapan rekrutmen tidak ditemukan');

    return this.prisma.hiringPipelineStage.update({
      where: { id },
      data: {
        name: data.name.trim(),
        sequence: parseInt(String(data.sequence)) || 1,
        pic: data.pic.trim(),
        duration: parseInt(String(data.duration)) || 1,
      },
    });
  }

  async deleteStage(id: string) {
    const existing = await this.prisma.hiringPipelineStage.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Tahapan rekrutmen tidak ditemukan');
    return this.prisma.hiringPipelineStage.delete({ where: { id } });
  }

  async getTemplates() {
    await this.ensureDefaults();
    return this.prisma.jobTemplate.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createTemplate(data: {
    position: string;
    description: string;
    qualification: string;
    benefits?: string;
  }) {
    return this.prisma.jobTemplate.create({
      data: {
        position: data.position.trim(),
        description: data.description.trim(),
        qualification: data.qualification.trim(),
        benefits: data.benefits?.trim() || null,
      },
    });
  }

  async updateTemplate(
    id: string,
    data: { position: string; description: string; qualification: string; benefits?: string },
  ) {
    const existing = await this.prisma.jobTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template lowongan tidak ditemukan');

    return this.prisma.jobTemplate.update({
      where: { id },
      data: {
        position: data.position.trim(),
        description: data.description.trim(),
        qualification: data.qualification.trim(),
        benefits: data.benefits?.trim() || null,
      },
    });
  }

  async deleteTemplate(id: string) {
    const existing = await this.prisma.jobTemplate.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Template lowongan tidak ditemukan');
    return this.prisma.jobTemplate.delete({ where: { id } });
  }

  async getSources() {
    await this.ensureDefaults();
    return this.prisma.recruitmentSource.findMany({ orderBy: { createdAt: 'asc' } });
  }

  async createSource(name: string) {
    return this.prisma.recruitmentSource.create({
      data: { name: name.trim(), active: true },
    });
  }

  async toggleSource(id: string) {
    const existing = await this.prisma.recruitmentSource.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Sumber rekrutmen tidak ditemukan');

    return this.prisma.recruitmentSource.update({
      where: { id },
      data: { active: !existing.active },
    });
  }

  async getFormFields() {
    await this.ensureDefaults();
    return this.prisma.applicationFormField.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async updateFormFields(fields: { id: string; required: boolean }[]) {
    for (const f of fields) {
      const existing = await this.prisma.applicationFormField.findUnique({ where: { id: f.id } });
      if (!existing || existing.isSystem) continue;
      await this.prisma.applicationFormField.update({
        where: { id: f.id },
        data: { required: f.required },
      });
    }
    return this.getFormFields();
  }
}
