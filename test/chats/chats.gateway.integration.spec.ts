/**
 * Integration tests for ChatsGateway
 * These tests import real classes to ensure coverage
 */
import { Test, TestingModule } from '@nestjs/testing';
import { ChatsGateway } from '../../src/chats/chats.gateway';
import { ChatsService } from '../../src/chats/chats.service';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

describe('ChatsGateway (Integration)', () => {
  let gateway: ChatsGateway;
  let chatsService: ChatsService;
  let jwtService: JwtService;

  // Mock socket
  const createMockSocket = (data: any = {}): Partial<Socket> => ({
    id: 'socket-123',
    data: { userId: 'user-123', email: 'test@test.com', rol: 'ESTUDIANTE', ...data },
    handshake: {
      auth: { token: 'valid-token' },
      query: {},
    } as any,
    rooms: new Set(['socket-123']),
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  });

  // Mock server
  const mockServer = {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
  };

  // Mock ChatsService
  const mockChatsService = {
    validateMembership: jest.fn(),
    sendMessage: jest.fn(),
    getMessages: jest.fn(),
  };

  // Mock JwtService
  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatsGateway,
        {
          provide: ChatsService,
          useValue: mockChatsService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    gateway = module.get<ChatsGateway>(ChatsGateway);
    chatsService = module.get<ChatsService>(ChatsService);
    jwtService = module.get<JwtService>(JwtService);

    // Inject mock server
    gateway.server = mockServer as any;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit', () => {
    it('should log initialization message', () => {
      const mockServerInit = {} as Server;
      
      // Should not throw
      expect(() => gateway.afterInit(mockServerInit)).not.toThrow();
    });
  });

  describe('handleConnection', () => {
    it('should authenticate user with valid token', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        email: 'test@test.com',
        rol: 'ESTUDIANTE',
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(mockSocket.data.userId).toBe('user-123');
    });

    it('should disconnect client without token', async () => {
      const mockSocket = createMockSocket();
      mockSocket.handshake = { auth: {}, query: {} } as any;

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client with invalid token', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should disconnect client with token missing sub claim', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockResolvedValue({ email: 'test@test.com' }); // no sub

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should use token from query if not in auth', async () => {
      const mockSocket = createMockSocket();
      mockSocket.handshake = {
        auth: {},
        query: { token: 'query-token' },
      } as any;
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        email: 'test@test.com',
        rol: 'ESTUDIANTE',
      });

      await gateway.handleConnection(mockSocket as Socket);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('query-token');
    });
  });

  describe('handleDisconnect', () => {
    it('should handle disconnect for authenticated user', () => {
      const mockSocket = createMockSocket();

      // Should not throw
      expect(() => gateway.handleDisconnect(mockSocket as Socket)).not.toThrow();
    });

    it('should handle disconnect for unauthenticated user', () => {
      const mockSocket = createMockSocket({ userId: undefined, email: undefined });

      // Should not throw
      expect(() => gateway.handleDisconnect(mockSocket as Socket)).not.toThrow();
    });
  });

  describe('handleJoinGroup', () => {
    it('should join group with object payload', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      const result = await gateway.handleJoinGroup(
        mockSocket as Socket,
        { grupoId: 'group-123' },
      );

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('group-123');
      expect(mockChatsService.validateMembership).toHaveBeenCalledWith(
        'group-123',
        'user-123',
      );
    });

    it('should join group with string payload (JSON)', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      const result = await gateway.handleJoinGroup(
        mockSocket as Socket,
        JSON.stringify({ grupoId: 'group-123' }),
      );

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('group-123');
    });

    it('should join group with string payload (direct ID)', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      const result = await gateway.handleJoinGroup(
        mockSocket as Socket,
        'group-123',
      );

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('group-123');
    });

    it('should fail when user is not a member', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockRejectedValue(
        new Error('No eres miembro de este grupo'),
      );

      const result = await gateway.handleJoinGroup(
        mockSocket as Socket,
        { grupoId: 'group-123' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No eres miembro de este grupo');
    });

    it('should notify other members when user joins', async () => {
      const mockSocket = createMockSocket();
      mockSocket.to = jest.fn().mockReturnValue({ emit: jest.fn() });
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      await gateway.handleJoinGroup(mockSocket as Socket, { grupoId: 'group-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('group-123');
    });
  });

  describe('handleLeaveGroup', () => {
    it('should leave group with object payload', async () => {
      const mockSocket = createMockSocket();
      mockSocket.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      const result = await gateway.handleLeaveGroup(
        mockSocket as Socket,
        { grupoId: 'group-123' },
      );

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('group-123');
    });

    it('should leave group with string payload (JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      const result = await gateway.handleLeaveGroup(
        mockSocket as Socket,
        JSON.stringify({ grupoId: 'group-123' }),
      );

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('group-123');
    });

    it('should leave group with string payload (direct ID)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.to = jest.fn().mockReturnValue({ emit: jest.fn() });

      const result = await gateway.handleLeaveGroup(
        mockSocket as Socket,
        'group-123',
      );

      expect(result.success).toBe(true);
    });

    it('should notify other members when user leaves', async () => {
      const mockSocket = createMockSocket();
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleLeaveGroup(mockSocket as Socket, { grupoId: 'group-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('group-123');
      expect(emitMock).toHaveBeenCalledWith('userLeft', expect.any(Object));
    });
  });

  describe('handleSendMessage', () => {
    const mockMessage = {
      id: 'msg-123',
      grupoId: 'group-123',
      contenido: 'Hello World',
      fechaCreacion: new Date(),
      usuario: {
        id: 'user-123',
        nombre: 'Test',
        apellido: 'User',
        email: 'test@test.com',
        avatar_url: null,
      },
    };

    it('should send message with object payload', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      mockChatsService.sendMessage.mockResolvedValue(mockMessage);

      const result = await gateway.handleSendMessage(
        mockSocket as Socket,
        { grupoId: 'group-123', contenido: 'Hello World' },
      );

      expect(result.success).toBe(true);
      expect(mockChatsService.sendMessage).toHaveBeenCalledWith(
        { grupoId: 'group-123', contenido: 'Hello World' },
        'user-123',
      );
    });

    it('should send message with string payload (JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      mockChatsService.sendMessage.mockResolvedValue(mockMessage);

      const result = await gateway.handleSendMessage(
        mockSocket as Socket,
        JSON.stringify({ grupoId: 'group-123', contenido: 'Hello' }),
      );

      expect(result.success).toBe(true);
    });

    it('should fail when user is not in room', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123']); // Not in group-123

      const result = await gateway.handleSendMessage(
        mockSocket as Socket,
        { grupoId: 'group-123', contenido: 'Hello' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Debes unirte al grupo');
    });

    it('should fail with invalid JSON payload', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);

      const result = await gateway.handleSendMessage(
        mockSocket as Socket,
        'invalid-json-{',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Formato de payload inválido');
    });

    it('should broadcast message to all room members', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      mockChatsService.sendMessage.mockResolvedValue(mockMessage);

      await gateway.handleSendMessage(
        mockSocket as Socket,
        { grupoId: 'group-123', contenido: 'Hello' },
      );

      expect(mockServer.to).toHaveBeenCalledWith('group-123');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', expect.any(Object));
    });

    it('should handle service error', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      mockChatsService.sendMessage.mockRejectedValue(
        new Error('Error al enviar mensaje'),
      );

      const result = await gateway.handleSendMessage(
        mockSocket as Socket,
        { grupoId: 'group-123', contenido: 'Hello' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error al enviar mensaje');
    });
  });

  describe('handleTyping', () => {
    it('should emit typing event with object payload', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleTyping(mockSocket as Socket, { grupoId: 'group-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('group-123');
      expect(emitMock).toHaveBeenCalledWith('userTyping', expect.any(Object));
    });

    it('should emit typing event with string payload (JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleTyping(
        mockSocket as Socket,
        JSON.stringify({ grupoId: 'group-123' }),
      );

      expect(emitMock).toHaveBeenCalledWith('userTyping', expect.any(Object));
    });

    it('should emit typing event with string payload (direct ID)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleTyping(mockSocket as Socket, 'group-123');

      expect(emitMock).toHaveBeenCalledWith('userTyping', expect.any(Object));
    });

    it('should not emit if user is not in room', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123']); // Not in group-123
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleTyping(mockSocket as Socket, { grupoId: 'group-123' });

      expect(emitMock).not.toHaveBeenCalled();
    });
  });

  describe('handleStopTyping', () => {
    it('should emit stop typing event with object payload', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleStopTyping(mockSocket as Socket, { grupoId: 'group-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('group-123');
      expect(emitMock).toHaveBeenCalledWith('userStoppedTyping', expect.any(Object));
    });

    it('should emit stop typing event with string payload (JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleStopTyping(
        mockSocket as Socket,
        JSON.stringify({ grupoId: 'group-123' }),
      );

      expect(emitMock).toHaveBeenCalledWith('userStoppedTyping', expect.any(Object));
    });

    it('should emit stop typing event with string payload (direct ID)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123', 'group-123']);
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleStopTyping(mockSocket as Socket, 'group-123');

      expect(emitMock).toHaveBeenCalledWith('userStoppedTyping', expect.any(Object));
    });

    it('should not emit if user is not in room', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123']); // Not in group-123
      const emitMock = jest.fn();
      mockSocket.to = jest.fn().mockReturnValue({ emit: emitMock });

      await gateway.handleStopTyping(mockSocket as Socket, { grupoId: 'group-123' });

      expect(emitMock).not.toHaveBeenCalled();
    });
  });
});
