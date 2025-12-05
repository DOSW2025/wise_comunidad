/**
 * Integration tests for PrismaService
 * These tests import the real class to ensure coverage
 */
import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';

// Mock pg and @prisma/adapter-pg before importing PrismaService
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    end: jest.fn().mockResolvedValue(undefined),
  })),
}));

jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(function(this: any) {
    this.$connect = jest.fn().mockResolvedValue(undefined);
    this.$disconnect = jest.fn().mockResolvedValue(undefined);
    return this;
  }),
}));

// Now import the service after mocks are set up
import { PrismaService } from '../../src/prisma/prisma.service';

describe('PrismaService (Integration)', () => {
  let service: PrismaService;
  let loggerSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Spy on Logger methods
    loggerSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    loggerSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create pool and adapter', () => {
      const { Pool } = require('pg');
      const { PrismaPg } = require('@prisma/adapter-pg');

      expect(Pool).toHaveBeenCalled();
      expect(PrismaPg).toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('should connect to database successfully', async () => {
      (service as any).$connect = jest.fn().mockResolvedValue(undefined);

      await service.onModuleInit();

      expect((service as any).$connect).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Database connected successfully');
    });

    it('should throw error when connection fails', async () => {
      const error = new Error('Connection failed');
      (service as any).$connect = jest.fn().mockRejectedValue(error);

      await expect(service.onModuleInit()).rejects.toThrow('Connection failed');
      expect(loggerErrorSpy).toHaveBeenCalledWith(
        'Failed to connect to database',
        error,
      );
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect from database', async () => {
      (service as any).$disconnect = jest.fn().mockResolvedValue(undefined);
      (service as any).pool = { end: jest.fn().mockResolvedValue(undefined) };

      await service.onModuleDestroy();

      expect((service as any).$disconnect).toHaveBeenCalled();
      expect((service as any).pool.end).toHaveBeenCalled();
      expect(loggerSpy).toHaveBeenCalledWith('Database disconnected');
    });
  });
});
