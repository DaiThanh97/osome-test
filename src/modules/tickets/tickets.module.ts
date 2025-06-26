import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { Ticket } from '@db/models/Ticket';
import { User } from '@db/models/User';
import { CompaniesModule } from '@/modules/companies/companies.module';

@Module({
  imports: [SequelizeModule.forFeature([Ticket, User]), CompaniesModule],
  controllers: [TicketsController],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
