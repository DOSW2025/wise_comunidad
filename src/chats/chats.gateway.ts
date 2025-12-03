import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChatsService } from './chats.service';

/**
 * Gateway de WebSockets para chat en tiempo real
 * Maneja conexiones autenticadas con JWT, mensajes y eventos de chat
 */
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST'],
  },
  transports: ['websocket', 'polling'],
  namespace: '/chat',
})
export class ChatsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatsGateway.name);

  constructor(
    private readonly chatsService: ChatsService,
    private readonly jwtService: JwtService,
  ) {
    this.logger.log('[GATEWAY] ChatGateway inicializado en namespace /chat');
  }

  /**
   * Se ejecuta cuando el servidor WebSocket está listo
   */
  afterInit(server: Server) {
    this.logger.log('[GATEWAY] Servidor WebSocket iniciado correctamente');
    this.logger.log('[GATEWAY] Escuchando en namespace: /chat');
  }

  /**
   * Se ejecuta cuando un cliente intenta conectarse al WebSocket
   * Valida el token JWT antes de permitir la conexión
   */
  async handleConnection(client: Socket) {
    this.logger.log(`[CONEXION] Nueva conexión recibida - Socket ID: ${client.id}`);
    this.logger.log(`[CONEXION] Handshake auth:`, JSON.stringify(client.handshake.auth));
    this.logger.log(`[CONEXION] Handshake query:`, JSON.stringify(client.handshake.query));

    try {
      // 1. Obtener el token del handshake (auth o query)
      const token = client.handshake.auth?.token || client.handshake.query?.token as string;

      if (!token) {
        this.logger.warn(`[RECHAZO] Cliente rechazado: No se proporcionó token`);
        client.disconnect();
        return;
      }

      this.logger.log(`[TOKEN] Token recibido: ${token.substring(0, 20)}...`);

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
    @MessageBody() payload: { grupoId: string } | string,
  ) {
    const userId = client.data.userId;

    // Debug: ver qué está llegando
    this.logger.debug(`[joinGroup] Payload recibido: ${JSON.stringify(payload)}`);
    this.logger.debug(`[joinGroup] Tipo de payload: ${typeof payload}`);

    // Manejar diferentes formatos de payload
    let grupoId: string = '';

    if (typeof payload === 'string') {
      // Si es string, puede ser JSON o el ID directo
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        // Si no es JSON válido, es el ID directo
        grupoId = payload;
      }
    } else if (payload && typeof payload === 'object') {
      grupoId = payload.grupoId;
    }

    this.logger.debug(`[joinGroup] GrupoId extraído: "${grupoId}"`);

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
    @MessageBody() payload: { grupoId: string } | string,
  ) {
    const userId = client.data.userId;

    // Manejar diferentes formatos de payload
    let grupoId: string = '';

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        grupoId = payload;
      }
    } else if (payload && typeof payload === 'object') {
      grupoId = payload.grupoId;
    }

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
    @MessageBody() payload: { grupoId: string; contenido: string } | string,
  ) {
    const userId = client.data.userId;

    // Debug: ver qué está llegando
    this.logger.debug(`[sendMessage] Payload recibido: ${JSON.stringify(payload)}`);
    this.logger.debug(`[sendMessage] Tipo de payload: ${typeof payload}`);

    // Manejar diferentes formatos de payload
    let grupoId: string = '';
    let contenido: string = '';

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
        contenido = parsed.contenido;
      } catch {
        this.logger.error('[sendMessage] Error: payload es string pero no es JSON válido');
        return { success: false, message: 'Formato de payload inválido' };
      }
    } else if (payload && typeof payload === 'object') {
      grupoId = payload.grupoId;
      contenido = payload.contenido;
    }

    this.logger.debug(`[sendMessage] GrupoId: "${grupoId}", Contenido: "${contenido}"`);

    // Verificar si el cliente está en la sala del grupo
    const rooms = Array.from(client.rooms);
    if (!rooms.includes(grupoId)) {
      this.logger.warn(`[sendMessage] Usuario ${userId} intentó enviar mensaje sin estar en la sala ${grupoId}`);
      return {
        success: false,
        message: 'Debes unirte al grupo antes de enviar mensajes (usa joinGroup)',
      };
    }

    try {
      // Crear el mensaje en la base de datos
      const mensaje = await this.chatsService.sendMessage(
        { grupoId, contenido },
        userId,
      );

      // Emitir el mensaje a todos los miembros del grupo (incluyendo al emisor)
      const mensajeEmitido = {
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
      };

      this.server.to(grupoId).emit('newMessage', mensajeEmitido);

      this.logger.log(`Mensaje enviado al grupo ${grupoId} por ${client.data.email}`);
      this.logger.log(`Contenido del evento newMessage: ${JSON.stringify(mensajeEmitido)}`);

      // Detectar usuarios desconectados y enviar notificaciones
      await this.notifyOfflineMembers(grupoId, mensaje);

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
   * Detecta qué miembros del grupo están desconectados y activa notificaciones
   * @param grupoId - ID del grupo
   * @param mensaje - El mensaje que se envió
   */
  private async notifyOfflineMembers(grupoId: string, mensaje: any) {
    try {
      // 1. Obtener todos los miembros del grupo
      const todosMiembros = await this.chatsService.getGroupMembers(grupoId);

      // 2. Obtener usuarios conectados al room del grupo
      const socketsEnRoom = await this.server.in(grupoId).fetchSockets();
      const usuariosConectados = socketsEnRoom.map(socket => socket.data.userId);

      // 3. Identificar usuarios desconectados
      const usuariosDesconectados = todosMiembros.filter(
        miembroId => !usuariosConectados.includes(miembroId) && miembroId !== mensaje.usuarioId
      );

      if (usuariosDesconectados.length > 0) {
        this.logger.log(`[NOTIFICACIONES] ${usuariosDesconectados.length} usuarios desconectados en grupo ${grupoId}`);

        // Obtener nombre del grupo para la notificación
        const nombreGrupo = await this.chatsService.getGroupName(grupoId);

        // TODO: Implementación de llamado de notificación con Azure Service Bus
        // Datos que se enviarán al Service Bus:
        // - usuariosDesconectados: Array de IDs de usuarios que recibirán notificación
        // - nombreGrupo: Nombre del grupo donde se envió el mensaje
        // - mensaje: { id, contenido, usuario: { nombre, apellido, avatar_url }, fechaCreacion }

        this.logger.debug(`[NOTIFICACION] Se deben notificar a ${usuariosDesconectados.length} usuarios sobre nuevo mensaje en "${nombreGrupo}"`);
        this.logger.debug(`[NOTIFICACION] Usuarios a notificar: ${usuariosDesconectados.join(', ')}`);
        this.logger.debug(`[NOTIFICACION] Remitente: ${mensaje.usuario.nombre} ${mensaje.usuario.apellido}`);
        this.logger.debug(`[NOTIFICACION] Contenido: ${mensaje.contenido.substring(0, 50)}...`);
      }
    } catch (error) {
      this.logger.error(`[NOTIFICACIONES] Error al detectar usuarios desconectados: ${error.message}`);
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
    @MessageBody() payload: { grupoId: string } | string,
  ) {
    const userId = client.data.userId;

    // Manejar diferentes formatos de payload
    let grupoId: string = '';

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        grupoId = payload;
      }
    } else if (payload && typeof payload === 'object') {
      grupoId = payload.grupoId;
    }

    // Verificar si el cliente está en la sala del grupo
    const rooms = Array.from(client.rooms);
    if (!rooms.includes(grupoId)) {
      return;
    }

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
    @MessageBody() payload: { grupoId: string } | string,
  ) {
    const userId = client.data.userId;

    // Manejar diferentes formatos de payload
    let grupoId: string = '';

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        grupoId = payload;
      }
    } else if (payload && typeof payload === 'object') {
      grupoId = payload.grupoId;
    }

    // Verificar si el cliente está en la sala del grupo
    const rooms = Array.from(client.rooms);
    if (!rooms.includes(grupoId)) {
      return;
    }

    // Emitir a todos EXCEPTO al emisor
    client.to(grupoId).emit('userStoppedTyping', {
      userId,
    });
  }
}
