import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
import { ShiftService } from './shift.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('shift')
export class ShiftController {
  constructor(
    private readonly service: ShiftService,
    private readonly prisma: PrismaService,
  ) {}

  private async getSessionUser(req: express.Request) {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        val.forEach((v) => headers.append(key, v));
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
    const emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) {
      throw new NotFoundException('Profile karyawan tidak ditemukan');
    }
    return emp;
  }

  private assertScheduleAccess(user: unknown) {
    const role = (user as { role?: string }).role;
    if (!['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(role || '')) {
      throw new UnauthorizedException('Unauthorized access');
    }
  }

  private assertAdminAccess(user: unknown) {
    const role = (user as { role?: string }).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can manage shift types');
    }
  }

  private assertSwapApprovalAccess(user: unknown) {
    const role = (user as { role?: string }).role;
    if (!['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER'].includes(role || '')) {
      throw new UnauthorizedException('Unauthorized access');
    }
  }

  @Get('types')
  async getShiftTypes(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getShiftTypes();
  }

  @Post('types')
  async createShiftType(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    this.assertAdminAccess(user);
    return this.service.createShiftType(body);
  }

  @Put('types/:id')
  async updateShiftType(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    this.assertAdminAccess(user);
    return this.service.updateShiftType(id, body);
  }

  @Delete('types/:id')
  async deleteShiftType(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    this.assertAdminAccess(user);
    return this.service.deleteShiftType(id);
  }

  @Get('schedules')
  async getWeeklySchedule(
    @Req() req: express.Request,
    @Query('weekStart') weekStart: string,
    @Query('departmentId') departmentId?: string,
  ) {
    await this.getSessionUser(req);
    if (!weekStart) {
      throw new NotFoundException('weekStart query parameter is required');
    }
    return this.service.getWeeklySchedule(weekStart, departmentId || undefined);
  }

  @Put('schedules')
  async assignSchedule(
    @Req() req: express.Request,
    @Body() body: { employeeId: string; date: string; shiftId?: string | null },
  ) {
    const user = await this.getSessionUser(req);
    this.assertScheduleAccess(user);
    return this.service.assignSchedule(body.employeeId, body.date, body.shiftId ?? null);
  }

  @Post('schedules/copy-week')
  async copyWeekSchedule(
    @Req() req: express.Request,
    @Body() body: { weekStart: string },
  ) {
    const user = await this.getSessionUser(req);
    this.assertScheduleAccess(user);
    return this.service.copyWeekSchedule(body.weekStart);
  }

  @Get('swaps')
  async getSwaps(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getSwaps();
  }

  @Post('swaps')
  async createSwap(
    @Req() req: express.Request,
    @Body() body: { partnerId: string; date: string; shiftDetails: string },
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.createSwap(emp.id, body);
  }

  @Put('swaps/:id/approve')
  async approveSwap(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    this.assertSwapApprovalAccess(user);
    return this.service.updateSwapStatus(id, 'approved');
  }

  @Put('swaps/:id/reject')
  async rejectSwap(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    this.assertSwapApprovalAccess(user);
    return this.service.updateSwapStatus(id, 'rejected');
  }
}
