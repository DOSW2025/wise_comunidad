import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMensajeDto, ListMensajesQueryDto } from './dto/create-mensaje.dto';
import { ApiResponse } from '../common/responses/api.response';
import { ForosMessages } from '../common/messages/foros.messages';

@Injectable()
export class MensajesService {
  private readonly logger = new Logger(MensajesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Obtiene todos los mensajes de un foro con paginación
   * @param forumId ID del foro
   * @param opts Opciones de paginación y filtros
   */
  async listMensajes(forumId: number, opts: ListMensajesQueryDto = {}) {
    const take = 20;
    const page = opts.page ?? 1;
    const skip = (page - 1) * take;

    try {
      // Verificar que el foro existe
      const foro = await this.prisma.foro.findUnique({
        where: { id: forumId },
      });

      if (!foro) {
        this.logger.warn(`Intento de listar mensajes de foro inexistente: ${forumId}`);
        throw new NotFoundException(ForosMessages.FORO_NOT_FOUND);
      }

      // Construir filtro según opciones
      const where: any = { forumId };
      if (opts.unreadOnly) {
        where.leido = false;
      }

      const [mensajes, total] = await Promise.all([
        this.prisma.mensaje.findMany({
          where,
          skip,
          take,
          orderBy: { created_at: 'desc' },
          include: {
            author: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar_url: true,
                email: true,
              },
            },
          },
        }),
        this.prisma.mensaje.count({ where }),
      ]);

      this.logger.log(
        `${mensajes.length} mensajes listados del foro ${forumId} (página ${page})`,
      );

      return ApiResponse.success(ForosMessages.MENSAJES_LISTED, {
        mensajes,
        pagination: {
          page,
          pageSize: take,
          total,
          totalPages: Math.ceil(total / take),
        },
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al listar mensajes del foro ${forumId}: ${error.message}`);
      throw new BadRequestException(ForosMessages.DATABASE_ERROR);
    }
  }

  /**
   * Envía un nuevo mensaje en un foro
   * @param forumId ID del foro
   * @param dto Datos del mensaje
   */
  async sendMensaje(forumId: number, dto: CreateMensajeDto) {
    try {
      // 1. Validar que el foro existe
      const foro = await this.prisma.foro.findUnique({
        where: { id: forumId },
        include: { materia: true },
      });

      if (!foro) {
        this.logger.warn(
          `Intento de enviar mensaje a foro inexistente: ${forumId}`,
        );
        throw new NotFoundException(ForosMessages.FORO_NOT_FOUND);
      }

      // 2. Validar que el usuario existe
      const usuario = await this.prisma.usuarios.findUnique({
        where: { id: dto.authorId },
      });

      if (!usuario) {
        this.logger.warn(
          `Intento de enviar mensaje por usuario inexistente: ${dto.authorId}`,
        );
        throw new NotFoundException(
          ForosMessages.USUARIO_NOT_FOUND(dto.authorId),
        );
      }

      // 3. Validar que el contenido no esté vacío
      if (!dto.contenido || dto.contenido.trim().length === 0) {
        this.logger.warn(`Intento de enviar mensaje vacío en foro: ${forumId}`);
        throw new BadRequestException(
          ForosMessages.REQUIRED_FIELD('contenido'),
        );
      }

      // 4. Crear el mensaje
      const mensaje = await this.prisma.mensaje.create({
        data: {
          forumId,
          authorId: dto.authorId,
          contenido: dto.contenido.trim(),
        },
        include: {
          author: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar_url: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(
        `Mensaje enviado en foro ${forumId} por usuario ${dto.authorId}`,
      );

      return ApiResponse.created(
        ForosMessages.MENSAJE_SENT(`${usuario.nombre} ${usuario.apellido}`),
        {
          ...mensaje,
          foro: {
            id: foro.id,
            nombre: foro.nombre,
            slug: foro.slug,
            materia: foro.materia,
          },
        },
      );
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error al enviar mensaje en foro ${forumId}: ${error.message}`,
      );
      throw new BadRequestException(ForosMessages.DATABASE_CREATE_ERROR);
    }
  }

  /**
   * Marca un mensaje como leído
   * @param forumId ID del foro
   * @param messageId ID del mensaje
   */
  async markAsRead(forumId: number, messageId: number) {
    try {
      // Verificar que el mensaje existe y pertenece al foro
      const mensaje = await this.prisma.mensaje.findUnique({
        where: { id: messageId },
      });

      if (!mensaje || mensaje.forumId !== forumId) {
        this.logger.warn(
          `Intento de marcar mensaje inexistente como leído: ${messageId}`,
        );
        throw new NotFoundException('Mensaje no encontrado.');
      }

      // Actualizar estado
      const updated = await this.prisma.mensaje.update({
        where: { id: messageId },
        data: { leido: true },
        include: {
          author: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              avatar_url: true,
              email: true,
            },
          },
        },
      });

      this.logger.log(`Mensaje ${messageId} marcado como leído`);

      return ApiResponse.success(ForosMessages.MENSAJE_MARKED_READ, updated);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Error al marcar mensaje ${messageId} como leído: ${error.message}`,
      );
      throw new BadRequestException(ForosMessages.DATABASE_UPDATE_ERROR);
    }
  }

  /**
   * Obtiene la cantidad de mensajes no leídos en un foro
   * @param forumId ID del foro
   */
  async getUnreadCount(forumId: number) {
    try {
      const count = await this.prisma.mensaje.count({
        where: {
          forumId,
          leido: false,
        },
      });

      this.logger.log(`${count} mensajes no leídos en foro ${forumId}`);

      return {
        forumId,
        unreadCount: count,
      };
    } catch (error) {
      this.logger.error(
        `Error al contar mensajes no leídos en foro ${forumId}: ${error.message}`,
      );
      throw new BadRequestException(ForosMessages.DATABASE_ERROR);
    }
  }
}
