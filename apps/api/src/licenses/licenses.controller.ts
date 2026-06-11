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
import { LicensesService } from './licenses.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('licenses')
export class LicensesController {
  constructor(
    private readonly service: LicensesService,
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

  @Get('types')
  async findTypes(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findTypes();
  }

  @Post('types')
  async createType(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.createType(body);
  }

  @Put('types/:id')
  async updateType(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateType(id, body);
  }

  @Delete('types/:id')
  async deleteType(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.deleteType(id);
  }

  @Get('expiring')
  async findExpiring(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findExpiring();
  }

  @Get()
  async findAll(
    @Req() req: express.Request,
    @Query('employeeId') employeeId?: string,
    @Query('typeId') typeId?: string,
    @Query('status') status?: string,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    if (this.isAdmin(role)) {
      return this.service.findAll({ employeeId, typeId, status });
    }

    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) return [];
    return this.service.findAll({ employeeId: emp.id, typeId, status });
  }

  @Post()
  async create(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    if (this.isAdmin(role)) {
      if (!body.employeeId) {
        throw new UnauthorizedException('employeeId is required');
      }
      return this.service.create(body);
    }

    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.create({ ...body, employeeId: emp.id });
  }

  @Put(':id')
  async update(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    let licenseRecord;
    try {
      licenseRecord = await this.service.findById(id);
    } catch {
      throw new NotFoundException('License not found');
    }

    if (!this.isAdmin(role)) {
      const emp = await this.getLinkedEmployee(user.id, user.email);
      if (!emp || emp.id !== licenseRecord.employeeId) {
        throw new UnauthorizedException('Access denied');
      }
    }

    return this.service.update(id, body);
  }

  @Delete(':id')
  async delete(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.delete(id);
  }
}
