import {
  Controller,
  Get,
  Post,
  HttpCode,
  Param,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':jobId')
  getJobStatus(@Param('jobId') jobId: string) {
    const jobStatus = this.reportsService.getJobStatus(jobId);
    if (!jobStatus) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    return {
      jobId: jobStatus.jobId,
      status: jobStatus.status,
      startTime: jobStatus.startTime,
      endTime: jobStatus.endTime,
      totalDuration: jobStatus.totalDuration
        ? `${jobStatus.totalDuration.toFixed(2)}s`
        : null,
    };
  }

  @Post()
  @HttpCode(HttpStatus.ACCEPTED)
  async generateReports() {
    const jobId = await this.reportsService.generateReports();
    return {
      message: 'Report generation started',
      jobId,
      statusUrl: `/reports/${jobId}`,
    };
  }
}
