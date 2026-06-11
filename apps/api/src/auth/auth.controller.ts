import {
  Controller,
  All,
  Post,
  Body,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import * as express from 'express';
import { toNodeHandler, fromNodeHeaders } from 'better-auth/node';
import { auth } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly prisma: PrismaService) {}

  @Post('mobile/sign-in')
  async mobileSignIn(
    @Body() body: { email?: string; password?: string },
    @Req() req: express.Request,
  ) {
    try {
      const { headers: responseHeaders, response } = await auth.api.signInEmail({
        returnHeaders: true,
        body: {
          email: body.email ?? '',
          password: body.password ?? '',
        },
        headers: fromNodeHeaders(req.headers),
      });

      const token = responseHeaders.get('set-auth-token');
      if (!token || !response?.user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      const employee = await this.prisma.employee.findFirst({
        where: { userId: response.user.id },
        include: { department: true, position: true },
      });

      return {
        token,
        user: {
          id: response.user.id,
          name: response.user.name,
          email: response.user.email,
          employeeId: employee?.id,
          role: (response.user as { role?: string }).role ?? 'EMPLOYEE',
          departmentName: employee?.department?.name,
          positionName: employee?.position?.name,
          photoUrl: employee?.photoUrl,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  @All('*')
  async handleAuth(@Req() req: express.Request, @Res() res: express.Response) {
    return toNodeHandler(auth)(req, res);
  }
}
