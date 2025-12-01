import { Test, TestingModule } from '@nestjs/testing';
import { ReportesService } from './reportes.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  CreateReporteDto,
  MotivoReporte,
  TipoEntidadReporte,
} from './dto/create-reporte.dto';

describe('ReportesService', () => {
  let service: ReportesService;
  let prisma: PrismaService;

  // Mock de PrismaService
  const mockPrismaService = {
    usuarios: {
      findUnique: jest.fn(),
    },
    tutoria: {
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
    descripcion:
      'El tutor no se presentó a la sesión programada para hoy a las 10am sin previo aviso.',
  };

  beforeEach(async () => {
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
    prisma = module.get<PrismaService>(PrismaService);

    // Reset mocks
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

        await expect(
          service.create('usuario-inexistente', validReporteDto),
        ).rejects.toThrow('Usuario no autenticado o no válido');
      });

      it('debe aceptar un usuario válido existente', async () => {
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter) // reporter
          .mockResolvedValueOnce(mockReportedUser); // reported user
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);
        mockPrismaService.reporte.findFirst.mockResolvedValue(null);
        mockPrismaService.reporte.create.mockResolvedValue({
          id: 1,
          ...validReporteDto,
          reporterId: 'reporter-123',
          estado: 'PENDIENTE',
          createdAt: new Date(),
          reporter: mockReporter,
          reportedUser: mockReportedUser,
        });
        mockPrismaService.audit_log.create.mockResolvedValue({});

        const result = await service.create('reporter-123', validReporteDto);

        expect(result.success).toBe(true);
        expect(mockPrismaService.usuarios.findUnique).toHaveBeenCalledWith({
          where: { id: 'reporter-123' },
        });
      });
    });

    describe('Validación de contenido válido (entidad reportada)', () => {
      it('debe rechazar si la tutoría reportada no existe', async () => {
        jest.clearAllMocks();
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(null);

        await expect(
          service.create('reporter-123', validReporteDto),
        ).rejects.toThrow(NotFoundException);
      });

      it('debe aceptar si la tutoría reportada existe', async () => {
        jest.clearAllMocks();
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
        expect(mockPrismaService.tutoria.findUnique).toHaveBeenCalledWith({
          where: { id_tutoria: 'tutoria-789' },
        });
      });

      it('debe rechazar si el usuario reportado no existe', async () => {
        jest.clearAllMocks();
        // El servicio llama findUnique 2 veces: 1) reporter, 2) reportedUser
        mockPrismaService.usuarios.findUnique
          .mockImplementation((args: { where: { id: string } }) => {
            if (args.where.id === 'reporter-123') return Promise.resolve(mockReporter);
            if (args.where.id === 'tutor-456') return Promise.resolve(null); // no existe
            return Promise.resolve(null);
          });
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);

        await expect(
          service.create('reporter-123', validReporteDto),
        ).rejects.toThrow('El usuario reportado no existe');
      });
    });

    describe('Validación de auto-reporte', () => {
      it('debe rechazar si el usuario intenta reportarse a sí mismo', async () => {
        jest.clearAllMocks();
        // Ambas llamadas retornan el mismo usuario
        mockPrismaService.usuarios.findUnique.mockResolvedValue(mockReporter);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);

        const selfReportDto: CreateReporteDto = {
          ...validReporteDto,
          reportedUserId: 'reporter-123', // mismo que el reporter
        };

        await expect(
          service.create('reporter-123', selfReportDto),
        ).rejects.toThrow('No puedes reportarte a ti mismo');
      });
    });

    describe('Validación de reportes duplicados', () => {
      it('debe rechazar si ya existe un reporte pendiente para la misma entidad', async () => {
        jest.clearAllMocks();
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);
        mockPrismaService.reporte.findFirst.mockResolvedValue({
          id: 99,
          estado: 'PENDIENTE',
        });

        await expect(
          service.create('reporter-123', validReporteDto),
        ).rejects.toThrow('Ya existe un reporte pendiente');
      });

      it('debe permitir crear reporte si no hay duplicados pendientes', async () => {
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

    describe('Creación exitosa del reporte', () => {
      beforeEach(() => {
        mockPrismaService.usuarios.findUnique
          .mockResolvedValueOnce(mockReporter)
          .mockResolvedValueOnce(mockReportedUser);
        mockPrismaService.tutoria.findUnique.mockResolvedValue(mockTutoria);
        mockPrismaService.reporte.findFirst.mockResolvedValue(null);
      });

      it('debe crear el reporte correctamente', async () => {
        const createdReporte = {
          id: 1,
          reporterId: 'reporter-123',
          reportedUserId: 'tutor-456',
          tipoEntidad: TipoEntidadReporte.TUTORIA,
          entidadId: 'tutoria-789',
          motivo: MotivoReporte.AUSENCIA_TUTOR,
          descripcion: validReporteDto.descripcion,
          estado: 'PENDIENTE',
          createdAt: new Date(),
          reporter: mockReporter,
          reportedUser: mockReportedUser,
        };

        mockPrismaService.reporte.create.mockResolvedValue(createdReporte);
        mockPrismaService.audit_log.create.mockResolvedValue({});

        const result = await service.create('reporter-123', validReporteDto);

        expect(result.success).toBe(true);
        expect(result.message).toContain('creado exitosamente');
        expect(result.data.id).toBe(1);
        expect(result.data.estado).toBe('PENDIENTE');
      });

      it('debe registrar el log de auditoría (RB-02)', async () => {
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
            entidad: 'reporte',
            ipAddress: '192.168.1.1',
            userAgent: 'Mozilla/5.0',
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
      expect(result.meta.page).toBe(1);
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
  });

  describe('findOne() - Obtener reporte por ID', () => {
    it('debe retornar el reporte si existe', async () => {
      mockPrismaService.reporte.findUnique.mockResolvedValue({
        id: 1,
        motivo: 'AUSENCIA_TUTOR',
      });

      const result = await service.findOne(1);

      expect(result.id).toBe(1);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockPrismaService.reporte.findUnique.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
