import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Company } from '@db/models/Company';
import { CompaniesService } from './companies.service';

@Module({
  imports: [SequelizeModule.forFeature([Company])],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
