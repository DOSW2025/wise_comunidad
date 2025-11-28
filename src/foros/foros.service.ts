import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class ForosService {
  constructor(private prisma: PrismaService) {}

  async listForums(opts: { page?: number } = { page: 1 }) {
    const take = 20;
    const page = opts.page ?? 1;
    const skip = (page - 1) * take;
    return this.prisma.foro.findMany({ skip, take, orderBy: { created_at: 'desc' } });
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
