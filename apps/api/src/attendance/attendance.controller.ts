import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Req,
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
  async checkOut(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.checkOut(emp.id);
  }

  @Get('history')
  async getMyHistory(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.getMyHistory(emp.id);
  }

  @Get('report')
  async getReport(
    @Req() req: express.Request,
    @Query('search') search?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string
  ) {
    const user = await this.getSessionUser(req);
    // RBAC: Only Super Admin, HR Admin can access reports
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Unauthorized access to attendance reports');
    }
    return this.service.getReport({
      search,
      startDate,
      endDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get('settings')
  async getSettings(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getSettings();
  }

  @Put('settings')
  async updateSettings(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can edit settings');
    }
    return this.service.updateSettings(body);
  }
}
