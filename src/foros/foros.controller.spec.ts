import { Test, TestingModule } from '@nestjs/testing';
import { ForosController } from './foros.controller';
import { ForosService } from './foros.service';
import { MensajesService } from './mensajes.service';
import { CreateForoDto } from './dto/create-foro.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateMensajeDto } from './dto/create-mensaje.dto';

describe('ForosController', () => {
  let controller: ForosController;
  let forosService: ForosService;
  let mensajesService: MensajesService;

  const mockForosService = {
    listForums: jest.fn(),
    createForo: jest.fn(),
    createThread: jest.fn(),
    listThreads: jest.fn(),
    getThread: jest.fn(),
    createPost: jest.fn(),
  };

  const mockMensajesService = {
    listMensajes: jest.fn(),
    sendMensaje: jest.fn(),
    markAsRead: jest.fn(),
    getUnreadCount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ForosController],
      providers: [
        {
          provide: ForosService,
          useValue: mockForosService,
        },
        {
          provide: MensajesService,
          useValue: mockMensajesService,
        },
      ],
    }).compile();

    controller = module.get<ForosController>(ForosController);
    forosService = module.get<ForosService>(ForosService);
    mensajesService = module.get<MensajesService>(MensajesService);
  });

  describe('findForums', () => {
    it('debería listar foros', async () => {
      const mockForos = [
        {
          id: 1,
          slug: 'foro-1',
          nombre: 'Foro 1',
        },
      ];

      mockForosService.listForums.mockResolvedValue(mockForos);

      const result = await controller.findForums('1');

      expect(result).toEqual(mockForos);
      expect(mockForosService.listForums).toHaveBeenCalledWith({ page: 1 });
    });

    it('debería usar página 1 por defecto', async () => {
      mockForosService.listForums.mockResolvedValue([]);

      await controller.findForums(undefined);

      expect(mockForosService.listForums).toHaveBeenCalledWith({ page: 1 });
    });

    it('debería convertir string a número para página', async () => {
      mockForosService.listForums.mockResolvedValue([]);

      await controller.findForums('3');

      expect(mockForosService.listForums).toHaveBeenCalledWith({ page: 3 });
    });
  });

  describe('createForo', () => {
    it('debería crear un foro', async () => {
      const dto: CreateForoDto = {
        slug: 'test-foro',
        nombre: 'Test Foro',
        descripcion: 'Test Description',
        materiaId: 'MAT101',
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        data: { id: 1, ...dto },
      };

      mockForosService.createForo.mockResolvedValue(mockResponse);

      const result = await controller.createForo(dto);

      expect(result.statusCode).toBe(201);
      expect(mockForosService.createForo).toHaveBeenCalledWith(dto);
    });
  });

  describe('createThread', () => {
    it('debería crear un hilo', async () => {
      const dto: CreateThreadDto = {
        title: 'Test Thread',
        slug: 'test-thread',
        content: 'Test content',
        authorId: 'user-123',
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        data: { id: 1, title: 'Test Thread' },
      };

      mockForosService.createThread.mockResolvedValue(mockResponse);

      const result = await controller.createThread('test-foro', dto);

      expect((result as any).statusCode).toBe(201);
      expect(mockForosService.createThread).toHaveBeenCalledWith('test-foro', dto);
    });
  });

  describe('listThreads', () => {
    it('debería listar hilos de un foro', async () => {
      const mockThreads = [
        {
          id: 1,
          title: 'Thread 1',
          slug: 'thread-1',
        },
      ];

      mockForosService.listThreads.mockResolvedValue(mockThreads);

      const result = await controller.listThreads('test-foro', '1');

      expect(result).toEqual(mockThreads);
      expect(mockForosService.listThreads).toHaveBeenCalledWith('test-foro', {
        page: 1,
      });
    });
  });

  describe('getThread', () => {
    it('debería obtener un hilo con sus posts', async () => {
      const mockThread = {
        id: 1,
        title: 'Test Thread',
        posts: [],
      };

      mockForosService.getThread.mockResolvedValue(mockThread);

      const result = await controller.getThread('1', '1');

      expect(result).toEqual(mockThread);
      expect(mockForosService.getThread).toHaveBeenCalledWith(1, { page: 1 });
    });
  });

  describe('createPost', () => {
    it('debería crear un post', async () => {
      const dto: CreatePostDto = {
        content: 'Test post content',
        authorId: 'user-123',
      };

      const mockResponse = {
        success: true,
        statusCode: 201,
        data: { id: 1, content: 'Test post content', authorId: 'user-123' },
      };

      mockForosService.createPost.mockResolvedValue(mockResponse);

      const result = await controller.createPost('1', dto);

      expect((result as any).statusCode).toBe(201);
      expect(mockForosService.createPost).toHaveBeenCalledWith(1, dto);
    });
  });

  describe('Endpoints de Mensajería', () => {
    describe('listMensajes', () => {
      it('debería listar mensajes de un foro', async () => {
        const mockResponse = {
          success: true,
          data: {
            mensajes: [],
            pagination: { page: 1, total: 0 },
          },
        };

        mockMensajesService.listMensajes.mockResolvedValue(mockResponse);

        const result = await controller.listMensajes('1', { page: 1 });

        expect(result.success).toBe(true);
        expect(mockMensajesService.listMensajes).toHaveBeenCalledWith(1, {
          page: 1,
        });
      });
    });

    describe('sendMensaje', () => {
      it('debería enviar un mensaje', async () => {
        const dto: CreateMensajeDto = {
          contenido: 'Test message',
          authorId: 'user-123',
        };

        const mockResponse = {
          success: true,
          statusCode: 201,
          data: { id: 1, ...dto },
        };

        mockMensajesService.sendMensaje.mockResolvedValue(mockResponse);

        const result = await controller.sendMensaje('1', dto);

        expect(result.statusCode).toBe(201);
        expect(mockMensajesService.sendMensaje).toHaveBeenCalledWith(1, dto);
      });
    });

    describe('markMensajeAsRead', () => {
      it('debería marcar un mensaje como leído', async () => {
        const mockResponse = {
          success: true,
          statusCode: 200,
          data: { id: 1, leido: true },
        };

        mockMensajesService.markAsRead.mockResolvedValue(mockResponse);

        const result = await controller.markMensajeAsRead('1', '1');

        expect(result.success).toBe(true);
        expect(mockMensajesService.markAsRead).toHaveBeenCalledWith(1, 1);
      });
    });

    describe('getUnreadCount', () => {
      it('debería obtener el conteo de mensajes no leídos', async () => {
        const mockResponse = {
          forumId: 1,
          unreadCount: 5,
        };

        mockMensajesService.getUnreadCount.mockResolvedValue(mockResponse);

        const result = await controller.getUnreadCount('1');

        expect(result.forumId).toBe(1);
        expect(result.unreadCount).toBe(5);
        expect(mockMensajesService.getUnreadCount).toHaveBeenCalledWith(1);
      });
    });
  });
});
