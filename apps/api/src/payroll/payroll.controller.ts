import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import { PayrollService } from './payroll.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('payroll')
export class PayrollController {
  constructor(
    private readonly service: PayrollService,
    private readonly prisma: PrismaService,
  ) {}

  private async getSessionUser(req: express.Request) {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach(v => headers.append(key, v));
      } else if (val) {
        headers.set(key, val);
      }
    });

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return session.user;
  }

  private async getLinkedEmployee(userId: string, email: string) {
    let emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) {
      emp = await this.prisma.employee.findUnique({ where: { email } });
    }
    return emp;
  }

  @Get('periods')
  async findAllPeriods(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findAllPeriods();
  }

  @Post('periods')
  async createPeriod(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.createPeriod(body);
  }

  @Get('my-payslips')
  async findMyPayslips(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) return [];
    return this.service.findMyPayslips(emp.id);
  }

  @Get('dashboard')
  async getDashboard(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.getDashboard();
  }

  @Get('components')
  async findComponents(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findComponents();
  }

  @Post('components')
  async createComponent(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.createComponent(body);
  }

  @Put('components/:id')
  async updateComponent(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateComponent(id, body);
  }

  @Delete('components/:id')
  async deleteComponent(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.deleteComponent(id);
  }

  @Put('periods/:id')
  async updatePeriod(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updatePeriod(id, body);
  }

  @Post('periods/:id/process')
  async processPeriod(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.processPeriod(id);
  }

  @Post('periods/:id/finalize')
  async finalizePeriod(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.finalizePeriod(id);
  }

  @Get('periods/:id/records')
  async findRecordsByPeriod(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findRecordsByPeriod(id);
  }

  @Get('records/:recordId')
  async findRecordById(@Req() req: express.Request, @Param('recordId') recordId: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    const record = await this.service.findRecordById(recordId);

    const isAdmin = role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'FINANCE';
    if (!isAdmin) {
      const emp = await this.getLinkedEmployee(user.id, user.email);
      if (!emp || emp.id !== record.employeeId) {
        throw new UnauthorizedException('Access denied');
      }
    }

    return record;
  }

  @Put('records/:recordId/items')
  async updateRecordItems(
    @Req() req: express.Request,
    @Param('recordId') recordId: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateRecordItems(recordId, body.items);
  }
}
