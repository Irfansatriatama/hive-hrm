import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import { ProcurementService } from './procurement.service';
import { auth } from '../auth/auth.service';

@Controller('procurement')
export class ProcurementController {
  constructor(private readonly service: ProcurementService) {}

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

  @Get('dashboard')
  async getDashboard(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getDashboard();
  }

  @Get('vendors')
  async getVendors(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getVendors();
  }

  @Get('po')
  async getPOs(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getPOs();
  }

  @Get('po/:id')
  async getPO(@Req() req: express.Request, @Param('id') id: string) {
    await this.getSessionUser(req);
    return this.service.getPOById(id);
  }

  @Post('po')
  async createPO(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.service.createPO(user.id, user.name, body);
  }

  @Post('po/:id/status')
  async updateStatus(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role || 'EMPLOYEE';
    return this.service.updatePOStatus(id, body.status, user.id, role);
  }

  @Post('po/:id/action')
  async poAction(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' },
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Only admins/finance can action POs');
    }

    const status = body.action === 'approve' ? 'Approved' : 'Draft';
    return this.service.updatePOStatus(id, status, user.id, role);
  }

  @Get('report')
  async getReport(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException(
        'Access to reports is restricted to Admins/Finance',
      );
    }
    return this.service.getReport();
  }
}
