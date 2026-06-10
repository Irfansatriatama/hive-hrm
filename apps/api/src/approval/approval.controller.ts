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
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
import { ApprovalService } from './approval.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('approval')
export class ApprovalController {
  constructor(
    private readonly service: ApprovalService,
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

  @Get('inbox')
  async getInbox(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    
    let empId = '';
    try {
      const emp = await this.getEmployeeByUserId(user.id);
      empId = emp.id;
    } catch {
      // Super admin might not have employee profile, which is fine
    }

    return this.service.getPendingApprovals(role, empId);
  }

  @Post('action')
  async action(@Req() req: express.Request, @Body() body: { type: string; id: string; action: 'approve' | 'reject' }) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'MANAGER') {
      throw new UnauthorizedException('Only admins and managers can perform approval actions');
    }

    let empId = '';
    try {
      const emp = await this.getEmployeeByUserId(user.id);
      empId = emp.id;
    } catch {
      // Admin bypass
    }

    return this.service.actionApproval(body.type, body.id, body.action, user.id, empId);
  }

  @Get('rules')
  async getRules(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getRules();
  }

  @Post('rules')
  async createRule(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Admin only');
    }
    return this.service.createRule(user.id, body);
  }

  @Put('rules/:id')
  async updateRule(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { before: any; after: any }
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Admin only');
    }
    return this.service.updateRule(user.id, id, body.before, body.after);
  }

  @Delete('rules/:id')
  async deleteRule(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { deletedRule: any }
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Admin only');
    }
    return this.service.deleteRule(user.id, id, body.deletedRule);
  }

  @Get('settings')
  async getSettings(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getSettings();
  }

  @Post('settings')
  async saveSettings(@Req() req: express.Request, @Body() body: { before: any; after: any }) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Admin only');
    }
    return this.service.saveSettings(user.id, body.before, body.after);
  }
}

