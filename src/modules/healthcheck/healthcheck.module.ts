import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { HealthcheckController } from './healthcheck.controller';
import { User } from '@db/models/User';
import { HealthcheckService } from './healthcheck.service';

@Module({
  imports: [SequelizeModule.forFeature([User])],
  controllers: [HealthcheckController],
  providers: [HealthcheckService],
})
export class HealthcheckModule {}
