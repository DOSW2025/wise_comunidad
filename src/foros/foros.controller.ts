import { Controller, Post, Body, Get, Param, Query, HttpCode } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { ForosService } from './foros.service';
import { CreateThreadDto } from './dto/create-thread.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { CreateForoDto } from './dto/create-foro.dto';

@ApiTags('Foros')
@Controller()
export class ForosController {
  constructor(private readonly forosService: ForosService) {}

  @Get('forums')
  findForums(@Query('page') page?: string) {
    return this.forosService.listForums({ page: Number(page) || 1 });
  }

  @Post('forums')
  @HttpCode(201)
  @ApiCreatedResponse({ description: 'Foro creado exitosamente' })
  @ApiBadRequestResponse({ description: 'Error al crear el foro' })
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
}
