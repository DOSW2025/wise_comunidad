import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { envs } from './config';

async function bootstrap() {

  const logger = new Logger('wise_comunidad');
  
  const app = await NestFactory.create(AppModule);
  await app.listen(envs.port);

  logger.log(`wise_comunidad esta corriendo en el puerto: ${envs.port}`);
}
bootstrap();
