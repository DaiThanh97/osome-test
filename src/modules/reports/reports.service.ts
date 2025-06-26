import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { v4 as uuidv4 } from 'uuid';
import { PROCESSOR_NAME } from './reports.constant';

export interface ReportResult {
  type: string;
  duration: number;
}

export interface ReportJobStatus {
  jobId: string;
  status: {
    accounts: string;
    yearly: string;
    fs: string;
  };
  startTime: Date;
  endTime?: Date;
  totalDuration?: number;
}

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  private jobStatuses: Map<string, ReportJobStatus> = new Map();

  constructor(@InjectQueue('reports') private reportsQueue: Queue) {}

  getJobStatus(jobId: string): ReportJobStatus | undefined {
    return this.jobStatuses.get(jobId);
  }

  async generateReports(): Promise<string> {
    // Generate a unique job ID
    const jobId = uuidv4();
    const jobStatus: ReportJobStatus = {
      jobId,
      status: {
        accounts: 'queued',
        yearly: 'queued',
        fs: 'queued',
      },
      startTime: new Date(),
    };

    this.jobStatuses.set(jobId, jobStatus);
    this.logger.log(`Starting report generation job: ${jobId}`);

    try {
      // Add jobs to the queue
      const [accountsJob, yearlyJob, fsJob] = await Promise.all([
        this.reportsQueue.add(PROCESSOR_NAME.ACCOUNTS, { jobId }),
        this.reportsQueue.add(PROCESSOR_NAME.YEARLY, { jobId }),
        this.reportsQueue.add(PROCESSOR_NAME.FS, { jobId }),
      ]);

      // Set up completion handlers
      accountsJob
        .finished()
        .then((result: ReportResult) => {
          this.updateJobStatus(
            jobId,
            'accounts',
            `finished in ${result.duration.toFixed(2)}s`,
          );
          this.checkJobCompletion(jobId);
        })
        .catch((err: Error) => {
          this.updateJobStatus(jobId, 'accounts', `error: ${err.message}`);
        });

      yearlyJob
        .finished()
        .then((result: ReportResult) => {
          this.updateJobStatus(
            jobId,
            'yearly',
            `finished in ${result.duration.toFixed(2)}s`,
          );
          this.checkJobCompletion(jobId);
        })
        .catch((err: Error) => {
          this.updateJobStatus(jobId, 'yearly', `error: ${err.message}`);
        });

      fsJob
        .finished()
        .then((result: ReportResult) => {
          this.updateJobStatus(
            jobId,
            'fs',
            `finished in ${result.duration.toFixed(2)}s`,
          );
          this.checkJobCompletion(jobId);
        })
        .catch((err: Error) => {
          this.updateJobStatus(jobId, 'fs', `error: ${err.message}`);
        });

      return jobId;
    } catch (error) {
      if (error instanceof Error) {
        this.logger.error(`Failed to queue report jobs: ${error.message}`);
      } else {
        this.logger.error('Failed to queue report jobs: Unknown error');
      }
      throw error;
    }
  }

  private updateJobStatus(
    jobId: string,
    reportType: 'accounts' | 'yearly' | 'fs',
    status: string,
  ): void {
    const jobStatus = this.jobStatuses.get(jobId);
    if (jobStatus) {
      jobStatus.status[reportType] = status;
      this.logger.log(
        `Updated ${reportType} status for job ${jobId}: ${status}`,
      );
    }
  }

  private checkJobCompletion(jobId: string): void {
    const jobStatus = this.jobStatuses.get(jobId);
    if (!jobStatus) return;

    const { accounts, yearly, fs } = jobStatus.status;

    // Check if all reports are finished or have errors
    if (
      (accounts.startsWith('finished') || accounts.startsWith('error')) &&
      (yearly.startsWith('finished') || yearly.startsWith('error')) &&
      (fs.startsWith('finished') || fs.startsWith('error'))
    ) {
      jobStatus.endTime = new Date();
      jobStatus.totalDuration =
        (jobStatus.endTime.getTime() - jobStatus.startTime.getTime()) / 1000;

      this.logger.log(
        `Job ${jobId} completed in ${jobStatus.totalDuration.toFixed(2)}s`,
      );
    }
  }
}
