import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { getDatabaseConfig } from './database.config';

@Module({
  imports: [
    SequelizeModule.forRoot({
      ...getDatabaseConfig(),
      autoLoadModels: true,
      synchronize: false,
    }),
  ],
  exports: [SequelizeModule],
})
export class DatabaseModule {}
