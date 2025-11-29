import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { CreateGroupDto } from './dto/creategroup.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Valida que todos los correos existan en la base de datos
   * @param emails - Lista de correos a validar
   * @throws BadRequestException si algún correo no existe
   */
  private async validateEmails(emails: string[]): Promise<void> {
    const usuarios = await this.prisma.usuarios.findMany({
      where: {
        email: {
          in: emails,
        },
      },
      select: {
        email: true,
      },
    });

    const correosEncontrados = usuarios.map((u) => u.email);
    const correosNoEncontrados = emails.filter(
      (email) => !correosEncontrados.includes(email),
    );

    if (correosNoEncontrados.length > 0) {
      throw new BadRequestException(
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
}
