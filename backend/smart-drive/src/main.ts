import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Todos os controllers ficam sob /api/* (convenção do frontend — lib/api/*).
  // EXCEÇÃO: POST /telemetry fica sem prefixo porque o firmware já gravado
  // (sd_config.h: SD_TELEMETRY_URL) posta em /telemetry. Quando a ingestão real
  // do Pedro (PED-RF-06) definir o caminho final, revisar esta exclusão.
  app.setGlobalPrefix('api', {
    exclude: [{ path: 'telemetry', method: RequestMethod.POST }],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({ origin: process.env.CORS_ORIGIN ?? '*' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
