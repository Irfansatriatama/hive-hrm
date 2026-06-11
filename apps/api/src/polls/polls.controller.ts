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
} from '@nestjs/common';
import * as express from 'express';
import { PollsService } from './polls.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('polls')
export class PollsController {
  constructor(
    private readonly service: PollsService,
    private readonly prisma: PrismaService,
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

    const session = await auth.api.getSession({
      headers,
    });

    if (!session) {
      throw new UnauthorizedException('Invalid or expired session');
    }

    return session.user;
  }

  private async getLinkedEmployee(userId: string, email: string) {
    let emp = await this.prisma.employee.findUnique({ where: { userId } });
    if (!emp) {
      emp = await this.prisma.employee.findUnique({ where: { email } });
    }
    return emp;
  }

  private isAdmin(role: string) {
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  }

  @Get()
  async findAll(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    const admin = this.isAdmin(role);

    const emp = await this.getLinkedEmployee(user.id, user.email);
    return this.service.findAll(admin, emp?.departmentId, emp?.id);
  }

  @Post()
  async create(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.create(body, user.id);
  }

  @Put(':id')
  async update(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.update(id, body);
  }

  @Delete(':id')
  async delete(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.delete(id);
  }

  @Post(':id/publish')
  async publish(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.publish(id);
  }

  @Post(':id/close')
  async close(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.close(id);
  }

  @Post(':id/vote')
  async vote(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.vote(id, emp.id, body);
  }

  @Get(':id/results')
  async getResults(@Req() req: express.Request, @Param('id') id: string) {
    await this.getSessionUser(req);
    return this.service.getResults(id);
  }
}
