import { Body, Controller, Get, Param, Post, UsePipes, ValidationPipe, HttpCode, HttpStatus } from '@nestjs/common';
import { ThreadsService } from './threads.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { UpdateThreadDto } from './dto/update-thread.dto';

@Controller('threads')
@ApiTags('Threads')
export class ThreadsController {
  constructor(private readonly threadsService: ThreadsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Crear un hilo de discusión' })
  @ApiBody({ type: CreateThreadDto })
  @ApiResponse({
    status: 201,
    description: 'Hilo creado',
    schema: {
      example: {
        statusCode: 201,
        message: 'Hilo creado',
        data: {
          id: '22222222-2222-2222-2222-222222222222',
          author_id: '37292cf3-6a1a-4211-9b3f-7a82331d0965',
          title: 'Título de prueba válido con más de quince caracteres',
          content: 'Contenido de prueba del hilo. Debe tener al menos quince caracteres.',
          status: 'open',
          replies_count: 0,
          views_count: 0,
          pinned: false,
          created_at: '2025-12-02T00:00:00.000Z'
        }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Solicitud inválida (validación o autor no encontrado)',
    schema: { example: { statusCode: 400, message: ['authorId debe ser un UUID'], error: 'Bad Request' } },
  })
  @ApiResponse({ status: 409, description: 'Hilo duplicado', schema: { example: { statusCode: 409, message: 'Hilo duplicado' } } })
  async create(@Body() dto: CreateThreadDto) {
    const created = await this.threadsService.create(dto);
    return { statusCode: 201, message: 'Hilo creado', data: created };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un hilo por id' })
  @ApiParam({ name: 'id', description: 'UUID del hilo', schema: { example: '22222222-2222-2222-2222-222222222222' } })
  @ApiResponse({ status: 200, description: 'Hilo encontrado', schema: { example: { statusCode: 200, data: { id: '22222222-2222-2222-2222-222222222222', title: 'Título ejemplo', content: 'Contenido ejemplo', author_id: '37292cf3-6a1a-4211-9b3f-7a82331d0965' } } } })
  @ApiResponse({ status: 404, description: 'Hilo no encontrado', schema: { example: { statusCode: 404, message: 'Hilo no encontrado' } } })
  async findOne(@Param('id') id: string) {
    const thread = await this.threadsService.findOne(id);
    return { statusCode: 200, data: thread };
  }

  @Post(':id/like')
  @ApiOperation({ summary: 'Dar like a un hilo' })
  @ApiParam({ name: 'id', description: 'UUID del hilo' })
  @ApiResponse({ status: 200, description: 'Like registrado' })
  async like(@Param('id') id: string) {
    const updated = await this.threadsService.like(id);
    return { status: 'ok', likes: updated.likes_count };
  }

  @Post(':id/edit')
  @UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
  @ApiOperation({ summary: 'Editar un hilo (solo autor)' })
  @ApiParam({ name: 'id', description: 'UUID del hilo' })
  @ApiBody({ type: UpdateThreadDto })
  @ApiResponse({ status: 200, description: 'Hilo actualizado' })
  async update(@Param('id') id: string, @Body() dto: any) {
    const updated = await this.threadsService.update(id, dto);
    return { statusCode: 200, data: updated };
  }
}
