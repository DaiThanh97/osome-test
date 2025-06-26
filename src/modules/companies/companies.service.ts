import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Company } from '@db/models/Company';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company)
    private companyModel: typeof Company,
  ) {}

  async findById(id: number): Promise<Company | null> {
    return this.companyModel.findByPk(id);
  }
}
