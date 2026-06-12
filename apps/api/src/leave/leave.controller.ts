import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
import { LeaveService } from './leave.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('leave')
export class LeaveController {
  constructor(
    private readonly service: LeaveService,
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

  @Get('types')
  async getLeaveTypes(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findLeaveTypes();
  }

  @Get('balances')
  async getBalances(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.getBalances(emp.id);
  }

  @Get('balances/all')
  async getAllBalances(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access restricted to HR/Super Admin');
    }
    return this.service.getAllBalances();
  }

  @Post('balances/adjust')
  async adjustBalance(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access restricted to HR/Super Admin');
    }
    return this.service.adjustBalance(user.id, body);
  }


  @Get('requests/my')
  async getMyRequests(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.findMyRequests(emp.id);
  }

  @Post('requests')
  async createRequest(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.createRequest(emp.id, body, user.id);
  }

  @Delete('requests/:id')
  async cancelRequest(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.cancelRequest(id, emp.id, user.id);
  }

  @Get('requests')
  async getAllRequests(@Req() req: express.Request, @Query('status') status?: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access to all leave requests is restricted to Admins');
    }
    return this.service.findAllRequests(status);
  }

  @Get('calendar')
  async getLeaveCalendar(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.prisma.employee.findUnique({ where: { userId: user.id } });
    const monthNum = month ? parseInt(month, 10) : undefined;
    const yearNum = year ? parseInt(year, 10) : undefined;
    return this.service.getLeaveCalendar(emp?.id, monthNum, yearNum);
  }
}
