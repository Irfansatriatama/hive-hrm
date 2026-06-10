import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Req,
  Query,
  Param,
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

  private assertHRAccess(user: unknown) {
    const role = (user as { role?: string }).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Unauthorized access');
    }
  }

  @Get('balance')
  async getBalance(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    try {
      const emp = await this.getEmployeeByUserId(user.id);
      return this.service.getPointsBalance(emp.id);
    } catch {
      return 0;
    }
  }

  @Get('catalog')
  async getCatalog(@Req() req: express.Request, @Query('all') all?: string) {
    const user = await this.getSessionUser(req);
    const includeInactive = all === 'true' && this.isHR(user);
    if (all === 'true') this.assertHRAccess(user);
    return this.service.getCatalog(includeInactive);
  }

  private isHR(user: unknown) {
    const role = (user as { role?: string }).role;
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  }

  @Post('catalog')
  async createCatalogItem(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.createCatalogItem(body, user.id);
  }

  @Put('catalog/:id')
  async updateCatalogItem(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.updateCatalogItem(id, body, user.id);
  }

  @Delete('catalog/:id')
  async deleteCatalogItem(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.deleteCatalogItem(id, user.id);
  }

  @Get('hashtags')
  async getHashtags(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getHashtags();
  }

  @Post('hashtags')
  async createHashtag(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.createHashtag(body, user.id);
  }

  @Put('hashtags/:id')
  async updateHashtag(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.updateHashtag(id, body, user.id);
  }

  @Delete('hashtags/:id')
  async deleteHashtag(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.deleteHashtag(id, user.id);
  }

  @Get('settings')
  async getSettings(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.getSettings();
  }

  @Put('settings')
  async updateSettings(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.updateSettings(body, user.id);
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
    return this.service.redeemItem(user.id, emp.id, body.itemId);
  }

  @Get('redemptions')
  async getRedemptions(
    @Req() req: express.Request,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.getRedemptions({ status, startDate, endDate });
  }

  @Post('redemptions/:id/approve')
  async approveRedemption(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.approveRedemption(id, user.id);
  }

  @Post('redemptions/:id/reject')
  async rejectRedemption(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { notes?: string }
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.rejectRedemption(id, body?.notes, user.id);
  }

  @Get('hashtag-report')
  async getHashtagReport(
    @Req() req: express.Request,
    @Query('departmentId') departmentId?: string,
    @Query('hashtag') hashtag?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    const rows = await this.service.getHashtagReport({
      departmentId,
      hashtag,
      startDate,
      endDate,
    });
    return rows.map(row => this.service.mapTransactionRow(row));
  }

  @Get('ledger')
  async getLedger(
    @Req() req: express.Request,
    @Query('employeeId') employeeId?: string,
    @Query('type') type?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    const rows = await this.service.getLedger({ employeeId, type, startDate, endDate });
    return rows.map(row => this.service.mapTransactionRow(row));
  }

  @Get('feed')
  async getFeed(@Req() req: express.Request) {
    await this.getSessionUser(req);
    const rows = await this.service.getRecentFeed(5);
    return rows.map(row => this.service.mapTransactionRow(row));
  }

  @Get('transactions')
  async getTransactions(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    try {
      const emp = await this.getEmployeeByUserId(user.id);
      const rows = await this.service.getMyTransactions(emp.id);
      return rows.map(row => this.service.mapTransactionRow(row));
    } catch {
      return [];
    }
  }
}
