import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ApiProperty } from '@nestjs/swagger';

class CreateResponseDto {
  @ApiProperty({ description: 'Identificador de la respuesta (único)' })
  id: string;

  @ApiProperty({ description: 'Contenido de la respuesta (opcional)', required: false })
  content?: string;
}

@ApiTags('Respuestas')
@Controller('responses')
export class ResponsesController {
  constructor(private readonly responsesService: ResponsesService) {}

  @Post()
  @ApiOperation({ summary: 'Crear una respuesta (en memoria para demo)' })
  @ApiBody({ type: CreateResponseDto })
  @ApiResponse({
    status: 200,
    description: 'Respuesta creada',
    schema: {
      example: { status: 'ok', response: { id: 'r1', content: 'Contenido de ejemplo', createdAt: '2025-12-02T00:00:00.000Z' } },
    },
  })
  @ApiResponse({ status: 400, description: 'Solicitud inválida (falta id)', schema: { example: { status: 'error', message: 'id es obligatorio' } } })
  create(@Body() body: CreateResponseDto) {
    if (!body?.id) {
      return { status: 'error', message: 'id es obligatorio' };
    }
    const rec = this.responsesService.create(body.id, body.content);
    return { status: 'ok', response: rec };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una respuesta por id' })
  @ApiParam({ name: 'id', description: 'Identificador de la respuesta', schema: { example: 'r1' } })
  @ApiResponse({ status: 200, description: 'Respuesta encontrada', schema: { example: { status: 'ok', response: { id: 'r1', content: 'Contenido de ejemplo', createdAt: '2025-12-02T00:00:00.000Z' } } } })
  @ApiResponse({ status: 404, description: 'Respuesta no encontrada', schema: { example: { status: 'no_encontrado', message: 'Respuesta no encontrada' } } })
  get(@Param('id') id: string) {
    const rec = this.responsesService.get(id);
    if (!rec) return { status: 'no_encontrado', message: 'Respuesta no encontrada' };
    return { status: 'ok', response: rec };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las respuestas (en memoria)' })
  @ApiResponse({ status: 200, description: 'Listado de respuestas', schema: { example: { status: 'ok', responses: [ { id: 'r1', content: 'Contenido de ejemplo', createdAt: '2025-12-02T00:00:00.000Z' } ] } } })
  list() {
    return { status: 'ok', responses: this.responsesService.list() };
  }
}
