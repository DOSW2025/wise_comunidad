import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = new Logger('ComunidadApp');
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Wise Comunidad API')
    .setDescription('Community API documentation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document);

  // DEBUG: print all documented paths to help troubleshooting missing endpoints
  try {
    const paths = Object.keys(document.paths || {});
    console.log('[DEBUG] Swagger documented paths:', paths);
  } catch (e) {
    console.error('[DEBUG] Failed to list Swagger paths', e);
  }
  await app.listen(envs.port);
  // exact informational line requested by user (uses configured port)
  logger.log(`Application is running on: ${envs.port}`);
    console.log(`[INFO] Server is running on http://localhost:${envs.port}`);
}
bootstrap();
