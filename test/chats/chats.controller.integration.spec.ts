/**
 * Integration tests for ChatsController
 * These tests import real classes to ensure coverage
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ChatsController } from '../../src/chats/chats.controller';
import { ChatsService } from '../../src/chats/chats.service';

describe('ChatsController (Integration)', () => {
  let controller: ChatsController;
  let chatsService: ChatsService;

  // Mock data
  const mockUser = {
    id: 'user-123',
    email: 'test@test.com',
    rol: 'ESTUDIANTE',
  };

  const mockGroup = {
    id: 'group-123',
    nombre: 'Test Group',
    creadorId: 'user-123',
    createdAt: new Date(),
    updatedAt: new Date(),
    miembros: [{ id: 'user-123', nombre: 'Test', apellido: 'User' }],
  };

  const mockMessage = {
    id: 'msg-123',
    grupoId: 'group-123',
    usuarioId: 'user-123',
    contenido: 'Hello World',
    fechaCreacion: new Date(),
    usuario: { id: 'user-123', nombre: 'Test', apellido: 'User' },
  };

  // Mock ChatsService
  const mockChatsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    getMessages: jest.fn(),
    sendMessage: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChatsController],
      providers: [
        {
          provide: ChatsService,
          useValue: mockChatsService,
        },
      ],
    }).compile();

    controller = module.get<ChatsController>(ChatsController);
    chatsService = module.get<ChatsService>(ChatsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createGroupDto = {
      nombre: 'New Group',
      emails: ['member1@test.com', 'member2@test.com'],
    };

    it('should create a group successfully', async () => {
      mockChatsService.create.mockResolvedValue({
        success: true,
        message: 'Grupo creado correctamente',
        data: mockGroup,
      });

      const result = await controller.create(createGroupDto, mockUser);

      expect(result.success).toBe(true);
      expect(mockChatsService.create).toHaveBeenCalledWith(
        createGroupDto,
        mockUser.id,
      );
    });

    it('should handle service error', async () => {
      mockChatsService.create.mockRejectedValue(
        new Error('Error al crear grupo'),
      );

      await expect(controller.create(createGroupDto, mockUser)).rejects.toThrow(
        'Error al crear grupo',
      );
    });
  });

  describe('findAll', () => {
    it('should return all groups', async () => {
      const mockGroups = [mockGroup, { ...mockGroup, id: 'group-456' }];
      mockChatsService.findAll.mockResolvedValue(mockGroups);

      const result = await controller.findAll(mockUser.id);

      expect(result).toHaveLength(2);
      expect(mockChatsService.findAll).toHaveBeenCalled();
    });

    it('should return empty array when no groups', async () => {
      mockChatsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll(mockUser.id);

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a group by id', async () => {
      mockChatsService.findOne.mockResolvedValue(mockGroup);

      const result = await controller.findOne('group-123', mockUser);

      expect(result).toEqual(mockGroup);
      expect(mockChatsService.findOne).toHaveBeenCalledWith('group-123');
    });

    it('should handle group not found', async () => {
      mockChatsService.findOne.mockRejectedValue(
        new Error('Grupo no encontrado'),
      );

      await expect(controller.findOne('non-existent', mockUser)).rejects.toThrow(
        'Grupo no encontrado',
      );
    });
  });

  describe('getMessages', () => {
    it('should return messages for a group', async () => {
      const mockMessages = [mockMessage, { ...mockMessage, id: 'msg-456' }];
      mockChatsService.getMessages.mockResolvedValue(mockMessages);

      const result = await controller.getMessages('group-123', mockUser.id);

      expect(result).toHaveLength(2);
      expect(mockChatsService.getMessages).toHaveBeenCalledWith(
        'group-123',
        mockUser.id,
      );
    });

    it('should return empty array when no messages', async () => {
      mockChatsService.getMessages.mockResolvedValue([]);

      const result = await controller.getMessages('group-123', mockUser.id);

      expect(result).toEqual([]);
    });

    it('should handle unauthorized access', async () => {
      mockChatsService.getMessages.mockRejectedValue(
        new Error('No eres miembro de este grupo'),
      );

      await expect(
        controller.getMessages('group-123', 'other-user'),
      ).rejects.toThrow('No eres miembro de este grupo');
    });
  });

  describe('sendMessage', () => {
    it('should send a message successfully', async () => {
      mockChatsService.sendMessage.mockResolvedValue(mockMessage);

      const result = await controller.sendMessage(
        'group-123',
        { contenido: 'Hello World' },
        mockUser.id,
      );

      expect(result).toEqual(mockMessage);
      expect(mockChatsService.sendMessage).toHaveBeenCalledWith(
        { grupoId: 'group-123', contenido: 'Hello World' },
        mockUser.id,
      );
    });

    it('should handle empty message', async () => {
      mockChatsService.sendMessage.mockRejectedValue(
        new Error('El mensaje no puede estar vacío'),
      );

      await expect(
        controller.sendMessage('group-123', { contenido: '' }, mockUser.id),
      ).rejects.toThrow('El mensaje no puede estar vacío');
    });

    it('should handle unauthorized send', async () => {
      mockChatsService.sendMessage.mockRejectedValue(
        new Error('No eres miembro de este grupo'),
      );

      await expect(
        controller.sendMessage('group-123', { contenido: 'Hello' }, 'other-user'),
      ).rejects.toThrow('No eres miembro de este grupo');
    });
  });

  describe('remove', () => {
    it('should delete a group successfully', async () => {
      mockChatsService.remove.mockResolvedValue({
        success: true,
        message: 'Grupo eliminado correctamente',
      });

      const result = await controller.remove('group-123', mockUser);

      expect(result.success).toBe(true);
      expect(mockChatsService.remove).toHaveBeenCalledWith('group-123');
    });

    it('should handle group not found', async () => {
      mockChatsService.remove.mockRejectedValue(
        new Error('Grupo no encontrado'),
      );

      await expect(controller.remove('non-existent', mockUser)).rejects.toThrow(
        'Grupo no encontrado',
      );
    });

    it('should handle unauthorized delete', async () => {
      mockChatsService.remove.mockRejectedValue(
        new Error('No tienes permisos para eliminar este grupo'),
      );

      await expect(controller.remove('group-123', mockUser)).rejects.toThrow(
        'No tienes permisos para eliminar este grupo',
      );
    });
  });
});
