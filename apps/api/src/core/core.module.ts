import { Module } from '@nestjs/common';
import { CoreService } from './core.service';
import { CoreController } from './core.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [CoreService],
  controllers: [CoreController],
  exports: [CoreService],
})
export class CoreModule {}
