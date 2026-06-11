import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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

  async findAllJobs() {
    return this.prisma.jobPosting.findMany({
      include: {
        department: true,
        position: true,
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createJob(data: any) {
    return this.prisma.jobPosting.create({
      data: {
        title: data.title?.trim(),
        departmentId: data.departmentId || null,
        positionId: data.positionId || null,
        description: data.description?.trim(),
        requirements: data.requirements?.trim() || null,
        benefits: data.benefits?.trim() || null,
        employmentType: data.employmentType || 'full_time',
        location: data.location?.trim() || null,
        salaryMin: data.salaryMin != null ? parseInt(String(data.salaryMin)) : null,
        salaryMax: data.salaryMax != null ? parseInt(String(data.salaryMax)) : null,
        status: data.status || 'draft',
        deadline: data.deadline ? new Date(data.deadline) : null,
        openings: parseInt(String(data.openings)) || 1,
      },
      include: { department: true, position: true, _count: { select: { applications: true } } },
    });
  }

  async updateJob(id: string, data: any) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lowongan tidak ditemukan');

    return this.prisma.jobPosting.update({
      where: { id },
      data: {
        title: data.title?.trim() ?? existing.title,
        departmentId: data.departmentId !== undefined ? (data.departmentId || null) : existing.departmentId,
        positionId: data.positionId !== undefined ? (data.positionId || null) : existing.positionId,
        description: data.description?.trim() ?? existing.description,
        requirements: data.requirements !== undefined ? (data.requirements?.trim() || null) : existing.requirements,
        benefits: data.benefits !== undefined ? (data.benefits?.trim() || null) : existing.benefits,
        employmentType: data.employmentType ?? existing.employmentType,
        location: data.location !== undefined ? (data.location?.trim() || null) : existing.location,
        salaryMin: data.salaryMin !== undefined ? (data.salaryMin != null ? parseInt(String(data.salaryMin)) : null) : existing.salaryMin,
        salaryMax: data.salaryMax !== undefined ? (data.salaryMax != null ? parseInt(String(data.salaryMax)) : null) : existing.salaryMax,
        deadline: data.deadline !== undefined ? (data.deadline ? new Date(data.deadline) : null) : existing.deadline,
        openings: data.openings !== undefined ? (parseInt(String(data.openings)) || 1) : existing.openings,
      },
      include: { department: true, position: true, _count: { select: { applications: true } } },
    });
  }

  async openJob(id: string) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lowongan tidak ditemukan');
    return this.prisma.jobPosting.update({
      where: { id },
      data: { status: 'open' },
      include: { department: true, position: true, _count: { select: { applications: true } } },
    });
  }

  async closeJob(id: string) {
    const existing = await this.prisma.jobPosting.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Lowongan tidak ditemukan');
    return this.prisma.jobPosting.update({
      where: { id },
      data: { status: 'closed' },
      include: { department: true, position: true, _count: { select: { applications: true } } },
    });
  }

  async findApplicationsByJob(jobId: string) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Lowongan tidak ditemukan');

    return this.prisma.jobApplication.findMany({
      where: { jobId },
      include: {
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findApplicationById(id: string) {
    const app = await this.prisma.jobApplication.findUnique({
      where: { id },
      include: {
        job: { include: { department: true, position: true } },
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
    });
    if (!app) throw new NotFoundException('Pelamar tidak ditemukan');
    return app;
  }

  async createApplication(jobId: string, data: any) {
    const job = await this.prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) throw new NotFoundException('Lowongan tidak ditemukan');

    return this.prisma.jobApplication.create({
      data: {
        jobId,
        applicantName: data.applicantName?.trim(),
        email: data.email?.trim(),
        phone: data.phone?.trim() || null,
        resumeUrl: data.resumeUrl?.trim() || null,
        coverLetter: data.coverLetter?.trim() || null,
        source: data.source?.trim() || null,
        currentStage: 'applied',
        stageHistory: {
          create: { stage: 'applied', notes: 'Lamaran masuk' },
        },
      },
      include: {
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
    });
  }

  async moveApplicationStage(id: string, stage: string, notes?: string, movedBy?: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Pelamar tidak ditemukan');
    if (app.hiredAt || app.rejectedAt) {
      throw new BadRequestException('Pelamar sudah di-hire atau ditolak');
    }

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        currentStage: stage,
        stageHistory: {
          create: { stage, notes: notes?.trim() || null, movedBy: movedBy || null },
        },
      },
      include: {
        job: { include: { department: true, position: true } },
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
    });
  }

  async updateApplication(id: string, data: { rating?: number; notes?: string }) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Pelamar tidak ditemukan');

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        rating: data.rating !== undefined ? (data.rating != null ? parseInt(String(data.rating)) : null) : app.rating,
        notes: data.notes !== undefined ? (data.notes?.trim() || null) : app.notes,
      },
      include: {
        job: { include: { department: true, position: true } },
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
    });
  }

  async hireApplication(id: string, movedBy?: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Pelamar tidak ditemukan');
    if (app.hiredAt) throw new BadRequestException('Pelamar sudah di-hire');

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        hiredAt: new Date(),
        currentStage: 'hired',
        stageHistory: {
          create: { stage: 'hired', notes: 'Kandidat diterima', movedBy: movedBy || null },
        },
      },
      include: {
        job: { include: { department: true, position: true } },
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
    });
  }

  async rejectApplication(id: string, reason: string, movedBy?: string) {
    const app = await this.prisma.jobApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Pelamar tidak ditemukan');
    if (app.rejectedAt) throw new BadRequestException('Pelamar sudah ditolak');

    return this.prisma.jobApplication.update({
      where: { id },
      data: {
        rejectedAt: new Date(),
        rejectedReason: reason?.trim() || null,
        currentStage: 'rejected',
        stageHistory: {
          create: {
            stage: 'rejected',
            notes: reason?.trim() || 'Ditolak',
            movedBy: movedBy || null,
          },
        },
      },
      include: {
        job: { include: { department: true, position: true } },
        stageHistory: { orderBy: { movedAt: 'desc' } },
      },
    });
  }
}
