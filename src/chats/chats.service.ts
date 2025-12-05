import { Injectable, BadRequestException, ConflictException, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { CreateGroupDto, SendMessageDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceBusClient, ServiceBusMessage } from '@azure/service-bus';
import { notificacionDto, TemplateNotificacionesEnum } from './dto/notificacion.chat.dto';

@Injectable()
export class ChatsService {
  private notification;  
  constructor(private readonly prisma: PrismaService,
              private readonly client: ServiceBusClient
  ) { 
    this.notification = this.client.createSender('mail.envio.individual');
  }
  
  private readonly logger = new Logger(ChatsService.name);
  /**
   * Valida que todos los correos existan en la base de datos
   * @param emails - Lista de correos a validar
   * @throws BadRequestException si algún correo no exief594c4e-5569-4298-9964-41ca4accc03aste
   */
  private async validateEmails(emails: string[]): Promise<void> {
    // Búsqueda en paralelo de todos los emails usando Promise.all
    const resultados = await Promise.all(
      emails.map(email =>
        this.prisma.usuarios.findUnique({
          where: { email },
          select: { email: true }
        })
      )
    );

    // Identificar correos no encontrados
    const correosNoEncontrados = emails.filter((email, index) => !resultados[index]);

    if (correosNoEncontrados.length > 0) {
      throw new NotFoundException(
        `Los siguientes correos no están registrados: ${correosNoEncontrados.join(', ')}`,
      );
    }
  }

  /**
   * Crea un nuevo grupo de chat
   * @param createGroupDto - Datos del grupo a crear (nombre y emails)
   * @param adminId - ID del usuario que está creando el grupo
   * @returns El grupo creado con sus miembros
   */
  async create(createGroupDto: CreateGroupDto, adminId: string) {
    const { nombre, emails } = createGroupDto;

    // 1. Validar que el nombre no esté vacío (ya lo hace el DTO, pero doble validación)
    if (!nombre || nombre.trim() === '') {
      throw new BadRequestException('El nombre del grupo no puede estar vacío');
    }

    if (nombre.length > 30) {
      throw new BadRequestException(
        'El nombre del grupo no puede superar los 30 caracteres',
      );
    }

    // 2. Verificar que no exista un grupo con el mismo nombre
    const grupoExistente = await this.prisma.grupoChat.findUnique({
      where: { nombre },
    });

    if (grupoExistente) {
      throw new ConflictException(
        'Ya existe un grupo con ese nombre. Por favor, elige un nombre diferente.',
      );
    }

    // 3. Validar que todos los correos existan
    await this.validateEmails(emails);

    // 4. Obtener los IDs de los usuarios a partir de los emails
    const usuarios = await this.prisma.usuarios.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        id: true,
        email: true,
      },
    });

    const userIds = usuarios.map((u) => u.id);

    // 5. Agregar al creador del grupo si no está en la lista
    if (!userIds.includes(adminId)) {
      userIds.push(adminId);
    }

    // 6. Crear el grupo y agregar todos los miembros en una transacción
    const grupo = await this.prisma.$transaction(async (tx) => {
      // Crear el grupo
      const nuevoGrupo = await tx.grupoChat.create({
        data: {
          nombre,
          creadoPor: adminId,
        },
      });

      // Agregar todos los miembros
      await tx.miembroGrupoChat.createMany({
        data: userIds.map((userId) => ({
          grupoId: nuevoGrupo.id,
          usuarioId: userId,
        })),
      });

      // Retornar el grupo con sus miembros
      return tx.grupoChat.findUnique({
        where: { id: nuevoGrupo.id },
        include: {
          miembros: {
            include: {
              usuario: {
                select: {
                  id: true,
                  email: true,
                  nombre: true,
                  apellido: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      });
    });

    return {
      success: true,
      message: 'Grupo creado correctamente',
      data: grupo,
    };
  }

  /**
   * Obtiene todos los grupos
   */
  async findAll() {
    const grupos = await this.prisma.grupoChat.findMany({
      include: {
        miembros: {
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true,
                avatar_url: true,
              },
            },
          },
        },
        _count: {
          select: {
            mensajes: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return grupos;
  }

  /**
   * Obtiene un grupo por su ID
   * @param id - ID del grupo
   */
  async findOne(id: string) {
    const grupo = await this.prisma.grupoChat.findUnique({
      where: { id },
      include: {
        miembros: {
          include: {
            usuario: {
              select: {
                id: true,
                email: true,
                nombre: true,
                apellido: true,
                avatar_url: true,
              },
            },
          },
        },
        mensajes: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                apellido: true,
                avatar_url: true,
              },
            },
          },
          orderBy: {
            fechaCreacion: 'asc',
          },
        },
      },
    });

    if (!grupo) {
      throw new BadRequestException('Grupo no encontrado');
    }

    return grupo;
  }

  /**
   * Elimina un grupo
   * @param id - ID del grupo a eliminar
   */
  async remove(id: string) {
    const grupo = await this.prisma.grupoChat.findUnique({
      where: { id },
    });

    if (!grupo) {
      throw new BadRequestException('Grupo no encontrado');
    }

    await this.prisma.grupoChat.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Grupo eliminado correctamente',
    };
  }

  /**
   * Valida que un usuario sea miembro de un grupo
   * @param grupoId - ID del grupo
   * @param usuarioId - ID del usuario
   * @throws ForbiddenException si el usuario no es miembro
   */
  async validateMembership(grupoId: string, usuarioId: string): Promise<void> {
    console.log(`[validateMembership] Buscando: grupoId="${grupoId}", usuarioId="${usuarioId}"`);

    const miembro = await this.prisma.miembroGrupoChat.findUnique({
      where: {
        grupoId_usuarioId: {
          grupoId,
          usuarioId,
        },
      },
    });

    console.log(`[validateMembership] Miembro encontrado:`, miembro);

    if (!miembro) {
      // Buscar todos los miembros del grupo para debug
      const todosMiembros = await this.prisma.miembroGrupoChat.findMany({
        where: { grupoId },
      });
      console.log(`[validateMembership] Todos los miembros del grupo:`, todosMiembros);

      throw new ForbiddenException('No eres miembro de este grupo');
    }
  }

  /**
   * Crea un nuevo mensaje en un grupo
   * @param sendMessageDto - Datos del mensaje (grupoId y contenido)
   * @param usuarioId - ID del usuario que envía el mensaje
   * @returns El mensaje creado con información del usuario
   */
  async sendMessage(sendMessageDto: SendMessageDto, usuarioId: string) {
    const { grupoId, contenido } = sendMessageDto;

    // 1. Validar que el grupo exista
    const grupo = await this.prisma.grupoChat.findUnique({
      where: { id: grupoId },
    });

    if (!grupo) {
      throw new BadRequestException('El grupo no existe');
    }

    // 2. Validar que el usuario sea miembro del grupo
    await this.validateMembership(grupoId, usuarioId);

    // 3. Crear el mensaje
    const mensaje = await this.prisma.mensajeChat.create({
      data: {
        grupoId,
        usuarioId,
        contenido,
      },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    return mensaje;
  }

  /**
   * Obtiene todos los mensajes de un grupo
   * @param grupoId - ID del grupo
   * @param usuarioId - ID del usuario que solicita los mensajes
   * @returns Lista de mensajes ordenados cronológicamente
   */
  async getMessages(grupoId: string, usuarioId: string) {
    // 1. Validar que el grupo exista
    const grupo = await this.prisma.grupoChat.findUnique({
      where: { id: grupoId },
    });

    if (!grupo) {
      throw new BadRequestException('El grupo no existe');
    }

    // 2. Validar que el usuario sea miembro del grupo
    await this.validateMembership(grupoId, usuarioId);

    // 3. Obtener mensajes
    const mensajes = await this.prisma.mensajeChat.findMany({
      where: { grupoId },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'asc',
      },
    });

    return mensajes;
  }

  /**
   * Obtiene todos los miembros de un grupo
   * @param grupoId - ID del grupo
   * @returns Lista de IDs de usuarios que son miembros del grupo
   */
  async getGroupMembers(grupoId: string): Promise<string[]> {
    const miembros = await this.prisma.miembroGrupoChat.findMany({
      where: { grupoId },
      select: {
        usuarioId: true,
      },
    });

    return miembros.map(m => m.usuarioId);
  }

  /**
   * Obtiene el nombre del grupo
   * @param grupoId - ID del grupo
   * @returns Nombre del grupo
   * @throws NotFoundException si el grupo no existe
   */
  async getGroupName(grupoId: string): Promise<string> {
    const grupo = await this.prisma.grupoChat.findUnique({
      where: { id: grupoId },
      select: { nombre: true },
    });

    if (!grupo) {
      throw new NotFoundException('El grupo no existe');
    }

    return grupo.nombre;
  }

  /**
   * Obtiene los emails de usuarios a partir de sus IDs
   * @param userIds - Array de IDs de usuarios
   * @returns Array de emails de los usuarios
   */
  async getEmailsByUserIds(userIds: string[]): Promise<string[]> {
    const usuarios = await this.prisma.usuarios.findMany({
      where: {
        id: {
          in: userIds,
        },
      },
      select: {
        email: true,
      },
    });

    return usuarios.map(u => u.email);
  }

  async sendNotificacionToServiceBus(notificacionDto: notificacionDto) {
    
    const Message : ServiceBusMessage= {
      body: notificacionDto,
    }

    await this.notification.sendMessages(Message);
  }
}

