import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Req,
  UploadedFile,
  UseInterceptors,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import * as express from 'express';
import { ExpenseService } from './expense.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly service: ExpenseService,
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
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'FINANCE';
  }

  private canManageCategories(role: string) {
    return role === 'SUPER_ADMIN' || role === 'HR_ADMIN' || role === 'FINANCE';
  }

  @Get('categories')
  async findCategories(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findCategories();
  }

  @Post('categories')
  async createCategory(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.canManageCategories(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.createCategory(body);
  }

  @Put('categories/:id')
  async updateCategory(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.canManageCategories(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateCategory(id, body);
  }

  @Delete('categories/:id')
  async deleteCategory(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.deleteCategory(id);
  }

  @Get('claims')
  async findAllClaims(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    if (this.isAdmin(role)) {
      return this.service.findAllClaims();
    }

    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) return [];
    return this.service.findAllClaims(emp.id);
  }

  @Get('claims/:id')
  async findClaimById(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    const claim = await this.service.findClaimById(id);

    if (!this.isAdmin(role)) {
      const emp = await this.getLinkedEmployee(user.id, user.email);
      if (!emp || emp.id !== claim.employeeId) {
        throw new UnauthorizedException('Access denied');
      }
    }

    return claim;
  }

  @Post('claims')
  async createClaim(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.createClaim(emp.id, body);
  }

  @Put('claims/:id')
  async updateClaim(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.updateClaim(id, emp.id, body);
  }

  @Post('claims/:id/items')
  async addItem(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.addItem(id, emp.id, body);
  }

  @Put('claims/:id/items/:itemId')
  async updateItem(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.updateItem(id, itemId, emp.id, body);
  }

  @Delete('claims/:id/items/:itemId')
  async deleteItem(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
  ) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.deleteItem(id, itemId, emp.id);
  }

  @Post('claims/:id/submit')
  async submitClaim(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) {
      throw new UnauthorizedException('Employee profile not found');
    }
    return this.service.submitClaim(id, emp.id);
  }

  @Post('receipt-upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (_req, _file, cb) => {
          const dir = join(process.cwd(), 'uploads', 'receipts');
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
  async uploadReceipt(
    @Req() req: express.Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    await this.getSessionUser(req);
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const baseUrl = process.env.API_PUBLIC_URL || `http://localhost:${process.env.PORT || 4000}`;
    return { url: `${baseUrl}/uploads/receipts/${file.filename}` };
  }

  @Post('claims/:id/approve')
  async approveClaim(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.canManageCategories(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.approveClaim(id, user.id);
  }

  @Post('claims/:id/reject')
  async rejectClaim(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.canManageCategories(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.rejectClaim(id, user.id, body.reason || '');
  }

  @Post('claims/:id/paid')
  async markPaid(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'FINANCE') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.markPaid(id);
  }
}
