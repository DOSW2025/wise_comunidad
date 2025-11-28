import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateForoDto } from './dto/create-foro.dto';

@Injectable()
export class ForosService {
  constructor(private prisma: PrismaService) {}

  async listForums(opts: { page?: number } = { page: 1 }) {
    const take = 20;
    const page = opts.page ?? 1;
    const skip = (page - 1) * take;
    return this.prisma.foro.findMany({ skip, take, orderBy: { created_at: 'desc' } });
  }

  async createForo(dto: CreateForoDto) {
    // 1. Validar que la materia existe
    const materia = await this.prisma.materia.findUnique({
      where: { id: dto.materiaId },
    });

    if (!materia) {
      throw new NotFoundException(
        `La materia con ID "${dto.materiaId}" no existe. Por favor, verifica el ID.`,
      );
    }

    // 2. Validar que el slug no esté duplicado
    const existingForo = await this.prisma.foro.findUnique({
      where: { slug: dto.slug },
    });

    if (existingForo) {
      throw new ConflictException(
        `Un foro con el slug "${dto.slug}" ya existe. Por favor, usa otro slug único.`,
      );
    }

    // 3. Validar que no exista otro foro para la misma materia
    const foroEnMateria = await this.prisma.foro.findFirst({
      where: { materiaId: dto.materiaId },
    });

    if (foroEnMateria) {
      throw new ConflictException(
        `Ya existe un foro para la materia "${materia.nombre}". No se pueden crear foros duplicados.`,
      );
    }

    // 4. Crear el foro
    try {
      const foro = await this.prisma.foro.create({
        data: {
          slug: dto.slug,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          materiaId: dto.materiaId,
        },
        include: {
          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
      });

      return {
        success: true,
        message: `✅ Foro "${foro.nombre}" creado exitosamente para la materia "${foro.materia.nombre}".`,
        data: foro,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al crear el foro: ${error.message}. Por favor, intenta de nuevo.`,
      );
    }
  }

  async createThread(forumSlug: string, dto: CreateThreadDto) {
    const forum = await this.prisma.foro.findUnique({ where: { slug: forumSlug } });
    if (!forum) throw new NotFoundException('Foro no encontrado');

    const thread = await this.prisma.hilo.create({
      data: {
        title: dto.title,
        slug: dto.slug,
        forumId: forum.id,
        authorId: dto.authorId,
        posts: {
          create: {
            content: dto.content ?? '',
            authorId: dto.authorId,
          },
        },
      },
      include: { posts: true },
    });

    return thread;
  }

  async listThreads(forumSlug: string, opts: { page?: number } = { page: 1 }) {
    const forum = await this.prisma.foro.findUnique({ where: { slug: forumSlug } });
    if (!forum) throw new NotFoundException('Foro no encontrado');
    const take = 20;
    const page = opts.page ?? 1;
    const skip = (page - 1) * take;
    return this.prisma.hilo.findMany({
      where: { forumId: forum.id },
      skip,
      take,
      orderBy: [{ isPinned: 'desc' }, { updated_at: 'desc' }],
    });
  }

  async getThread(id: number, opts: { page?: number } = { page: 1 }) {
    const thread = await this.prisma.hilo.findUnique({ where: { id }, include: { posts: true } });
    if (!thread) throw new NotFoundException('Hilo no encontrado');

    return thread;
  }

  async createPost(threadId: number, dto: CreatePostDto) {
    const thread = await this.prisma.hilo.findUnique({ where: { id: threadId } });
    if (!thread) throw new NotFoundException('Hilo no encontrado');

    const post = await this.prisma.post.create({
      data: {
        threadId,
        authorId: dto.authorId,
        parentId: dto.parentId,
        content: dto.content,
      },
    });

    // Increment repliesCount on hilo
    await this.prisma.hilo.update({ where: { id: threadId }, data: { repliesCount: { increment: 1 } } });

    return post;
  }
}
