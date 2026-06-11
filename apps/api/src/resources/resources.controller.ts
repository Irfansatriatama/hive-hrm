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
  BadRequestException,
} from '@nestjs/common';
import * as express from 'express';
import { ResourcesService } from './resources.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('resources')
export class ResourcesController {
  constructor(
    private readonly service: ResourcesService,
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

  private canApproveBooking(role: string) {
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER';
  }

  private canViewAllBookings(role: string) {
    return this.canApproveBooking(role);
  }

  @Get()
  async findResources(@Req() req: express.Request, @Query('all') all?: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    const includeInactive = all === '1' || all === 'true';
    if (includeInactive && !this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findResources(includeInactive);
  }

  @Post()
  async createResource(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.createResource(body);
  }

  @Get('bookings/calendar')
  async findCalendarBookings(
    @Req() req: express.Request,
    @Query('start') start: string,
    @Query('end') end: string,
  ) {
    await this.getSessionUser(req);
    if (!start || !end) {
      throw new BadRequestException('start and end query parameters are required');
    }
    return this.service.findCalendarBookings(new Date(start), new Date(end));
  }

  @Get('bookings')
  async findBookings(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    if (this.canViewAllBookings(role)) {
      return this.service.findBookings();
    }

    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) return [];
    return this.service.findBookings(emp.id);
  }

  @Post('bookings')
  async createBooking(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.createBooking(emp.id, body);
  }

  @Put('bookings/:id')
  async updateBooking(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.updateBooking(id, emp.id, body);
  }

  @Post('bookings/:id/approve')
  async approveBooking(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.canApproveBooking(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.approveBooking(id, user.id);
  }

  @Post('bookings/:id/reject')
  async rejectBooking(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.canApproveBooking(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.rejectBooking(id, user.id, body.reason);
  }

  @Post('bookings/:id/cancel')
  async cancelBooking(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    if (!this.isAdmin(role)) {
      const emp = await this.getLinkedEmployee(user.id, user.email);
      const booking = await this.prisma.resourceBooking.findUnique({ where: { id } });
      if (!emp || !booking || booking.employeeId !== emp.id) {
        throw new UnauthorizedException('Access denied');
      }
    }

    return this.service.cancelBooking(id);
  }

  @Put(':id')
  async updateResource(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateResource(id, body);
  }

  @Delete(':id')
  async deleteResource(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.deleteResource(id);
  }
}
