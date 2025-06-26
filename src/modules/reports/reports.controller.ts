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
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ReportJobStatusDto, ReportJobResponseDto } from './reports.dto';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get(':jobId')
  @ApiOperation({
    summary: 'Get report job status',
    description:
      'Retrieves the current status of a specific report generation job',
  })
  @ApiParam({
    name: 'jobId',
    description: 'Unique identifier of the report job',
    example: 'job-1620000000000-123',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The job status has been successfully retrieved',
    type: ReportJobStatusDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found',
  })
  getJobStatus(@Param('jobId') jobId: string): ReportJobStatusDto {
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
  @ApiOperation({
    summary: 'Generate reports',
    description:
      'Starts an asynchronous process to generate all reports (accounts, yearly, financial statement)',
  })
  @ApiResponse({
    status: HttpStatus.ACCEPTED,
    description: 'The report generation has been started',
    type: ReportJobResponseDto,
  })
  async generateReports(): Promise<ReportJobResponseDto> {
    const jobId = await this.reportsService.generateReports();
    return {
      message: 'Report generation started',
      jobId,
      statusUrl: `/reports/${jobId}`,
    };
  }
}
