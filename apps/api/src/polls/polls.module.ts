import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { PollsController } from './polls.controller';
import { PollsService } from './polls.service';

@Module({
  imports: [PrismaModule],
  controllers: [PollsController],
  providers: [PollsService],
  exports: [PollsService],
})
export class PollsModule {}
