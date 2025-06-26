export interface ReportState {
  accounts: string;
  yearly: string;
  fs: string;
  startTime?: number;
  endTime?: number;
  totalTime?: number;
}

export interface ReportMetrics {
  startTime: number;
  endTime: number;
  duration: number;
}
