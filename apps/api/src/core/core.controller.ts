import {
  Controller,
  Get,
  Post,
  Put,
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

  // 7. User Access
  @Get('user-access')
  async getUsers(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access to user directory is restricted to Super Admins');
    }
    return this.service.getUsers();
  }

  @Put('user-access/:id/role')
  async updateUserRole(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { role: string }
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Only Super Admins can edit user roles');
    }
    return this.service.updateUserRole(id, body.role);
  }
}
