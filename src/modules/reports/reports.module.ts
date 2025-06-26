import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { ReportsProcessor } from './reports.processor';
import { REPORT_QUEUE_NAME } from './reports.constant';

@Module({
  imports: [
    BullModule.registerQueue({
      name: REPORT_QUEUE_NAME,
    }),
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ReportsProcessor],
})
export class ReportsModule {}
