import { Controller, All, Req, Res } from '@nestjs/common';
import * as express from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './auth.service';

@Controller('auth')
export class AuthController {
  @All('*')
  async handleAuth(@Req() req: express.Request, @Res() res: express.Response) {
    return toNodeHandler(auth)(req, res);
  }
}
