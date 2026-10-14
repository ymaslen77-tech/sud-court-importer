import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({ origin: process.env.WEB_ORIGIN ?? 'http://localhost:4173' });
  app.setGlobalPrefix('api/v1');
  await app.listen(Number(process.env.PORT ?? process.env.API_PORT ?? 4000), '0.0.0.0');
}
void bootstrap();
