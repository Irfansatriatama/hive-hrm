import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  Query,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
    private readonly prisma: PrismaService
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

    const session = await auth.api.getSession({ headers });
    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }
    return session.user;
  }

  private async getEmployeeByUserId(userId: string) {
    const emp = await this.prisma.employee.findUnique({
      where: { userId },
    });
    if (!emp) {
      throw new NotFoundException('Profile karyawan tidak ditemukan');
    }
    return emp;
  }

  private assertHRAccess(user: unknown) {
    const role = (user as { role?: string }).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Unauthorized access');
    }
  }

  @Get('today')
  async getTodayStatus(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.getTodayStatus(emp.id);
  }

  @Post('check-in')
  async checkIn(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.checkIn(emp.id, body);
  }

  @Post('check-out')
  async checkOut(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.checkOut(emp.id, body);
  }

  @Get('history')
  async getMyHistory(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.service.getMyHistory(emp.id, m, y);
  }

  @Get('report')
  async getReport(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.getReport();
  }

  @Put('report/bulk-status')
  async bulkUpdateStatus(
    @Req() req: express.Request,
    @Body() body: { ids: string[]; status: string }
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.bulkUpdateStatus(body.ids || [], body.status, user.id);
  }

  @Get('settings')
  async getSettings(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getSettings();
  }

  @Put('settings')
  async updateSettings(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.updateSettings(body, user.id);
  }
}
