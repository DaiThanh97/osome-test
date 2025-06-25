import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Company } from '@db/models/Company';

@Module({
  imports: [SequelizeModule.forFeature([Company])],
  exports: [SequelizeModule],
})
export class CompaniesModule {}
