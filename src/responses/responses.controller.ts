import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ResponsesService } from './responses.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
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
  @ApiResponse({ status: 200, description: 'Respuesta creada' })
  @ApiResponse({ status: 400, description: 'Solicitud inválida (falta id)' })
  create(@Body() body: CreateResponseDto) {
    if (!body?.id) {
      return { status: 'error', message: 'id es obligatorio' };
    }
    const rec = this.responsesService.create(body.id, body.content);
    return { status: 'ok', response: rec };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una respuesta por id' })
  @ApiResponse({ status: 200, description: 'Respuesta encontrada' })
  @ApiResponse({ status: 404, description: 'Respuesta no encontrada' })
  get(@Param('id') id: string) {
    const rec = this.responsesService.get(id);
    if (!rec) return { status: 'no_encontrado', message: 'Respuesta no encontrada' };
    return { status: 'ok', response: rec };
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las respuestas (en memoria)' })
  @ApiResponse({ status: 200, description: 'Listado de respuestas' })
  list() {
    return { status: 'ok', responses: this.responsesService.list() };
  }
}
