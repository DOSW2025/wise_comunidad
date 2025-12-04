import { Body, Controller, Get, Param, Post, BadRequestException, Logger } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { CreateResponseDto } from './dto/create-response.dto';
import { PrismaService } from '../prisma/prisma.service';
import { escapeHtml } from '../threads/utils/sanitize';

@ApiTags('Respuestas')
@Controller('responses')
export class ResponsesController {
  private readonly logger = new Logger(ResponsesController.name);

  constructor(private readonly responsesService: ResponsesService, private readonly prisma: PrismaService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una respuesta' })
  @ApiBody({ type: CreateResponseDto })
  @ApiResponse({
    status: 200,
    description: 'Respuesta creada',
    schema: {
      example: { status: 'ok', response: { id: 'r1', content: 'Contenido de ejemplo', createdAt: '2025-12-02T00:00:00.000Z' } },
    },
  })
  async create(@Body() body: CreateResponseDto) {
    const { threadId, authorId, content } = body;

    // validar hilo
    const thread = await (this.prisma as any).thread.findUnique({ where: { id: threadId } });
    if (!thread) {
      this.logger.warn(`Intento crear respuesta en hilo inexistente threadId=${threadId}`);
      throw new BadRequestException('Hilo no encontrado');
    }

    // validar autor
    const author = await (this.prisma as any).usuarios.findUnique({
      where: { id: authorId },
      include: { roles: true, estados_usuario: true },
    });
    if (!author) {
      this.logger.warn(`Autor no encontrado authorId=${authorId}`);
      throw new BadRequestException('Autor no encontrado');
    }
    if (author.estados_usuario && author.estados_usuario.activo === false) {
      this.logger.warn(`Usuario en estado no activo - user_id=${authorId} estado=${author.estados_usuario.nombre}`);
      throw new BadRequestException('Estado de usuario no permite crear respuestas');
    }
    if (!author.roles || author.roles.activo === false) {
      this.logger.warn(`Rol no permitido o inactivo - user_id=${authorId} rol=${author.roles?.nombre}`);
      throw new BadRequestException('Rol de usuario no permite crear respuestas');
    }

    // sanitizar
    const safeContent = escapeHtml(content);

    // crear en BD
    const created = await (this.prisma as any).responses.create({
      data: {
        thread_id: threadId,
        author_id: authorId,
        content: safeContent,
      },
    });

    this.logger.log(`Respuesta creada id=${created.id} thread=${threadId} author=${authorId}`);
    return { status: 'ok', response: created };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una respuesta por id' })
  @ApiParam({ name: 'id', description: 'Identificador de la respuesta', schema: { example: 'r1' } })
  @ApiResponse({ status: 200, description: 'Respuesta encontrada', schema: { example: { status: 'ok', response: { id: 'r1', content: 'Contenido de ejemplo', createdAt: '2025-12-02T00:00:00.000Z' } } } })
  @ApiResponse({ status: 404, description: 'Respuesta no encontrada', schema: { example: { status: 'no_encontrado', message: 'Respuesta no encontrada' } } })
  async get(@Param('id') id: string) {
    const rec = await (this.prisma as any).responses.findUnique({ where: { id } });
    if (!rec) return { status: 'no_encontrado', message: 'Respuesta no encontrada' };
    return { status: 'ok', response: rec };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las respuestas' })
  @ApiResponse({ status: 200, description: 'Listado de respuestas', schema: { example: { status: 'ok', responses: [ { id: 'r1', content: 'Contenido de ejemplo', createdAt: '2025-12-02T00:00:00.000Z' } ] } } })
  async list() {
    const items = await (this.prisma as any).responses.findMany({ orderBy: { created_at: 'desc' } });
    return { status: 'ok', responses: items };
  }
}
