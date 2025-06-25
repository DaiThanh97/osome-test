import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthcheckController } from './healthcheck.controller';
import { User } from '@db/models/User';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [HealthcheckController],
})
export class HealthcheckModule {}
