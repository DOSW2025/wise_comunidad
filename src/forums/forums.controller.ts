import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ForumsService } from './forums.service';
import { CreateForumDto } from './dto/create-forum.dto';
import { UpdateForumDto } from './dto/update-forum.dto';
import { CreateThreadDto } from '../threads/dto/create-thread.dto';
import { ThreadsService } from '../threads/threads.service';

@ApiTags('Foros')
@Controller('forums')
export class ForumsController {
  constructor(private readonly forumsService: ForumsService, private readonly threadsService: ThreadsService) {}

  // Crear hilo dentro de un foro
  @Post(':id/threads')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Crear un hilo dentro de un foro' })
  @ApiParam({ name: 'id', description: 'ID del foro' })
  @ApiBody({ type: CreateThreadDto })
  @ApiResponse({ status: 201, description: 'Hilo creado en el foro' })
  async createThreadInForum(@Param('id') id: string, @Body() dto: CreateThreadDto) {
    // fuerza forumId del path
    (dto as any).forumId = id;
    const createdThread = await this.threadsService.create(dto);
    return { status: 'ok', thread: createdThread };
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Dar like a un foro' })
  @ApiParam({ name: 'id', description: 'ID del foro' })
  @ApiResponse({ status: 200, description: 'Like registrado' })
  async like(@Param('id') id: string) {
    const updated = await this.forumsService.like(id);
    return { status: 'ok', likes: updated.likes_count };
  }

  @Post()
  @ApiOperation({ summary: 'Crear un foro asociado a una materia existente' })
  @ApiBody({ type: CreateForumDto })
  @ApiResponse({ status: 201, description: 'Foro creado' })
  async create(@Body() dto: CreateForumDto) {
    const created = await this.forumsService.create(dto);
    return { status: 'ok', forum: created };
  }

  @Get()
  @ApiOperation({ summary: 'Listar foros' })
  @ApiResponse({ status: 200, description: 'Listado de foros' })
  async list() {
    const items = await this.forumsService.findAll();
    return { status: 'ok', forums: items };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener foro por id (incluye hilos asociados)' })
  @ApiParam({ name: 'id', description: 'ID del foro' })
  @ApiResponse({ status: 200, description: 'Foro con hilos' })
  async get(@Param('id') id: string) {
    const f = await this.forumsService.findOne(id);
    return { status: 'ok', forum: f };
  }

  @Post(':id/edit')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Editar un foro (solo creador)' })
  @ApiBody({ type: UpdateForumDto })
  @ApiParam({ name: 'id', description: 'ID del foro' })
  @ApiResponse({ status: 200, description: 'Foro actualizado' })
  async update(@Param('id') id: string, @Body() dto: UpdateForumDto) {
    const updated = await this.forumsService.update(id, dto);
    return { status: 'ok', forum: updated };
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Cerrar un foro (solo creador)' })
  @ApiParam({ name: 'id', description: 'ID del foro' })
  @ApiBody({ schema: { example: { editorId: '37292cf3-6a1a-4211-9b3f-7a82331d0965' } } })
  @ApiResponse({ status: 200, description: 'Foro cerrado' })
  async close(@Param('id') id: string, @Body() body: { editorId: string }) {
    const updated = await this.forumsService.close(id, body.editorId);
    return { status: 'ok', forum: updated };
  }
}
