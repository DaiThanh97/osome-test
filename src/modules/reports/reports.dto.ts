import { ApiProperty } from '@nestjs/swagger';

export class ReportJobStatusDto {
  @ApiProperty({
    description: 'Unique identifier of the report job',
    example: 'job-1620000000000-123',
  })
  jobId: string;

  @ApiProperty({
    description: 'Status of each report type',
    example: {
      accounts: 'finished in 1.25s',
      yearly: 'processing',
      fs: 'queued',
    },
  })
  status: {
    accounts: string;
    yearly: string;
    fs: string;
  };

  @ApiProperty({
    description: 'Timestamp when the job started',
    example: '2023-05-01T12:00:00.000Z',
  })
  startTime: Date;

  @ApiProperty({
    description: 'Timestamp when the job completed (if finished)',
    example: '2023-05-01T12:01:30.000Z',
    required: false,
    nullable: true,
  })
  endTime?: Date;

  @ApiProperty({
    description: 'Total duration of the job in seconds (if finished)',
    example: '90.25s',
    required: false,
    nullable: true,
  })
  totalDuration?: string | null;
}

export class ReportJobResponseDto {
  @ApiProperty({
    description: 'Status message',
    example: 'Report generation started',
  })
  message: string;

  @ApiProperty({
    description: 'Unique identifier of the report job',
    example: 'job-1620000000000-123',
  })
  jobId: string;

  @ApiProperty({
    description: 'URL to check the status of the job',
    example: '/reports/job-1620000000000-123',
  })
  statusUrl: string;
}
