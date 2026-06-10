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
} from '@nestjs/common';
import * as express from 'express';
import { EmployeesService } from './employees.service';
import { auth } from '../auth/auth.service';

@Controller('employees')
export class EmployeesController {
  constructor(private readonly service: EmployeesService) {}

  // Helper to extract session on NestJS backend via Better Auth
  private async getSessionUser(req: express.Request) {
    // Transform Express headers to standard Headers object Better Auth expects
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

  @Get('dashboard-stats')
  async getDashboardStats(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role || 'EMPLOYEE';
    return this.service.getDashboardStats(role);
  }

  @Get('departments')
  async findDepartments(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findDepartments();
  }

  @Get('positions')
  async findPositions(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findPositions();
  }

  @Get('managers')
  async findManagers(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findManagers();
  }

  @Get('groups')
  async findAllGroups(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findAllGroups();
  }

  @Post('groups')
  async createGroup(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.service.createGroup(body, user.id);
  }

  @Put('groups/:id')
  async updateGroup(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.service.updateGroup(id, body, user.id);
  }

  @Delete('groups/:id')
  async removeGroup(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    return this.service.removeGroup(id, user.id);
  }

  @Get('requests/my')
  async findMyRequests(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.service.findByUserId(user.id);
    if (!emp) return [];
    return this.service.findMyRequests(emp.id);
  }

  @Post('requests')
  async createProfileRequest(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.service.findByUserId(user.id);
    if (!emp) throw new UnauthorizedException('No employee profile associated with this user');
    return this.service.createProfileRequest(emp.id, body, user.id);
  }

  @Delete('requests/:id')
  async cancelProfileRequest(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const emp = await this.service.findByUserId(user.id);
    if (!emp) throw new UnauthorizedException('No employee profile associated with this user');
    return this.service.cancelProfileRequest(id, emp.id, user.id);
  }

  @Get()
  async findAll(
    @Req() req: express.Request,
    @Query('search') search?: string,
    @Query('dept') dept?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    await this.getSessionUser(req);
    return this.service.findAll({
      search,
      dept,
      status,
      type,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 10,
    });
  }

  @Get(':id')
  async findOne(@Req() req: express.Request, @Param('id') id: string) {
    await this.getSessionUser(req);
    return this.service.findOne(id);
  }

  @Post()
  async create(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    // Check permission (Only Super Admin / HR Admin can add employees)
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('You do not have permission to add employees');
    }
    return this.service.create(body);
  }

  @Put(':id')
  async update(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('You do not have permission to edit employees');
    }
    return this.service.update(id, body);
  }

  @Delete(':id')
  async remove(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Super Admin can delete employees');
    }
    return this.service.remove(id);
  }
}
