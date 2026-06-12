import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Req,
  Res,
  Query,
  Param,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import * as express from 'express';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('attendance')
export class AttendanceController {
  constructor(
    private readonly service: AttendanceService,
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

  @Get('today')
  async getTodayStatus(@Req() req: express.Request, @Res() res: express.Response) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    const record = await this.service.getTodayStatus(emp.id);
    return res.status(200).json(record);
  }

  @Post('check-in')
  async checkIn(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.checkIn(emp.id, body);
  }

  @Post('check-out')
  async checkOut(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.checkOut(emp.id, body);
  }

  @Post('selfie-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'selfies');
          if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
          }
          cb(null, dir);
        },
        filename: (_req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extname(file.originalname) || '.jpg'}`;
          cb(null, unique);
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          cb(new BadRequestException('Only image files are allowed') as unknown as Error, false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async uploadSelfie(
    @Req() req: express.Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.getSessionUser(req);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    return { url: `${baseUrl}/uploads/selfies/${file.filename}` };
  }

  @Get('history')
  async getMyHistory(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.service.getMyHistory(emp.id, m, y);
  }

  @Get('summary')
  async getMySummary(
    @Req() req: express.Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    const m = month ? parseInt(month, 10) : undefined;
    const y = year ? parseInt(year, 10) : undefined;
    return this.service.getMySummary(emp.id, m, y);
  }

  @Get('records/:id')
  async getRecord(
    @Req() req: express.Request,
    @Param('id') id: string,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getEmployeeByUserId(user.id);
    return this.service.getRecordById(emp.id, id);
  }

  @Get('report')
  async getReport(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.getReport();
  }

  @Put('report/bulk-status')
  async bulkUpdateStatus(
    @Req() req: express.Request,
    @Body() body: { ids: string[]; status: string }
  ) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.bulkUpdateStatus(body.ids || [], body.status, user.id);
  }

  @Get('settings')
  async getSettings(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getSettings();
  }

  @Put('settings')
  async updateSettings(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    this.assertHRAccess(user);
    return this.service.updateSettings(body, user.id);
  }
}
