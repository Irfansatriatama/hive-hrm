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
import { HiringService } from './hiring.service';
import { auth } from '../auth/auth.service';

@Controller('hiring')
export class HiringController {
  constructor(private readonly service: HiringService) {}

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

  private async assertHRAdmin(req: express.Request) {
    const user = await this.getSessionUser(req);
    const role = (user as any).role;
    if (role !== 'SUPER_ADMIN' && role !== 'HR_ADMIN') {
      throw new UnauthorizedException('Access restricted to HR/Super Admin');
    }
    return user;
  }

  @Get('stages')
  async getStages(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getStages();
  }

  @Post('stages')
  async createStage(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createStage(body);
  }

  @Put('stages/:id')
  async updateStage(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.updateStage(id, body);
  }

  @Post('stages/:id/delete')
  async deleteStage(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteStage(id);
  }

  @Get('templates')
  async getTemplates(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getTemplates();
  }

  @Post('templates')
  async createTemplate(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createTemplate(body);
  }

  @Put('templates/:id')
  async updateTemplate(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.updateTemplate(id, body);
  }

  @Post('templates/:id/delete')
  async deleteTemplate(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.deleteTemplate(id);
  }

  @Get('sources')
  async getSources(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getSources();
  }

  @Post('sources')
  async createSource(@Req() req: express.Request, @Body() body: { name: string }) {
    await this.assertHRAdmin(req);
    return this.service.createSource(body.name);
  }

  @Post('sources/:id/toggle')
  async toggleSource(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.toggleSource(id);
  }

  @Get('form-fields')
  async getFormFields(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.getFormFields();
  }

  @Put('form-fields')
  async updateFormFields(@Req() req: express.Request, @Body() body: { fields: { id: string; required: boolean }[] }) {
    await this.assertHRAdmin(req);
    return this.service.updateFormFields(body.fields || []);
  }

  @Get('jobs')
  async findAllJobs(@Req() req: express.Request) {
    await this.getSessionUser(req);
    return this.service.findAllJobs();
  }

  @Post('jobs')
  async createJob(@Req() req: express.Request, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createJob(body);
  }

  @Put('jobs/:id')
  async updateJob(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.updateJob(id, body);
  }

  @Post('jobs/:id/open')
  async openJob(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.openJob(id);
  }

  @Post('jobs/:id/close')
  async closeJob(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.closeJob(id);
  }

  @Get('jobs/:id/applications')
  async findApplicationsByJob(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.findApplicationsByJob(id);
  }

  @Get('applications/:id')
  async findApplicationById(@Req() req: express.Request, @Param('id') id: string) {
    await this.assertHRAdmin(req);
    return this.service.findApplicationById(id);
  }

  @Post('jobs/:id/applications')
  async createApplication(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.createApplication(id, body);
  }

  @Put('applications/:id/stage')
  async moveApplicationStage(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    const user = await this.assertHRAdmin(req);
    return this.service.moveApplicationStage(id, body.stage, body.notes, user.id);
  }

  @Put('applications/:id')
  async updateApplication(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    await this.assertHRAdmin(req);
    return this.service.updateApplication(id, body);
  }

  @Post('applications/:id/hire')
  async hireApplication(@Req() req: express.Request, @Param('id') id: string) {
    const user = await this.assertHRAdmin(req);
    return this.service.hireApplication(id, user.id);
  }

  @Post('applications/:id/reject')
  async rejectApplication(@Req() req: express.Request, @Param('id') id: string, @Body() body: any) {
    const user = await this.assertHRAdmin(req);
    return this.service.rejectApplication(id, body.reason || body.rejectedReason || '', user.id);
  }
}
