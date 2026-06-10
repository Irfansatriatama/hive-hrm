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
import { CoreService } from './core.service';
import { auth } from '../auth/auth.service';

@Controller('core')
export class CoreController {
  constructor(private readonly service: CoreService) {}

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

  // 1. Announcements
  @Get('announcements')
  async getAnnouncements(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getAnnouncements();
  }

  @Post('announcements')
  async createAnnouncement(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can create announcements');
    }
    return this.service.createAnnouncement({ ...body, createdBy: user.name });
  }

  // 2. Assets
  @Get('assets')
  async getAssets(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getAssets();
  }

  @Post('assets')
  async createAsset(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can add assets');
    }
    return this.service.createAsset(body);
  }

  @Post('assets/:id/assign')
  async assignAsset(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { employeeId: string }
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can assign assets');
    }
    return this.service.assignAsset(id, body.employeeId);
  }

  @Post('assets/:id/return')
  async returnAsset(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can return assets');
    }
    return this.service.returnAsset(id);
  }

  // 3. Documents
  @Get('documents')
  async getDocuments(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getDocuments();
  }

  @Post('documents')
  async createDocument(@Req() req: express.Request, @Body() body: any) {
    await this.getSessionUser(req);
    return this.service.createDocument(body);
  }

  // 4. Shifts
  @Get('shifts')
  async getShifts(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getShifts();
  }

  @Post('shifts')
  async createShift(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can edit shifts');
    }
    return this.service.createShift(body);
  }

  // 5. Visitors
  @Get('visitors')
  async getVisitors(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getVisitors();
  }

  @Post('visitors')
  async createVisitor(@Req() req: express.Request, @Body() body: any) {
    await this.getSessionUser(req);
    return this.service.createVisitor(body);
  }

  @Post('visitors/:id/check-out')
  async checkOutVisitor(@Req() req: express.Request, @Param('id') id: string) {
    await this.getSessionUser(req);
    return this.service.checkOutVisitor(id);
  }

  // 6. Company Profile
  @Get('company')
  async getCompany(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getCompany();
  }

  @Put('company/:id')
  async updateCompany(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can update company details');
    }
    return this.service.updateCompany(id, body);
  }

  @Get('company/branches')
  async getBranches(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getBranches();
  }

  @Post('company/branches')
  async createBranch(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can add branches');
    }
    return this.service.createBranch(body);
  }

  @Put('company/branches/:id')
  async updateBranch(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can update branches');
    }
    return this.service.updateBranch(id, body);
  }

  @Post('company/branches/:id/delete')
  async deleteBranch(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can delete branches');
    }
    return this.service.deleteBranch(id);
  }

  @Get('company/holidays')
  async getHolidays(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getHolidays();
  }

  @Post('company/holidays')
  async createHoliday(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can manage holidays');
    }
    return this.service.createHoliday(body);
  }

  @Post('company/holidays/:id/delete')
  async deleteHoliday(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Only admins can manage holidays');
    }
    return this.service.deleteHoliday(id);
  }

  @Get('modules')
  async getModules(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getModules();
  }

  @Put('modules/:key')
  async updateModule(
    @Req() req: express.Request,
    @Param('key') key: string,
    @Body() body: { isEnabled: boolean },
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Super Admins can manage modules');
    }
    return this.service.updateModule(key, body.isEnabled);
  }

  @Put('modules')
  async bulkUpdateModules(
    @Req() req: express.Request,
    @Body() body: { modules: { key: string; isEnabled: boolean }[] },
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Super Admins can manage modules');
    }
    return this.service.bulkUpdateModules(body.modules);
  }

  @Get('billing')
  async getBilling(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Billing access restricted');
    }
    return this.service.getBillingSettings();
  }

  @Put('billing')
  async updateBilling(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Billing access restricted');
    }
    return this.service.updateBillingSettings(body);
  }

  // 7. Permissions (all authenticated users)
  @Get('permissions')
  async getPermissions(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getPublicPermissionMatrix();
  }

  // 8. User Access Management (Super Admin only)
  private assertSuperAdmin(user: any) {
    if (user?.role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access restricted to Super Admins');
    }
  }

  @Get('user-access/roles')
  async getRoles(@Req() req: express.Request) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.getRoles();
  }

  @Post('user-access/roles')
  async createRole(@Req() req: express.Request, @Body() body: any) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.createRole(body);
  }

  @Put('user-access/roles/:key')
  async updateRole(
    @Req() req: express.Request,
    @Param('key') key: string,
    @Body() body: any,
  ) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.updateRole(key, body);
  }

  @Delete('user-access/roles/:key')
  async deleteRole(@Req() req: express.Request, @Param('key') key: string) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.deleteRole(key);
  }

  @Get('user-access/permissions')
  async getPermissionMatrix(@Req() req: express.Request) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.getPermissionMatrix();
  }

  @Put('user-access/permissions')
  async savePermissionMatrix(
    @Req() req: express.Request,
    @Body() body: { matrix: Record<string, string[]> },
  ) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.savePermissionMatrix(body.matrix);
  }

  @Get('user-access')
  async getUsers(@Req() req: express.Request) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.getUsers();
  }

  @Get('user-access/unassigned-employees')
  async getUnassignedEmployees(@Req() req: express.Request) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.getUnassignedEmployees();
  }

  @Post('user-access/users')
  async createUser(@Req() req: express.Request, @Body() body: any) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.createUserAccount(body);
  }

  @Put('user-access/:id/role')
  async updateUserRole(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { role: string },
  ) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.updateUserRole(id, body.role);
  }

  @Put('user-access/:id/status')
  async updateUserStatus(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.updateUserStatus(id, body.status);
  }

  @Post('user-access/:id/reset-password')
  async resetUserPassword(@Req() req: express.Request, @Param('id') id: string) {
    this.assertSuperAdmin(await this.getSessionUser(req));
    return this.service.resetUserPassword(id);
  }
}
