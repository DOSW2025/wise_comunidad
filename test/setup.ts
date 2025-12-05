// Setup file para tests de Jest
// Configura variables de entorno antes de que los módulos se carguen

process.env.PORT = '3000';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing';

// Mock global de @prisma/client
jest.mock('@prisma/client', () => {
  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    $connect: jest.fn().mockResolvedValue(undefined),
    $disconnect: jest.fn().mockResolvedValue(undefined),
    usuarios: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    grupoChat: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    miembroGrupoChat: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
      delete: jest.fn(),
    },
    mensajeChat: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    tutoria: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    reporte: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
    },
    audit_log: {
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({
      grupoChat: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
      miembroGrupoChat: {
        createMany: jest.fn(),
      },
    })),
  }));

  return {
    PrismaClient: mockPrismaClient,
  };
});

// Mock de @prisma/adapter-pg
jest.mock('@prisma/adapter-pg', () => ({
  PrismaPg: jest.fn().mockImplementation(() => ({})),
}));

// Mock de pg Pool
jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    end: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
  })),
}));

// Mock de envs para evitar errores de validación
jest.mock('../src/config/envs', () => ({
  envs: {
    port: 3000,
    databaseurl: 'postgresql://test:test@localhost:5432/test_db',
    jwtSecret: 'test-jwt-secret-key-for-testing',
  },
}));
