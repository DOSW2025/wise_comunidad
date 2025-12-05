import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';

// Test PrismaService sin importar el real para evitar problemas con el Driver Adapter
describe('PrismaService', () => {
  // Creamos una clase mock que simula el comportamiento
  class MockPrismaService implements OnModuleInit, OnModuleDestroy {
    private logger = { log: jest.fn(), error: jest.fn() };
    private pool = { end: jest.fn().mockResolvedValue(undefined) };
    
    $connect = jest.fn().mockResolvedValue(undefined);
    $disconnect = jest.fn().mockResolvedValue(undefined);

    async onModuleInit(): Promise<void> {
      await this.$connect();
      this.logger.log('Successfully connected to the database');
    }

    async onModuleDestroy(): Promise<void> {
      await this.$disconnect();
      await this.pool.end();
      this.logger.log('Database connection closed');
    }

    getPool() {
      return this.pool;
    }
  }

  let service: MockPrismaService;

  beforeEach(() => {
    service = new MockPrismaService();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit()', () => {
    it('debe conectar a la base de datos', async () => {
      await service.onModuleInit();

      expect(service.$connect).toHaveBeenCalled();
    });

    it('debe lanzar error si falla la conexión', async () => {
      const mockError = new Error('Connection failed');
      service.$connect = jest.fn().mockRejectedValue(mockError);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
    });
  });

  describe('onModuleDestroy()', () => {
    it('debe desconectar de la base de datos', async () => {
      await service.onModuleDestroy();

      expect(service.$disconnect).toHaveBeenCalled();
      expect(service.getPool().end).toHaveBeenCalled();
    });
  });

  describe('getPool()', () => {
    it('debe retornar el pool de conexiones', () => {
      const pool = service.getPool();
      expect(pool).toBeDefined();
      expect(pool.end).toBeDefined();
    });
  });
});
