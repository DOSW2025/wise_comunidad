import { Test, TestingModule } from '@nestjs/testing';
import { ChatsModule } from '../../src/chats/chats.module';
import { PrismaModule } from '../../src/prisma/prisma.module';
import { AuthModule } from '../../src/auth/auth.module';
import { ChatsService } from '../../src/chats/chats.service';
import { ChatsController } from '../../src/chats/chats.controller';
import { ChatsGateway } from '../../src/chats/chats.gateway';

// Mock de PrismaService
jest.mock('../../src/prisma/prisma.service', () => ({
  PrismaService: jest.fn().mockImplementation(() => ({
    $connect: jest.fn(),
    $disconnect: jest.fn(),
    usuarios: { findUnique: jest.fn(), findMany: jest.fn() },
    grupoChat: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn() },
    miembroGrupoChat: { findUnique: jest.fn(), findMany: jest.fn() },
    mensajeChat: { create: jest.fn(), findMany: jest.fn() },
  })),
}));

// Mock de envs
jest.mock('../../src/config', () => ({
  envs: {
    jwtSecret: 'test-secret',
    port: 3000,
    databaseurl: 'postgresql://test:test@localhost:5432/test',
  },
}));

describe('ChatsModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ChatsModule],
    })
      .overrideProvider('PrismaService')
      .useValue({
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();
  });

  it('debe compilar el módulo', () => {
    expect(module).toBeDefined();
  });

  it('debe proveer ChatsService', () => {
    const service = module.get<ChatsService>(ChatsService);
    expect(service).toBeDefined();
  });

  it('debe proveer ChatsController', () => {
    const controller = module.get<ChatsController>(ChatsController);
    expect(controller).toBeDefined();
  });

  it('debe proveer ChatsGateway', () => {
    const gateway = module.get<ChatsGateway>(ChatsGateway);
    expect(gateway).toBeDefined();
  });
});
