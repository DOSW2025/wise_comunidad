import { Injectable, BadRequestException, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';

@Injectable()
export class ForumsService {
  private readonly logger = new Logger(ForumsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateForumDto) {
    const { materiaId, title, description, creatorId } = dto;

    // validar existencia de materia
    const materia = await (this.prisma as any).materia.findUnique({ where: { id: materiaId } });
    if (!materia) {
      this.logger.warn(`Intento crear foro con materia inexistente materiaId=${materiaId}`);
      throw new BadRequestException('Materia no encontrada');
    }

    // validar existencia de usuario creador y su estado/rol
    const author = await (this.prisma as any).usuarios.findUnique({ where: { id: creatorId }, include: { roles: true, estados_usuario: true } });
    if (!author) {
      this.logger.warn(`Autor no encontrado - creatorId=${creatorId}`);
      throw new BadRequestException('Autor no encontrado');
    }
    if (author.estados_usuario && author.estados_usuario.activo === false) {
      this.logger.warn(`Usuario en estado no activo - user_id=${creatorId}`);
      throw new BadRequestException('Estado de usuario no permite crear foros');
    }
    if (!author.roles || author.roles.activo === false) {
      this.logger.warn(`Rol de usuario no permite crear foros - user_id=${creatorId}`);
      throw new BadRequestException('Rol de usuario no permite crear foros');
    }

    const created = await (this.prisma as any).forum.create({
      data: { materiaId, title, description, creator_id: creatorId },
    });

    this.logger.log(`Foro creado id=${created.id} materia=${materiaId}`);
    return created;
  }

  async update(id: string, dto: UpdateForumDto) {
    const { title, description, editorId } = dto as any;
    const forum = await (this.prisma as any).forum.findUnique({ where: { id } });
    if (!forum) throw new BadRequestException('Foro no encontrado');
    if (!editorId || forum.creator_id !== editorId) {
      throw new ForbiddenException('Solo el creador puede editar este foro');
    }

    const updated = await (this.prisma as any).forum.update({ where: { id }, data: { title: title ?? forum.title, description: description ?? forum.description } });
    return updated;
  }

  async close(id: string, editorId: string) {
    const forum = await (this.prisma as any).forum.findUnique({ where: { id } });
    if (!forum) throw new BadRequestException('Foro no encontrado');
    if (!editorId || forum.creator_id !== editorId) {
      throw new ForbiddenException('Solo el creador puede cerrar este foro');
    }
    const updated = await (this.prisma as any).forum.update({ where: { id }, data: { closed: true } });
    return updated;
  }

  async findAll() {
    return await (this.prisma as any).forum.findMany({ orderBy: { created_at: 'desc' } });
  }

  async findOne(id: string) {
    // incrementar contador de vistas y devolver foro con hilos
    const updated = await (this.prisma as any).forum.update({
      where: { id },
      data: { views_count: { increment: 1 } },
      include: { threads: true },
    });
    if (!updated) throw new BadRequestException('Foro no encontrado');
    return updated;
  }

  async like(id: string) {
    const updated = await (this.prisma as any).forum.update({
      where: { id },
      data: { likes_count: { increment: 1 } },
    });
    return updated;
  }
}
