import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OnboardingService {
  constructor(private prisma: PrismaService) {}

  async findTemplates() {
    return this.prisma.onboardingTemplate.findMany({
      include: {
        _count: { select: { tasks: true } },
        tasks: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createTemplate(data: any) {
    return this.prisma.onboardingTemplate.create({
      data: {
        name: data.name,
        description: data.description || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
      },
    });
  }

  async updateTemplate(id: string, data: any) {
    const template = await this.prisma.onboardingTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Onboarding template not found');

    return this.prisma.onboardingTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async deleteTemplate(id: string) {
    const template = await this.prisma.onboardingTemplate.findUnique({ where: { id } });
    if (!template) throw new NotFoundException('Onboarding template not found');

    const activeCount = await this.prisma.onboardingAssignment.count({
      where: { templateId: id, status: 'in_progress' },
    });
    if (activeCount > 0) {
      throw new BadRequestException('Cannot delete template with active assignments');
    }

    return this.prisma.onboardingTemplate.delete({ where: { id } });
  }

  async addTask(templateId: string, data: any) {
    const template = await this.prisma.onboardingTemplate.findUnique({ where: { id: templateId } });
    if (!template) throw new NotFoundException('Onboarding template not found');

    return this.prisma.onboardingTemplateTask.create({
      data: {
        templateId,
        title: data.title,
        description: data.description || null,
        category: data.category || 'other',
        dueAfterDays: data.dueAfterDays !== undefined ? parseInt(data.dueAfterDays, 10) : 7,
        assignedTo: data.assignedTo || 'employee',
        sortOrder: data.sortOrder !== undefined ? parseInt(data.sortOrder, 10) : 0,
      },
    });
  }

  async updateTask(templateId: string, taskId: string, data: any) {
    const task = await this.prisma.onboardingTemplateTask.findFirst({
      where: { id: taskId, templateId },
    });
    if (!task) throw new NotFoundException('Template task not found');

    return this.prisma.onboardingTemplateTask.update({
      where: { id: taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.dueAfterDays !== undefined && { dueAfterDays: parseInt(data.dueAfterDays, 10) }),
        ...(data.assignedTo !== undefined && { assignedTo: data.assignedTo }),
        ...(data.sortOrder !== undefined && { sortOrder: parseInt(data.sortOrder, 10) }),
      },
    });
  }

  async deleteTask(templateId: string, taskId: string) {
    const task = await this.prisma.onboardingTemplateTask.findFirst({
      where: { id: taskId, templateId },
    });
    if (!task) throw new NotFoundException('Template task not found');

    return this.prisma.onboardingTemplateTask.delete({ where: { id: taskId } });
  }

  async findAllAssignments(employeeId?: string) {
    return this.prisma.onboardingAssignment.findMany({
      where: employeeId ? { employeeId } : undefined,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNumber: true,
            department: { select: { name: true } },
          },
        },
        template: { select: { id: true, name: true } },
        taskProgress: {
          include: {
            task: true,
          },
          orderBy: { task: { sortOrder: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyAssignment(employeeId: string) {
    return this.prisma.onboardingAssignment.findFirst({
      where: { employeeId, status: 'in_progress' },
      include: {
        template: { select: { id: true, name: true, description: true } },
        taskProgress: {
          include: { task: true },
          orderBy: { task: { sortOrder: 'asc' } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async assignTemplate(data: { employeeId: string; templateId: string; startDate?: string; notes?: string }) {
    const template = await this.prisma.onboardingTemplate.findUnique({
      where: { id: data.templateId },
      include: { tasks: true },
    });
    if (!template) throw new NotFoundException('Onboarding template not found');
    if (!template.isActive) throw new BadRequestException('Template is not active');

    const employee = await this.prisma.employee.findUnique({ where: { id: data.employeeId } });
    if (!employee) throw new NotFoundException('Employee not found');

    const existing = await this.prisma.onboardingAssignment.findFirst({
      where: { employeeId: data.employeeId, status: 'in_progress' },
    });
    if (existing) {
      throw new BadRequestException('Employee already has an active onboarding assignment');
    }

    return this.prisma.onboardingAssignment.create({
      data: {
        templateId: data.templateId,
        employeeId: data.employeeId,
        startDate: data.startDate ? new Date(data.startDate) : new Date(),
        notes: data.notes || null,
        taskProgress: {
          create: template.tasks.map(task => ({
            taskId: task.id,
            status: 'pending',
          })),
        },
      },
      include: {
        employee: { select: { id: true, fullName: true } },
        template: { select: { id: true, name: true } },
        taskProgress: {
          include: { task: true },
          orderBy: { task: { sortOrder: 'asc' } },
        },
      },
    });
  }

  async getAssignmentDetail(id: string) {
    const assignment = await this.prisma.onboardingAssignment.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            employeeNumber: true,
            email: true,
            department: { select: { name: true } },
            position: { select: { name: true } },
          },
        },
        template: { select: { id: true, name: true, description: true } },
        taskProgress: {
          include: { task: true },
          orderBy: { task: { sortOrder: 'asc' } },
        },
      },
    });
    if (!assignment) throw new NotFoundException('Onboarding assignment not found');
    return assignment;
  }

  async updateTaskProgress(
    assignmentId: string,
    taskId: string,
    data: { status: string; notes?: string },
  ) {
    const progress = await this.prisma.onboardingTaskProgress.findFirst({
      where: { assignmentId, taskId },
      include: { task: true, assignment: true },
    });
    if (!progress) throw new NotFoundException('Task progress not found');

    const validStatuses = ['pending', 'done', 'skipped'];
    if (!validStatuses.includes(data.status)) {
      throw new BadRequestException('Invalid status');
    }

    await this.prisma.onboardingTaskProgress.update({
      where: { id: progress.id },
      data: {
        status: data.status,
        notes: data.notes !== undefined ? data.notes : progress.notes,
        completedAt: data.status === 'done' || data.status === 'skipped' ? new Date() : null,
      },
    });

    const allProgress = await this.prisma.onboardingTaskProgress.findMany({
      where: { assignmentId },
    });
    const allComplete = allProgress.every(p =>
      p.id === progress.id
        ? data.status === 'done' || data.status === 'skipped'
        : p.status === 'done' || p.status === 'skipped',
    );

    if (allComplete) {
      await this.prisma.onboardingAssignment.update({
        where: { id: assignmentId },
        data: { status: 'completed', completedAt: new Date() },
      });
    } else if (progress.assignment.status === 'completed') {
      await this.prisma.onboardingAssignment.update({
        where: { id: assignmentId },
        data: { status: 'in_progress', completedAt: null },
      });
    }

    return this.getAssignmentDetail(assignmentId);
  }
}
