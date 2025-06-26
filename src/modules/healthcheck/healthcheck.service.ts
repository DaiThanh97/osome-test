import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/sequelize';
import { User } from '@db/models/User';

@Injectable()
export class HealthcheckService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User,
  ) {}

  async ping(): Promise<boolean> {
    await this.userModel.findAll();
    return true;
  }
}
