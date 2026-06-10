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
import { SettingsService } from './settings.service';
import { auth } from '../auth/auth.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly service: SettingsService) {}

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

  private async assertHRAdmin(req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access restricted to HR/Super Admin');
    }
    return user;
  }

  @Get('global-preferences')
  async getGlobalPreferences(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getGlobalPreferences();
  }

  @Put('global-preferences')
  async updateGlobalPreferences(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.updateGlobalPreferences(body);
  }

  @Get('procurement/limits')
  async getProcurementLimits(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getProcurementLimits();
  }

  @Put('procurement/limits')
  async updateProcurementLimits(
    @Req() req: express.Request,
    @Body() body: { limits: { grade: string; title: string; limit: number }[] },
  ) {
    await this.assertHRAdmin(req);
    return this.service.updateProcurementLimits(body.limits || []);
  }

  @Get('procurement/categories')
  async getProcurementCategories(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getProcurementCategories();
  }

  @Post('procurement/categories')
  async createProcurementCategory(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createProcurementCategory(body);
  }

  @Put('procurement/categories/:id')
  async updateProcurementCategory(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    await this.assertHRAdmin(req);
    return this.service.updateProcurementCategory(id, body);
  }

  @Delete('procurement/categories/:id')
  async deleteProcurementCategory(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteProcurementCategory(id);
  }

  @Get('procurement/vendors')
  async getProcurementVendors(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getProcurementVendors();
  }

  @Post('procurement/vendors')
  async createProcurementVendor(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createProcurementVendor(body);
  }

  @Put('procurement/vendors/:id')
  async updateProcurementVendor(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    await this.assertHRAdmin(req);
    return this.service.updateProcurementVendor(id, body);
  }

  @Delete('procurement/vendors/:id')
  async deleteProcurementVendor(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteProcurementVendor(id);
  }

  @Get('leave/types')
  async getLeaveTypes(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getLeaveTypes();
  }

  @Post('leave/types')
  async createLeaveType(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createLeaveType(body);
  }

  @Put('leave/types/:id')
  async updateLeaveType(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    await this.assertHRAdmin(req);
    return this.service.updateLeaveType(id, body);
  }

  @Delete('leave/types/:id')
  async deleteLeaveType(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteLeaveType(id);
  }

  @Put('leave/accruals')
  async updateLeaveAccruals(
    @Req() req: express.Request,
    @Body() body: {
      rules: { leaveTypeId: string; accrualType: string; carryOver: boolean; maxCarry: number }[];
    },
  ) {
    await this.assertHRAdmin(req);
    return this.service.updateLeaveAccruals(body.rules || []);
  }

  @Get('leave/blackouts')
  async getLeaveBlackouts(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getLeaveBlackouts();
  }

  @Post('leave/blackouts')
  async createLeaveBlackout(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createLeaveBlackout(body);
  }

  @Delete('leave/blackouts/:id')
  async deleteLeaveBlackout(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteLeaveBlackout(id);
  }

  @Get('custom-forms')
  async getCustomForms(@Req() req: express.Request) {
    await this.assertHRAdmin(req);
    return this.service.getCustomForms();
  }

  @Post('custom-forms')
  async createCustomForm(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createCustomForm(body);
  }

  @Get('custom-forms/:id')
  async getCustomForm(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.getCustomFormById(id);
  }

  @Delete('custom-forms/:id')
  async deleteCustomForm(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteCustomForm(id);
  }
}
