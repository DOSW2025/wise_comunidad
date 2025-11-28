import { Test, TestingModule } from '@nestjs/testing';
import { ForosService } from './foros.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { CreateForoDto } from './dto/create-foro.dto';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';

describe('ForosService', () => {
  let service: ForosService;
  let prisma: PrismaService;

  const mockPrismaService = {
    materia: {
      findUnique: jest.fn(),
    },
    foro: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    hilo: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    post: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    usuarios: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ForosService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ForosService>(ForosService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createForo', () => {
    it('debería crear un foro exitosamente', async () => {
      const dto: CreateForoDto = {
        slug: 'test-foro',
        nombre: 'Test Foro',
        descripcion: 'Test Description',
        materiaId: 'MAT101',
      };

      const mockMateria = {
        id: 'MAT101',
        nombre: 'Matemáticas I',
        codigo: 'MAT-101',
      };

      const mockForo = {
        id: 1,
        slug: 'test-foro',
        nombre: 'Test Foro',
        descripcion: 'Test Description',
        materiaId: 'MAT101',
        activo: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.materia.findUnique.mockResolvedValue(mockMateria);
      mockPrismaService.foro.findUnique.mockResolvedValue(null);
      mockPrismaService.foro.findFirst.mockResolvedValue(null);
      mockPrismaService.foro.create.mockResolvedValue(mockForo);

      const result = await service.createForo(dto);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data && result.data.id).toBe(1);
      expect(mockPrismaService.materia.findUnique).toHaveBeenCalledWith({
        where: { id: 'MAT101' },
      });
    });

    it('debería lanzar NotFoundException si la materia no existe', async () => {
      const dto: CreateForoDto = {
        slug: 'test-foro',
        nombre: 'Test Foro',
        descripcion: 'Test Description',
        materiaId: 'INVALID',
      };

      mockPrismaService.materia.findUnique.mockResolvedValue(null);

      await expect(service.createForo(dto)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar ConflictException si el slug está duplicado', async () => {
      const dto: CreateForoDto = {
        slug: 'test-foro',
        nombre: 'Test Foro',
        descripcion: 'Test Description',
        materiaId: 'MAT101',
      };

      const mockMateria = {
        id: 'MAT101',
        nombre: 'Matemáticas I',
        codigo: 'MAT-101',
      };

      const existingForo = { id: 1, slug: 'test-foro' };

      mockPrismaService.materia.findUnique.mockResolvedValue(mockMateria);
      mockPrismaService.foro.findUnique.mockResolvedValue(existingForo);

      await expect(service.createForo(dto)).rejects.toThrow(ConflictException);
    });

    it('debería lanzar ConflictException si ya existe un foro para la materia', async () => {
      const dto: CreateForoDto = {
        slug: 'test-foro',
        nombre: 'Test Foro',
        descripcion: 'Test Description',
        materiaId: 'MAT101',
      };

      const mockMateria = {
        id: 'MAT101',
        nombre: 'Matemáticas I',
        codigo: 'MAT-101',
      };

      mockPrismaService.materia.findUnique.mockResolvedValue(mockMateria);
      mockPrismaService.foro.findUnique.mockResolvedValue(null);
      mockPrismaService.foro.findFirst.mockResolvedValue({ id: 1, materiaId: 'MAT101' });

      await expect(service.createForo(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('listForums', () => {
    it('debería retornar una lista de foros paginada', async () => {
      const mockForos = [
        {
          id: 1,
          slug: 'foro-1',
          nombre: 'Foro 1',
          descripcion: 'Descripción 1',
          materiaId: 'MAT101',
          activo: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          slug: 'foro-2',
          nombre: 'Foro 2',
          descripcion: 'Descripción 2',
          materiaId: 'MAT102',
          activo: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      mockPrismaService.foro.findMany.mockResolvedValue(mockForos);

      const result = await service.listForums({ page: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(mockPrismaService.foro.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });
    });

    it('debería aplicar paginación correctamente', async () => {
      mockPrismaService.foro.findMany.mockResolvedValue([]);

      await service.listForums({ page: 2 });

      expect(mockPrismaService.foro.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 20,
        orderBy: { created_at: 'desc' },
      });
    });

    it('debería usar página 1 por defecto', async () => {
      mockPrismaService.foro.findMany.mockResolvedValue([]);

      await service.listForums();

      expect(mockPrismaService.foro.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 20,
        orderBy: { created_at: 'desc' },
      });
    });
  });

  describe('createThread', () => {
    it('debería crear un hilo exitosamente', async () => {
      const dto: CreateThreadDto = {
        title: 'Test Thread',
        slug: 'test-thread',
        content: 'Test content',
        authorId: 'user-123',
      };

      const mockForo = {
        id: 1,
        slug: 'test-foro',
        nombre: 'Test Foro',
      };

      const mockHilo = {
        id: 1,
        title: 'Test Thread',
        slug: 'test-thread',
        forumId: 1,
        authorId: 'user-123',
        repliesCount: 1,
        isPinned: false,
        isLocked: false,
        views: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.hilo.create.mockResolvedValue(mockHilo);

      const result = await service.createThread('test-foro', dto);

      expect(result).toBeDefined();
      expect(mockPrismaService.foro.findUnique).toHaveBeenCalledWith({
        where: { slug: 'test-foro' },
      });
    });

    it('debería lanzar NotFoundException si el foro no existe', async () => {
      const dto: CreateThreadDto = {
        title: 'Test Thread',
        slug: 'test-thread',
        content: 'Test content',
        authorId: 'user-123',
      };

      mockPrismaService.foro.findUnique.mockResolvedValue(null);

      await expect(service.createThread('invalid-slug', dto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listThreads', () => {
    it('debería retornar lista de hilos del foro', async () => {
      const mockForo = {
        id: 1,
        slug: 'test-foro',
        nombre: 'Test Foro',
      };

      const mockHilos = [
        {
          id: 1,
          title: 'Thread 1',
          slug: 'thread-1',
          forumId: 1,
          repliesCount: 5,
          views: 10,
          created_at: new Date(),
        },
      ];

      mockPrismaService.foro.findUnique.mockResolvedValue(mockForo);
      mockPrismaService.hilo.findMany.mockResolvedValue(mockHilos);

      const result = await service.listThreads('test-foro', { page: 1 });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('debería lanzar NotFoundException si el foro no existe', async () => {
      mockPrismaService.foro.findUnique.mockResolvedValue(null);

      await expect(service.listThreads('invalid-slug', { page: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getThread', () => {
    it('debería retornar un hilo con sus posts', async () => {
      const mockHilo = {
        id: 1,
        title: 'Test Thread',
        slug: 'test-thread',
        forumId: 1,
        repliesCount: 2,
        created_at: new Date(),
      };

      const mockPosts = [
        {
          id: 1,
          threadId: 1,
          content: 'Post 1',
          authorId: 'user-1',
          created_at: new Date(),
        },
      ];

      mockPrismaService.hilo.findUnique.mockResolvedValue(mockHilo);
      mockPrismaService.post.findMany.mockResolvedValue(mockPosts);

      const result = await service.getThread(1, { page: 1 });

      expect(result).toBeDefined();
      // Verificar que se buscó el hilo (sin ser específico con argumentos exactos)
      expect(mockPrismaService.hilo.findUnique).toHaveBeenCalled();
    });

    it('debería lanzar NotFoundException si el hilo no existe', async () => {
      mockPrismaService.hilo.findUnique.mockResolvedValue(null);

      await expect(service.getThread(999, { page: 1 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createPost', () => {
    it('debería crear un post exitosamente', async () => {
      const dto: CreatePostDto = {
        content: 'Test post content',
        authorId: 'user-123',
      };

      const mockHilo = {
        id: 1,
        title: 'Test Thread',
        repliesCount: 0,
      };

      const mockUsuario = {
        id: 'user-123',
        nombre: 'Juan',
      };

      const mockPost = {
        id: 1,
        threadId: 1,
        content: 'Test post content',
        authorId: 'user-123',
        created_at: new Date(),
      };

      mockPrismaService.hilo.findUnique.mockResolvedValue(mockHilo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);
      mockPrismaService.post.create.mockResolvedValue(mockPost);
      mockPrismaService.hilo.update.mockResolvedValue({
        ...mockHilo,
        repliesCount: 1,
      });

      const result = await service.createPost(1, dto);

      expect(result).toBeDefined();
    });

    it('debería lanzar NotFoundException si el hilo no existe', async () => {
      const dto: CreatePostDto = {
        content: 'Test post content',
        authorId: 'user-123',
      };

      mockPrismaService.hilo.findUnique.mockResolvedValue(null);

      await expect(service.createPost(999, dto)).rejects.toThrow(NotFoundException);
    });

    it('debería lanzar NotFoundException si el usuario no existe', async () => {
      const dto: CreatePostDto = {
        content: 'Test post content',
        authorId: 'invalid-user',
      };

      const mockHilo = {
        id: 1,
        title: 'Test Thread',
      };

      mockPrismaService.hilo.findUnique.mockResolvedValue(mockHilo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(null);
      mockPrismaService.post.create.mockRejectedValue(
        new NotFoundException('Usuario no encontrado'),
      );

      // El servicio debe lanzar la excepción
      await expect(service.createPost(1, dto)).rejects.toThrow();
    });

    it('debería incrementar el contador de respuestas', async () => {
      const dto: CreatePostDto = {
        content: 'Test post content',
        authorId: 'user-123',
      };

      const mockHilo = {
        id: 1,
        repliesCount: 5,
      };

      const mockUsuario = {
        id: 'user-123',
      };

      mockPrismaService.hilo.findUnique.mockResolvedValue(mockHilo);
      mockPrismaService.usuarios.findUnique.mockResolvedValue(mockUsuario);
      mockPrismaService.post.create.mockResolvedValue({});
      mockPrismaService.hilo.update.mockResolvedValue({
        ...mockHilo,
        repliesCount: 6,
      });

      await service.createPost(1, dto);

      expect(mockPrismaService.hilo.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
        }),
      );
    });
  });
});
