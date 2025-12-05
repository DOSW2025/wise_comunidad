/**
 * Integration tests for ReportesController
 * These tests import real classes to ensure coverage
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ReportesController } from '../../src/reportes/reportes.controller';
import { ReportesService } from '../../src/reportes/reportes.service';
import { TipoEntidadReporte, MotivoReporte } from '../../src/reportes/dto/create-reporte.dto';

describe('ReportesController (Integration)', () => {
  let controller: ReportesController;
  let reportesService: ReportesService;

  // Mock data
  const mockReporte = {
    id: 1,
    reporterId: 'user-123',
    reportedUserId: 'user-456',
    tipoEntidad: TipoEntidadReporte.USUARIO,
    entidadId: 'user-456',
    motivo: MotivoReporte.CONTENIDO_SPAM,
    descripcion: 'Spam content that violates community guidelines',
    estado: 'PENDIENTE',
    createdAt: new Date(),
  };

  // Mock ReportesService
  const mockReportesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByReporter: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReportesController],
      providers: [
        {
          provide: ReportesService,
          useValue: mockReportesService,
        },
      ],
    }).compile();

    controller = module.get<ReportesController>(ReportesController);
    reportesService = module.get<ReportesService>(ReportesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createReporteDto = {
      tipoEntidad: TipoEntidadReporte.USUARIO,
      entidadId: 'user-456',
      reportedUserId: 'user-456',
      motivo: MotivoReporte.CONTENIDO_SPAM,
      descripcion: 'Spam content that violates community guidelines',
    };

    it('should create a report successfully', async () => {
      mockReportesService.create.mockResolvedValue({
        success: true,
        message: 'Reporte creado exitosamente',
        data: mockReporte,
      });

      const result = await controller.create(
        createReporteDto,
        'user-123',
        '127.0.0.1',
        'Test Browser',
      );

      expect(result.success).toBe(true);
      expect(mockReportesService.create).toHaveBeenCalledWith(
        'user-123',
        createReporteDto,
        { ipAddress: '127.0.0.1', userAgent: 'Test Browser' },
      );
    });

    it('should return error when user id is missing', async () => {
      const result = await controller.create(
        createReporteDto,
        '', // empty userId
        '127.0.0.1',
        'Test Browser',
      );

      expect(result.success).toBe(false);
      expect((result as any).statusCode).toBe(401);
      expect(mockReportesService.create).not.toHaveBeenCalled();
    });

    it('should return error when user id is undefined', async () => {
      const result = await controller.create(
        createReporteDto,
        undefined as any,
        '127.0.0.1',
        'Test Browser',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Usuario no autenticado');
    });

    it('should handle optional headers', async () => {
      mockReportesService.create.mockResolvedValue({
        success: true,
        message: 'Reporte creado',
        data: mockReporte,
      });

      await controller.create(createReporteDto, 'user-123');

      expect(mockReportesService.create).toHaveBeenCalledWith(
        'user-123',
        createReporteDto,
        { ipAddress: undefined, userAgent: undefined },
      );
    });
  });

  describe('findAll', () => {
    it('should return all reports with default pagination', async () => {
      mockReportesService.findAll.mockResolvedValue({
        data: [mockReporte],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      const result = await controller.findAll();

      expect(result.data).toHaveLength(1);
      expect(mockReportesService.findAll).toHaveBeenCalledWith({
        estado: undefined,
        tipoEntidad: undefined,
        page: 1,
        limit: 10,
      });
    });

    it('should filter by estado', async () => {
      mockReportesService.findAll.mockResolvedValue({
        data: [mockReporte],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await controller.findAll('PENDIENTE');

      expect(mockReportesService.findAll).toHaveBeenCalledWith({
        estado: 'PENDIENTE',
        tipoEntidad: undefined,
        page: 1,
        limit: 10,
      });
    });

    it('should filter by tipoEntidad', async () => {
      mockReportesService.findAll.mockResolvedValue({
        data: [mockReporte],
        meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
      });

      await controller.findAll(undefined, 'USUARIO');

      expect(mockReportesService.findAll).toHaveBeenCalledWith({
        estado: undefined,
        tipoEntidad: 'USUARIO',
        page: 1,
        limit: 10,
      });
    });

    it('should handle custom pagination', async () => {
      mockReportesService.findAll.mockResolvedValue({
        data: [],
        meta: { total: 50, page: 3, limit: 5, totalPages: 10 },
      });

      await controller.findAll(undefined, undefined, '3', '5');

      expect(mockReportesService.findAll).toHaveBeenCalledWith({
        estado: undefined,
        tipoEntidad: undefined,
        page: 3,
        limit: 5,
      });
    });

    it('should handle all filters together', async () => {
      mockReportesService.findAll.mockResolvedValue({
        data: [mockReporte],
        meta: { total: 1, page: 2, limit: 20, totalPages: 1 },
      });

      await controller.findAll('RESUELTO', 'TUTORIA', '2', '20');

      expect(mockReportesService.findAll).toHaveBeenCalledWith({
        estado: 'RESUELTO',
        tipoEntidad: 'TUTORIA',
        page: 2,
        limit: 20,
      });
    });
  });

  describe('findOne', () => {
    it('should return a report by id', async () => {
      mockReportesService.findOne.mockResolvedValue(mockReporte);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockReporte);
      expect(mockReportesService.findOne).toHaveBeenCalledWith(1);
    });

    it('should handle report not found', async () => {
      mockReportesService.findOne.mockRejectedValue(
        new Error('Reporte no encontrado'),
      );

      await expect(controller.findOne(999)).rejects.toThrow('Reporte no encontrado');
    });
  });

  describe('findByReporter', () => {
    it('should return reports by user id', async () => {
      const userReportes = [
        { id: 1, tipoEntidad: 'USUARIO', motivo: 'SPAM', estado: 'PENDIENTE' },
        { id: 2, tipoEntidad: 'TUTORIA', motivo: 'ACOSO', estado: 'RESUELTO' },
      ];
      mockReportesService.findByReporter.mockResolvedValue(userReportes);

      const result = await controller.findByReporter('user-123');

      expect(result).toHaveLength(2);
      expect(mockReportesService.findByReporter).toHaveBeenCalledWith('user-123');
    });

    it('should return empty array for user with no reports', async () => {
      mockReportesService.findByReporter.mockResolvedValue([]);

      const result = await controller.findByReporter('user-no-reports');

      expect(result).toEqual([]);
    });
  });
});
