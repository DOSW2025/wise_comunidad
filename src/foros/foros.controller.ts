import { Controller, Post, Body, Get, Param, Query, HttpCode, UseFilters } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiBadRequestResponse, ApiNotFoundResponse } from '@nestjs/swagger';
import { ForosService } from './foros.service';
import { MensajesService } from './mensajes.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateForoDto } from './dto/create-foro.dto';
import { CreateMensajeDto, ListMensajesQueryDto } from './dto/create-mensaje.dto';
import { GlobalExceptionFilter } from '../common/filters/global-exception.filter';

@ApiTags('Foros')
@Controller()
@UseFilters(GlobalExceptionFilter)
export class ForosController {
  constructor(
    private readonly forosService: ForosService,
    private readonly mensajesService: MensajesService,
  ) {}

  @Get('forums')
  findForums(@Query('page') page?: string) {
    return this.forosService.listForums({ page: Number(page) || 1 });
  }

  @Post('forums')
  @HttpCode(201)
  @ApiCreatedResponse({ description: 'Foro creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Materia no encontrada o foro duplicado' })
  @ApiNotFoundResponse({ description: 'Materia no existe' })
  createForo(@Body() dto: CreateForoDto) {
    return this.forosService.createForo(dto);
  }

  @Post('forums/:slug/threads')
  @HttpCode(201)
  createThread(@Param('slug') slug: string, @Body() dto: CreateThreadDto) {
    return this.forosService.createThread(slug, dto);
  }

  @Get('forums/:slug/threads')
  listThreads(@Param('slug') slug: string, @Query('page') page?: string) {
    return this.forosService.listThreads(slug, { page: Number(page) || 1 });
  }

  @Get('threads/:id')
  getThread(@Param('id') id: string, @Query('page') page?: string) {
    return this.forosService.getThread(Number(id), { page: Number(page) || 1 });
  }

  @Post('threads/:id/posts')
  @HttpCode(201)
  createPost(@Param('id') id: string, @Body() dto: CreatePostDto) {
    return this.forosService.createPost(Number(id), dto);
  }

  // ==================== MENSAJES ====================

  @Get('forums/:id/messages')
  @ApiNotFoundResponse({ description: 'Foro no encontrado' })
  listMensajes(@Param('id') id: string, @Query() query: ListMensajesQueryDto) {
    return this.mensajesService.listMensajes(Number(id), query);
  }

  @Post('forums/:id/messages')
  @HttpCode(201)
  @ApiCreatedResponse({ description: 'Mensaje enviado exitosamente' })
  @ApiBadRequestResponse({ description: 'Error al enviar el mensaje' })
  @ApiNotFoundResponse({ description: 'Foro o usuario no encontrado' })
  sendMensaje(@Param('id') id: string, @Body() dto: CreateMensajeDto) {
    return this.mensajesService.sendMensaje(Number(id), dto);
  }

  @Post('forums/:forumId/messages/:messageId/read')
  @HttpCode(200)
  markMensajeAsRead(
    @Param('forumId') forumId: string,
    @Param('messageId') messageId: string,
  ) {
    return this.mensajesService.markAsRead(Number(forumId), Number(messageId));
  }

  @Get('forums/:id/messages/unread/count')
  getUnreadCount(@Param('id') id: string) {
    return this.mensajesService.getUnreadCount(Number(id));
  }
}
