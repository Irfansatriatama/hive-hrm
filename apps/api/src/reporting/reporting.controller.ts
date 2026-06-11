import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import { auth } from '../auth/auth.service';
import { ReportingService } from './reporting.service';

const REPORTING_ROLES = ['SUPER_ADMIN', 'HR_ADMIN', 'MANAGER', 'FINANCE'];

@Controller('reporting')
export class ReportingController {
  constructor(private readonly service: ReportingService) {}

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

  private assertReportingAccess(user: unknown) {
    const role = (user as { role?: string }).role || 'EMPLOYEE';
    if (!REPORTING_ROLES.includes(role)) {
      throw new UnauthorizedException(
        'Pusat laporan hanya untuk Admin, Manager, dan Finance',
      );
    }
  }

  @Get('preview')
  async getPreview(
    @Req() req: express.Request,
    @Query('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('departmentId') departmentId?: string,
    @Query('employeeId') employeeId?: string,
  ) {
    const user = await this.getSessionUser(req);
    this.assertReportingAccess(user);

    return this.service.getPreview(type, {
      startDate,
      endDate,
      departmentId,
      employeeId,
    });
  }

  @Get('attendance')
  async getAttendanceReport(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    this.assertReportingAccess(user);

    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.service.getAttendanceReport(m, y);
  }

  @Get('leave')
  async getLeaveReport(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    this.assertReportingAccess(user);

    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.service.getLeaveReport(m, y);
  }

  @Get('payroll')
  async getPayrollReport(
    @Req() req: express.Request,
    @Query('periodId') periodId?: string,
  ) {
    const user = await this.getSessionUser(req);
    this.assertReportingAccess(user);

    return this.service.getPayrollReport(periodId || undefined);
  }

  @Get('headcount')
  async getHeadcountReport(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    this.assertReportingAccess(user);

    return this.service.getHeadcountReport();
  }

  @Get('expense')
  async getExpenseReport(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    this.assertReportingAccess(user);

    const now = new Date();
    const m = month ? parseInt(month, 10) : now.getMonth() + 1;
    const y = year ? parseInt(year, 10) : now.getFullYear();
    return this.service.getExpenseReport(m, y);
  }
}
