import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportingController } from './reporting.controller';
import { ReportingService } from './reporting.service';

@Module({
  imports: [PrismaModule],
  providers: [ReportingService],
  controllers: [ReportingController],
  exports: [ReportingService],
})
export class ReportingModule {}
