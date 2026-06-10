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

  @Get('po')
  async getPOs(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getPOs();
  }

  @Post('po')
  async createPO(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.service.createPO(user.id, user.name, body);
  }

  @Post('po/:id/action')
  async poAction(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { action: 'approve' | 'reject' }
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Only admins/finance can action POs');
    }
    return this.service.approveOrRejectPO(id, body.action, user.id);
  }

  @Get('report')
  async getReport(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Access to reports is restricted to Admins/Finance');
    }
    return this.service.getReport();
  }
}
