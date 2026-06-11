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
import { OnboardingService } from './onboarding.service';
import { PrismaService } from '../prisma/prisma.service';
import { auth } from '../auth/auth.service';

@Controller('onboarding')
export class OnboardingController {
  constructor(
    private readonly service: OnboardingService,
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

  @Get('templates')
  async findTemplates(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.findTemplates();
  }

  @Post('templates')
  async createTemplate(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.createTemplate(body);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateTemplate(id, body);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN') {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.deleteTemplate(id);
  }

  @Post('templates/:id/tasks')
  async addTask(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.addTask(id, body);
  }

  @Put('templates/:id/tasks/:taskId')
  async updateTask(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.updateTask(id, taskId, body);
  }

  @Delete('templates/:id/tasks/:taskId')
  async deleteTask(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.deleteTask(id, taskId);
  }

  @Get('assignments')
  async findAllAssignments(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;

    if (this.isAdmin(role)) {
      return this.service.findAllAssignments();
    }

    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) return [];
    return this.service.findAllAssignments(emp.id);
  }

  @Post('assignments')
  async assignTemplate(@Req() req: express.Request, @Body() body: any) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (!this.isAdmin(role)) {
      throw new UnauthorizedException('Access denied');
    }
    return this.service.assignTemplate(body);
  }

  @Get('assignments/:id')
  async getAssignmentDetail(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    const assignment = await this.service.getAssignmentDetail(id);

    if (!this.isAdmin(role)) {
      const emp = await this.getLinkedEmployee(user.id, user.email);
      if (!emp || emp.id !== assignment.employeeId) {
        throw new UnauthorizedException('Access denied');
      }
    }

    return assignment;
  }

  @Put('assignments/:id/tasks/:taskId')
  async updateTaskProgress(
    @Req() req: express.Request,
    @Param('id') id: string,
    @Param('taskId') taskId: string,
    @Body() body: any,
  ) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    const assignment = await this.prisma.onboardingAssignment.findUnique({
      where: { id },
      select: { employeeId: true },
    });
    if (!assignment) {
      throw new UnauthorizedException('Assignment not found');
    }

    const progress = await this.prisma.onboardingTaskProgress.findFirst({
      where: { assignmentId: id, taskId },
      include: { task: true },
    });
    if (!progress) {
      throw new UnauthorizedException('Task not found');
    }

    const emp = await this.getLinkedEmployee(user.id, user.email);

    const isOwner = emp?.id === assignment.employeeId;
    const isManagerOfEmployee =
      emp &&
      assignment.employeeId !== emp.id &&
      (await this.prisma.employee.findFirst({
        where: { id: assignment.employeeId, managerId: emp.id },
      }));

    const assignedTo = progress.task.assignedTo;
    const canUpdate =
      this.isAdmin(role) ||
      (isOwner && assignedTo === 'employee') ||
      (role === 'MANAGER' && assignedTo === 'manager' && (isOwner || !!isManagerOfEmployee)) ||
      (this.isAdmin(role) && assignedTo === 'hr');

    if (!canUpdate) {
      throw new UnauthorizedException('Access denied');
    }

    return this.service.updateTaskProgress(id, taskId, body);
  }

  @Get('my')
  async findMyAssignment(@Req() req: express.Request) {
    const user = await this.getSessionUser(req);
    const emp = await this.getLinkedEmployee(user.id, user.email);
    if (!emp) return null;
    return this.service.findMyAssignment(emp.id);
  }
}
