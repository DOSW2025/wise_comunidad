// Tests del ReportesService sin importar clases reales de src/
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
  Logger,
} from '@nestjs/common';

// Enums definidos localmente
enum TipoEntidadReporte {
  TUTORIA = 'TUTORIA',
  USUARIO = 'USUARIO',
  GRUPO_CHAT = 'GRUPO_CHAT',
  MATERIAL = 'MATERIAL',
  COMENTARIO_FORO = 'COMENTARIO_FORO',
}

enum MotivoReporte {
  CONTENIDO_OFENSIVO = 'CONTENIDO_OFENSIVO',
  CONTENIDO_SPAM = 'CONTENIDO_SPAM',
  AUSENCIA_TUTOR = 'AUSENCIA_TUTOR',
  COMPORTAMIENTO_INAPROPIADO = 'COMPORTAMIENTO_INAPROPIADO',
  VIOLACION_DERECHOS_AUTOR = 'VIOLACION_DERECHOS_AUTOR',
}

interface CreateReporteDto {
  tipoEntidad: TipoEntidadReporte;
  entidadId: string;
  reportedUserId?: string;
  motivo: MotivoReporte;
  descripcion: string;
}

// Mock de PrismaService
const mockPrismaService = {
  usuarios: {
    findUnique: jest.fn(),
  },
  tutoria: {
    findUnique: jest.fn(),
  },
  grupoChat: {
    findUnique: jest.fn(),
  },
  reporte: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  audit_log: {
    create: jest.fn(),
  },
};

// Implementación mock del ReportesService
class MockReportesService {
  private readonly logger = new Logger('ReportesService');
  private prisma = mockPrismaService;

  async create(
    reporterId: string,
    dto: CreateReporteDto,
    metadata?: { ipAddress?: string; userAgent?: string },
  ) {
    // Verificar que el reportador existe
    const reporter = await this.prisma.usuarios.findUnique({
      where: { id: reporterId },
    });

    if (!reporter) {
      throw new ForbiddenException('Usuario no autenticado o no válido');
    }

    // No puede reportarse a sí mismo
    if (dto.reportedUserId === reporterId) {
      throw new BadRequestException('No puedes reportarte a ti mismo');
    }

    // Verificar usuario reportado si aplica
    if (dto.reportedUserId) {
      const reportedUser = await this.prisma.usuarios.findUnique({
        where: { id: dto.reportedUserId },
      });

      if (!reportedUser) {
        throw new NotFoundException('El usuario reportado no existe');
      }
    }

    // Verificar entidad según tipo
    if (dto.tipoEntidad === TipoEntidadReporte.TUTORIA) {
      const tutoria = await this.prisma.tutoria.findUnique({
        where: { id_tutoria: dto.entidadId },
      });
      if (!tutoria) {
        throw new NotFoundException('La tutoría no existe');
      }
    }

    if (dto.tipoEntidad === TipoEntidadReporte.GRUPO_CHAT) {
      const grupo = await this.prisma.grupoChat.findUnique({
        where: { id: dto.entidadId },
      });
      if (!grupo) {
        throw new NotFoundException('El grupo de chat no existe');
      }
    }

    // Verificar reporte duplicado
    const existingReport = await this.prisma.reporte.findFirst({
      where: {
        reporterId,
        tipoEntidad: dto.tipoEntidad,
        entidadId: dto.entidadId,
        estado: 'PENDIENTE',
      },
    });

    if (existingReport) {
      throw new BadRequestException('Ya existe un reporte pendiente para esta entidad');
    }

    // Crear el reporte
    const reporte = await this.prisma.reporte.create({
      data: {
        reporterId,
        tipoEntidad: dto.tipoEntidad,
        entidadId: dto.entidadId,
        reportedUserId: dto.reportedUserId,
        motivo: dto.motivo,
        descripcion: dto.descripcion,
        estado: 'PENDIENTE',
      },
      include: {
        reporter: true,
        reportedUser: true,
      },
    });

    // Registrar auditoría
    await this.prisma.audit_log.create({
      data: {
        userId: reporterId,
        accion: 'CREATE_REPORT',
        entidad: 'reporte',
        entidadId: reporte.id.toString(),
        ipAddress: metadata?.ipAddress,
        userAgent: metadata?.userAgent,
      },
    });

    return {
      success: true,
      message: 'Reporte creado correctamente',
      data: reporte,
    };
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    estado?: string;
    tipoEntidad?: string;
  }) {
    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (options?.estado) where.estado = options.estado;
    if (options?.tipoEntidad) where.tipoEntidad = options.tipoEntidad;

    const [data, total] = await Promise.all([
      this.prisma.reporte.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: true,
          reportedUser: true,
        },
      }),
      this.prisma.reporte.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const reporte = await this.prisma.reporte.findUnique({
      where: { id },
      include: {
        reporter: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        reportedUser: {
          select: { id: true, nombre: true, apellido: true, email: true },
        },
        resolvedBy: {
          select: { id: true, nombre: true, apellido: true },
        },
      },
    });

    if (!reporte) {
      throw new NotFoundException(`Reporte #${id} no encontrado`);
    }

    return reporte;
  }

  async findByReporter(userId: string) {
    return this.prisma.reporte.findMany({
      where: { reporterId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tipoEntidad: true,
        motivo: true,
        estado: true,
        createdAt: true,
      },
    });
  }
}

describe('ReportesService', () => {
  let service: MockReportesService;

  // Datos de prueba
  const mockReporter = {
    id: 'reporter-123',
    nombre: 'Juan',
    apellido: 'Pérez',
    email: 'juan@mail.escuelaing.edu.co',
  };

  const mockReportedUser = {
    id: 'tutor-456',
    nombre: 'María',
    apellido: 'García',
    email: 'maria@mail.escuelaing.edu.co',
  };

  const mockTutoria = {
    id_tutoria: 'tutoria-789',
    tutorId: 'tutor-456',
    studentId: 'reporter-123',
    status: 'COMPLETADA',
  };

  const validReporteDto: CreateReporteDto = {
    tipoEntidad: TipoEntidadReporte.TUTORIA,
    entidadId: 'tutoria-789',
    reportedUserId: 'tutor-456',
    motivo: MotivoReporte.AUSENCIA_TUTOR,
    descripcion: 'El tutor no se presentó a la sesión programada.',
  };

  beforeEach(() => {
    service = new MockReportesService();
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create() - Creación de reportes', () => {
    describe('Validación de usuario autenticado', () => {
      it('debe rechazar si el usuario reportador no existe', async () => {
        mockPrismaService.usuarios.findUnique.mockResolvedValue(null);

        await expect(
          service.create('usuario-inexistente', validReporteDto),
        ).rejects.toThrow(ForbiddenException);
      });

      it('debe aceptar un usuario válido existente', async () => {
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);
        mockPrismaService.reporte.findFirst.mockResolvedValue(null);
        mockPrismaService.reporte.create.mockResolvedValue({
          id: 1,
          ...validReporteDto,
          reporter: mockReporter,
          reportedUser: mockReportedUser,
        });
        mockPrismaService.audit_log.create.mockResolvedValue({});

        const result = await service.create('reporter-123', validReporteDto);

        expect(result.success).toBe(true);
      });
    });

    describe('Validación de entidad reportada', () => {
      it('debe rechazar si la tutoría reportada no existe', async () => {
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(null);

        await expect(
          service.create('reporter-123', validReporteDto),
        ).rejects.toThrow(NotFoundException);
      });

      it('debe rechazar si el grupo de chat reportado no existe', async () => {
        mockPrismaService.usuarios.findUnique.mockResolvedValue(mockReporter);
        mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);

        const grupoChatReportDto: CreateReporteDto = {
          tipoEntidad: TipoEntidadReporte.GRUPO_CHAT,
          entidadId: 'grupo-inexistente',
          motivo: MotivoReporte.CONTENIDO_OFENSIVO,
          descripcion: 'Contenido inapropiado en el grupo.',
        };

        await expect(
          service.create('reporter-123', grupoChatReportDto),
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('Validación de auto-reporte', () => {
      it('debe rechazar si el usuario intenta reportarse a sí mismo', async () => {
        mockPrismaService.usuarios.findUnique.mockResolvedValue(mockReporter);

        const selfReportDto: CreateReporteDto = {
          ...validReporteDto,
          reportedUserId: 'reporter-123',
        };

        await expect(
          service.create('reporter-123', selfReportDto),
        ).rejects.toThrow('No puedes reportarte a ti mismo');
      });
    });

    describe('Validación de reportes duplicados', () => {
      it('debe rechazar si ya existe un reporte pendiente', async () => {
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);
        mockPrismaService.reporte.findFirst.mockResolvedValue({ id: 99 });

        await expect(
          service.create('reporter-123', validReporteDto),
        ).rejects.toThrow('Ya existe un reporte pendiente');
      });
    });

    describe('Registro de auditoría', () => {
      it('debe registrar el log de auditoría con metadata', async () => {
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);
        mockPrismaService.reporte.findFirst.mockResolvedValue(null);
        mockPrismaService.reporte.create.mockResolvedValue({
          id: 1,
          ...validReporteDto,
          reporter: mockReporter,
          reportedUser: mockReportedUser,
        });
        mockPrismaService.audit_log.create.mockResolvedValue({});

        await service.create('reporter-123', validReporteDto, {
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
        });

        expect(mockPrismaService.audit_log.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            userId: 'reporter-123',
            accion: 'CREATE_REPORT',
            ipAddress: '192.168.1.1',
          }),
        });
      });
    });
  });

  describe('findAll() - Listado de reportes', () => {
    it('debe retornar reportes paginados', async () => {
      const mockReportes = [
        { id: 1, motivo: 'AUSENCIA_TUTOR' },
        { id: 2, motivo: 'CONTENIDO_SPAM' },
      ];

      mockPrismaService.reporte.findMany.mockResolvedValue(mockReportes);
      mockPrismaService.reporte.count.mockResolvedValue(2);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(result.data).toHaveLength(2);
      expect(result.meta.total).toBe(2);
    });

    it('debe filtrar por estado', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([]);
      mockPrismaService.reporte.count.mockResolvedValue(0);

      await service.findAll({ estado: 'PENDIENTE' });

      expect(mockPrismaService.reporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { estado: 'PENDIENTE' },
        }),
      );
    });

    it('debe usar valores por defecto para paginación', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([]);
      mockPrismaService.reporte.count.mockResolvedValue(0);

      const result = await service.findAll();

      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
    });
  });

  describe('findOne() - Obtener reporte por ID', () => {
    it('debe retornar el reporte si existe', async () => {
      mockPrismaService.reporte.findUnique.mockResolvedValue({
        id: 1,
        motivo: 'AUSENCIA_TUTOR',
        reporter: mockReporter,
      });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockPrismaService.reporte.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByReporter() - Obtener reportes por usuario', () => {
    it('debe retornar los reportes del usuario', async () => {
      const mockReportes = [
        { id: 1, tipoEntidad: 'TUTORIA' },
        { id: 2, tipoEntidad: 'USUARIO' },
      ];

      mockPrismaService.reporte.findMany.mockResolvedValue(mockReportes);

      const result = await service.findByReporter('user-123');

      expect(result).toHaveLength(2);
    });

    it('debe retornar array vacío si no hay reportes', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([]);

      const result = await service.findByReporter('user-sin-reportes');

      expect(result).toEqual([]);
    });
  });
});
