import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EmployeeStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PayrollService {
  constructor(private prisma: PrismaService) {}

  async findAllPeriods() {
    return this.prisma.payrollPeriod.findMany({
      include: { _count: { select: { records: true } } },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async createPeriod(data: any) {
    return this.prisma.payrollPeriod.create({
      data: {
        name: data.name,
        month: parseInt(data.month, 10),
        year: parseInt(data.year, 10),
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        payDate: data.payDate ? new Date(data.payDate) : null,
        notes: data.notes || null,
        status: data.status || 'draft',
      },
    });
  }

  async updatePeriod(id: string, data: any) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.month !== undefined && { month: parseInt(data.month, 10) }),
        ...(data.year !== undefined && { year: parseInt(data.year, 10) }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && { endDate: new Date(data.endDate) }),
        ...(data.payDate !== undefined && {
          payDate: data.payDate ? new Date(data.payDate) : null,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });
  }

  async processPeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');
    if (period.status !== 'draft' && period.status !== 'processing') {
      throw new BadRequestException('Period can only be processed from draft status');
    }

    const employees = await this.prisma.employee.findMany({
      where: { status: EmployeeStatus.ACTIVE },
    });

    for (const employee of employees) {
      const existing = await this.prisma.payrollRecord.findUnique({
        where: {
          periodId_employeeId: { periodId: id, employeeId: employee.id },
        },
      });
      if (existing) continue;

      const basicSalary = employee.basicSalary || 0;
      const bpjsKetenagakerjaan = Math.round(basicSalary * 0.02);
      const bpjsKesehatan = Math.round(basicSalary * 0.01);
      const grossSalary = basicSalary;
      const totalDeduct = bpjsKetenagakerjaan + bpjsKesehatan;
      const netSalary = grossSalary - totalDeduct;

      await this.prisma.payrollRecord.create({
        data: {
          periodId: id,
          employeeId: employee.id,
          basicSalary,
          grossSalary,
          totalDeduct,
          netSalary,
          status: 'draft',
          items: {
            create: [
              {
                name: 'Gaji Pokok',
                type: 'earning',
                category: 'basic',
                amount: basicSalary,
              },
              {
                name: 'BPJS Ketenagakerjaan',
                type: 'deduction',
                category: 'bpjs',
                amount: bpjsKetenagakerjaan,
              },
              {
                name: 'BPJS Kesehatan',
                type: 'deduction',
                category: 'bpjs',
                amount: bpjsKesehatan,
              },
            ],
          },
        },
      });
    }

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'processing' },
      include: { _count: { select: { records: true } } },
    });
  }

  async finalizePeriod(id: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id } });
    if (!period) throw new NotFoundException('Payroll period not found');

    await this.prisma.payrollRecord.updateMany({
      where: { periodId: id },
      data: { status: 'approved' },
    });

    return this.prisma.payrollPeriod.update({
      where: { id },
      data: { status: 'finalized' },
      include: { _count: { select: { records: true } } },
    });
  }

  async findRecordsByPeriod(periodId: string) {
    const period = await this.prisma.payrollPeriod.findUnique({ where: { id: periodId } });
    if (!period) throw new NotFoundException('Payroll period not found');

    return this.prisma.payrollRecord.findMany({
      where: { periodId },
      include: {
        employee: {
          include: { department: true, position: true },
        },
        items: true,
      },
      orderBy: { employee: { fullName: 'asc' } },
    });
  }

  async findRecordById(recordId: string) {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id: recordId },
      include: {
        period: true,
        employee: {
          include: { department: true, position: true },
        },
        items: true,
      },
    });
    if (!record) throw new NotFoundException('Payroll record not found');
    return record;
  }

  async updateRecordItems(recordId: string, items: any[]) {
    const record = await this.prisma.payrollRecord.findUnique({
      where: { id: recordId },
      include: { items: true },
    });
    if (!record) throw new NotFoundException('Payroll record not found');

    await this.prisma.payrollItem.deleteMany({ where: { recordId } });

    const createdItems = await Promise.all(
      (items || []).map((item: any) =>
        this.prisma.payrollItem.create({
          data: {
            recordId,
            name: item.name,
            type: item.type,
            category: item.category || 'other',
            amount: parseInt(item.amount, 10) || 0,
            notes: item.notes || null,
          },
        }),
      ),
    );

    const grossSalary = createdItems
      .filter(i => i.type === 'earning')
      .reduce((sum, i) => sum + i.amount, 0);
    const totalDeduct = createdItems
      .filter(i => i.type === 'deduction')
      .reduce((sum, i) => sum + i.amount, 0);
    const basicSalary =
      createdItems.find(i => i.category === 'basic')?.amount || record.basicSalary;
    const netSalary = grossSalary - totalDeduct;

    return this.prisma.payrollRecord.update({
      where: { id: recordId },
      data: { basicSalary, grossSalary, totalDeduct, netSalary },
      include: {
        employee: { include: { department: true, position: true } },
        items: true,
      },
    });
  }

  async findComponents() {
    return this.prisma.payrollComponent.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createComponent(data: any) {
    return this.prisma.payrollComponent.create({
      data: {
        name: data.name,
        type: data.type,
        category: data.category,
        isDefault: data.isDefault ?? false,
        isFixed: data.isFixed ?? true,
        taxable: data.taxable ?? true,
        sortOrder: parseInt(data.sortOrder, 10) || 0,
      },
    });
  }

  async updateComponent(id: string, data: any) {
    const component = await this.prisma.payrollComponent.findUnique({ where: { id } });
    if (!component) throw new NotFoundException('Payroll component not found');

    return this.prisma.payrollComponent.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.isFixed !== undefined && { isFixed: data.isFixed }),
        ...(data.taxable !== undefined && { taxable: data.taxable }),
        ...(data.sortOrder !== undefined && { sortOrder: parseInt(data.sortOrder, 10) }),
      },
    });
  }

  async deleteComponent(id: string) {
    const component = await this.prisma.payrollComponent.findUnique({ where: { id } });
    if (!component) throw new NotFoundException('Payroll component not found');
    return this.prisma.payrollComponent.delete({ where: { id } });
  }

  async findMyPayslips(employeeId: string) {
    return this.prisma.payrollRecord.findMany({
      where: { employeeId },
      include: {
        period: true,
        items: true,
        employee: { include: { department: true, position: true } },
      },
      orderBy: { period: { year: 'desc' } },
    });
  }

  async getDashboard() {
    const latestPeriod = await this.prisma.payrollPeriod.findFirst({
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
      include: { _count: { select: { records: true } } },
    });

    let totalPayroll = 0;
    let employeeCount = 0;

    if (latestPeriod) {
      const agg = await this.prisma.payrollRecord.aggregate({
        where: { periodId: latestPeriod.id },
        _sum: { netSalary: true },
        _count: true,
      });
      totalPayroll = agg._sum.netSalary || 0;
      employeeCount = agg._count;
    }

    return {
      latestPeriod,
      employeeCount,
      totalPayroll,
    };
  }
}
