import { SequelizeModuleOptions } from '@nestjs/sequelize';

const configs: Record<string, SequelizeModuleOptions> = {
  development: dbConfig.development as SequelizeModuleOptions,
  test: dbConfig.test as SequelizeModuleOptions,
};

export const getDatabaseConfig = (): SequelizeModuleOptions => {
  const env = process.env.NODE_ENV || 'development';
  return configs[env] || configs.development;
};
