import { Test, TestingModule } from '@nestjs/testing';
import { MensajesService } from './mensajes.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateMensajeDto } from './dto/create-mensaje.dto';

describe('MensajesService', () => {
  let service: MensajesService;
  let prisma: PrismaService;

  const mockPrismaService = {
    foro: {
      findUnique: jest.fn(),
      count: jest.fn(),
    },
    usuarios: {
      findUnique: jest.fn(),
    },
    mensaje: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MensajesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<MensajesService>(MensajesService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('sendMensaje', () => {
    it('debería enviar un mensaje exitosamente', async () => {
      const dto: CreateMensajeDto = {
        contenido: 'Mensaje de prueba',
        authorId: 'user-123',
      };

      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
        slug: 'foro-test',
        materia: {
          id: 'MAT101',
          nombre: 'Matemáticas I',
          codigo: 'MAT-101',
        },
      };

      const mockUsuario = {
        id: 'user-123',
        nombre: 'Juan',
        apellido: 'Pérez',
      };

      const mockMensaje = {
        id: 1,
        forumId: 1,
        authorId: 'user-123',
        contenido: 'Mensaje de prueba',
        leido: false,
        created_at: new Date(),
        updated_at: new Date(),
        author: {
          id: 'user-123',
          nombre: 'Juan',
          apellido: 'Pérez',
          email: 'juan@test.com',
          avatar_url: null,
        },
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);
      mockPrismaService.mensaje.create.mockResolvedValue(mockMensaje);

      const result = await service.sendMensaje(1, dto);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.contenido).toBe('Mensaje de prueba');
      expect(mockPrismaService.foro.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: { materia: true },
      });
    });

    it('debería lanzar NotFoundException si el foro no existe', async () => {
      const dto: CreateMensajeDto = {
        contenido: 'Mensaje de prueba',
        authorId: 'user-123',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(null);

      await expect(service.sendMensaje(999, dto)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      const dto: CreateMensajeDto = {
        contenido: 'Mensaje de prueba',
        authorId: 'invalid-user',
      };

      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(null);

      await expect(service.sendMensaje(1, dto)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar BadRequestException si el contenido está vacío', async () => {
      const dto: CreateMensajeDto = {
        contenido: '   ',
        authorId: 'user-123',
      };

      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
      };

      const mockUsuario = {
        id: 'user-123',
        nombre: 'Juan',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);

      await expect(service.sendMensaje(1, dto)).rejects.toThrow(BadRequestException);
    });

    it('debería trimear el contenido del mensaje', async () => {
      const dto: CreateMensajeDto = {
        contenido: '  Mensaje con espacios  ',
        authorId: 'user-123',
      };

      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
        materia: {},
      };

      const mockUsuario = {
        id: 'user-123',
        nombre: 'Juan',
        apellido: 'Pérez',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);
      mockPrismaService.mensaje.create.mockResolvedValue({
        id: 1,
        contenido: 'Mensaje con espacios',
        author: mockUsuario,
      });

      await service.sendMensaje(1, dto);

      expect(mockPrismaService.mensaje.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            contenido: 'Mensaje con espacios',
          }),
        }),
      );
    });
  });

  describe('listMensajes', () => {
    it('debería listar mensajes con paginación', async () => {
      const mockMensajes = [
        {
          id: 1,
          contenido: 'Mensaje 1',
          leido: false,
          author: {
            id: 'user-1',
            nombre: 'Juan',
            apellido: 'Pérez',
          },
        },
        {
          id: 2,
          contenido: 'Mensaje 2',
          leido: true,
          author: {
            id: 'user-2',
            nombre: 'María',
            apellido: 'González',
          },
        },
      ];

      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.mensaje.findMany.mockResolvedValue(mockMensajes);
      mockPrismaService.mensaje.count.mockResolvedValue(2);

      const result = await service.listMensajes(1, { page: 1 });

      expect(result.success).toBe(true);
      expect(result.data && result.data.mensajes.length).toBe(2);
      expect(result.data && result.data.pagination.page).toBe(1);
      expect(result.data && result.data.pagination.total).toBe(2);
    });

    it('debería aplicar paginación correctamente', async () => {
      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.mensaje.findMany.mockResolvedValue([]);
      mockPrismaService.mensaje.count.mockResolvedValue(50);

      await service.listMensajes(1, { page: 2 });

      expect(mockPrismaService.mensaje.findMany).toHaveBeenCalledWith({
        where: { forumId: 1 },
        skip: 20,
        take: 20,
        orderBy: { created_at: 'desc' },
        include: {
          author: {
            select: expect.any(Object),
          },
        },
      });
    });

    it('debería filtrar solo mensajes no leídos si unreadOnly es true', async () => {
      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.mensaje.findMany.mockResolvedValue([]);
      mockPrismaService.mensaje.count.mockResolvedValue(0);

      await service.listMensajes(1, { page: 1, unreadOnly: true });

      expect(mockPrismaService.mensaje.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            leido: false,
          }),
        }),
      );
    });

    it('debería lanzar NotFoundException si el foro no existe', async () => {
      mockPrismaService.foro.findUnique.mockResolvedValue(null);

      await expect(service.listMensajes(999, { page: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('debería usar página 1 por defecto', async () => {
      const mockForo = {
        id: 1,
        nombre: 'Foro Test',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.mensaje.findMany.mockResolvedValue([]);
      mockPrismaService.mensaje.count.mockResolvedValue(0);

      await service.listMensajes(1);

      expect(mockPrismaService.mensaje.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20,
        }),
      );
    });
  });

  describe('markAsRead', () => {
    it('debería marcar un mensaje como leído', async () => {
      const mockMensaje = {
        id: 1,
        forumId: 1,
        leido: false,
      };

      const mockMensajeActualizado = {
        ...mockMensaje,
        leido: true,
        author: {
          id: 'user-1',
          nombre: 'Juan',
          apellido: 'Pérez',
        },
      };

      mockPrismaService.mensaje.findUnique.mockResolvedValue(mockMensaje);
      mockPrismaService.mensaje.update.mockResolvedValue(mockMensajeActualizado);

      const result = await service.markAsRead(1, 1);

      expect(result.success).toBe(true);
      expect(result.data.leido).toBe(true);
      expect(mockPrismaService.mensaje.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { leido: true },
        include: {
          author: {
            select: expect.any(Object),
          },
        },
      });
    });

    it('debería lanzar NotFoundException si el mensaje no existe', async () => {
      mockPrismaService.mensaje.findUnique.mockResolvedValue(null);

      await expect(service.markAsRead(1, 999)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si el mensaje no pertenece al foro', async () => {
      const mockMensaje = {
        id: 1,
        forumId: 2, // Pertenece a otro foro
      };

      mockPrismaService.mensaje.findUnique.mockResolvedValue(mockMensaje);

      await expect(service.markAsRead(1, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUnreadCount', () => {
    it('debería retornar el conteo de mensajes no leídos', async () => {
      mockPrismaService.mensaje.count.mockResolvedValue(5);

      const result = await service.getUnreadCount(1);

      expect(result.forumId).toBe(1);
      expect(result.unreadCount).toBe(5);
      expect(mockPrismaService.mensaje.count).toHaveBeenCalledWith({
        where: {
          forumId: 1,
          leido: false,
        },
      });
    });

    it('debería retornar 0 si no hay mensajes no leídos', async () => {
      mockPrismaService.mensaje.count.mockResolvedValue(0);

      const result = await service.getUnreadCount(1);

      expect(result.unreadCount).toBe(0);
    });

    it('debería manejar errores de base de datos', async () => {
      mockPrismaService.mensaje.count.mockRejectedValue(new Error('DB Error'));

      await expect(service.getUnreadCount(1)).rejects.toThrow(BadRequestException);
    });
  });
});
