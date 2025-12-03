import { Injectable, ConflictException, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
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

    const normalizedTitle = title.replace(/\s+/g, ' ').trim();
    const normalizedContent = content.replace(/\s+/g, ' ').trim();

    const titleTrunc = this.truncateTitle(normalizedTitle);
    this.logger.log(`Intento creación hilo - user_id=${authorId} title="${titleTrunc}"`);

    // Verificar existencia del autor (authorId)
    const author = await (this.prisma as any).usuarios.findUnique({ where: { id: authorId } });
    if (!author) {
      this.logger.warn(`Autor no encontrado - user_id=${authorId} title="${titleTrunc}"`);
      throw new BadRequestException('Autor no encontrado');
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
        },
      });

      return thread;
    });

    this.logger.log(`Hilo creado - user_id=${authorId} id=${created.id} title="${this.truncateTitle(created.title)}"`);
    return created;
  }

  async findOne(id: string) {
    const thread = await (this.prisma as any).thread.findUnique({
      where: { id },
      include: { replies: true },
    });

    if (!thread) {
      throw new NotFoundException('Hilo no encontrado');
    }

    return thread;
  }
}
