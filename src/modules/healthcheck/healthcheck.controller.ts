import { Controller, Get } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '@db/models/User';

@Controller('healthcheck')
export class HealthcheckController {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  @Get()
  async ping() {
    await this.userModel.findAll();
    return {
      OK: true,
    };
  }
}
