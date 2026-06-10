import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import * as express from 'express';
import { RewardService } from './reward.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('reward')
export class RewardController {
  constructor(
    private readonly service: RewardService,
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

  @Get('balance')
  async getBalance(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    let empId = '';
    try {
      const emp = await this.getEmployeeByUserId(user.id);
      empId = emp.id;
    } catch {
      return 0;
    }
    return this.service.getPointsBalance(empId, user.id);
  }

  @Get('catalog')
  async getCatalog(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getCatalog();
  }

  @Post('appreciation')
  async sendAppreciation(
    @Req() req: express.Request,
    @Body() body: { recipientId: string; points: number; message: string; hashtag: string }
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.sendAppreciation(user.id, emp.id, body.recipientId, body);
  }

  @Post('redeem')
  async redeemItem(@Req() req: express.Request, @Body() body: { itemId: string }) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.redeemItem(user.id, emp.id, emp.fullName, body.itemId);
  }

  @Get('transactions')
  async getTransactions(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    let empId = '';
    try {
      const emp = await this.getEmployeeByUserId(user.id);
      empId = emp.id;
    } catch {
      return [];
    }
    return this.service.getTransactions(empId, user.id);
  }
}
