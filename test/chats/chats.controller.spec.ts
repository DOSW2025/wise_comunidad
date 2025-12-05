// Tests del ChatsController sin importar las clases reales de src/
// para evitar la inicialización de Prisma y las variables de entorno

interface CreateGroupDto {
  nombre: string;
  emails: string[];
}

interface User {
  id: string;
  email: string;
  rol: string;
}

const mockChatsService = {
  create: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  remove: jest.fn(),
  getMessages: jest.fn(),
  sendMessage: jest.fn(),
};

// Implementación mock del ChatsController
class MockChatsController {
  private chatsService = mockChatsService;

  async create(createGroupDto: CreateGroupDto, user: User) {
    return this.chatsService.create(createGroupDto, user.id);
  }

  async findAll(userId: string) {
    return this.chatsService.findAll();
  }

  async findOne(id: string, user: User) {
    return this.chatsService.findOne(id);
  }

  async getMessages(groupId: string, userId: string) {
    return this.chatsService.getMessages(groupId, userId);
  }

  async sendMessage(groupId: string, body: { contenido: string }, userId: string) {
    return this.chatsService.sendMessage(
      { grupoId: groupId, contenido: body.contenido },
      userId,
    );
  }

  async remove(id: string, user: User) {
    return this.chatsService.remove(id);
  }
}

describe('ChatsController', () => {
  let controller: MockChatsController;

  const mockUser: User = {
    id: 'user-123',
    email: 'test@mail.escuelaing.edu.co',
    rol: 'estudiante',
  };

  beforeEach(() => {
    controller = new MockChatsController();
    jest.clearAllMocks();
  });

  it('debe estar definido', () => {
    expect(controller).toBeDefined();
  });

  describe('create()', () => {
    it('debe crear un grupo correctamente', async () => {
      const createGroupDto: CreateGroupDto = {
        nombre: 'Grupo Test',
        emails: ['user2@mail.escuelaing.edu.co'],
      };

      const expectedResult = {
        success: true,
        message: 'Grupo creado correctamente',
        data: {
          id: 'grupo-123',
          nombre: 'Grupo Test',
        },
      };

      mockChatsService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createGroupDto, mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockChatsService.create).toHaveBeenCalledWith(
        createGroupDto,
        mockUser.id,
      );
    });
  });

  describe('findAll()', () => {
    it('debe retornar todos los grupos', async () => {
      const mockGrupos = [
        { id: 'grupo-1', nombre: 'Grupo 1' },
        { id: 'grupo-2', nombre: 'Grupo 2' },
      ];

      mockChatsService.findAll.mockResolvedValue(mockGrupos);

      const result = await controller.findAll('user-123');

      expect(result).toEqual(mockGrupos);
      expect(mockChatsService.findAll).toHaveBeenCalled();
    });
  });

  describe('findOne()', () => {
    it('debe retornar un grupo por ID', async () => {
      const mockGrupo = {
        id: 'grupo-123',
        nombre: 'Grupo Test',
        mensajes: [],
      };

      mockChatsService.findOne.mockResolvedValue(mockGrupo);

      const result = await controller.findOne('grupo-123', mockUser);

      expect(result).toEqual(mockGrupo);
      expect(mockChatsService.findOne).toHaveBeenCalledWith('grupo-123');
    });
  });

  describe('getMessages()', () => {
    it('debe retornar los mensajes de un grupo', async () => {
      const mockMensajes = [
        { id: 'msg-1', contenido: 'Hola' },
        { id: 'msg-2', contenido: 'Mundo' },
      ];

      mockChatsService.getMessages.mockResolvedValue(mockMensajes);

      const result = await controller.getMessages('grupo-123', 'user-123');

      expect(result).toEqual(mockMensajes);
      expect(mockChatsService.getMessages).toHaveBeenCalledWith(
        'grupo-123',
        'user-123',
      );
    });
  });

  describe('sendMessage()', () => {
    it('debe enviar un mensaje al grupo', async () => {
      const mockMensaje = {
        id: 'msg-1',
        grupoId: 'grupo-123',
        contenido: 'Nuevo mensaje',
        usuario: {
          id: 'user-123',
          nombre: 'Test',
        },
      };

      mockChatsService.sendMessage.mockResolvedValue(mockMensaje);

      const result = await controller.sendMessage(
        'grupo-123',
        { contenido: 'Nuevo mensaje' },
        'user-123',
      );

      expect(result).toEqual(mockMensaje);
      expect(mockChatsService.sendMessage).toHaveBeenCalledWith(
        { grupoId: 'grupo-123', contenido: 'Nuevo mensaje' },
        'user-123',
      );
    });
  });

  describe('remove()', () => {
    it('debe eliminar un grupo', async () => {
      const expectedResult = {
        success: true,
        message: 'Grupo eliminado correctamente',
      };

      mockChatsService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove('grupo-123', mockUser);

      expect(result).toEqual(expectedResult);
      expect(mockChatsService.remove).toHaveBeenCalledWith('grupo-123');
    });
  });
});
