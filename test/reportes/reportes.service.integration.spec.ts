/**
 * Integration tests for ReportesService
 * These tests import real classes to ensure coverage
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ReportesService } from '../../src/reportes/reportes.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { TipoEntidadReporte, MotivoReporte } from '../../src/reportes/dto/create-reporte.dto';

describe('ReportesService (Integration)', () => {
  let service: ReportesService;
  let prismaService: PrismaService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    nombre: 'Test',
    apellido: 'User',
    email: 'test@test.com',
  };

  const mockReporte = {
    id: 1,
    reporterId: 'user-123',
    reportedUserId: 'user-456',
    tipoEntidad: TipoEntidadReporte.USUARIO,
    entidadId: 'user-456',
    motivo: 'SPAM',
    descripcion: 'Spam content',
    estado: 'PENDIENTE',
    createdAt: new Date(),
    reporter: mockUser,
    reportedUser: { ...mockUser, id: 'user-456' },
  };

  // Mock PrismaService
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
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
    audit_log: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ReportesService>(ReportesService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createReporteDto = {
      tipoEntidad: TipoEntidadReporte.USUARIO,
      entidadId: 'user-456',
      reportedUserId: 'user-456',
      motivo: MotivoReporte.CONTENIDO_SPAM,
      descripcion: 'Sending spam messages and unwanted content to users',
    };

    it('should create a report successfully', async () => {
      // Mock calls in order: 1) reporter, 2) entity validation, 3) reported user
      mockPrismaService.usuarios.findUnique
        .mockResolvedValueOnce(mockUser) // reporter exists
        .mockResolvedValueOnce({ ...mockUser, id: 'user-456' }) // entity exists (USUARIO type)
        .mockResolvedValueOnce({ ...mockUser, id: 'user-456' }); // reported user exists

      mockPrismaService.reporte.findFirst.mockResolvedValue(null); // no duplicate
      mockPrismaService.reporte.create.mockResolvedValue(mockReporte);
      mockPrismaService.audit_log.create.mockResolvedValue({});

      const result = await service.create('user-123', createReporteDto, {
        ipAddress: '127.0.0.1',
        userAgent: 'Test Browser',
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain('Reporte creado exitosamente');
      expect(result.data).toBeDefined();
      expect(mockPrismaService.audit_log.create).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when reporter not found', async () => {
      mockPrismaService.usuarios.findUnique.mockResolvedValue(null);

      await expect(
        service.create('non-existent', createReporteDto),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException when reported user not found', async () => {
      mockPrismaService.usuarios.findUnique
        .mockResolvedValueOnce(mockUser) // reporter exists
        .mockResolvedValueOnce(null); // reported user not found (for entity validation)

      // For USUARIO type, validateEntityExists checks usuarios
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);

      const dto = {
        ...createReporteDto,
        reportedUserId: 'non-existent',
      };

      // Reset and set up properly
      mockPrismaService.usuarios.findUnique
        .mockReset()
        .mockResolvedValueOnce(mockUser) // reporter exists
        .mockResolvedValueOnce({ id: 'user-456' }) // entity exists
        .mockResolvedValueOnce(null); // reported user not found

      await expect(service.create('user-123', dto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when self-reporting', async () => {
      const selfReportDto = {
        ...createReporteDto,
        reportedUserId: 'user-123', // same as reporter
      };

      mockPrismaService.usuarios.findUnique
        .mockResolvedValueOnce(mockUser) // reporter
        .mockResolvedValueOnce(mockUser) // entity exists
        .mockResolvedValueOnce(mockUser); // reported user (same)

      await expect(
        service.create('user-123', selfReportDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when duplicate pending report exists', async () => {
      mockPrismaService.usuarios.findUnique
        .mockResolvedValueOnce(mockUser) // reporter
        .mockResolvedValueOnce({ id: 'user-456' }) // entity
        .mockResolvedValueOnce({ id: 'user-456' }); // reported user

      mockPrismaService.reporte.findFirst.mockResolvedValue(mockReporte); // duplicate exists

      await expect(
        service.create('user-123', createReporteDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should validate TUTORIA entity type', async () => {
      const tutoriaDto = {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        motivo: MotivoReporte.CONTENIDO_OFENSIVO,
        descripcion: 'Bad content that is offensive and inappropriate for the platform',
      };

      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.tutoria.findUnique.mockResolvedValue({ id_tutoria: 'tutoria-123' });
      mockPrismaService.reporte.findFirst.mockResolvedValue(null);
      mockPrismaService.reporte.create.mockResolvedValue({
        ...mockReporte,
        tipoEntidad: TipoEntidadReporte.TUTORIA,
      });
      mockPrismaService.audit_log.create.mockResolvedValue({});

      const result = await service.create('user-123', tutoriaDto);

      expect(result.success).toBe(true);
      expect(mockPrismaService.tutoria.findUnique).toHaveBeenCalledWith({
        where: { id_tutoria: 'tutoria-123' },
      });
    });

    it('should throw NotFoundException when TUTORIA not found', async () => {
      const tutoriaDto = {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'non-existent',
        motivo: MotivoReporte.CONTENIDO_SPAM,
        descripcion: 'Test description that is at least 20 characters long',
      };

      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.tutoria.findUnique.mockResolvedValue(null);

      await expect(service.create('user-123', tutoriaDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate GRUPO_CHAT entity type', async () => {
      const grupoChatDto = {
        tipoEntidad: TipoEntidadReporte.GRUPO_CHAT,
        entidadId: 'grupo-123',
        motivo: MotivoReporte.COMPORTAMIENTO_INAPROPIADO,
        descripcion: 'Harassment and inappropriate behavior in this group chat',
      };

      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-123' });
      mockPrismaService.reporte.findFirst.mockResolvedValue(null);
      mockPrismaService.reporte.create.mockResolvedValue({
        ...mockReporte,
        tipoEntidad: TipoEntidadReporte.GRUPO_CHAT,
      });
      mockPrismaService.audit_log.create.mockResolvedValue({});

      const result = await service.create('user-123', grupoChatDto);

      expect(result.success).toBe(true);
      expect(mockPrismaService.grupoChat.findUnique).toHaveBeenCalledWith({
        where: { id: 'grupo-123' },
      });
    });

    it('should throw NotFoundException when GRUPO_CHAT not found', async () => {
      const grupoChatDto = {
        tipoEntidad: TipoEntidadReporte.GRUPO_CHAT,
        entidadId: 'non-existent',
        motivo: MotivoReporte.CONTENIDO_SPAM,
        descripcion: 'Test description that is at least 20 characters long',
      };

      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);

      await expect(service.create('user-123', grupoChatDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should handle MATERIAL entity type (pending validation)', async () => {
      const materialDto = {
        tipoEntidad: TipoEntidadReporte.MATERIAL,
        entidadId: 'material-123',
        motivo: MotivoReporte.VIOLACION_DERECHOS_AUTOR,
        descripcion: 'Plagiarized content that violates copyright rules',
      };

      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.reporte.findFirst.mockResolvedValue(null);
      mockPrismaService.reporte.create.mockResolvedValue({
        ...mockReporte,
        tipoEntidad: TipoEntidadReporte.MATERIAL,
      });
      mockPrismaService.audit_log.create.mockResolvedValue({});

      const result = await service.create('user-123', materialDto);

      expect(result.success).toBe(true);
    });

    it('should handle COMENTARIO_FORO entity type (pending validation)', async () => {
      const comentarioDto = {
        tipoEntidad: TipoEntidadReporte.COMENTARIO_FORO,
        entidadId: 'comentario-123',
        motivo: MotivoReporte.CONTENIDO_SPAM,
        descripcion: 'Spam comment that is unwanted and inappropriate',
      };

      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.reporte.findFirst.mockResolvedValue(null);
      mockPrismaService.reporte.create.mockResolvedValue({
        ...mockReporte,
        tipoEntidad: TipoEntidadReporte.COMENTARIO_FORO,
      });
      mockPrismaService.audit_log.create.mockResolvedValue({});

      const result = await service.create('user-123', comentarioDto);

      expect(result.success).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all reports with default pagination', async () => {
      const mockReportes = [mockReporte, { ...mockReporte, id: 2 }];
      mockPrismaService.reporte.findMany.mockResolvedValue(mockReportes);
      mockPrismaService.reporte.count.mockResolvedValue(2);

      const result = await service.findAll();

      expect(result.data).toHaveLength(2);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(2);
    });

    it('should filter by estado', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([mockReporte]);
      mockPrismaService.reporte.count.mockResolvedValue(1);

      const result = await service.findAll({ estado: 'PENDIENTE' });

      expect(mockPrismaService.reporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ estado: 'PENDIENTE' }),
        }),
      );
    });

    it('should filter by tipoEntidad', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([mockReporte]);
      mockPrismaService.reporte.count.mockResolvedValue(1);

      const result = await service.findAll({ tipoEntidad: 'USUARIO' });

      expect(mockPrismaService.reporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tipoEntidad: 'USUARIO' }),
        }),
      );
    });

    it('should paginate correctly', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([mockReporte]);
      mockPrismaService.reporte.count.mockResolvedValue(25);

      const result = await service.findAll({ page: 2, limit: 5 });

      expect(mockPrismaService.reporte.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        }),
      );
      expect(result.meta.totalPages).toBe(5);
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      mockPrismaService.reporte.findUnique.mockResolvedValue(mockReporte);

      const result = await service.findOne(1);

      expect(result).toEqual(mockReporte);
      expect(mockPrismaService.reporte.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: expect.any(Object),
      });
    });

    it('should throw NotFoundException when report not found', async () => {
      mockPrismaService.reporte.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByReporter', () => {
    it('should return reports by reporter id', async () => {
      const mockReportes = [
        { id: 1, tipoEntidad: 'USUARIO', motivo: 'SPAM', estado: 'PENDIENTE', createdAt: new Date() },
        { id: 2, tipoEntidad: 'TUTORIA', motivo: 'ACOSO', estado: 'RESUELTO', createdAt: new Date() },
      ];
      mockPrismaService.reporte.findMany.mockResolvedValue(mockReportes);

      const result = await service.findByReporter('user-123');

      expect(result).toHaveLength(2);
      expect(mockPrismaService.reporte.findMany).toHaveBeenCalledWith({
        where: { reporterId: 'user-123' },
        orderBy: { createdAt: 'desc' },
        select: expect.objectContaining({
          id: true,
          tipoEntidad: true,
          motivo: true,
          estado: true,
        }),
      });
    });

    it('should return empty array when no reports found', async () => {
      mockPrismaService.reporte.findMany.mockResolvedValue([]);

      const result = await service.findByReporter('user-no-reports');

      expect(result).toEqual([]);
    });
  });
});
