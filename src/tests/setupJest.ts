import { Test } from '@nestjs/testing';
import { DestroyOptions } from 'sequelize';
import { Model, ModelCtor } from 'sequelize-typescript';
import { Company } from '../../db/models/Company';
import { Ticket } from '../../db/models/Ticket';
import { User } from '../../db/models/User';
import { DatabaseModule } from './../modules/database/database.module';
import { register } from 'tsconfig-paths';
import { compilerOptions } from '../../tsconfig.json';

register({
  baseUrl: compilerOptions.baseUrl,
  paths: compilerOptions.paths,
});

const isUnitTest = process.argv.some((arg) => arg.includes('.spec.ts'));
const isIntegrationTest = process.argv.some((arg) =>
  arg.includes('.e2e-spec.ts'),
);

// For all tests, restore mocks before each test
beforeEach(() => {
  jest.restoreAllMocks();
});

if (isIntegrationTest) {
  beforeEach(async () => {
    await cleanTables();
  });
}

export async function cleanTables() {
  // Skip database operations if this is a unit test
  if (isUnitTest) {
    return;
  }

  try {
    await Test.createTestingModule({
      imports: [DatabaseModule],
    }).compile();

    const models: ModelCtor<Model>[] = [Ticket, User, Company];
    for (const model of models) {
      await cleanTable(model);
    }
  } catch (error) {
    console.error('Error setting up database for tests:', error);
  }

  async function cleanTable<T extends Model>(model: ModelCtor<T>) {
    const options: DestroyOptions = {
      where: {},
    };
    try {
      await model.unscoped().destroy(options);
    } catch (err) {
      // https://github.com/sequelize/sequelize/issues/14807
      console.error(err as Error);
      throw err;
    }
  }
}
