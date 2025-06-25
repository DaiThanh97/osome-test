import { plainToClass } from 'class-transformer';
import { IsEnum, IsString, validateSync } from 'class-validator';

export enum ENVIRONMENT {
  DEVELOPMENT = 'development',
  PRODUCTION = 'production',
}

class EnvironmentVariables {
  @IsEnum(ENVIRONMENT)
  NODE_ENV!: ENVIRONMENT;

  @IsString()
  PORT!: string;

  @IsString()
  DB_HOST!: string;

  @IsString()
  DB_PORT!: string;

  @IsString()
  DB_USER!: string;

  @IsString()
  DB_PASSWORD!: string;

  @IsString()
  DB_NAME!: string;
}

export function validate(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validatedConfig = plainToClass(EnvironmentVariables, config);
  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  const errorMessages: string[] = [];
  errors.forEach((error) => {
    for (const validation in error.constraints) {
      errorMessages.push(`${error.constraints[validation]}`);
    }
  });

  if (errorMessages.length > 0) {
    const msg = errorMessages?.join(', ');
    throw new Error(msg);
  }

  return validatedConfig;
}

export const ENV_CONFIG = () => ({
  IS_PROD: process.env.NODE_ENV === ENVIRONMENT.PRODUCTION,
});
