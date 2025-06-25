import { Module } from '@nestjs/common';
import { DatabaseModule } from './modules/database/database.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { ReportsModule } from './modules/reports/reports.module';
import { HealthcheckModule } from './modules/healthcheck/healthcheck.module';
import { UsersModule } from './modules/users/users.module';
import { CompaniesModule } from './modules/companies/companies.module';

@Module({
  imports: [
    DatabaseModule,
    CompaniesModule,
    UsersModule,
    TicketsModule,
    ReportsModule,
    HealthcheckModule,
  ],
})
export class AppModule {}
