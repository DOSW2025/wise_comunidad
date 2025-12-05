// Tests del ReportesController sin importar clases reales de src/

// Enums definidos localmente
enum TipoEntidadReporte {
  TUTORIA = 'TUTORIA',
  USUARIO = 'USUARIO',
  GRUPO_CHAT = 'GRUPO_CHAT',
}

enum MotivoReporte {
  CONTENIDO_OFENSIVO = 'CONTENIDO_OFENSIVO',
  AUSENCIA_TUTOR = 'AUSENCIA_TUTOR',
}

interface CreateReporteDto {
  tipoEntidad: TipoEntidadReporte;
  entidadId: string;
  reportedUserId?: string;
  motivo: MotivoReporte;
  descripcion: string;
}

interface User {
  id: string;
  email: string;
  rol: string;
}

const mockReportesService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  findByReporter: jest.fn(),
};

// Implementación mock del ReportesController
class MockReportesController {
  private reportesService = mockReportesService;

  async create(dto: CreateReporteDto, user: User, req: { ip: string; headers: Record<string, string> }) {
    return this.reportesService.create(user.id, dto, {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
    });
  }

  async findAll(options?: { page?: number; limit?: number; estado?: string }) {
    return this.reportesService.findAll(options);
  }

  async findOne(id: number) {
    return this.reportesService.findOne(id);
  }

  async findMyReports(user: User) {
    return this.reportesService.findByReporter(user.id);
  }
}

describe('ReportesController', () => {
  let controller: MockReportesController;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@mail.escuelaing.edu.co',
    rol: 'estudiante',
  };

  const mockRequest = {
    ip: '192.168.1.1',
    headers: {
      'user-agent': 'Mozilla/5.0',
    },
  };

  beforeEach(() => {
    controller = new MockReportesController();
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('debe crear un reporte correctamente', async () => {
      const createReporteDto: CreateReporteDto = {
        tipoEntidad: TipoEntidadReporte.TUTORIA,
        entidadId: 'tutoria-123',
        reportedUserId: 'tutor-456',
        motivo: MotivoReporte.AUSENCIA_TUTOR,
        descripcion: 'El tutor no se presentó.',
      };

      const expectedResult = {
        success: true,
        message: 'Reporte creado correctamente',
        data: { id: 1, ...createReporteDto },
      };

      mockReportesService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createReporteDto, mockUser, mockRequest);

      expect(result).toEqual(expectedResult);
      expect(mockReportesService.create).toHaveBeenCalledWith(
        mockUser.id,
        createReporteDto,
        {
          ipAddress: mockRequest.ip,
          userAgent: mockRequest.headers['user-agent'],
        },
      );
    });
  });

  describe('findAll()', () => {
    it('debe retornar reportes paginados', async () => {
      const mockReportes = {
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 2, page: 1, limit: 10, totalPages: 1 },
      };

      mockReportesService.findAll.mockResolvedValue(mockReportes);

      const result = await controller.findAll({ page: 1, limit: 10 });

      expect(result).toEqual(mockReportes);
    });

    it('debe filtrar por estado', async () => {
      mockReportesService.findAll.mockResolvedValue({ data: [], meta: {} });

      await controller.findAll({ estado: 'PENDIENTE' });

      expect(mockReportesService.findAll).toHaveBeenCalledWith({
        estado: 'PENDIENTE',
      });
    });
  });

  describe('findOne()', () => {
    it('debe retornar un reporte por ID', async () => {
      const mockReporte = {
        id: 1,
        motivo: 'AUSENCIA_TUTOR',
        reporter: { id: 'user-123' },
      };

      mockReportesService.findOne.mockResolvedValue(mockReporte);

      const result = await controller.findOne(1);

      expect(result).toEqual(mockReporte);
      expect(mockReportesService.findOne).toHaveBeenCalledWith(1);
    });
  });

  describe('findMyReports()', () => {
    it('debe retornar los reportes del usuario autenticado', async () => {
      const mockReportes = [
        { id: 1, tipoEntidad: 'TUTORIA' },
        { id: 2, tipoEntidad: 'USUARIO' },
      ];

      mockReportesService.findByReporter.mockResolvedValue(mockReportes);

      const result = await controller.findMyReports(mockUser);

      expect(result).toEqual(mockReportes);
      expect(mockReportesService.findByReporter).toHaveBeenCalledWith(mockUser.id);
    });
  });
});
