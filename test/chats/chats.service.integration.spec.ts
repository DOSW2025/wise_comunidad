// Tests del ChatsService con imports reales
import { Test, TestingModule } from '@nestjs/testing';
import { ChatsService } from 'src/chats/chats.service';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

describe('ChatsService (Integración)', () => {
  let service: ChatsService;
  let prisma: PrismaService;

  // Mock de PrismaService
  const mockPrismaService = {
    usuarios: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    grupoChat: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    miembroGrupoChat: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      createMany: jest.fn(),
    },
    mensajeChat: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ChatsService>(ChatsService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('create()', () => {
    it('debe rechazar nombre vacío', async () => {
      await expect(
        service.create({ nombre: '', emails: [] }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar nombre con espacios', async () => {
      await expect(
        service.create({ nombre: '   ', emails: [] }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar nombre mayor a 30 caracteres', async () => {
      await expect(
        service.create({ nombre: 'A'.repeat(31), emails: [] }, 'user-1'),
      ).rejects.toThrow('no puede superar los 30 caracteres');
    });

    it('debe rechazar si ya existe grupo con mismo nombre', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-existente' });

      await expect(
        service.create({ nombre: 'Grupo Existente', emails: [] }, 'user-1'),
      ).rejects.toThrow(ConflictException);
    });

    it('debe rechazar si emails no existen', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(null);

      await expect(
        service.create({ nombre: 'Grupo Nuevo', emails: ['noexiste@mail.edu.co'] }, 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('debe crear grupo exitosamente', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);
      mockPrismaService.usuarios.findUnique.mockResolvedValue({ email: 'user@mail.edu.co' });
      mockPrismaService.usuarios.findMany.mockResolvedValue([{ id: 'user-2', email: 'user@mail.edu.co' }]);
      mockPrismaService.$transaction.mockImplementation(async (callback) => {
        return callback({
          grupoChat: {
            create: jest.fn().mockResolvedValue({ id: 'nuevo-grupo', nombre: 'Grupo Nuevo' }),
            findUnique: jest.fn().mockResolvedValue({
              id: 'nuevo-grupo',
              nombre: 'Grupo Nuevo',
              miembros: [{ usuario: { id: 'user-1' } }],
            }),
          },
          miembroGrupoChat: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        });
      });

      const result = await service.create(
        { nombre: 'Grupo Nuevo', emails: ['user@mail.edu.co'] },
        'user-1',
      );

      expect(result.success).toBe(true);
      expect(result.message).toBe('Grupo creado correctamente');
    });
  });

  describe('findAll()', () => {
    it('debe retornar todos los grupos', async () => {
      const mockGrupos = [
        { id: 'grupo-1', nombre: 'Grupo 1', miembros: [] },
        { id: 'grupo-2', nombre: 'Grupo 2', miembros: [] },
      ];
      mockPrismaService.grupoChat.findMany.mockResolvedValue(mockGrupos);

      const result = await service.findAll();

      expect(result).toHaveLength(2);
      expect(mockPrismaService.grupoChat.findMany).toHaveBeenCalled();
    });

    it('debe retornar array vacío si no hay grupos', async () => {
      mockPrismaService.grupoChat.findMany.mockResolvedValue([]);

      const result = await service.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne()', () => {
    it('debe retornar grupo por ID', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({
        id: 'grupo-123',
        nombre: 'Grupo Test',
        miembros: [],
        mensajes: [],
      });

      const result = await service.findOne('grupo-123');

      expect(result.id).toBe('grupo-123');
    });

    it('debe lanzar error si grupo no existe', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);

      await expect(service.findOne('no-existe')).rejects.toThrow(BadRequestException);
    });
  });

  describe('remove()', () => {
    it('debe eliminar grupo exitosamente', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-123' });
      mockPrismaService.grupoChat.delete.mockResolvedValue({});

      const result = await service.remove('grupo-123');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Grupo eliminado correctamente');
    });

    it('debe lanzar error si grupo no existe', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);

      await expect(service.remove('no-existe')).rejects.toThrow(BadRequestException);
    });
  });

  describe('validateMembership()', () => {
    it('debe pasar si usuario es miembro', async () => {
      mockPrismaService.miembroGrupoChat.findUnique.mockResolvedValue({ id: 'member-1' });

      await expect(service.validateMembership('grupo-123', 'user-1')).resolves.not.toThrow();
    });

    it('debe lanzar error si no es miembro', async () => {
      mockPrismaService.miembroGrupoChat.findUnique.mockResolvedValue(null);
      mockPrismaService.miembroGrupoChat.findMany.mockResolvedValue([]);

      await expect(
        service.validateMembership('grupo-123', 'user-extraño'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('sendMessage()', () => {
    it('debe crear mensaje exitosamente', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-123' });
      mockPrismaService.miembroGrupoChat.findUnique.mockResolvedValue({ id: 'member-1' });
      mockPrismaService.mensajeChat.create.mockResolvedValue({
        id: 'msg-1',
        grupoId: 'grupo-123',
        contenido: 'Hola!',
        usuario: { id: 'user-1', nombre: 'Test' },
      });

      const result = await service.sendMessage(
        { grupoId: 'grupo-123', contenido: 'Hola!' },
        'user-1',
      );

      expect(result.id).toBe('msg-1');
      expect(result.contenido).toBe('Hola!');
    });

    it('debe rechazar si grupo no existe', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);

      await expect(
        service.sendMessage({ grupoId: 'no-existe', contenido: 'Hola' }, 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si no es miembro', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-123' });
      mockPrismaService.miembroGrupoChat.findUnique.mockResolvedValue(null);
      mockPrismaService.miembroGrupoChat.findMany.mockResolvedValue([]);

      await expect(
        service.sendMessage({ grupoId: 'grupo-123', contenido: 'Hola' }, 'user-extraño'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getMessages()', () => {
    it('debe retornar mensajes del grupo', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-123' });
      mockPrismaService.miembroGrupoChat.findUnique.mockResolvedValue({ id: 'member-1' });
      mockPrismaService.mensajeChat.findMany.mockResolvedValue([
        { id: 'msg-1', contenido: 'Hola' },
        { id: 'msg-2', contenido: 'Mundo' },
      ]);

      const result = await service.getMessages('grupo-123', 'user-1');

      expect(result).toHaveLength(2);
    });

    it('debe rechazar si grupo no existe', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue(null);

      await expect(
        service.getMessages('no-existe', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('debe rechazar si no es miembro', async () => {
      mockPrismaService.grupoChat.findUnique.mockResolvedValue({ id: 'grupo-123' });
      mockPrismaService.miembroGrupoChat.findUnique.mockResolvedValue(null);
      mockPrismaService.miembroGrupoChat.findMany.mockResolvedValue([]);

      await expect(
        service.getMessages('grupo-123', 'user-extraño'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
