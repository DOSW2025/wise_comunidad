import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateForoDto } from './dto/create-foro.dto';
import { ApiResponse } from '../common/responses/api.response';
import { ForosMessages } from '../common/messages/foros.messages';

@Injectable()
export class ForosService {
  private readonly logger = new Logger(ForosService.name);

  constructor(private prisma: PrismaService) {}

  async listForums(opts: { page?: number } = { page: 1 }) {
    const take = 20;
    const page = opts.page ?? 1;
    const skip = (page - 1) * take;
    return this.prisma.foro.findMany({ skip, take, orderBy: { created_at: 'desc' } });
  }

  async createForo(dto: CreateForoDto) {
    try {
      // 1. Validar que la materia existe
      const materia = await this.prisma.materia.findUnique({
        where: { id: dto.materiaId },
      });

      if (!materia) {
        this.logger.warn(`Intento de crear foro con materia inexistente: ${dto.materiaId}`);
        throw new NotFoundException(ForosMessages.MATERIA_NOT_FOUND(dto.materiaId));
      }

      // 2. Validar que el slug no esté duplicado
      const existingForo = await this.prisma.foro.findUnique({
        where: { slug: dto.slug },
      });

      if (existingForo) {
        this.logger.warn(`Intento de crear foro con slug duplicado: ${dto.slug}`);
        throw new ConflictException(ForosMessages.FORO_SLUG_DUPLICATE(dto.slug));
      }

      // 3. Validar que no exista otro foro para la misma materia
      const foroEnMateria = await this.prisma.foro.findFirst({
        where: { materiaId: dto.materiaId },
      });

      if (foroEnMateria) {
        this.logger.warn(
          `Intento de crear foro duplicado para materia: ${dto.materiaId} (${materia.nombre})`,
        );
        throw new ConflictException(ForosMessages.FORO_DUPLICATE(materia.nombre));
      }

      // 4. Crear el foro
      const foro = await this.prisma.foro.create({
        data: {
          slug: dto.slug,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          materiaId: dto.materiaId,
        },
      });

      this.logger.log(`Foro creado exitosamente: ${foro.id} - ${foro.nombre} (Materia: ${materia.nombre})`);

      return ApiResponse.created(
        ForosMessages.FORO_CREATED(foro.nombre, materia.nombre),
        {
          ...foro,
          materia: {
            id: materia.id,
            nombre: materia.nombre,
            codigo: materia.codigo,
          },
        },
      );
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Error al crear foro: ${error.message}`, error.stack);
      throw new BadRequestException(ForosMessages.DATABASE_CREATE_ERROR);
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
