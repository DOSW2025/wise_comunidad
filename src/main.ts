import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { envs } from './config/envs';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

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

  app.useGlobalFilters(new GlobalExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('WISE Comunidad API')
    .setDescription('Documentación de la API de WISE Comunidad')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  // Exponer Swagger UI en `/api` para que la URL sea `http://localhost:PORT/api#/`
  SwaggerModule.setup('api', app, document);
  
  await app.listen(envs.port);
  logger.log(`Application is running on: ${envs.port}`);
  // Mensaje adicional y consistente para desarrollo: se mostrará siempre al iniciar
  console.log(`[INFO] Server is running on http://localhost:${envs.port}`);
}
bootstrap();
