import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReporteDto, TipoEntidadReporte } from './dto/create-reporte.dto';

/**
 * Servicio de Reportes
 * Implementa RB-01 (Normas de comunidad) y RB-02 (Logs de auditoría)
 */
@Injectable()
export class ReportesService {
  private readonly logger = new Logger(ReportesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un nuevo reporte en el sistema
   * @param reporterId - ID del usuario que realiza el reporte
   * @param createReporteDto - Datos del reporte
   * @param metadata - Información adicional para auditoría (IP, User-Agent)
   */
  async create(
    reporterId: string,
    createReporteDto: CreateReporteDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    // 1. Validar que el usuario reportador existe
    const reporter = await this.prisma.usuarios.findUnique({
      where: { id: reporterId },
    });

    if (!reporter) {
      throw new ForbiddenException('Usuario no autenticado o no válido');
    }

    // 2. Validar que la entidad reportada existe
    await this.validateEntityExists(
      createReporteDto.tipoEntidad,
      createReporteDto.entidadId,
    );

    // 3. Validar que el usuario reportado existe (si se proporciona)
    if (createReporteDto.reportedUserId) {
      const reportedUser = await this.prisma.usuarios.findUnique({
        where: { id: createReporteDto.reportedUserId },
      });

      if (!reportedUser) {
        throw new BadRequestException('El usuario reportado no existe');
      }

      // No permitir auto-reportes
      if (createReporteDto.reportedUserId === reporterId) {
        throw new BadRequestException('No puedes reportarte a ti mismo');
      }
    }

    // 4. Verificar que no exista un reporte duplicado pendiente
    const existingReport = await this.prisma.reporte.findFirst({
      where: {
        reporterId,
        tipoEntidad: createReporteDto.tipoEntidad,
        entidadId: createReporteDto.entidadId,
        estado: 'PENDIENTE',
      },
    });

    if (existingReport) {
      throw new BadRequestException(
        'Ya existe un reporte pendiente para esta entidad',
      );
    }

    // 5. Crear el reporte
    const reporte = await this.prisma.reporte.create({
      data: {
        reporterId,
        reportedUserId: createReporteDto.reportedUserId,
        tipoEntidad: createReporteDto.tipoEntidad,
        entidadId: createReporteDto.entidadId,
        motivo: createReporteDto.motivo,
        descripcion: createReporteDto.descripcion,
        evidenciaUrl: createReporteDto.evidenciaUrl,
      },
      include: {
        reporter: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
      },
    });

    // 6. Registrar en audit_log (RB-02)
    await this.prisma.audit_log.create({
      data: {
        userId: reporterId,
        accion: 'CREATE_REPORT',
        entidad: 'reporte',
        entidadId: reporte.id.toString(),
        datoNuevo: {
          tipoEntidad: createReporteDto.tipoEntidad,
          entidadId: createReporteDto.entidadId,
          motivo: createReporteDto.motivo,
        },
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    this.logger.log(
      `Reporte #${reporte.id} creado por usuario ${reporterId} - Motivo: ${createReporteDto.motivo}`,
    );

    return {
      success: true,
      message: 'Reporte creado exitosamente. Será revisado por un moderador.',
      data: reporte,
    };
  }

  /**
   * Valida que la entidad reportada existe en el sistema
   */
  private async validateEntityExists(
    tipoEntidad: TipoEntidadReporte,
    entidadId: string,
  ): Promise<void> {
    let entity: unknown = null;

    switch (tipoEntidad) {
      case TipoEntidadReporte.TUTORIA:
        entity = await this.prisma.tutoria.findUnique({
          where: { id_tutoria: entidadId },
        });
        break;

      case TipoEntidadReporte.USUARIO:
        entity = await this.prisma.usuarios.findUnique({
          where: { id: entidadId },
        });
        break;

      case TipoEntidadReporte.MATERIAL:
        // TODO: Implementar cuando exista el modelo de materiales
        // Por ahora, aceptamos el ID sin validación
        this.logger.warn(
          `Validación de MATERIAL pendiente - ID: ${entidadId}`,
        );
        return;

      case TipoEntidadReporte.COMENTARIO_FORO:
        // TODO: Implementar cuando exista el modelo de foros
        this.logger.warn(
          `Validación de COMENTARIO_FORO pendiente - ID: ${entidadId}`,
        );
        return;

      case TipoEntidadReporte.GRUPO_CHAT:
        entity = await this.prisma.grupoChat.findUnique({
          where: { id: entidadId },
        });
        break;

      default:
        throw new BadRequestException('Tipo de entidad no soportado');
    }

    if (!entity) {
      throw new NotFoundException(
        `La entidad ${tipoEntidad} con ID ${entidadId} no existe`,
      );
    }
  }

  /**
   * Obtiene todos los reportes (para administradores)
   */
  async findAll(filters?: {
    estado?: string;
    tipoEntidad?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (filters?.estado) {
      where.estado = filters.estado;
    }

    if (filters?.tipoEntidad) {
      where.tipoEntidad = filters.tipoEntidad;
    }

    const [reportes, total] = await Promise.all([
      this.prisma.reporte.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          reportedUser: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              email: true,
            },
          },
          resolvedBy: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      this.prisma.reporte.count({ where }),
    ]);

    return {
      data: reportes,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Obtiene un reporte por ID
   */
  async findOne(id: number) {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id },
      include: {
        reporter: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        reportedUser: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
          },
        },
      },
    });

    if (!reporte) {
      throw new NotFoundException(`Reporte #${id} no encontrado`);
    }

    return reporte;
  }

  /**
   * Obtiene los reportes creados por un usuario
   */
  async findByReporter(reporterId: string) {
    return this.prisma.reporte.findMany({
      where: { reporterId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tipoEntidad: true,
        motivo: true,
        estado: true,
        createdAt: true,
        resolvedAt: true,
      },
    });
  }
}
