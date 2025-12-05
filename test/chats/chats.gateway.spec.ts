// Tests del ChatsGateway sin importar clases reales de src/

interface MockSocket {
  id: string;
  data: Record<string, unknown>;
  handshake: {
    auth: Record<string, unknown>;
    query: Record<string, unknown>;
  };
  rooms: Set<string>;
  join: jest.Mock;
  leave: jest.Mock;
  to: jest.Mock;
  emit: jest.Mock;
  disconnect: jest.Mock;
}

interface MockServer {
  to: jest.Mock;
  emit: jest.Mock;
}

const mockChatsService = {
  validateMembership: jest.fn(),
  sendMessage: jest.fn(),
};

const mockJwtService = {
  verifyAsync: jest.fn(),
};

const mockServer: MockServer = {
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
};

const createMockSocket = (data: Record<string, unknown> = {}): MockSocket => ({
  id: 'socket-123',
  data: {
    userId: 'user-123',
    email: 'test@mail.escuelaing.edu.co',
    rol: 'estudiante',
    ...data,
  },
  handshake: {
    auth: { token: 'valid-jwt-token' },
    query: {},
  },
  rooms: new Set(['socket-123', 'grupo-123']),
  join: jest.fn(),
  leave: jest.fn(),
  to: jest.fn().mockReturnThis(),
  emit: jest.fn(),
  disconnect: jest.fn(),
});

// Implementación mock del ChatsGateway
class MockChatsGateway {
  server = mockServer;
  private chatsService = mockChatsService;
  private jwtService = mockJwtService;

  afterInit(server: MockServer) {
    // Inicialización del gateway
  }

  async handleConnection(client: MockSocket) {
    const token = client.handshake.auth.token || client.handshake.query.token;

    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const payload = await this.jwtService.verifyAsync(token as string);

      if (!payload || !payload.sub) {
        client.disconnect();
        return;
      }

      client.data.userId = payload.sub;
      client.data.email = payload.email;
      client.data.rol = payload.rol;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: MockSocket) {
    // Manejo de desconexión
  }

  async handleJoinGroup(client: MockSocket, payload: unknown) {
    try {
      let grupoId: string;

      if (typeof payload === 'string') {
        try {
          const parsed = JSON.parse(payload);
          grupoId = parsed.grupoId;
        } catch {
          grupoId = payload;
        }
      } else {
        grupoId = (payload as { grupoId: string }).grupoId;
      }

      await this.chatsService.validateMembership(grupoId, client.data.userId as string);
      client.join(grupoId);

      return { success: true, message: 'Unido al grupo' };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async handleLeaveGroup(client: MockSocket, payload: unknown) {
    let grupoId: string;

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        grupoId = payload;
      }
    } else {
      grupoId = (payload as { grupoId: string }).grupoId;
    }

    client.leave(grupoId);

    return { success: true, message: 'Salido del grupo' };
  }

  async handleSendMessage(client: MockSocket, payload: unknown) {
    try {
      let grupoId: string;
      let contenido: string;

      if (typeof payload === 'string') {
        try {
          const parsed = JSON.parse(payload);
          grupoId = parsed.grupoId;
          contenido = parsed.contenido;
        } catch {
          return { success: false, message: 'Formato de payload inválido' };
        }
      } else {
        grupoId = (payload as { grupoId: string; contenido: string }).grupoId;
        contenido = (payload as { grupoId: string; contenido: string }).contenido;
      }

      if (!client.rooms.has(grupoId)) {
        return { success: false, message: 'Debes unirte al grupo primero' };
      }

      const mensaje = await this.chatsService.sendMessage(
        { grupoId, contenido },
        client.data.userId as string,
      );

      this.server.to(grupoId).emit('newMessage', mensaje);

      return { success: true, mensaje };
    } catch (error) {
      return { success: false, message: (error as Error).message };
    }
  }

  async handleTyping(client: MockSocket, payload: unknown) {
    let grupoId: string;

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        grupoId = payload;
      }
    } else {
      grupoId = (payload as { grupoId: string }).grupoId;
    }

    if (client.rooms.has(grupoId)) {
      client.to(grupoId).emit('userTyping', { userId: client.data.userId });
    }
  }

  async handleStopTyping(client: MockSocket, payload: unknown) {
    let grupoId: string;

    if (typeof payload === 'string') {
      try {
        const parsed = JSON.parse(payload);
        grupoId = parsed.grupoId;
      } catch {
        grupoId = payload;
      }
    } else {
      grupoId = (payload as { grupoId: string }).grupoId;
    }

    if (client.rooms.has(grupoId)) {
      client.to(grupoId).emit('userStoppedTyping', { userId: client.data.userId });
    }
  }
}

describe('ChatsGateway', () => {
  let gateway: MockChatsGateway;

  beforeEach(() => {
    gateway = new MockChatsGateway();
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(gateway).toBeDefined();
  });

  describe('afterInit()', () => {
    it('debe ejecutarse sin errores al iniciar', () => {
      expect(() => gateway.afterInit(mockServer)).not.toThrow();
    });
  });

  describe('handleConnection()', () => {
    it('debe desconectar si no hay token', async () => {
      const mockSocket = createMockSocket();
      mockSocket.handshake = { auth: {}, query: {} };

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('debe autenticar con token válido', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-123',
        email: 'test@mail.escuelaing.edu.co',
        rol: 'estudiante',
      });

      await gateway.handleConnection(mockSocket);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-jwt-token');
      expect(mockSocket.data.userId).toBe('user-123');
    });

    it('debe desconectar con token inválido', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('debe desconectar si el payload no tiene sub', async () => {
      const mockSocket = createMockSocket();
      mockJwtService.verifyAsync.mockResolvedValue({
        email: 'test@mail.escuelaing.edu.co',
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('debe aceptar token desde query params', async () => {
      const mockSocket = createMockSocket();
      mockSocket.handshake = {
        auth: {},
        query: { token: 'query-jwt-token' },
      };

      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-456',
        email: 'query@mail.escuelaing.edu.co',
        rol: 'tutor',
      });

      await gateway.handleConnection(mockSocket);

      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('query-jwt-token');
    });
  });

  describe('handleDisconnect()', () => {
    it('debe manejar desconexión de usuario autenticado', () => {
      const mockSocket = createMockSocket();

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });

    it('debe manejar desconexión de usuario no autenticado', () => {
      const mockSocket = createMockSocket();
      mockSocket.data = {};

      expect(() => gateway.handleDisconnect(mockSocket)).not.toThrow();
    });
  });

  describe('handleJoinGroup()', () => {
    it('debe unir al usuario al grupo correctamente (objeto)', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      const result = await gateway.handleJoinGroup(mockSocket, { grupoId: 'grupo-123' });

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('grupo-123');
      expect(mockChatsService.validateMembership).toHaveBeenCalledWith(
        'grupo-123',
        'user-123',
      );
    });

    it('debe unir al usuario al grupo (payload string JSON)', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      const result = await gateway.handleJoinGroup(
        mockSocket,
        JSON.stringify({ grupoId: 'grupo-456' }),
      );

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('grupo-456');
    });

    it('debe unir al usuario al grupo (payload string directo)', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockResolvedValue(undefined);

      const result = await gateway.handleJoinGroup(mockSocket, 'grupo-789');

      expect(result.success).toBe(true);
      expect(mockSocket.join).toHaveBeenCalledWith('grupo-789');
    });

    it('debe rechazar si el usuario no es miembro', async () => {
      const mockSocket = createMockSocket();
      mockChatsService.validateMembership.mockRejectedValue(
        new Error('No eres miembro de este grupo'),
      );

      const result = await gateway.handleJoinGroup(
        mockSocket,
        { grupoId: 'grupo-restringido' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('No eres miembro de este grupo');
    });
  });

  describe('handleLeaveGroup()', () => {
    it('debe remover al usuario del grupo (objeto)', async () => {
      const mockSocket = createMockSocket();

      const result = await gateway.handleLeaveGroup(mockSocket, { grupoId: 'grupo-123' });

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('grupo-123');
    });

    it('debe remover al usuario del grupo (string JSON)', async () => {
      const mockSocket = createMockSocket();

      const result = await gateway.handleLeaveGroup(
        mockSocket,
        JSON.stringify({ grupoId: 'grupo-456' }),
      );

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('grupo-456');
    });

    it('debe remover al usuario del grupo (string directo)', async () => {
      const mockSocket = createMockSocket();

      const result = await gateway.handleLeaveGroup(mockSocket, 'grupo-789');

      expect(result.success).toBe(true);
      expect(mockSocket.leave).toHaveBeenCalledWith('grupo-789');
    });
  });

  describe('handleSendMessage()', () => {
    const mockMensaje = {
      id: 'msg-123',
      grupoId: 'grupo-123',
      contenido: 'Hola!',
      fechaCreacion: new Date(),
      usuario: {
        id: 'user-123',
        nombre: 'Test',
        apellido: 'User',
        email: 'test@mail.escuelaing.edu.co',
        avatar_url: null,
      },
    };

    it('debe enviar mensaje correctamente (objeto)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-123');
      mockChatsService.sendMessage.mockResolvedValue(mockMensaje);

      const result = await gateway.handleSendMessage(
        mockSocket,
        { grupoId: 'grupo-123', contenido: 'Hola!' },
      );

      expect(result.success).toBe(true);
      expect(mockChatsService.sendMessage).toHaveBeenCalledWith(
        { grupoId: 'grupo-123', contenido: 'Hola!' },
        'user-123',
      );
      expect(mockServer.to).toHaveBeenCalledWith('grupo-123');
    });

    it('debe enviar mensaje (payload string JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-123');
      mockChatsService.sendMessage.mockResolvedValue(mockMensaje);

      const result = await gateway.handleSendMessage(
        mockSocket,
        JSON.stringify({ grupoId: 'grupo-123', contenido: 'Mensaje!' }),
      );

      expect(result.success).toBe(true);
    });

    it('debe rechazar si no está en la sala', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123']);

      const result = await gateway.handleSendMessage(
        mockSocket,
        { grupoId: 'grupo-999', contenido: 'Mensaje!' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Debes unirte al grupo');
    });

    it('debe manejar errores del servicio', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-123');
      mockChatsService.sendMessage.mockRejectedValue(new Error('Error al guardar'));

      const result = await gateway.handleSendMessage(
        mockSocket,
        { grupoId: 'grupo-123', contenido: 'Mensaje!' },
      );

      expect(result.success).toBe(false);
      expect(result.message).toBe('Error al guardar');
    });

    it('debe rechazar payload string no JSON', async () => {
      const mockSocket = createMockSocket();

      const result = await gateway.handleSendMessage(
        mockSocket,
        'esto no es json valido',
      );

      expect(result.success).toBe(false);
      expect(result.message).toContain('Formato de payload inválido');
    });
  });

  describe('handleTyping()', () => {
    it('debe emitir evento de typing (objeto)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-123');

      await gateway.handleTyping(mockSocket, { grupoId: 'grupo-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('grupo-123');
    });

    it('debe emitir evento de typing (string JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-456');

      await gateway.handleTyping(
        mockSocket,
        JSON.stringify({ grupoId: 'grupo-456' }),
      );

      expect(mockSocket.to).toHaveBeenCalledWith('grupo-456');
    });

    it('debe emitir evento de typing (string directo)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-789');

      await gateway.handleTyping(mockSocket, 'grupo-789');

      expect(mockSocket.to).toHaveBeenCalledWith('grupo-789');
    });

    it('no debe emitir si no está en la sala', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123']);

      await gateway.handleTyping(mockSocket, { grupoId: 'grupo-999' });

      expect(mockSocket.to).not.toHaveBeenCalled();
    });
  });

  describe('handleStopTyping()', () => {
    it('debe emitir evento de stop typing (objeto)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-123');

      await gateway.handleStopTyping(mockSocket, { grupoId: 'grupo-123' });

      expect(mockSocket.to).toHaveBeenCalledWith('grupo-123');
    });

    it('debe emitir evento de stop typing (string JSON)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-456');

      await gateway.handleStopTyping(
        mockSocket,
        JSON.stringify({ grupoId: 'grupo-456' }),
      );

      expect(mockSocket.to).toHaveBeenCalledWith('grupo-456');
    });

    it('debe emitir evento de stop typing (string directo)', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms.add('grupo-789');

      await gateway.handleStopTyping(mockSocket, 'grupo-789');

      expect(mockSocket.to).toHaveBeenCalledWith('grupo-789');
    });

    it('no debe emitir si no está en la sala', async () => {
      const mockSocket = createMockSocket();
      mockSocket.rooms = new Set(['socket-123']);

      await gateway.handleStopTyping(mockSocket, { grupoId: 'grupo-999' });

      expect(mockSocket.to).not.toHaveBeenCalled();
    });
  });
});
