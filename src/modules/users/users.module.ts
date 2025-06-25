import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from '@db/models/User';

@Module({
  imports: [SequelizeModule.forFeature([User])],
})
export class UsersModule {}
