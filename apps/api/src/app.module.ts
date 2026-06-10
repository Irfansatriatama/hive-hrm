import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployeesModule } from './employees/employees.module';
import { AttendanceModule } from './attendance/attendance.module';
import { LeaveModule } from './leave/leave.module';
import { ApprovalModule } from './approval/approval.module';
import { RewardModule } from './reward/reward.module';
import { ProcurementModule } from './procurement/procurement.module';
import { CoreModule } from './core/core.module';
import { HiringModule } from './hiring/hiring.module';
import { ShiftModule } from './shift/shift.module';
import { ReportingModule } from './reporting/reporting.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    EmployeesModule,
    AttendanceModule,
    LeaveModule,
    ApprovalModule,
    RewardModule,
    ProcurementModule,
    CoreModule,
    HiringModule,
    ShiftModule,
    ReportingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

