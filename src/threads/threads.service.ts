import { Injectable, ConflictException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { escapeHtml } from './utils/sanitize';

@Injectable()
export class ThreadsService {
  private readonly logger = new Logger(ThreadsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private truncateTitle(title: string) {
    if (!title) return '';
    return title.length > 120 ? `${title.slice(0, 120)}...` : title;
  }

  async create(createDto: CreateThreadDto) {
    const { authorId, title, content } = createDto;
    const forumId = (createDto as any).forumId;

    const normalizedTitle = title.replace(/\s+/g, ' ').trim();
    const normalizedContent = content.replace(/\s+/g, ' ').trim();

    const titleTrunc = this.truncateTitle(normalizedTitle);
    this.logger.log(`Intento creación hilo - user_id=${authorId} title="${titleTrunc}"`);

    // Verificar existencia del autor (authorId) e incluir rol/estado
    const author = await (this.prisma as any).usuarios.findUnique({
      where: { id: authorId },
      include: { roles: true, estados_usuario: true },
    });
    if (!author) {
      this.logger.warn(`Autor no encontrado - user_id=${authorId} title="${titleTrunc}"`);
      throw new BadRequestException('Autor no encontrado');
    }

    // Validar estado del usuario
    if (author.estados_usuario && author.estados_usuario.activo === false) {
      this.logger.warn(`Usuario en estado no activo - user_id=${authorId} estado=${author.estados_usuario.nombre}`);
      throw new BadRequestException('Estado de usuario no permite crear hilos');
    }

    // Validar rol del usuario (debe existir y estar activo)
    if (!author.roles || author.roles.activo === false) {
      this.logger.warn(`Rol no permitido o inactivo - user_id=${authorId} rol=${author.roles?.nombre}`);
      throw new BadRequestException('Rol de usuario no permite crear hilos');
    }

    // Duplicate check (exact match on author, title and content)
    // Cast to any because generated Prisma client types may not be available
    // in the TS server until `prisma generate` is run and the editor restarts.
    const existing = await (this.prisma as any).thread.findFirst({
      where: {
        author_id: authorId,
        title: normalizedTitle,
        content: normalizedContent,
      },
    });

    if (existing) {
      this.logger.warn(`Hilo duplicado - user_id=${authorId} title="${titleTrunc}"`);
      throw new ConflictException('Hilo duplicado');
    }

    // If forumId provided, ensure there is no other thread with the same title in that forum
    if (forumId) {
      const sameTitle = await (this.prisma as any).thread.findFirst({
        where: {
          forum_id: forumId,
          title: normalizedTitle,
        },
      });
      if (sameTitle) {
        this.logger.warn(`Título duplicado en foro - forum_id=${forumId} title="${titleTrunc}"`);
        throw new ConflictException('Ya existe un hilo con el mismo título en este foro');
      }
    }

    // If forumId provided, validate forum exists
    if (forumId) {
      const forum = await (this.prisma as any).forum.findUnique({ where: { id: forumId } });
      if (!forum) {
        this.logger.warn(`Foro no encontrado - forum_id=${forumId} user_id=${authorId}`);
        throw new BadRequestException('Foro no encontrado');
      }
    }

    // Sanitize data
    const safeTitle = escapeHtml(normalizedTitle);
    const safeContent = escapeHtml(normalizedContent);

    // Create atomically (transaction) in case counters or related writes are added later
    const created = await this.prisma.$transaction(async (tx) => {
      const thread = await (tx as any).thread.create({
        data: {
          author_id: authorId,
          title: safeTitle,
          content: safeContent,
          forum_id: forumId ? forumId : null,
        },
      });

      return thread;
    });

    this.logger.log(`Hilo creado - user_id=${authorId} id=${created.id} title="${this.truncateTitle(created.title)}"`);
    return created;
  }

  async findOne(id: string) {
    // incrementar contador de vistas y devolver hilo con respuestas
    const updated = await (this.prisma as any).thread.update({
      where: { id },
      data: { views_count: { increment: 1 } },
      include: { responses: true },
    });

    if (!updated) {
      throw new NotFoundException('Hilo no encontrado');
    }

    return updated;
  }

  async like(id: string) {
    const updated = await (this.prisma as any).thread.update({
      where: { id },
      data: { likes_count: { increment: 1 } },
    });
    return updated;
  }

  async update(id: string, dto: { title?: string; content?: string; authorId?: string }) {
    const { title, content, authorId } = dto as any;
    const thread = await (this.prisma as any).thread.findUnique({ where: { id } });
    if (!thread) throw new NotFoundException('Hilo no encontrado');
    if (!authorId || thread.author_id !== authorId) {
      throw new ForbiddenException('Solo el autor puede editar este hilo');
    }

    const safeTitle = title ? escapeHtml(title.replace(/\s+/g, ' ').trim()) : thread.title;
    const safeContent = content ? escapeHtml(content.replace(/\s+/g, ' ').trim()) : thread.content;

    const updated = await (this.prisma as any).thread.update({ where: { id }, data: { title: safeTitle, content: safeContent } });
    return updated;
  }
}
