import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { envs } from './config/envs';

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

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Wise Comunidad - API de Chats')
    .setDescription(
      `API REST y WebSocket para el sistema de chat en tiempo real.

**Documentación REST:** Esta documentación cubre los endpoints HTTP REST para gestión de grupos y mensajes.

**Documentación WebSocket:** Para eventos en tiempo real (Socket.IO), consulta el archivo de documentación en el repositorio: src/chats/documents/websockets/events.doc.ts

**WebSocket Connection:**
- **URL:** ws://localhost:3004/chat (o wss:// para HTTPS)
- **Namespace:** /chat
- **Protocol:** Socket.IO

**Eventos Cliente → Servidor:**
- joinGroup - Unirse a un grupo
- leaveGroup - Abandonar un grupo
- sendMessage - Enviar mensaje
- typing - Usuario está escribiendo
- stopTyping - Usuario dejó de escribir

**Eventos Servidor → Cliente:**
- userJoined - Usuario se unió al grupo
- userLeft - Usuario abandonó el grupo
- newMessage - Nuevo mensaje recibido
- userTyping - Usuario está escribiendo
- userStoppedTyping - Usuario dejó de escribir

**Autenticación:** JWT Bearer token requerido en el handshake (auth.token o query.token)`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Ingresa el token JWT para autenticación',
      },
      'JWT-auth',
    )
    .addTag('Chats', 'Endpoints REST para gestión de grupos de chat y mensajes')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Wise Comunidad - API Docs',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  logger.log('Swagger documentation available at: /api');

  // Escuchar en 0.0.0.0 para permitir conexiones externas (necesario para Docker)
  await app.listen(envs.port, '0.0.0.0');
  logger.log(`Application is running on: ${envs.port}`);
}
bootstrap();
