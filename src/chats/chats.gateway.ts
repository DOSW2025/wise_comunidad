import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';

/**
 * Gateway de WebSockets para chat en tiempo real
 * Maneja conexiones autenticadas con JWT, mensajes y eventos de chat
 *
 * IMPORTANTE: Este gateway maneja autenticación JWT en WebSocket
 * El cliente debe enviar el token en el handshake:
 *
 * ```typescript
 * const socket = io('ws://localhost:3004/chat', {
 *   auth: { token: 'JWT_TOKEN' }
 * });
 * ```
 */
@WebSocketGateway({
  cors: {
    origin: '*', // TODO: Configurar con la URL del frontend en producción
    credentials: true,
  },
  namespace: '/chat', // Namespace específico para chat: ws://host:port/chat
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatsGateway.name);

  constructor(
    private readonly chatsService: ChatsService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Se ejecuta cuando un cliente intenta conectarse al WebSocket
   * Valida el token JWT antes de permitir la conexión
   */
  async handleConnection(client: Socket) {
    try {
      // 1. Obtener el token del handshake
      const token = client.handshake.auth?.token;

      if (!token) {
        this.logger.warn(`Cliente rechazado: No se proporcionó token`);
        client.disconnect();
        return;
      }

      // 2. Verificar el token JWT
      const payload = await this.jwtService.verifyAsync(token);

      if (!payload || !payload.sub) {
        this.logger.warn(`Cliente rechazado: Token inválido`);
        client.disconnect();
        return;
      }

      // 3. Guardar userId en el socket para usarlo en los eventos
      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.rol = payload.rol;

      this.logger.log(
        `Usuario autenticado: ${payload.email} (${payload.sub})`,
      );
    } catch (error) {
      this.logger.error(`Error de autenticación: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Se ejecuta cuando un cliente se desconecta del WebSocket
   */
  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    const email = client.data.email;

    if (userId) {
      this.logger.log(`Usuario desconectado: ${email} (${userId})`);
    } else {
      this.logger.log(`Cliente desconectado: ${client.id}`);
    }
  }

  /**
   * Evento: El usuario se une a un grupo (sala)
   * @param client - Socket del cliente autenticado
   * @param payload - { grupoId: string }
   */
  @SubscribeMessage('joinGroup')
  async handleJoinGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { grupoId: string },
  ) {
    const userId = client.data.userId;
    const { grupoId } = payload;

    try {
      // Validar que el usuario sea miembro del grupo
      await this.chatsService.validateMembership(grupoId, userId);

      // Unir al cliente a la sala del grupo
      client.join(grupoId);

      this.logger.log(`Usuario ${userId} se unió al grupo ${grupoId}`);

      // Notificar a los demás miembros del grupo
      client.to(grupoId).emit('userJoined', {
        userId,
        email: client.data.email,
        message: `${client.data.email} se ha unido al chat`,
        timestamp: new Date(),
      });

      return {
        success: true,
        message: 'Te has unido al grupo correctamente',
        grupoId,
      };
    } catch (error) {
      this.logger.error(`Error al unirse al grupo: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Evento: El usuario abandona un grupo (sala)
   * @param client - Socket del cliente autenticado
   * @param payload - { grupoId: string }
   */
  @SubscribeMessage('leaveGroup')
  async handleLeaveGroup(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { grupoId: string },
  ) {
    const userId = client.data.userId;
    const { grupoId } = payload;

    // Remover al cliente de la sala del grupo
    client.leave(grupoId);

    this.logger.log(`Usuario ${userId} abandonó el grupo ${grupoId}`);

    // Notificar a los demás miembros
    client.to(grupoId).emit('userLeft', {
      userId,
      email: client.data.email,
      message: `${client.data.email} ha abandonado el chat`,
      timestamp: new Date(),
    });

    return {
      success: true,
      message: 'Has abandonado el grupo',
      grupoId,
    };
  }

  /**
   * Evento: Enviar un mensaje a un grupo
   * @param client - Socket del cliente autenticado
   * @param payload - { grupoId: string, contenido: string }
   */
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { grupoId: string; contenido: string },
  ) {
    const userId = client.data.userId;
    const { grupoId, contenido } = payload;

    try {
      // Crear el mensaje en la base de datos
      const mensaje = await this.chatsService.sendMessage(
        { grupoId, contenido },
        userId,
      );

      // Emitir el mensaje a todos los miembros del grupo (incluyendo al emisor)
      this.server.to(grupoId).emit('newMessage', {
        id: mensaje.id,
        grupoId: mensaje.grupoId,
        contenido: mensaje.contenido,
        fechaCreacion: mensaje.fechaCreacion,
        usuario: {
          id: mensaje.usuario.id,
          nombre: mensaje.usuario.nombre,
          apellido: mensaje.usuario.apellido,
          email: mensaje.usuario.email,
          avatar_url: mensaje.usuario.avatar_url,
        },
      });

      this.logger.log(`Mensaje enviado al grupo ${grupoId} por ${client.data.email}`,);

      return {
        success: true,
        message: 'Mensaje enviado correctamente',
        data: mensaje,
      };
    } catch (error) {
      this.logger.error(`Error al enviar mensaje: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  /**
   * Evento: El usuario está escribiendo
   * @param client - Socket del cliente autenticado
   * @param payload - { grupoId: string }
   */
  @SubscribeMessage('typing')
  async handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { grupoId: string },
  ) {
    const userId = client.data.userId;
    const { grupoId } = payload;

    // Emitir a todos EXCEPTO al emisor
    client.to(grupoId).emit('userTyping', {
      userId,
      email: client.data.email,
    });
  }

  /**
   * Evento: El usuario dejó de escribir
   * @param client - Socket del cliente autenticado
   * @param payload - { grupoId: string }
   */
  @SubscribeMessage('stopTyping')
  async handleStopTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { grupoId: string },
  ) {
    const userId = client.data.userId;
    const { grupoId } = payload;

    // Emitir a todos EXCEPTO al emisor
    client.to(grupoId).emit('userStoppedTyping', {
      userId,
    });
  }
}
