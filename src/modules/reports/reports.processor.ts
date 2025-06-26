import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import * as fs from 'fs';
import * as path from 'path';
import { performance } from 'perf_hooks';
import { ReportResult } from './reports.service';
import { PROCESSOR_NAME, REPORT_QUEUE_NAME } from './reports.constant';

interface ReportJob {
  jobId: string;
}

@Processor(REPORT_QUEUE_NAME)
export class ReportsProcessor {
  private readonly logger = new Logger(ReportsProcessor.name);

  constructor() {
    // Create output directory if it doesn't exist
    const outDir = path.join(process.cwd(), 'out');
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
  }

  @Process(PROCESSOR_NAME.ACCOUNTS)
  processAccounts(job: Job<ReportJob>): ReportResult {
    this.logger.log(`Processing accounts report for job ${job.data.jobId}`);
    const start = performance.now();

    try {
      const tmpDir = 'tmp';
      const outputFile = 'out/accounts.csv';
      const accountBalances: Record<string, number> = {};

      fs.readdirSync(tmpDir).forEach((file) => {
        if (file.endsWith('.csv')) {
          const lines = fs
            .readFileSync(path.join(tmpDir, file), 'utf-8')
            .trim()
            .split('\n');
          for (const line of lines) {
            const [, account, , debit, credit] = line.split(',');
            if (!accountBalances[account]) {
              accountBalances[account] = 0;
            }
            accountBalances[account] +=
              parseFloat(String(debit || 0)) - parseFloat(String(credit || 0));
          }
        }
      });

      const output = ['Account,Balance'];
      for (const [account, balance] of Object.entries(accountBalances)) {
        output.push(`${account},${balance.toFixed(2)}`);
      }

      fs.writeFileSync(outputFile, output.join('\n'));
      const duration = (performance.now() - start) / 1000;

      this.logger.log(`Accounts report completed in ${duration.toFixed(2)}s`);
      return {
        type: 'accounts',
        duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing accounts report: ${errorMessage}`);
      throw error;
    }
  }

  @Process(PROCESSOR_NAME.YEARLY)
  processYearly(job: Job<ReportJob>): ReportResult {
    this.logger.log(`Processing yearly report for job ${job.data.jobId}`);
    const start = performance.now();

    try {
      const tmpDir = 'tmp';
      const outputFile = 'out/yearly.csv';
      const cashByYear: Record<string, number> = {};

      fs.readdirSync(tmpDir).forEach((file) => {
        if (file.endsWith('.csv') && file !== 'yearly.csv') {
          const lines = fs
            .readFileSync(path.join(tmpDir, file), 'utf-8')
            .trim()
            .split('\n');
          for (const line of lines) {
            const [date, account, , debit, credit] = line.split(',');
            if (account === 'Cash') {
              const year = new Date(date).getFullYear();
              if (!cashByYear[year]) {
                cashByYear[year] = 0;
              }
              cashByYear[year] +=
                parseFloat(String(debit || 0)) -
                parseFloat(String(credit || 0));
            }
          }
        }
      });

      const output = ['Financial Year,Cash Balance'];
      Object.keys(cashByYear)
        .sort()
        .forEach((year) => {
          output.push(`${year},${cashByYear[year].toFixed(2)}`);
        });

      fs.writeFileSync(outputFile, output.join('\n'));
      const duration = (performance.now() - start) / 1000;

      this.logger.log(`Yearly report completed in ${duration.toFixed(2)}s`);
      return {
        type: 'yearly',
        duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`Error processing yearly report: ${errorMessage}`);
      throw error;
    }
  }

  @Process(PROCESSOR_NAME.FS)
  processFinancialStatement(job: Job<ReportJob>): ReportResult {
    this.logger.log(`Processing financial statement for job ${job.data.jobId}`);
    const start = performance.now();

    try {
      const tmpDir = 'tmp';
      const outputFile = 'out/fs.csv';

      const categories = {
        'Income Statement': {
          Revenues: ['Sales Revenue'],
          Expenses: [
            'Cost of Goods Sold',
            'Salaries Expense',
            'Rent Expense',
            'Utilities Expense',
            'Interest Expense',
            'Tax Expense',
          ],
        },
        'Balance Sheet': {
          Assets: [
            'Cash',
            'Accounts Receivable',
            'Inventory',
            'Fixed Assets',
            'Prepaid Expenses',
          ],
          Liabilities: [
            'Accounts Payable',
            'Loan Payable',
            'Sales Tax Payable',
            'Accrued Liabilities',
            'Unearned Revenue',
            'Dividends Payable',
          ],
          Equity: ['Common Stock', 'Retained Earnings'],
        },
      };

      const balances: Record<string, number> = {};
      for (const section of Object.values(categories)) {
        for (const group of Object.values(section)) {
          for (const account of group) {
            balances[account] = 0;
          }
        }
      }

      fs.readdirSync(tmpDir).forEach((file) => {
        if (file.endsWith('.csv') && file !== 'fs.csv') {
          const lines = fs
            .readFileSync(path.join(tmpDir, file), 'utf-8')
            .trim()
            .split('\n');

          for (const line of lines) {
            const [, account, , debit, credit] = line.split(',');

            if (Object.prototype.hasOwnProperty.call(balances, account)) {
              balances[account] +=
                parseFloat(String(debit || 0)) -
                parseFloat(String(credit || 0));
            }
          }
        }
      });

      const output: string[] = [];
      output.push('Basic Financial Statement');
      output.push('');
      output.push('Income Statement');

      let totalRevenue = 0;
      let totalExpenses = 0;

      for (const account of categories['Income Statement']['Revenues']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalRevenue += value;
      }

      for (const account of categories['Income Statement']['Expenses']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalExpenses += value;
      }

      output.push(`Net Income,${(totalRevenue - totalExpenses).toFixed(2)}`);
      output.push('');
      output.push('Balance Sheet');

      let totalAssets = 0;
      let totalLiabilities = 0;
      let totalEquity = 0;

      output.push('Assets');
      for (const account of categories['Balance Sheet']['Assets']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalAssets += value;
      }
      output.push(`Total Assets,${totalAssets.toFixed(2)}`);
      output.push('');

      output.push('Liabilities');
      for (const account of categories['Balance Sheet']['Liabilities']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalLiabilities += value;
      }
      output.push(`Total Liabilities,${totalLiabilities.toFixed(2)}`);
      output.push('');

      output.push('Equity');
      for (const account of categories['Balance Sheet']['Equity']) {
        const value = balances[account] || 0;
        output.push(`${account},${value.toFixed(2)}`);
        totalEquity += value;
      }
      output.push(
        `Retained Earnings (Net Income),${(totalRevenue - totalExpenses).toFixed(2)}`,
      );
      totalEquity += totalRevenue - totalExpenses;
      output.push(`Total Equity,${totalEquity.toFixed(2)}`);
      output.push('');
      output.push(
        `Assets = Liabilities + Equity, ${totalAssets.toFixed(2)} = ${(totalLiabilities + totalEquity).toFixed(2)}`,
      );

      fs.writeFileSync(outputFile, output.join('\n'));
      const duration = (performance.now() - start) / 1000;

      this.logger.log(
        `Financial statement completed in ${duration.toFixed(2)}s`,
      );
      return {
        type: 'fs',
        duration,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Error processing financial statement: ${errorMessage}`,
      );
      throw error;
    }
  }
}
