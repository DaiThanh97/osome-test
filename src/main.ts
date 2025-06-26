import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  const configService = app.get(ConfigService);
  const port = configService.get<string>('PORT') ?? '3000';
  const API_PREFIX = configService.get<string>('API_PREFIX') ?? '';
  app.setGlobalPrefix(API_PREFIX);

  // Set up Swagger
  const config = new DocumentBuilder()
    .setTitle('ACME Accounting API')
    .setDescription('API documentation for ACME Accounting service')
    .setVersion('1.0')
    .addTag('tickets', 'Ticket management endpoints')
    .addTag('reports', 'Report generation endpoints')
    .addTag('healthcheck', 'Health check endpoint')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(`${API_PREFIX}/docs`, app, document);

  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(
    `📚 Docs available at: http://localhost:${port}${API_PREFIX}/docs`,
  );
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
