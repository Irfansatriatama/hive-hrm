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
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
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
  private isAnnouncementAdmin(role?: string) {
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'MANAGER';
  }

  @Get('announcements/feed')
  async getAnnouncementFeed(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    return this.service.getAnnouncementFeed(user);
  }

  @Get('announcements/manage')
  async getAnnouncementsManage(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAnnouncementAdmin(role)) {
      throw new UnauthorizedException('Only admins can manage announcements');
    }
    return this.service.getAnnouncementsManage();
  }

  @Get('announcements')
  async getAnnouncements(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    return this.service.getAnnouncementFeed(user);
  }

  @Post('announcements')
  async createAnnouncement(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAnnouncementAdmin(role)) {
      throw new UnauthorizedException('Only admins can create announcements');
    }
    return this.service.createAnnouncement({ ...body, createdBy: user.name }, user.id);
  }

  @Put('announcements/:id')
  async updateAnnouncement(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAnnouncementAdmin(role)) {
      throw new UnauthorizedException('Only admins can update announcements');
    }
    return this.service.updateAnnouncement(id, body, user.id);
  }

  @Post('announcements/:id/delete')
  async deleteAnnouncement(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAnnouncementAdmin(role)) {
      throw new UnauthorizedException('Only admins can delete announcements');
    }
    return this.service.deleteAnnouncement(id, user.id);
  }

  @Post('announcements/:id/read')
  async markAnnouncementRead(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    return this.service.markAnnouncementRead(id, user);
  }

  // 2. Assets
  private isAssetAdmin(role?: string) {
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  }

  @Get('assets')
  async getAssets(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    return this.service.getAssets(user as any);
  }

  @Post('assets')
  async createAsset(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can add assets');
    }
    return this.service.createAsset(body);
  }

  @Get('assets/requests/list')
  async getAssetRequests(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    return this.service.getAssetRequests(user as any);
  }

  @Post('assets/requests')
  async createAssetRequest(
    @Req() req: express.Request,
    @Body() body: { assetName: string; reason: string; duration: number },
  ) {
    const user = await this.getSessionUser(req);
    return this.service.createAssetRequest(user as any, body);
  }

  @Post('assets/requests/:id/process')
  async processAssetRequest(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'rejected' },
  ) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can process asset requests');
    }
    return this.service.processAssetRequest(id, body.status);
  }

  @Get('assets/history/list')
  async getAssetHistory(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getAssetHistory();
  }

  @Get('assets/categories')
  async getAssetCategories(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getAssetCategories();
  }

  @Post('assets/categories')
  async createAssetCategory(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can manage asset categories');
    }
    return this.service.createAssetCategory(body);
  }

  @Put('assets/categories/:id')
  async updateAssetCategory(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can manage asset categories');
    }
    return this.service.updateAssetCategory(id, body);
  }

  @Delete('assets/categories/:id')
  async deleteAssetCategory(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can manage asset categories');
    }
    return this.service.deleteAssetCategory(id);
  }

  @Get('assets/locations')
  async getAssetLocations(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getAssetLocations();
  }

  @Post('assets/locations')
  async createAssetLocation(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can manage asset locations');
    }
    return this.service.createAssetLocation(body);
  }

  @Put('assets/locations/:id')
  async updateAssetLocation(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can manage asset locations');
    }
    return this.service.updateAssetLocation(id, body);
  }

  @Delete('assets/locations/:id')
  async deleteAssetLocation(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can manage asset locations');
    }
    return this.service.deleteAssetLocation(id);
  }

  @Get('assets/settings/rules')
  async getAssetLoanRules(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getAssetLoanRules();
  }

  @Put('assets/settings/rules')
  async updateAssetLoanRules(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can update asset loan rules');
    }
    return this.service.updateAssetLoanRules(body);
  }

  @Put('assets/:id')
  async updateAsset(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can update assets');
    }
    return this.service.updateAsset(id, body);
  }

  @Post('assets/:id/assign')
  async assignAsset(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: { employeeId: string },
  ) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can assign assets');
    }
    return this.service.assignAsset(id, body.employeeId);
  }

  @Post('assets/:id/return')
  async returnAsset(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    if (!this.isAssetAdmin((user as any).role)) {
      throw new UnauthorizedException('Only admins can return assets');
    }
    return this.service.returnAsset(id);
  }

  // 3. Documents
  @Get('documents/folders')
  async getDocumentFolders(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getDocumentFolders();
  }

  @Post('documents/folders')
  async createDocumentFolder(@Req() req: express.Request, @Body() body: { name: string }) {
    await this.getSessionUser(req);
    return this.service.createDocumentFolder(body.name);
  }

  @Get('documents')
  async getDocuments(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getDocuments();
  }

  @Post('documents/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'documents');
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname) || '.pdf'}`;
          cb(null, unique);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        const allowed =
          file.mimetype.match(/\/(pdf|msword|vnd\.openxmlformats-officedocument\.wordprocessingml\.document|vnd\.ms-excel|vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|jpeg|jpg|png|webp)$/) ||
          file.originalname.match(/\.(pdf|doc|docx|xls|xlsx|jpg|jpeg|png|webp)$/i);
        if (!allowed) {
          cb(new BadRequestException('File type not allowed') as unknown as Error, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadDocument(
    @Req() req: express.Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.getSessionUser(req);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    return { url: `${baseUrl}/uploads/documents/${file.filename}` };
  }

  @Post('documents')
  async createDocument(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    return this.service.createDocument(body, user.id);
  }

  @Delete('documents/:id')
  async deleteDocument(@Req() req: express.Request, @Param('id') id: string) {
    await this.getSessionUser(req);
    return this.service.deleteDocument(id);
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
